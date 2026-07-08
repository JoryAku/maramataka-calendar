import { Controller, Get, Header } from '@nestjs/common';
import {
  LocationSummary,
  getLocationSummaries,
} from '@maramataka-calendar/location';

@Controller('locations')
export class LocationsController {
  @Get()
  @Header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  getLocations(): readonly LocationSummary[] {
    return getLocationSummaries();
  }
}
