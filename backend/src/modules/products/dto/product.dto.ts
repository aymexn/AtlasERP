import { IsNotEmpty, IsString, IsNumber, IsOptional, Min, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArticleType } from '@prisma/client';

export class CreateProductDto {
    @ApiProperty({ example: 'Wireless Mouse' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ example: 'MS-WRL-001' })
    @IsNotEmpty()
    @IsString()
    sku: string;

    @ApiProperty({ example: 25.50 })
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    salePriceHt: number;

    @ApiPropertyOptional({ example: 0.20 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    taxRate?: number;

    @ApiProperty({ example: 15.00 })
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    standardCost: number;

    @ApiPropertyOptional({ example: 100 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    stockQuantity?: number;


    @ApiPropertyOptional({ example: 'uuid-family' })
    @IsOptional()
    @IsString()
    familyId?: string;

    @ApiPropertyOptional({ enum: ArticleType, example: ArticleType.FINISHED_PRODUCT })
    @IsOptional()
    @IsEnum(ArticleType)
    articleType?: ArticleType;

    @ApiPropertyOptional({ example: 'pcs' })
    @IsOptional()
    @IsString()
    unit?: string;

    @ApiPropertyOptional({ example: 'Souris sans fil' })
    @IsOptional()
    @IsString()
    secondaryName?: string;

    @ApiPropertyOptional({ example: 'Detailed description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: 12.00 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    purchasePriceHt?: number;

    @ApiPropertyOptional({ example: 10 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    minStock?: number;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    trackStock?: boolean;
}

export class UpdateProductDto {
    @ApiPropertyOptional({ example: 'Wireless Mouse Pro' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ example: 'MS-WRL-002' })
    @IsOptional()
    @IsString()
    sku?: string;

    @ApiPropertyOptional({ example: 29.99 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    salePriceHt?: number;

    @ApiPropertyOptional({ example: 0.20 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    taxRate?: number;

    @ApiPropertyOptional({ example: 18.00 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    standardCost?: number;

    @ApiPropertyOptional({ example: 120 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    stockQuantity?: number;


    @ApiPropertyOptional({ example: 'uuid-family' })
    @IsOptional()
    @IsString()
    familyId?: string;

    @ApiPropertyOptional({ enum: ArticleType })
    @IsOptional()
    @IsEnum(ArticleType)
    articleType?: ArticleType;

    @ApiPropertyOptional({ example: 'pcs' })
    @IsOptional()
    @IsString()
    unit?: string;

    @ApiPropertyOptional({ example: 'Souris sans fil' })
    @IsOptional()
    @IsString()
    secondaryName?: string;

    @ApiPropertyOptional({ example: 'Updated description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: 12.00 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    purchasePriceHt?: number;

    @ApiPropertyOptional({ example: 10 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    minStock?: number;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    trackStock?: boolean;
}
