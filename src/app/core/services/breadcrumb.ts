import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Breadcrumb {
private breadcrumbs$ = new BehaviorSubject<{label: string, url: string, icon?: string}[]>([
    { label: 'Home', url: '/', icon: 'home' }
  ]);

  setBreadcrumbs(breadcrumbs: {label: string, url: string, icon?: string}[]) {
    this.breadcrumbs$.next([
      { label: 'Home', url: '/', icon: 'home' },
      ...breadcrumbs
    ]);
  }

  getBreadcrumbs() {
    return this.breadcrumbs$.asObservable();
  }
}
