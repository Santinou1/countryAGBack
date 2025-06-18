import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoggingService } from '../../logging/logging.service';
import { EscaneoQR } from './entities/escaneo-qr.entity';
import * as QRCode from 'qrcode';
import { BoletosService } from '../boletos/boletos.service';
import { DateUtils } from 'src/date-utils';

interface QRData {
  boletoId: number;
  userId: number;
  timestamp?: string;
  codigo?: string;
}

interface QRResponse {
  qrCode: string;
  codigo: string;
  base64: string;
}

@Injectable()
export class QrService {
  constructor(
    @InjectRepository(EscaneoQR)
    private escaneoRepository: Repository<EscaneoQR>,
    private readonly logger: LoggingService,
    private readonly boletosService: BoletosService,
  ) {}

  async generateQR(data: QRData): Promise<QRResponse> {
    try {
      // Obtener el boleto
      const boleto = await this.boletosService.getBoletoById(data.boletoId);
      if (!boleto) {
        throw new NotFoundException('Boleto no encontrado');
      }

      // Verificar que el boleto esté aprobado
      if (boleto.estado !== 'aprobado') {
        throw new BadRequestException('El boleto no está aprobado');
      }

      // Verificar que el boleto esté válido
      if (!boleto.isValido()) {
        throw new BadRequestException('El boleto no está válido');
      }

      // Obtener el código del boleto
      const codigo = boleto.codigoBoleto;
      if (!codigo) {
        throw new BadRequestException('No hay código disponible para este boleto');
      }

      // Activar el QR (3 minutos de validez)
      boleto.activarQR();
      await this.boletosService.save(boleto);

      // Creamos un objeto con la información necesaria
      const qrData = {
        ...data,
        codigo,
        timestamp: DateUtils.nowISO(), // Timestamp en timezone de Argentina
      };

      // Convertimos el objeto a string
      const stringData = JSON.stringify(qrData);

      // Generamos el QR como una URL de datos (base64)
      const qrCode = await QRCode.toDataURL(stringData);

      // Extraemos el base64 puro (sin el prefijo data:image/png;base64,)
      const base64 = qrCode.split(',')[1];

      this.logger.log(
        `QR generado y activado para boleto ${data.boletoId} con código ${codigo}`,
        'QrService',
      );

      return {
        qrCode,
        codigo,
        base64,
      };
    } catch (error) {
      this.logger.error(`Error generando QR: ${error.message}`, error.stack, 'QrService');
      throw error;
    }
  }

  decodeQR(qrData: string): QRData {
    try {
      let decodedData: any;

      // Si los datos están en formato base64 de imagen
      if (typeof qrData === 'string' && qrData.startsWith('data:image')) {
        throw new BadRequestException(
          'El QR debe ser enviado como texto JSON, no como imagen base64',
        );
      }

      try {
        // Intentamos parsear si es un string
        decodedData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
      } catch (e) {
        throw new BadRequestException('Formato de datos QR inválido');
      }

      // Verificamos que tenga la estructura correcta
      if (!decodedData.boletoId || !decodedData.userId || !decodedData.codigo) {
        throw new BadRequestException('QR inválido: datos incompletos');
      }

      this.logger.log(
        `QR decodificado para boleto ${decodedData.boletoId} con código ${decodedData.codigo}`,
        'QrService',
      );
      return {
        boletoId: decodedData.boletoId,
        userId: decodedData.userId,
        codigo: decodedData.codigo,
      };
    } catch (error) {
      this.logger.error(`Error decodificando QR: ${error.message}`, error.stack, 'QrService');
      throw error;
    }
  }

  async registrarEscaneo(boletoId: number, adminId: number): Promise<EscaneoQR> {
    const escaneo = this.escaneoRepository.create({
      boletoId,
      escaneadoPor: adminId,
    });

    this.logger.log(`Registrando escaneo de boleto ${boletoId} por admin ${adminId}`, 'QrService');
    return this.escaneoRepository.save(escaneo);
  }

  async getEscaneosPorBoleto(boletoId: number): Promise<EscaneoQR[]> {
    return this.escaneoRepository.find({
      where: { boletoId },
      relations: ['admin', 'boleto'],
      order: { fechaEscaneo: 'DESC' },
    });
  }
}
