import { AfterViewInit, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';

type LatLng = { lat: number; lon: number };

const sourceIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.component.html'
})
export class MapComponent implements AfterViewInit, OnChanges {
  @Input() source?: LatLng;
  @Input() destination?: LatLng;

  private map?: L.Map;
  private markers: L.Marker[] = [];
  private route?: L.Polyline;

  ngAfterViewInit(): void {
    this.map = L.map('map', { zoomControl: true }).setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.render();
  }

  private render() {
    if (!this.map) return;
    this.markers.forEach(m => m.remove());
    this.markers = [];
    if (this.route) { this.route.remove(); this.route = undefined; }

    const pts: L.LatLngExpression[] = [];
    if (this.source) {
      const m = L.marker([this.source.lat, this.source.lon], { icon: sourceIcon, title: 'Source' }).addTo(this.map!);
      this.markers.push(m);
      pts.push([this.source.lat, this.source.lon]);
    }
    if (this.destination) {
      const m = L.marker([this.destination.lat, this.destination.lon], { icon: destIcon, title: 'Destination' }).addTo(this.map!);
      this.markers.push(m);
      pts.push([this.destination.lat, this.destination.lon]);
    }
    if (pts.length === 2) {
      this.route = L.polyline(pts as any, { color: '#3F51B5', weight: 3 }).addTo(this.map!);
      const b = L.latLngBounds(pts as any);
      this.map!.fitBounds(b, { padding: [50, 50] });
    } else if (pts.length === 1) {
      this.map!.setView(pts[0] as any, 8);
    }
  }
}


