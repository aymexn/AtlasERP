import { Module, Global } from '@nestjs/common';
import { PdfService } from './services/pdf.service';
import { CacheService } from './services/cache.service';

@Global()
@Module({
  providers: [PdfService, CacheService],
  exports: [PdfService, CacheService],
})
export class CommonModule {}
