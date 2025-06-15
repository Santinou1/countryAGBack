import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoggingService } from '../../logging/logging.service';
import { EscaneoQR } from './entities/escaneo-qr.entity';
import * as QRCode from 'qrcode';
import { BoletosService } from '../boletos/boletos.service';

interface QRData {
    type: 'ida' | 'vuelta';
    boletoId: number;
    userId: number;
    timestamp?: string;
    codigo?: string;
}

interface QRResponse {
    qrCode: string;
    codigo: string;
    codigoIda: string | null;
    codigoVuelta: string | null;
    base64: string;
}

@Injectable()
export class QrService {
    constructor(
        @InjectRepository(EscaneoQR)
        private escaneoRepository: Repository<EscaneoQR>,
        private readonly logger: LoggingService,
        private readonly boletosService: BoletosService
    ) {}

    async generateQR(data: QRData): Promise<QRResponse> {
        try {
            // Obtener el boleto
            const boleto = await this.boletosService.getBoletoById(data.boletoId);
            if (!boleto) {
                throw new NotFoundException('Boleto no encontrado');
            }

            // Obtener el código según el tipo
            const codigo = data.type === 'ida' ? boleto.codigoIda : boleto.codigoVuelta;
            if (!codigo) {
                throw new BadRequestException(`No hay código de ${data.type} disponible para este boleto`);
            }

            // Creamos un objeto con la información necesaria
            const qrData = {
                ...data,
                codigo,
                timestamp: new Date().toISOString(), // Agregamos timestamp para seguridad
            };

            // Convertimos el objeto a string
            const stringData = JSON.stringify(qrData);

            // Generamos el QR como una URL de datos (base64)
            const qrCode = await QRCode.toDataURL(stringData);
            
            // Extraemos el base64 puro (sin el prefijo data:image/png;base64,)
            const base64 = qrCode.split(',')[1];
            
            this.logger.log(
                `QR generado para boleto ${data.boletoId} - ${data.type} con código ${codigo}`,
                'QrService'
            );

            return {
                qrCode,
                codigo,
                codigoIda: boleto.codigoIda,
                codigoVuelta: boleto.codigoVuelta,
                base64
            };
        } catch (error) {
            this.logger.error(`Error generando QR: ${error.message}`, error.stack, 'QrService');
            throw error;
        }
    }

    decodeQR(qrData: string): QRData {
        try {
            let decodedData: QRData;

            // Si los datos están en formato base64 de imagen
            if (typeof qrData === 'string' && qrData.startsWith('data:image')) {
                throw new BadRequestException('El QR debe ser enviado como texto JSON, no como imagen base64');
            }

            try {
                // Intentamos parsear si es un string
                decodedData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
            } catch (e) {
                throw new BadRequestException('Formato de datos QR inválido');
            }
            
            // Verificamos que tenga la estructura correcta
            if (!decodedData.type || !decodedData.boletoId || !decodedData.userId || !decodedData.codigo) {
                throw new BadRequestException('QR inválido: datos incompletos');
            }

            // Verificamos que el tipo sea válido
            if (!['ida', 'vuelta'].includes(decodedData.type)) {
                throw new BadRequestException('QR inválido: tipo no válido');
            }

            this.logger.log(`QR decodificado para boleto ${decodedData.boletoId} con código ${decodedData.codigo}`, 'QrService');
            return {
                type: decodedData.type,
                boletoId: decodedData.boletoId,
                userId: decodedData.userId,
                codigo: decodedData.codigo
            };
        } catch (error) {
            this.logger.error(`Error decodificando QR: ${error.message}`, error.stack, 'QrService');
            throw error;
        }
    }

    async registrarEscaneo(boletoId: number, tipo: 'ida' | 'vuelta', adminId: number): Promise<EscaneoQR> {
        const escaneo = this.escaneoRepository.create({
            boletoId,
            tipo,
            escaneadoPor: adminId
        });

        this.logger.log(`Registrando escaneo de boleto ${boletoId} por admin ${adminId}`, 'QrService');
        return this.escaneoRepository.save(escaneo);
    }

    async getEscaneosPorBoleto(boletoId: number): Promise<EscaneoQR[]> {
        return this.escaneoRepository.find({
            where: { boletoId },
            relations: ['admin', 'boleto'],
            order: { fechaEscaneo: 'DESC' }
        });
    }
} 