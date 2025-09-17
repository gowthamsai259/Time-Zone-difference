import { Injectable, signal } from '@angular/core';

export type Place = { id: string | number; name: string; lat: number; lon: number; type?: string };

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = '';

  private searchCache = new Map<string, Place[]>();

  async search(query: string): Promise<Place[]> {
    const q = query.trim();
    if (this.searchCache.has(q)) return this.searchCache.get(q)!;

    try {
      const res = await fetch(`${this.baseUrl}/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        return [];
      }
      const data = await res.json();
      this.searchCache.set(q, data);
      return data;
    } catch {
      return []; // Return empty on network error
    }
  }

  async reverse(lat: number, lon: number): Promise<Place> {
    const res = await fetch(`${this.baseUrl}/api/reverse?lat=${lat}&lon=${lon}`);
    return await res.json();
  }

  async metrics(src: { lat: number; lon: number }, dst: { lat: number; lon: number }) {
    const params = new URLSearchParams({
      srcLat: String(src.lat), srcLon: String(src.lon), dstLat: String(dst.lat), dstLon: String(dst.lon)
    });
    const res = await fetch(`${this.baseUrl}/api/metrics?${params.toString()}`);
    return await res.json();
  }

  async nearby(lat: number, lon: number) {
    const res = await fetch(`${this.baseUrl}/api/nearby?lat=${lat}&lon=${lon}`);
    return await res.json();
  }
}


