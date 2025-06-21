import { Module } from '@nestjs/common';
import { MercadoPagoController } from './mercadopago.controller';
import { MercadoPagoService } from './mercadopago.service';
import { BoletosModule } from '../boletos/boletos.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [BoletosModule, UsersModule],
  controllers: [MercadoPagoController],
  providers: [MercadoPagoService],
  exports: [MercadoPagoService],
})
export class MercadoPagoModule {} 