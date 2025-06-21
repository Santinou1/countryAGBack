import { Controller, Post, Req, Res, HttpCode, Body } from '@nestjs/common';
import { Request, Response } from 'express';
import { MercadoPagoService } from './mercadopago.service';

@Controller('mercadopago')
export class MercadoPagoController {
  constructor(private readonly mercadoPagoService: MercadoPagoService) {}

  @Post('webhook')
  @HttpCode(200)
  handleWebhook(@Body() body: { type: string; data: { id: string } }) {
    if (body.type === 'payment') {
      this.mercadoPagoService.handlePaymentNotification(body.data.id);
    }
    // Respondemos inmediatamente a Mercado Pago para evitar reintentos.
    // El procesamiento real se hace de forma asíncrona.
  }

  @Post('create-preference')
  async createPreference(@Body() body: { payer: any }) {
    return this.mercadoPagoService.createPaymentPreference(
      body.payer,
    );
  }
} 