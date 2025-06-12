import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoggingService } from '../logging/logging.service';
import { EscaneoQR } from './entities/escaneo-qr.entity';
import * as QRCode from 'qrcode';

interface QRData {
    type: 'ida' | 'vuelta';
    boletoId: number;
    userId: number;
    timestamp?: string;
}

@Injectable()
export class QrService {
    constructor(
        @InjectRepository(EscaneoQR)
        private escaneoRepository: Repository<EscaneoQR>,
        private readonly logger: LoggingService
    ) {}

    async generateQR(data: QRData): Promise<string> {
        try {
            // Creamos un objeto con la información necesaria
            const qrData = {
                ...data,
                timestamp: new Date().toISOString(), // Agregamos timestamp para seguridad
            };

            // Convertimos el objeto a string
            const stringData = JSON.stringify(qrData);

            // Generamos el QR como una URL de datos (base64)
            const qrCode = await QRCode.toDataURL(stringData);
            
            this.logger.log(`QR generado para boleto ${data.boletoId} - ${data.type}`, 'QrService');
            return qrCode;
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
            if (!decodedData.type || !decodedData.boletoId || !decodedData.userId) {
                throw new BadRequestException('QR inválido: datos incompletos');
            }

            // Verificamos que el tipo sea válido
            if (!['ida', 'vuelta'].includes(decodedData.type)) {
                throw new BadRequestException('QR inválido: tipo no válido');
            }

            this.logger.log(`QR decodificado para boleto ${decodedData.boletoId}`, 'QrService');
            return {
                type: decodedData.type,
                boletoId: decodedData.boletoId,
                userId: decodedData.userId
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