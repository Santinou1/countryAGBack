import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { BoletosModule } from './modules/boletos/boletos.module';
import { LoggingModule } from './logging/logging.module';
import { AuthModule } from './modules/auth/auth.module';
import { QrModule } from './modules/qr/qr.module';
import { MercadoPagoModule } from './modules/mercadopago/mercadopago.module';
import { MetricasModule } from './modules/metricas/metricas.module';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(databaseConfig),
    LoggingModule,
    UsersModule,
    BoletosModule,
    AuthModule,
    QrModule,
    MercadoPagoModule,
    MetricasModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
