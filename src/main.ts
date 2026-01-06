import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { getDataSourceToken } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { SeedService } from "./commands/seed.command";
import * as cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Run seeding before starting the server
  const seedService = app.get(SeedService);
  await seedService.seed();

  // Enable cookie parsing
  app.use(cookieParser());

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

  // Debug: Check database connection
  try {
    const dataSource = app.get<DataSource>(getDataSourceToken());
    if (dataSource.isInitialized) {
      console.log("✅ Database connection established successfully!");
    } else {
      await dataSource.initialize();
      console.log("✅ Database connection established (after manual init)!");
    }
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }

  // Indicate both admin and customer sides are available (always show)
  console.log(
    "✅ Admin and customer (user) modules/routes are connected and server is running on port",
    port
  );
}

bootstrap();
