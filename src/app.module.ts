import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { BoletosModule } from './boletos/boletos.module';
import { LoggingModule } from './logging/logging.module';
import { QrModule } from './qr/qr.module';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(databaseConfig),
    LoggingModule,
    UsersModule,
    BoletosModule,
    QrModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
