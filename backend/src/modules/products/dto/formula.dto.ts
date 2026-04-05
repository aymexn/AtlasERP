import { IsNotEmpty, IsString, IsNumber, IsOptional, Min, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateFormulaLineDto {
    @ApiProperty({ example: 'uuid-component' })
    @IsNotEmpty()
    @IsString()
    componentProductId: string;

    @ApiProperty({ example: 1.5 })
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    quantity: number;

    @ApiProperty({ example: 'kg' })
    @IsNotEmpty()
    @IsString()
    unit: string;

    @ApiPropertyOptional({ example: 5.0 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    wastagePercent?: number;

    @ApiPropertyOptional({ example: 0 })
    @IsOptional()
    @IsNumber()
    sortOrder?: number;

    @ApiPropertyOptional({ example: 'Mix thoroughly' })
    @IsOptional()
    @IsString()
    note?: string;
}

export class UpdateFormulaLineDto {
    @ApiPropertyOptional({ example: 1.6 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    quantity?: number;

    @ApiPropertyOptional({ example: 'kg' })
    @IsOptional()
    @IsString()
    unit?: string;

    @ApiPropertyOptional({ example: 5.0 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    wastagePercent?: number;

    @ApiPropertyOptional({ example: 1 })
    @IsOptional()
    @IsNumber()
    sortOrder?: number;

    @ApiPropertyOptional({ example: 'Updated notes' })
    @IsOptional()
    @IsString()
    note?: string;
}

export class CreateFormulaDto {
    @ApiProperty({ example: 'Standard Recipe' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: '1.0' })
    @IsOptional()
    @IsString()
    version?: string;

    @ApiPropertyOptional({ example: 'F-001' })
    @IsOptional()
    @IsString()
    code?: string;

    @ApiPropertyOptional({ example: 'Main production formula' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: 100 })
    @IsNotEmpty()
    @IsNumber()
    @Min(0.001)
    outputQuantity: number;

    @ApiProperty({ example: 'pcs' })
    @IsNotEmpty()
    @IsString()
    outputUnit: string;

    @ApiPropertyOptional({ example: 0 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    scrapPercent?: number;

    @ApiPropertyOptional({ example: 'DRAFT' })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ type: [CreateFormulaLineDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateFormulaLineDto)
    lines?: CreateFormulaLineDto[];
}

export class UpdateFormulaDto {
    @ApiPropertyOptional({ example: 'Standard Recipe V2' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ example: '2.0' })
    @IsOptional()
    @IsString()
    version?: string;

    @ApiPropertyOptional({ example: 'F-001' })
    @IsOptional()
    @IsString()
    code?: string;

    @ApiPropertyOptional({ example: 'Updated production formula' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: 100 })
    @IsOptional()
    @IsNumber()
    @Min(0.001)
    outputQuantity?: number;

    @ApiPropertyOptional({ example: 'pcs' })
    @IsOptional()
    @IsString()
    outputUnit?: string;

    @ApiPropertyOptional({ example: 0 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    scrapPercent?: number;

    @ApiPropertyOptional({ example: 'ACTIVE' })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ type: [CreateFormulaLineDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateFormulaLineDto)
    lines?: CreateFormulaLineDto[];
}
