import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoletosController } from './boletos.controller';
import { BoletosService } from './boletos.service';
import { Boleto } from './entities/boleto.entity';
import { LoggingModule } from '../logging/logging.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Boleto]),
        LoggingModule,
        UsersModule
    ],
    controllers: [BoletosController],
    providers: [BoletosService],
    exports: [BoletosService]
})
export class BoletosModule {} 