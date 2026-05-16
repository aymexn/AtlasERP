import { Module } from '@nestjs/common';

import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { FamiliesService } from './families.service';
import { FamiliesController } from './families.controller';
import { FormulaService } from './formula.service';
import { FormulaController } from './formula.controller';
import { UomService } from './uom.service';
import { UomController } from './uom.controller';
import { VariantsService } from './variants.service';
import { VariantsController } from './variants.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PdfService } from '../../common/services/pdf.service';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
    imports: [PrismaModule, TenantsModule],
    controllers: [ProductsController, FamiliesController, FormulaController, UomController, VariantsController],
    providers: [ProductsService, FamiliesService, FormulaService, PdfService, UomService, VariantsService],
    exports: [ProductsService, FamiliesService, FormulaService, UomService, VariantsService],
})
export class ProductsModule { }
