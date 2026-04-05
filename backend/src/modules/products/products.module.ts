import { Module } from '@nestjs/common';

import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { FamiliesService } from './families.service';
import { FamiliesController } from './families.controller';
import { FormulaService } from './formula.service';
import { FormulaController } from './formula.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ProductsController, FamiliesController, FormulaController],
    providers: [ProductsService, FamiliesService, FormulaService],
    exports: [ProductsService, FamiliesService, FormulaService],
})
export class ProductsModule { }
