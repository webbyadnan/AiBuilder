import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let cachedApp: ReturnType<typeof NestFactory.create> extends Promise<infer T>
    ? T
    : never;

async function bootstrap() {
    if (cachedApp) return cachedApp;

    const app = await NestFactory.create(AppModule, { bufferLogs: true });

    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    });

    app.useGlobalPipes(
        new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );

    app.setGlobalPrefix('api', { exclude: ['/', '/health'] });

    await app.init();
    cachedApp = app as any;
    return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const app = await bootstrap();
    const httpAdapter = app.getHttpAdapter();
    const instance = httpAdapter.getInstance();
    instance(req, res);
}
