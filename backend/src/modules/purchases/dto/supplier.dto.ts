import { IsString, IsNotEmpty, IsOptional, IsEmail, IsInt, IsBoolean } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  taxId?: string;

  @IsInt()
  @IsOptional()
  paymentTermsDays?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateSupplierDto extends CreateSupplierDto {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
