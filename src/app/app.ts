import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="app-container">
      <!-- Loading overlay -->
      <div *ngIf="isLoading()" class="loading-overlay">
        <mat-spinner diameter="50"></mat-spinner>
        <p class="loading-text">Chargement...</p>
      </div>

      <!-- Router outlet pour les composants -->
      <router-outlet></router-outlet>
    </div>
  `,
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  private router = inject(Router);
  
  protected readonly title = signal('TravelEase - Gestion de Voyage');
  protected readonly isLoading = signal(true);

  ngOnInit() {
    // Écouter les changements de route pour gérer le loading
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        // Masquer le loading après la navigation
        setTimeout(() => {
          this.isLoading.set(false);
        }, 500);
      });

    // Initialiser le loading à false après un court délai
    setTimeout(() => {
      this.isLoading.set(false);
    }, 1000);
  }
}