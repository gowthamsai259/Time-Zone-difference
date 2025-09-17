import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
type Coordinates = {
    lat: number;
    lon: number;
};
export declare class TravelService {
    private readonly http;
    private readonly config;
    constructor(http: HttpService, config: ConfigService);
    searchPlaces(query: string): Promise<any>;
    reverseGeocode(coords: Coordinates): Promise<{
        id: any;
        name: any;
        lat: number;
        lon: number;
        type: any;
    }>;
    private haversineDistanceKm;
    private deg2rad;
    timezoneAndDistance(source: Coordinates, dest: Coordinates): Promise<{
        tzSource: any;
        tzDest: any;
        srcLocalTime: any;
        dstLocalTime: any;
        diffMinutes: number;
        distanceKm: number;
        estimatedFlightHours: number;
    }>;
    nearbyPlaces(dest: Coordinates): Promise<any[]>;
    private nearbyFoursquarePlaces;
    private nearbyWikipediaPlaces;
    private getWikipediaPageDetails;
}
export {};
