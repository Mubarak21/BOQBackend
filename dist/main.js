"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: true,
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.setGlobalPrefix("api");
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log("=================================");
    console.log("🚀 Application is running!");
    console.log(`📡 Server: http://localhost:${port}/api`);
    console.log("📦 Database: Connected successfully");
    console.log("=================================");
}
bootstrap();
//# sourceMappingURL=main.js.map