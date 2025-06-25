import { Controller, Post, Body, Param, Get, BadRequestException, UseGuards } from '@nestjs/common';
import { QrService } from './qr.service';
import { BoletosService } from '../boletos/boletos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user-role.enum';

@Controller('qr')
export class QrController {
  constructor(
    private readonly qrService: QrService,
    private readonly boletosService: BoletosService,
  ) {}

  @Post('generar/:boletoId/:userId')
  async generarQR(@Param('boletoId') boletoId: string, @Param('userId') userId: string) {
    const response = await this.qrService.generateQR({
      boletoId: parseInt(boletoId),
      userId: parseInt(userId),
    });

    return {
      qrCode: response.qrCode,
      codigo: response.codigo,
      base64: response.base64,
    };
  }

  @Post('escanear/:adminId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHOFER)
  async escanearQR(@Param('adminId') adminId: string, @Body() body: { qrData: any }) {
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
              'El contenido debe ser el texto que se obtiene al escanear el QR, no la imagen del QR.',
          );
        }
      } else {
        // Si qrData es un objeto, lo convertimos a string
        qrContent = JSON.stringify(body.qrData);
      }

      const decodedData = this.qrService.decodeQR(qrContent);

      // Verificar que el código esté presente
      if (!decodedData.codigo) {
        throw new BadRequestException('QR inválido: código no encontrado');
      }

      // Consumir el boleto usando el código
      await this.boletosService.consumirBoletoPorCodigo(decodedData.codigo);

      // Registrar el escaneo y devolver info del propietario
      return this.qrService.registrarEscaneo(decodedData.boletoId, parseInt(adminId));
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al procesar el QR: ' + error.message);
    }
  }

  @Get('historial/:boletoId')
  async getHistorialEscaneos(@Param('boletoId') boletoId: string) {
    return this.qrService.getEscaneosPorBoleto(parseInt(boletoId));
  }
}
