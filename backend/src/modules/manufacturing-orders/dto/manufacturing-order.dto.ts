import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ManufacturingOrderStatus } from '@prisma/client';

export class CreateManufacturingOrderDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  formulaId: string;

  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  plannedQuantity: number;

  @IsDateString()
  @IsNotEmpty()
  plannedDate: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateManufacturingOrderDto {
  @IsDateString()
  @IsOptional()
  plannedDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CompleteManufacturingOrderDto {
  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  producedQuantity: number;
}
