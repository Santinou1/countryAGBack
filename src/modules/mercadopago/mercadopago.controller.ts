import { Controller, Post, Req, HttpCode, Body } from '@nestjs/common';
import { Request } from 'express';
import { MercadoPagoService } from './mercadopago.service';

@Controller('mercadopago')
export class MercadoPagoController {
  constructor(private readonly mercadoPagoService: MercadoPagoService) {}

  @Post('webhook')
  @HttpCode(200)
  handleWebhook(@Req() req: Request & { rawBody?: Buffer }, @Body() body: any) {
    let data: any;

    if (req.rawBody) {
      try {
        data = JSON.parse(req.rawBody.toString());
      } catch (e) {
        data = body; // fallback
      }
    } else {
      data = body;
    }

    if (data.type === 'payment' && data.data?.id) {
      this.mercadoPagoService.handlePaymentNotification(data.data.id);
    }
  }

  @Post('create-preference')
  async createPreference(@Body() body: { payer: any, tipo?: 'diario' | 'unico', cantidad?: number }) {
    return this.mercadoPagoService.createPaymentPreference(
      body.payer,
      body.tipo || 'diario',
      body.cantidad || 1,
    );
  }

  @Post('comprar-para-otro')
  async comprarParaOtro(@Body() body: { payer: any, dni: string, cantidad?: number }) {
    return this.mercadoPagoService.createPaymentPreferenceForOther(
      body.payer,
      body.dni,
      body.cantidad || 1,
    );
  }
} 