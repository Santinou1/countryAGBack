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

  async createPaymentPreference(payer: { email: string }, tipo: 'diario' | 'unico' = 'diario', cantidad: number = 1) {
    // Log de todas las variables de entorno para depuración
    //this.logger.log('Variables de entorno actuales:', process.env);

    const preference = new Preference(this.client);

    // 1. Encontrar usuario
    const user = await this.usersService.findByEmail(payer.email);
    if (!user) {
      throw new Error(`Usuario con email ${payer.email} no encontrado.`);
    }

    // 2. Crear boletos pendientes
    const lote = 'PAGO_ONLINE';
    const boletos: any[] = [];
    for (let i = 0; i < cantidad; i++) {
      const nuevoBoleto = await this.boletosService.crearBoletoParaLote(
        user.id,
        lote,
        tipo,
      );
      boletos.push(nuevoBoleto);
    }

    // Usar el primer boleto como referencia
    const defaultItem = {
      id: 'BOLETO-UNICO',
      title: 'Boleto Único San Sebastian',
      quantity: cantidad,
      unit_price: 1, // Precio de prueba
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
        external_reference: boletos.map(b => b.id).join(','),
      },
    });

    return result;
  }

  async handlePaymentNotification(paymentId: string) {
    this.logger.log(`Handling payment notification for ID: ${paymentId}`);

    try {
      const payment = await new Payment(this.client).get({ id: paymentId });
      const boletoIds = payment.external_reference;

      if (!boletoIds) {
        this.logger.error(`External reference (boletoIds) not found for payment ID ${paymentId}`);
        return;
      }
      
      if (payment && payment.status === 'approved') {
        this.logger.log(`Payment ID ${paymentId} for Boleto IDs ${boletoIds} was approved.`);

        // Aprobar todos los boletos referenciados
        const ids = boletoIds.split(',').map((id: string) => parseInt(id, 10)).filter(Boolean);
        for (const boletoId of ids) {
          const boleto = await this.boletosService.getBoletoById(boletoId);
          if (!boleto) {
            this.logger.error(`Boleto with ID ${boletoId} not found.`);
            continue;
          }
          await this.boletosService.aprobarBoleto(boleto.idUsers, boleto.id);
          this.logger.log(`Boleto ${boleto.id} was successfully approved for user ${boleto.idUsers}.`);
        }
      } else {
        this.logger.log(
          `Payment ID ${paymentId} for Boleto IDs ${boletoIds} not approved. Status: ${payment?.status}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error handling payment notification for ID ${paymentId}`,
        error.stack,
      );
    }
  }

  async createPaymentPreferenceForOther(payer: { email: string }, dni: string, cantidad: number = 1) {
    // 1. Buscar usuario por DNI
    const user = await this.usersService.findByDni(dni);
    if (!user) {
      throw new Error(`Usuario con DNI ${dni} no encontrado.`);
    }

    // 2. Crear boletos pendientes para el usuario destinatario
    const lote = 'PAGO_ONLINE';
    const tipo = 'unico';
    const boletos: any[] = [];
    for (let i = 0; i < cantidad; i++) {
      const nuevoBoleto = await this.boletosService.crearBoletoParaLote(
        user.id,
        lote,
        tipo,
      );
      boletos.push(nuevoBoleto);
    }

    // 3. Crear preferencia de pago para el pagador
    const preference = new Preference(this.client);
    const defaultItem = {
      id: 'BOLETO-UNICO',
      title: `Boleto Único para DNI ${dni}`,
      quantity: cantidad,
      unit_price: 1,
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
        external_reference: boletos.map(b => b.id).join(','),
      },
    });
    return result;
  }

  async comprarPack(payer: { email: string }, packType: '10' | '20' | '40', dni?: string) {
    // Definir cantidad y precio por pack
    const cantidad = packType === '10' ? 10 : packType === '20' ? 20 : 40;
    const precioPorBoleto = 1;
    let user;
    if (dni) {
      user = await this.usersService.findByDni(dni);
      if (!user) throw new Error(`Usuario con DNI ${dni} no encontrado.`);
    } else {
      user = await this.usersService.findByEmail(payer.email);
      if (!user) throw new Error(`Usuario con email ${payer.email} no encontrado.`);
    }
    const lote = 'PAGO_ONLINE';
    const tipo = 'unico';
    const boletos: any[] = [];
    for (let i = 0; i < cantidad; i++) {
      const nuevoBoleto = await this.boletosService.crearBoletoParaLote(
        user.id,
        lote,
        tipo,
      );
      boletos.push(nuevoBoleto);
    }
    const preference = new Preference(this.client);
    const defaultItem = {
      id: `PACK-${packType}-VIAJES`,
      title: `Pack ${packType} viajes` + (dni ? ` para DNI ${dni}` : ''),
      quantity: 1,
      unit_price: precioPorBoleto * cantidad,
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
        external_reference: boletos.map(b => b.id).join(','),
      },
    });
    return result;
  }
} 