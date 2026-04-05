import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/tenant.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantsController {
    constructor(private tenantsService: TenantsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new tenant and assign the current user as its Admin' })
    @ApiResponse({ status: 201, description: 'Tenant successfully created.' })
    async create(@Body() dto: CreateTenantDto, @Request() req: any) {
        return this.tenantsService.create(dto, req.user.userId);
    }

    @Get('me')
    @ApiOperation({ summary: 'Get current user company/tenant info' })
    async getMyTenant(@Request() req: any) {
        return this.tenantsService.findByUserId(req.user.userId);
    }
}
