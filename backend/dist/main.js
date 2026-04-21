"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.enableCors({
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: 'Content-Type,Accept,Authorization',
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('AtlasERP API')
        .setDescription('The AtlasERP multi-tenant API documentation')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    const port = process.env.PORT || 3000;
    await app.listen(port, '127.0.0.1');
    console.log(`AtlasERP Backend running on: http://127.0.0.1:${port}`);
    console.log(`Swagger documentation available at: http://127.0.0.1:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map