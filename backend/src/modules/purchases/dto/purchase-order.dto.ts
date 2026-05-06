import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber, IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseOrderLineDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsNumber()
  @IsNotEmpty()
  unitPriceHt: number;

  @IsNumber()
  @IsOptional()
  taxRate?: number = 0.19;

  @IsString()
  @IsOptional()
  note?: string;
}

export class CreatePurchaseOrderDto {
  @IsString()
  @IsNotEmpty()
  supplierId: string;

  @IsDateString()
  @IsNotEmpty()
  orderDate: string;

  @IsDateString()
  @IsOptional()
  expectedDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderLineDto)
  lines: CreatePurchaseOrderLineDto[];

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  warehouseId?: string;
}

export class UpdatePurchaseOrderDto extends CreatePurchaseOrderDto {}
