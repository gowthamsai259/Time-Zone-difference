import { Controller, Get, Query } from '@nestjs/common';
import { TravelService } from './travel.service';

@Controller('api')
export class TravelController {
  constructor(private readonly travel: TravelService) {}

  @Get('search')
  search(@Query('q') q: string) {
    return this.travel.searchPlaces(q);
  }

  @Get('reverse')
  reverse(@Query('lat') lat: string, @Query('lon') lon: string) {
    return this.travel.reverseGeocode({ lat: parseFloat(lat), lon: parseFloat(lon) });
  }

  @Get('metrics')
  metrics(
    @Query('srcLat') srcLat: string,
    @Query('srcLon') srcLon: string,
    @Query('dstLat') dstLat: string,
    @Query('dstLon') dstLon: string,
  ) {
    return this.travel.timezoneAndDistance(
      { lat: parseFloat(srcLat), lon: parseFloat(srcLon) },
      { lat: parseFloat(dstLat), lon: parseFloat(dstLon) },
    );
  }

  @Get('nearby')
  nearby(@Query('lat') lat: string, @Query('lon') lon: string) {
    return this.travel.nearbyPlaces({ lat: parseFloat(lat), lon: parseFloat(lon) });
  }
}


