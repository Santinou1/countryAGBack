import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Desactivamos el bodyParser nativo de NestJS
    // para poder usar el de Express con la opción de `verify`.
    bodyParser: false,
  });
  
  // Configurar el prefijo global 'api'
  app.setGlobalPrefix('api');
  
  // Habilitar CORS
  app.enableCors();

  // Usamos el bodyParser de express para poder obtener el cuerpo crudo (raw body).
  // Esto es crucial para la validación de webhooks.
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use(express.json({
    // La función verify nos da el buffer crudo antes de que se parsee.
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    },
  }));
  expressApp.use(express.urlencoded({ extended: true, verify: (req: any, res, buf) => {
    req.rawBody = buf;
  } }));

  // Habilitar validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true
  }));
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
