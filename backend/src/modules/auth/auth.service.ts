import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private prisma: PrismaService,
    ) { }

    /**
     * Fetch all active permissions for a user as compact strings.
     * Returns ["clients:client:read", "sales:order:create", ...]
     * If ADMIN enum role and no AppRole permissions seeded, returns ALL permissions.
     */
    private async buildPermissions(userId: string, userRole: string): Promise<string[]> {
        const userRoles = await this.prisma.userRole.findMany({
            where: {
                userId,
                isActive: true,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
            include: {
                role: {
                    include: {
                        permissions: { include: { permission: true } },
                    },
                },
            },
        });

        const permissions = [
            ...new Set(
                userRoles.flatMap(ur =>
                    ur.role.permissions.map(
                        rp => `${rp.permission.module}:${rp.permission.resource}:${rp.permission.action}`
                    )
                )
            ),
        ];

        // Safety fallback: ADMIN enum with no AppRole assignments gets ALL permissions
        if (userRole === 'ADMIN' && permissions.length === 0) {
            const allPerms = await this.prisma.appPermission.findMany();
            return allPerms.map(p => `${p.module}:${p.resource}:${p.action}`);
        }

        return permissions;
    }

    async register(dto: RegisterDto) {
        const existing = await this.usersService.findByEmail(dto.email);
        if (existing) {
            throw new ConflictException('Email already registered');
        }

        const passwordHash = await bcrypt.hash(dto.password, 10);

        const { user } = await this.prisma.$transaction(async (tx) => {
            // 1. Create a placeholder company
            const company = await tx.company.create({
                data: {
                    name: `${dto.email.split('@')[0]}'s Company`,
                    slug: `${dto.email.split('@')[0]}-${Date.now()}`,
                }
            });

            // 2. Create the user as ADMIN of that company
            const newUser = await tx.user.create({
                data: {
                    email: dto.email,
                    passwordHash,
                    companyId: company.id,
                    role: 'ADMIN',
                },
            });

            // Automatically assign system admin AppRole if it exists
            const adminRole = await tx.appRole.findUnique({
                where: { name: 'admin' }
            });
            if (adminRole) {
                await tx.userRole.create({
                    data: {
                        userId: newUser.id,
                        roleId: adminRole.id,
                        isActive: true,
                    }
                });
            }

            return { user: newUser };
        });

        // Generate token AFTER transaction commits
        const permissions = await this.buildPermissions(user.id, user.role);
        const payload = {
            sub: user.id,
            email: user.email,
            companyId: user.companyId,
            role: user.role,
            permissions,
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                companyId: user.companyId,
                role: user.role
            }
        };
    }

    async login(dto: LoginDto) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const permissions = await this.buildPermissions(user.id, user.role);
        const payload = {
            sub: user.id,
            email: user.email,
            companyId: user.companyId,
            role: user.role,
            permissions,
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                companyId: user.companyId,
                role: user.role
            }
        };
    }

    /**
     * Re-issue JWT with fresh permissions (called after admin changes role permissions).
     * Used by POST /auth/refresh-permissions — requires valid JWT.
     */
    async refreshPermissions(userId: string) {
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        const permissions = await this.buildPermissions(user.id, user.role);
        const payload = {
            sub: user.id,
            email: user.email,
            companyId: user.companyId,
            role: user.role,
            permissions,
        };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
