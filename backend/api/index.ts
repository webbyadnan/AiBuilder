import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

let cachedApp: INestApplication;
const server = express();

const bootstrap = async () => {
    if (!cachedApp) {
        cachedApp = await NestFactory.create(
            AppModule,
            new ExpressAdapter(server)
        );

        cachedApp.enableCors({
            origin: '*',
            credentials: true,
        });

        cachedApp.useGlobalPipes(
            new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
        );

        await cachedApp.init();
    }
    return cachedApp;
};

export default async (req: any, res: any) => {
    await bootstrap();
    server(req, res);
};
