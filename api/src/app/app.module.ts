import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MaramatakaController } from './maramataka.controller';
import { LocationsController } from './locations.controller';
import { maramatakaServiceProvider } from './maramataka.service-provider';

@Module({
  imports: [],
  controllers: [AppController, MaramatakaController, LocationsController],
  providers: [AppService, maramatakaServiceProvider],
})
export class AppModule {}
