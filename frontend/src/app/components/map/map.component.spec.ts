import { TestBed } from '@angular/core/testing';
import { MapComponent } from './map.component';

describe('MapComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapComponent]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(MapComponent);
    const comp = fixture.componentInstance;
    expect(comp).toBeTruthy();
  });
});
