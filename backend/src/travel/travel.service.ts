import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import tzLookup from 'tz-lookup';
import { DateTime } from 'luxon';
import { ConfigService } from '@nestjs/config';

type Coordinates = { lat: number; lon: number };

@Injectable()
export class TravelService {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async searchPlaces(query: string) {
    const url = 'https://nominatim.openstreetmap.org/search';
    const params = { q: query, format: 'json', addressdetails: 1, limit: 10 };
    const res = await firstValueFrom(
      this.http.get(url, {
        params,
        headers: { 'User-Agent': 'Time-Zone-Diff-App/1.0 (contact: example@example.com)' },
      }),
    );
    return res.data.map((p: any) => ({
      id: p.place_id,
      name: p.display_name,
      lat: parseFloat(p.lat),
      lon: parseFloat(p.lon),
      type: p.type,
    }));
  }

  async reverseGeocode(coords: Coordinates) {
    const url = 'https://nominatim.openstreetmap.org/reverse';
    const params = { lat: coords.lat, lon: coords.lon, format: 'json', zoom: 10, addressdetails: 1 };
    const res = await firstValueFrom(
      this.http.get(url, {
        params,
        headers: { 'User-Agent': 'Time-Zone-Diff-App/1.0 (contact: example@example.com)' },
      }),
    );
    return {
      id: res.data.place_id,
      name: res.data.display_name,
      lat: parseFloat(res.data.lat),
      lon: parseFloat(res.data.lon),
      type: res.data.type,
    };
  }

  private haversineDistanceKm(a: Coordinates, b: Coordinates): number {
    const R = 6371;
    const dLat = this.deg2rad(b.lat - a.lat);
    const dLon = this.deg2rad(b.lon - a.lon);
    const lat1 = this.deg2rad(a.lat);
    const lat2 = this.deg2rad(b.lat);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  private deg2rad(d: number) {
    return (d * Math.PI) / 180;
  }

  async timezoneAndDistance(source: Coordinates, dest: Coordinates) {
    const tzSource = tzLookup(source.lat, source.lon);
    const tzDest = tzLookup(dest.lat, dest.lon);
    const now = DateTime.utc();
    const srcNow = now.setZone(tzSource);
    const dstNow = now.setZone(tzDest);
    const diffMinutes = dstNow.offset - srcNow.offset;
    const distanceKm = this.haversineDistanceKm(source, dest);
    // Simple flight duration estimate: 800 km/h average
    const flightHours = distanceKm / 800;
    return {
      tzSource,
      tzDest,
      srcLocalTime: srcNow.toISO(),
      dstLocalTime: dstNow.toISO(),
      diffMinutes,
      distanceKm,
      estimatedFlightHours: flightHours,
    };
  }

  async nearbyPlaces(dest: Coordinates) {
    const foursquarePlaces = this.nearbyFoursquarePlaces(dest);
    const wikipediaPlaces = this.nearbyWikipediaPlaces(dest);

    const [fs, wiki] = await Promise.all([foursquarePlaces, wikipediaPlaces]);

    return [...fs, ...wiki].sort(() => Math.random() - 0.5);
  }

  private async nearbyFoursquarePlaces(dest: Coordinates) {
    const apiKey = this.config.get('FOURSQUARE_API_KEY');
    if (!apiKey) {
      console.warn('FOURSQUARE_API_KEY not found.');
      return [];
    }
    
    const url = 'https://api.foursquare.com/v3/places/search';
    const params = {
      ll: `${dest.lat},${dest.lon}`,
      radius: 5000,
      categories: '13000,10000,16000', // Restaurants, Arts & Entertainment, Sights & Landmarks
      limit: 5,
      fields: 'fsq_id,name,location,categories,photos',
    };
    const headers = {
      Authorization: apiKey,
      accept: 'application/json',
    };

    try {
      const res = await firstValueFrom(
        this.http.get(url, { params, headers })
      );
      
      return res.data.results.map((place: any) => ({
        id: place.fsq_id,
        name: place.name,
        lat: place.location.lat,
        lon: place.location.lon,
        thumbnail:
          place.photos?.[0]
            ? `${place.photos[0].prefix}160x100${place.photos[0].suffix}`
            : null,
        category: place.categories?.[0]?.short_name.toLowerCase() || 'place',
      }));
    } catch (error) {
      console.error('Foursquare API error:', error.response?.data);
      return [];
    }
  }

  private async nearbyWikipediaPlaces(coords: Coordinates) {
    const url = 'https://en.wikipedia.org/w/api.php';
    const params = {
      action: 'query',
      list: 'geosearch',
      gscoord: `${coords.lat}|${coords.lon}`,
      gsradius: 10000, // 10km
      gslimit: 5,
      format: 'json',
      origin: '*',
    };

    try {
      const res = await firstValueFrom(this.http.get(url, { params }));
      const pages = res.data.query.geosearch;
      
      // For each page, we need to fetch the URL
      const details = await Promise.all(pages.map(p => this.getWikipediaPageDetails(p.pageid)));

      return pages.map((place: any, i: number) => ({
        id: `wiki_${place.pageid}`,
        name: place.title,
        lat: place.lat,
        lon: place.lon,
        thumbnail: details[i].thumbnail,
        category: 'wikipedia',
        wikipediaUrl: details[i].url,
      }));
    } catch (error) {
      console.error('Wikipedia API error:', error);
      return [];
    }
  }

  private async getWikipediaPageDetails(pageid: number) {
    const url = 'https://en.wikipedia.org/w/api.php';
    const params = {
      action: 'query',
      pageids: pageid,
      prop: 'info|pageimages',
      inprop: 'url',
      piprop: 'thumbnail',
      pithumbsize: 200, // Image size
      format: 'json',
      origin: '*',
    };
    try {
      const res = await firstValueFrom(this.http.get(url, { params }));
      const page = res.data.query.pages[pageid];
      return {
        url: page.fullurl,
        thumbnail: page.thumbnail?.source || null,
      }
    } catch(e) {
      return { url: null, thumbnail: null };
    }
  }
}


