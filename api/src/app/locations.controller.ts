import { Controller, Get, Header } from '@nestjs/common';
import {
  LocationSummary,
  getLocationSummaries,
} from '@maramataka-calendar/location';

@Controller('locations')
export class LocationsController {
  @Get()
  @Header('Cache-Control', 'no-cache, must-revalidate')
  getLocations(): readonly LocationSummary[] {
    return getLocationSummaries();
  }
}
