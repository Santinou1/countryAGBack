import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoletosController } from './boletos.controller';
import { BoletosService } from './boletos.service';
import { Boleto } from './entities/boleto.entity';
import { LoggingModule } from '../../logging/logging.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Boleto]),
        LoggingModule,
        UsersModule,
        forwardRef(() => AuthModule),
    ],
    controllers: [BoletosController],
    providers: [BoletosService],
    exports: [BoletosService]
})
export class BoletosModule {} 