import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Set global prefix
  app.setGlobalPrefix("api");

  const port = process.env.PORT || 3001;
  await app.listen(port);

  // Log database connection and server status
  console.log("=================================");
  console.log("🚀 Application is running!");
  console.log(`📡 Server: http://localhost:${port}/api`);
  console.log("📦 Database: Connected successfully");
  console.log("=================================");
}

bootstrap();
