import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetricasController } from './metricas.controller';
import { MetricasService } from './metricas.service';
import { Boleto } from '../boletos/entities/boleto.entity';
import { User } from '../users/entities/user.entity';
import { LoggingModule } from '../../logging/logging.module';

@Module({
  imports: [TypeOrmModule.forFeature([Boleto, User]), LoggingModule],
  controllers: [MetricasController],
  providers: [MetricasService],
  exports: [MetricasService],
})
export class MetricasModule {}
