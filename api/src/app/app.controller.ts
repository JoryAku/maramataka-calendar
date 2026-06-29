import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('health')
  getHealth() {
    return this.appService.getLiveness();
  }

  @Get('health/live')
  getLiveness() {
    return this.appService.getLiveness();
  }

  @Get('health/ready')
  async getReadiness() {
    const readiness = await this.appService.getReadiness();

    if (readiness.status !== 'ok') {
      throw new ServiceUnavailableException({
        message: 'Readiness check failed',
        ...readiness,
      });
    }

    return readiness;
  }
}
