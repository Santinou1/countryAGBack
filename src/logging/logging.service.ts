import { Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Inject } from '@nestjs/common';

@Injectable()
export class LoggingService implements LoggerService {
  constructor(@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService) {}

  log(message: string, context?: string): void {
    this.logger.log(message, context);
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, trace, context);
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, context);
  }

  debug(message: string, context?: string): void {
    if (this.logger.debug) {
      this.logger.debug(message, context);
    }
  }

  verbose(message: string, context?: string): void {
    if (this.logger.verbose) {
      this.logger.verbose(message, context);
    }
  }
}
