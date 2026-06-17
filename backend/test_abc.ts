import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { AbcClassificationService } from './src/modules/analytics/services/abc-classification.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const abcService = app.get(AbcClassificationService);
  
  const companyId = '5a6c7584-3b95-41e2-897f-824e87d9cdb9';
  console.log('Fetching summary...');
  const summary = await abcService.getSummary(companyId);
  console.log('Summary:', summary);

  console.log('Fetching Class A products...');
  const products = await abcService.getProductsByClassification(companyId, 'A');
  console.log('Class A Products count:', products.length);
  console.log('Class A Products:', JSON.stringify(products, null, 2));

  await app.close();
}

bootstrap().catch(console.error);
