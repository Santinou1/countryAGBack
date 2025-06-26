import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MercadoPago, { Preference, MercadoPagoConfig, Payment } from 'mercadopago';
import { BoletosService } from '../boletos/boletos.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class MercadoPagoService {
  private readonly client: MercadoPago;
  private readonly logger = new Logger(MercadoPagoService.name);

  constructor(
    private configService: ConfigService,
    private boletosService: BoletosService,
    private usersService: UsersService,
  ) {
    const accessToken = this.configService.get<string>(
      'MERCADOPAGO_ACCESS_TOKEN',
    );
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN is not defined');
    }
    this.client = new MercadoPago({
      accessToken,
    });
  }

  async createPaymentPreference(payer: { email: string }, tipo: 'diario' | 'unico' = 'diario') {
    // Log de todas las variables de entorno para depuración
    //this.logger.log('Variables de entorno actuales:', process.env);

    const preference = new Preference(this.client);

    // 1. Encontrar usuario
    const user = await this.usersService.findByEmail(payer.email);
    if (!user) {
      throw new Error(`Usuario con email ${payer.email} no encontrado.`);
    }

    // 2. Crear boleto pendiente
    const lote = 'PAGO_ONLINE';
    const nuevoBoleto = await this.boletosService.crearBoletoParaLote(
      user.id,
      lote,
      tipo,
    );

    const defaultItem = tipo === 'unico'
      ? {
          id: 'BOLETO-UNICO',
          title: 'Boleto Único San Sebastian',
          quantity: 1,
          unit_price: 1, // Cambiar a 5000 o el precio real del boleto único
        }
      : {
          id: 'BOLETO-DIARIO',
          title: 'Boleto Diario San Sebastian',
          quantity: 1,
          unit_price: 1, // Cambiar a 7000 o el precio real del boleto diario
        };

    const result = await preference.create({
      body: {
        items: [defaultItem],
        payer,
        back_urls: {
          success: `https://transporteenpunto.com.ar/home?payment_status=success`,
          failure: `https://transporteenpunto.com.ar/home?payment_status=failure`,
          pending: `https://transporteenpunto.com.ar/home?payment_status=pending`,
        },
        notification_url: `https://transporteenpunto.com.ar/api/mercadopago/webhook`,
        external_reference: nuevoBoleto.id.toString(), // 3. Enviar ID del boleto como referencia
      },
    });

    return result;
  }

  async handlePaymentNotification(paymentId: string) {
    this.logger.log(`Handling payment notification for ID: ${paymentId}`);

    try {
      const payment = await new Payment(this.client).get({ id: paymentId });
      const boletoId = payment.external_reference;

      if (!boletoId) {
        this.logger.error(`External reference (boletoId) not found for payment ID ${paymentId}`);
        return;
      }
      
      if (payment && payment.status === 'approved') {
        this.logger.log(`Payment ID ${paymentId} for Boleto ID ${boletoId} was approved.`);

        const boleto = await this.boletosService.getBoletoById(parseInt(boletoId, 10));

        if (!boleto) {
          this.logger.error(`Boleto with ID ${boletoId} not found.`);
          return;
        }

        // Se asume que el boleto fue creado por el usuario correcto, así que podemos usar un ID de "sistema" o el del propietario para aprobar.
        await this.boletosService.aprobarBoleto(boleto.idUsers, boleto.id);

        this.logger.log(
          `Boleto ${boleto.id} was successfully approved for user ${boleto.idUsers}.`,
        );
      } else {
        this.logger.log(
          `Payment ID ${paymentId} for Boleto ID ${boletoId} not approved. Status: ${payment?.status}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error handling payment notification for ID ${paymentId}`,
        error.stack,
      );
    }
  }
} 