import { Component, OnDestroy, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { SearchComponent } from '../../components/search/search.component';
import { MapComponent } from '../../components/map/map.component';
import { ApiService, Place } from '../../services/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeaderComponent, SearchComponent, MapComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnDestroy {
  source = signal<Place | undefined>(undefined);
  destination = signal<Place | undefined>(undefined);
  metrics = signal<any>(undefined);
  nearby = signal<any[]>([]);
  shareUrl = signal<string | null>(null);

  timeDifferenceText = computed(() => {
    const m = this.metrics();
    if (!m) return '';
    const diffMinutes = m.diffMinutes;
    if (diffMinutes === 0) return 'Same Timezone';
    const hours = Math.abs(diffMinutes / 60);
    const formattedHours = hours % 1 === 0 ? hours : hours.toFixed(1);
    const behindOrAhead = diffMinutes > 0 ? 'Ahead' : 'Behind';
    return `${formattedHours}h ${behindOrAhead}`;
  });

  sourceTime = signal('');
  destinationTime = signal('');
  private timeUpdateInterval?: any;

  constructor(public readonly api: ApiService) {
    // Auto-detect source via browser geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const place = await this.api.reverse(latitude, longitude);
          this.source.set(place);
          this.updateMetrics();
        } catch {}
      });
    }

    // Read from shareable URL
    const params = new URLSearchParams(location.search);
    const s = params.get('s');
    const d = params.get('d');
    if (s) {
      const [lat, lon, name] = s.split('|');
      this.source.set({ id: 's', name: decodeURIComponent(name || ''), lat: +lat, lon: +lon });
    }
    if (d) {
      const [lat, lon, name] = d.split('|');
      this.destination.set({ id: 'd', name: decodeURIComponent(name || ''), lat: +lat, lon: +lon });
    }

    effect(() => {
      const m = this.metrics();
      if (this.timeUpdateInterval) {
        clearInterval(this.timeUpdateInterval);
      }
      if (m?.tzSource && m?.tzDest) {
        this.updateTimes(m.tzSource, m.tzDest); // Initial update
        this.timeUpdateInterval = setInterval(() => {
          this.updateTimes(m.tzSource, m.tzDest);
        }, 1000);
      } else {
        this.sourceTime.set('');
        this.destinationTime.set('');
      }
    });
  }

  ngOnDestroy() {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }
  }

  private updateTimes(sourceTz: string, destTz: string) {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true,
    };
    try {
        this.sourceTime.set(now.toLocaleString('en-US', { ...options, timeZone: sourceTz }));
        this.destinationTime.set(now.toLocaleString('en-US', { ...options, timeZone: destTz }));
    } catch(e) {
        console.error("Invalid timezone provided", e);
        this.sourceTime.set("Invalid Timezone");
        this.destinationTime.set("Invalid Timezone");
    }
  }

  async setSource(p: Place) {
    if (p.id === 'me') { return this.useMyLocation(); }
    this.source.set(p);
    await this.updateMetrics();
    this.updateShareLink();
  }

  async setDestination(p: Place) {
    this.destination.set(p);
    await this.updateMetrics();
    await this.updateNearby();
    this.updateShareLink();
  }

  private async updateMetrics() {
    const s = this.source();
    const d = this.destination();
    if (!s || !d) {
      this.metrics.set(undefined);
      return;
    }
    const m = await this.api.metrics({ lat: s.lat, lon: s.lon }, { lat: d.lat, lon: d.lon });
    this.metrics.set(m);
  }

  private async updateNearby() {
    const d = this.destination();
    if (!d) { this.nearby.set([]); return; }
    const n = await this.api.nearby(d.lat, d.lon);
    this.nearby.set(n);
  }

  private updateShareLink() {
    const s = this.source();
    const d = this.destination();
    const params = new URLSearchParams();
    if (s) params.set('s', `${s.lat}|${s.lon}|${encodeURIComponent(s.name)}`);
    if (d) params.set('d', `${d.lat}|${d.lon}|${encodeURIComponent(d.name)}`);
    const url = `${location.origin}${location.pathname}?${params.toString()}`;
    history.replaceState(null, '', url);
    this.shareUrl.set(url);
  }

  useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const p = await this.api.reverse(pos.coords.latitude, pos.coords.longitude);
      await this.setSource(p);
    });
  }
}


