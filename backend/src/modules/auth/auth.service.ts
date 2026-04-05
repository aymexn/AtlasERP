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

            return { user: newUser };
        });

        // Generate token AFTER transaction commits
        const payload = {
            sub: user.id,
            email: user.email,
            companyId: user.companyId,
            role: user.role
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

        const payload = {
            sub: user.id,
            email: user.email,
            companyId: user.companyId,
            role: user.role
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
}
