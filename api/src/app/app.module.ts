import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MaramatakaController } from './maramataka.controller';
import { maramatakaServiceProvider } from './maramataka.service-provider';

@Module({
  imports: [],
  controllers: [AppController, MaramatakaController],
  providers: [AppService, maramatakaServiceProvider],
})
export class AppModule {}
