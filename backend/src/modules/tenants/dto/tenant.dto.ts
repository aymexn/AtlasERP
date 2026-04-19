import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateTenantDto {
    @ApiProperty({ example: 'Atlas Corp' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'atlas-corp' })
    @IsString()
    @IsNotEmpty()
    slug: string;
}

export class UpdateCompanyDto {
    @ApiProperty({ required: false })
    @IsString()
    name?: string;

    @ApiProperty({ required: false })
    @IsString()
    address?: string;

    @ApiProperty({ required: false })
    @IsString()
    phone?: string;

    @ApiProperty({ required: false })
    @IsString()
    email?: string;

    @ApiProperty({ required: false })
    @IsString()
    website?: string;

    @ApiProperty({ required: false })
    @IsString()
    logoUrl?: string;

    @ApiProperty({ required: false })
    @IsString()
    nif?: string;

    @ApiProperty({ required: false })
    @IsString()
    ai?: string;

    @ApiProperty({ required: false })
    @IsString()
    rc?: string;

    @ApiProperty({ required: false })
    @IsString()
    rib?: string;
}
