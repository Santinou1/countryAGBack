import { Controller, Post, Body, Param, Get, BadRequestException } from '@nestjs/common';
import { QrService } from './qr.service';
import { BoletosService } from '../boletos/boletos.service';

@Controller('qr')
export class QrController {
    constructor(
        private readonly qrService: QrService,
        private readonly boletosService: BoletosService
    ) {}

    @Post('generar/ida/:boletoId/:userId')
    async generarQRIda(
        @Param('boletoId') boletoId: string,
        @Param('userId') userId: string
    ) {
        return this.qrService.generateQR({
            type: 'ida',
            boletoId: parseInt(boletoId),
            userId: parseInt(userId)
        });
    }

    @Post('generar/vuelta/:boletoId/:userId')
    async generarQRVuelta(
        @Param('boletoId') boletoId: string,
        @Param('userId') userId: string
    ) {
        return this.qrService.generateQR({
            type: 'vuelta',
            boletoId: parseInt(boletoId),
            userId: parseInt(userId)
        });
    }

    @Post('escanear/:adminId')
    async escanearQR(
        @Param('adminId') adminId: string,
        @Body() body: { qrData: any }
    ) {
        try {
            if (!body.qrData) {
                throw new BadRequestException('No se proporcionaron datos del QR');
            }

            let qrContent: string;

            // Si qrData es un string, lo usamos directamente
            if (typeof body.qrData === 'string') {
                qrContent = body.qrData;
                // Si es una imagen base64, lanzamos error
                if (qrContent.startsWith('data:image')) {
                    throw new BadRequestException(
                        'Por favor, envía el contenido del QR como texto JSON, no como imagen base64. ' +
                        'El contenido debe ser el texto que se obtiene al escanear el QR, no la imagen del QR.'
                    );
                }
            } else {
                // Si qrData es un objeto, lo convertimos a string
                qrContent = JSON.stringify(body.qrData);
            }

            const decodedData = this.qrService.decodeQR(qrContent);

            // Marcar el boleto según el tipo
            if (decodedData.type === 'ida') {
                await this.boletosService.marcarIda(decodedData.userId, decodedData.boletoId);
            } else {
                await this.boletosService.marcarVuelta(decodedData.userId, decodedData.boletoId);
            }

            // Registrar el escaneo
            return this.qrService.registrarEscaneo(
                decodedData.boletoId,
                decodedData.type,
                parseInt(adminId)
            );
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(
                'Error al procesar el QR: ' + error.message
            );
        }
    }

    @Get('historial/:boletoId')
    async getHistorialEscaneos(@Param('boletoId') boletoId: string) {
        return this.qrService.getEscaneosPorBoleto(parseInt(boletoId));
    }
}