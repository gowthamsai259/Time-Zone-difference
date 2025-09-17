import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TravelService } from './travel.service';
import { TravelController } from './travel.controller';

@Module({
  imports: [HttpModule],
  controllers: [TravelController],
  providers: [TravelService],
})
export class TravelModule {}


