import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston/dist/winston.utilities';
import { LoggingService } from './logging.service';

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        // Console transport
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike('CountryAG', {
              prettyPrint: true,
              colors: true,
            }),
          ),
        }),
        // File transport for all logs
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),
        // File transport for error logs
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),
      ],
    }),
  ],
  providers: [LoggingService],
  exports: [LoggingService],
})
export class LoggingModule {}
