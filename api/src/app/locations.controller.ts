import { Controller, Get } from '@nestjs/common';
import { LocationSummary, getLocationSummaries } from './locations';

@Controller('locations')
export class LocationsController {
  @Get()
  getLocations(): LocationSummary[] {
    return getLocationSummaries();
  }
}
