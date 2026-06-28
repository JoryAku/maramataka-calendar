import { Controller, Get } from '@nestjs/common';
import {
  LocationSummary,
  getLocationSummaries,
} from '@maramataka-calendar/location';

@Controller('locations')
export class LocationsController {
  @Get()
  getLocations(): LocationSummary[] {
    return getLocationSummaries();
  }
}
