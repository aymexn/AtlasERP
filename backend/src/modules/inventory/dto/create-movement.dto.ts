import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
}

export class CreateStockMovementDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty()
  @IsUUID()
  @IsOptional()
  variantId?: string;

  @ApiProperty({ enum: MovementType })
  @IsEnum(MovementType)
  type: MovementType;

  @ApiProperty()
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty()
  @IsString()
  unit: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  unitCost?: number;

  @ApiProperty()
  @IsUUID()
  @IsOptional()
  warehouseId?: string; // For IN/OUT/ADJUSTMENT

  @ApiProperty()
  @IsUUID()
  @IsOptional()
  warehouseFromId?: string; // For TRANSFER

  @ApiProperty()
  @IsUUID()
  @IsOptional()
  warehouseToId?: string; // For TRANSFER

  @ApiProperty()
  @IsString()
  @IsOptional()
  sourceLocation?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  destinationLocation?: string;

  @ApiProperty()
  @IsUUID()
  @IsOptional()
  uomId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiProperty()
  @IsDateString()
  @IsOptional()
  date?: string;
}
