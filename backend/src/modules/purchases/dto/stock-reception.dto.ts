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

  @ValidateNested({ each: true })
  @Type(() => CreateStockReceptionLineDto)
  lines: CreateStockReceptionLineDto[];
}

export class UpdateStockReceptionLineDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsNumber()
  @IsNotEmpty()
  receivedQty: number;
}

export class UpdateStockReceptionDto {
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateStockReceptionLineDto)
  lines?: UpdateStockReceptionLineDto[];

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  warehouseId?: string;
}
