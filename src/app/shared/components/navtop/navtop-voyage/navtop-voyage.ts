import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { Auth } from '../../../../core/services/auth';

@Component({
  selector: 'app-navtop-voyage',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    RouterModule,
    MatTooltipModule,
    MatDividerModule,
    MatListModule
  ],
  templateUrl: './navtop-voyage.html',
  styleUrls: ['./navtop-voyage.css']
})
export class NavtopVoyageComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: Auth,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
      })
    );
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  navigateToSettings(): void {
    this.router.navigate(['/settings']);
  }

  navigateToVoyages(): void {
    this.router.navigate(['/voyage']);
  }

  navigateToReservations(): void {
    this.router.navigate(['/reservation']);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated;
  }

  get userName(): string {
    return this.currentUser?.name || '';
  }

  get userEmail(): string {
    return this.currentUser?.email || '';
  }

  get userInitials(): string {
    if (!this.currentUser?.name) return '';
    const names = this.currentUser.name.split(' ');
    return names.map((n: string) => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  }

  get userAvatar(): string {
    return this.currentUser?.avatar || '';
  }

  logout(): void {
    this.authService.logout();
  }
}