import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { LoggingModule } from './logging/logging.module';

@Module({
  imports: [UsersModule, LoggingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
