"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TravelService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const tz_lookup_1 = __importDefault(require("tz-lookup"));
const luxon_1 = require("luxon");
const config_1 = require("@nestjs/config");
let TravelService = class TravelService {
    http;
    config;
    constructor(http, config) {
        this.http = http;
        this.config = config;
    }
    async searchPlaces(query) {
        const url = 'https://nominatim.openstreetmap.org/search';
        const params = { q: query, format: 'json', addressdetails: 1, limit: 10 };
        const res = await (0, rxjs_1.firstValueFrom)(this.http.get(url, {
            params,
            headers: { 'User-Agent': 'Time-Zone-Diff-App/1.0 (contact: example@example.com)' },
        }));
        return res.data.map((p) => ({
            id: p.place_id,
            name: p.display_name,
            lat: parseFloat(p.lat),
            lon: parseFloat(p.lon),
            type: p.type,
        }));
    }
    async reverseGeocode(coords) {
        const url = 'https://nominatim.openstreetmap.org/reverse';
        const params = { lat: coords.lat, lon: coords.lon, format: 'json', zoom: 10, addressdetails: 1 };
        const res = await (0, rxjs_1.firstValueFrom)(this.http.get(url, {
            params,
            headers: { 'User-Agent': 'Time-Zone-Diff-App/1.0 (contact: example@example.com)' },
        }));
        return {
            id: res.data.place_id,
            name: res.data.display_name,
            lat: parseFloat(res.data.lat),
            lon: parseFloat(res.data.lon),
            type: res.data.type,
        };
    }
    haversineDistanceKm(a, b) {
        const R = 6371;
        const dLat = this.deg2rad(b.lat - a.lat);
        const dLon = this.deg2rad(b.lon - a.lon);
        const lat1 = this.deg2rad(a.lat);
        const lat2 = this.deg2rad(b.lat);
        const h = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(h));
    }
    deg2rad(d) {
        return (d * Math.PI) / 180;
    }
    async timezoneAndDistance(source, dest) {
        const tzSource = (0, tz_lookup_1.default)(source.lat, source.lon);
        const tzDest = (0, tz_lookup_1.default)(dest.lat, dest.lon);
        const now = luxon_1.DateTime.utc();
        const srcNow = now.setZone(tzSource);
        const dstNow = now.setZone(tzDest);
        const diffMinutes = dstNow.offset - srcNow.offset;
        const distanceKm = this.haversineDistanceKm(source, dest);
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
    async nearbyPlaces(dest) {
        const foursquarePlaces = this.nearbyFoursquarePlaces(dest);
        const wikipediaPlaces = this.nearbyWikipediaPlaces(dest);
        const [fs, wiki] = await Promise.all([foursquarePlaces, wikipediaPlaces]);
        return [...fs, ...wiki].sort(() => Math.random() - 0.5);
    }
    async nearbyFoursquarePlaces(dest) {
        const apiKey = this.config.get('FOURSQUARE_API_KEY');
        if (!apiKey) {
            console.warn('FOURSQUARE_API_KEY not found.');
            return [];
        }
        const url = 'https://api.foursquare.com/v3/places/search';
        const params = {
            ll: `${dest.lat},${dest.lon}`,
            radius: 5000,
            categories: '13000,10000,16000',
            limit: 5,
            fields: 'fsq_id,name,location,categories,photos',
        };
        const headers = {
            Authorization: apiKey,
            accept: 'application/json',
        };
        try {
            const res = await (0, rxjs_1.firstValueFrom)(this.http.get(url, { params, headers }));
            return res.data.results.map((place) => ({
                id: place.fsq_id,
                name: place.name,
                lat: place.location.lat,
                lon: place.location.lon,
                thumbnail: place.photos?.[0]
                    ? `${place.photos[0].prefix}160x100${place.photos[0].suffix}`
                    : null,
                category: place.categories?.[0]?.short_name.toLowerCase() || 'place',
            }));
        }
        catch (error) {
            console.error('Foursquare API error:', error.response?.data);
            return [];
        }
    }
    async nearbyWikipediaPlaces(coords) {
        const url = 'https://en.wikipedia.org/w/api.php';
        const params = {
            action: 'query',
            list: 'geosearch',
            gscoord: `${coords.lat}|${coords.lon}`,
            gsradius: 10000,
            gslimit: 5,
            format: 'json',
            origin: '*',
        };
        try {
            const res = await (0, rxjs_1.firstValueFrom)(this.http.get(url, { params }));
            const pages = res.data.query.geosearch;
            const details = await Promise.all(pages.map(p => this.getWikipediaPageDetails(p.pageid)));
            return pages.map((place, i) => ({
                id: `wiki_${place.pageid}`,
                name: place.title,
                lat: place.lat,
                lon: place.lon,
                thumbnail: details[i].thumbnail,
                category: 'wikipedia',
                wikipediaUrl: details[i].url,
            }));
        }
        catch (error) {
            console.error('Wikipedia API error:', error);
            return [];
        }
    }
    async getWikipediaPageDetails(pageid) {
        const url = 'https://en.wikipedia.org/w/api.php';
        const params = {
            action: 'query',
            pageids: pageid,
            prop: 'info|pageimages',
            inprop: 'url',
            piprop: 'thumbnail',
            pithumbsize: 200,
            format: 'json',
            origin: '*',
        };
        try {
            const res = await (0, rxjs_1.firstValueFrom)(this.http.get(url, { params }));
            const page = res.data.query.pages[pageid];
            return {
                url: page.fullurl,
                thumbnail: page.thumbnail?.source || null,
            };
        }
        catch (e) {
            return { url: null, thumbnail: null };
        }
    }
};
exports.TravelService = TravelService;
exports.TravelService = TravelService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], TravelService);
//# sourceMappingURL=travel.service.js.map