import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStockReceptionLineDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsOptional()
  purchaseLineId?: string;

  @IsNumber()
  @IsNotEmpty()
  expectedQty: number;

  @IsNumber()
  @IsNotEmpty()
  receivedQty: number;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsNumber()
  @IsNotEmpty()
  unitCost: number;

  @IsString()
  @IsOptional()
  note?: string;
}

export class CreateStockReceptionDto {
  @IsString()
  @IsNotEmpty()
  purchaseOrderId: string;

  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @IsDateString()
  @IsOptional()
  receivedAt?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStockReceptionLineDto)
  lines: CreateStockReceptionLineDto[];
}
