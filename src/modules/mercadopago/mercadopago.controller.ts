import { Controller, Post, Req, HttpCode, Body } from '@nestjs/common';
import { Request } from 'express';
import { MercadoPagoService } from './mercadopago.service';

@Controller('mercadopago')
export class MercadoPagoController {
  constructor(private readonly mercadoPagoService: MercadoPagoService) {}

  @Post('webhook')
  @HttpCode(200)
  handleWebhook(@Req() req: Request & { rawBody: Buffer }) {
    const body = JSON.parse(req.rawBody.toString());
    
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