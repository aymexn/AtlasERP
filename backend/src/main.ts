import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
  await app.listen(port, '127.0.0.1');
  
  console.log(`AtlasERP Backend running on: http://127.0.0.1:${port}`);
  console.log(`Swagger documentation available at: http://127.0.0.1:${port}/api`);
}
bootstrap();
