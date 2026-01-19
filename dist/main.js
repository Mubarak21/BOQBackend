"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const typeorm_1 = require("@nestjs/typeorm");
const seed_command_1 = require("./commands/seed.command");
const cookieParser = require("cookie-parser");
const path_1 = require("path");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useStaticAssets((0, path_1.join)(process.cwd(), "uploads"), {
        prefix: "/uploads",
    });
    const seedService = app.get(seed_command_1.SeedService);
    await seedService.seed();
    app.use(cookieParser());
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
    try {
        const dataSource = app.get((0, typeorm_1.getDataSourceToken)());
        if (dataSource.isInitialized) {
        }
        else {
            await dataSource.initialize();
        }
    }
    catch (err) {
    }
}
bootstrap();
//# sourceMappingURL=main.js.map