import { TravelService } from './travel.service';
export declare class TravelController {
    private readonly travel;
    constructor(travel: TravelService);
    search(q: string): Promise<any>;
    reverse(lat: string, lon: string): Promise<{
        id: any;
        name: any;
        lat: number;
        lon: number;
        type: any;
    }>;
    metrics(srcLat: string, srcLon: string, dstLat: string, dstLon: string): Promise<{
        tzSource: any;
        tzDest: any;
        srcLocalTime: any;
        dstLocalTime: any;
        diffMinutes: number;
        distanceKm: number;
        estimatedFlightHours: number;
    }>;
    nearby(lat: string, lon: string): Promise<any[]>;
}
