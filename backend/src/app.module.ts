import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TravelModule } from './travel/travel.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TravelModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
