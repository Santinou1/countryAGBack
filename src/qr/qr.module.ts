import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QrController } from './qr.controller';
import { QrService } from './qr.service';
import { LoggingModule } from '../logging/logging.module';
import { BoletosModule } from '../boletos/boletos.module';
import { EscaneoQR } from './entities/escaneo-qr.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([EscaneoQR]),
        LoggingModule, 
        BoletosModule
    ],
    controllers: [QrController],
    providers: [QrService],
    exports: [QrService]
})
export class QrModule {} 