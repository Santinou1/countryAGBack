import { Controller, Post, HttpCode, Body } from '@nestjs/common';
import { MercadoPagoService } from './mercadopago.service';

@Controller('mercadopago')
export class MercadoPagoController {
  constructor(private readonly mercadoPagoService: MercadoPagoService) {}

  @Post('webhook')
  @HttpCode(200)
  handleWebhook(@Body() body: any) {
    if (body.type === 'payment' && body.data?.id) {
      this.mercadoPagoService.handlePaymentNotification(body.data.id);
    }
  }

  @Post('create-preference')
  async createPreference(@Body() body: { payer: any }) {
    return this.mercadoPagoService.createPaymentPreference(
      body.payer,
    );
  }
} 