import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsBoolean, IsNumber, IsEnum, Length } from 'class-validator';
import { CustomerSegment, CustomerType, PaymentBehavior, RiskLevel } from '@prisma/client';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Acme Colors SARL', description: 'Le nom de l\'entreprise' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'contact@acme.dz', description: 'Adresse e-mail de contact' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '123456789012345', description: 'Identifiant fiscal (15 chiffres)' })
  @IsOptional()
  @IsString()
  @Length(15, 15)
  taxId?: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'Contact principal' })
  @IsOptional()
  @IsString()
  contact?: string;

  @ApiPropertyOptional({ example: '0550123456', description: 'Numéro de téléphone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Zone Industrielle, Alger', description: 'Adresse physique' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 1000000.00, description: 'Limite de crédit' })
  @IsOptional()
  @IsNumber()
  creditLimit?: number;

  @ApiPropertyOptional({ example: false, description: 'Statut de blocage du client' })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;

  @ApiPropertyOptional({ example: 'Client historique', description: 'Notes internes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: CustomerSegment, example: 'A', description: 'Segment client' })
  @IsOptional()
  @IsEnum(CustomerSegment)
  segment?: CustomerSegment;

  @ApiPropertyOptional({ enum: CustomerType, example: 'WHOLESALER', description: 'Type de client' })
  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;

  @ApiPropertyOptional({ enum: PaymentBehavior, example: 'GOOD', description: 'Comportement de paiement' })
  @IsOptional()
  @IsEnum(PaymentBehavior)
  paymentBehavior?: PaymentBehavior;

  @ApiPropertyOptional({ enum: RiskLevel, example: 'LOW', description: 'Niveau de risque' })
  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;
}
