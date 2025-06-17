import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { config } from 'dotenv';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  config()

  // Configurar el prefijo global 'api'
  app.setGlobalPrefix('api');
  
  // Habilitar CORS
  app.enableCors();

  // Habilitar validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true
  }));
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
