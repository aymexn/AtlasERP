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
