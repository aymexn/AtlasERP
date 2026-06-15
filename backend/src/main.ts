import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as fs from 'fs';
import { seedRbac } from './seed-rbac';

// Suppress verbose Prisma query logging regardless of DEBUG env variable
delete process.env.DEBUG;

async function bootstrap() {
  // Ensure uploads directory exists
  const uploadsDir = join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: ['error', 'warn', 'log'] });

  // Serve static assets
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });

  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Configure CORS - "Blindée" configuration for development flow
  app.enableCors({
    origin: true, // Accepte tout pendant le dev pour débloquer
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type,Accept,Authorization',
  });

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('AtlasERP API')
    .setDescription('The AtlasERP multi-tenant API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  // Force listening on 127.0.0.1 (IPv4) to avoid Node 18+ DNS resolution conflicts

  // Auto-seed RBAC before starting (upsert — safe to re-run on every boot)
  try {
    await seedRbac();
    console.log('✅ RBAC auto-seed verified');
  } catch (e) {
    console.error('⚠️  RBAC auto-seed failed (app continues):', (e as Error).message);
  }

  await app.listen(port, '127.0.0.1');

  
  console.log(`AtlasERP Backend running on: http://127.0.0.1:${port}`);
  console.log(`Swagger documentation available at: http://127.0.0.1:${port}/api`);
}
bootstrap();
