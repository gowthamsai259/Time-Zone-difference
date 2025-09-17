import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Place } from '../../services/api.service';
import { Subject, of, from } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap, catchError, filter } from 'rxjs/operators';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './search.component.html'
})
export class SearchComponent implements OnInit, OnDestroy {
  @Input({ required: true }) label!: string;
  @Input() placeholder = 'Search city';
  @Output() selected = new EventEmitter<Place>();

  query = signal('');
  results = signal<Place[]>([]);
  isOpen = signal(false);
  private readonly api = inject(ApiService);
  isLoading = signal(false);

  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      tap(query => {
        if (query.length < 2) {
          this.results.set([]);
          this.isOpen.set(false);
        }
      }),
      filter(query => query.length >= 2),
      tap(() => this.isLoading.set(true)),
      switchMap(query => from(this.api.search(query)).pipe(
        catchError(() => of([])),
      )),
      tap(() => this.isLoading.set(false))
    ).subscribe(results => {
      this.results.set(results);
      this.isOpen.set(results.length > 0);
    });
  }

  onInput(value: string) {
    this.query.set(value);
    this.searchSubject.next(value);
  }

  choose(place: Place) {
    this.query.set(place.name);
    this.isOpen.set(false);
    this.selected.emit(place);
  }

  ngOnDestroy() {
    this.searchSubject.unsubscribe();
  }
}


