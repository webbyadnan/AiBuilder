import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();

const bootstrap = async () => {
    const app = await NestFactory.create(
        AppModule,
        new ExpressAdapter(server)
    );

    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    });

    app.useGlobalPipes(
        new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );

    app.setGlobalPrefix('api', { exclude: ['/', '/health'] });

    await app.init();
};

bootstrap();

export default server;
