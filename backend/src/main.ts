import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  // Keep / and /health outside the api prefix for Railway healthcheck
  app.setGlobalPrefix('api', { exclude: ['/', '/health'] });

  const port = process.env.PORT || 3001;
  // Bind to 0.0.0.0 so Railway can reach the container
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Backend running on port ${port}`);
}
bootstrap();
