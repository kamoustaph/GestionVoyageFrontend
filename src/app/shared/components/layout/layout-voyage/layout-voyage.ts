import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NavtopVoyageComponent } from '../../navtop/navtop-voyage/navtop-voyage';

interface MenuItem {
  name: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-layout-voyage',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, NavtopVoyageComponent],
  templateUrl: './layout-voyage.html',
  styleUrls: ['./layout-voyage.css'],
})
export class LayoutVoyage {
  isMenuOpen = false;

  menuItems: MenuItem[] = [
    { name: 'Voyage', icon: 'flight', route: '/voyage' },
    { name: 'Ticket', icon: 'confirmation_number', route: '/ticket' },
    { name: 'Réservation', icon: 'event_seat', route: '/reservation' },
    { name: 'Paiement', icon: 'payment', route: '/paiement' },
    { name: 'Notification', icon: 'notifications', route: '/notification' },
  ];

  constructor(private router: Router) {}

  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
    if (this.isMenuOpen) {
      this.toggleMenu();
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    document.body.style.overflow = this.isMenuOpen ? 'hidden' : '';
  }

  closeMenuOnMobile() {
    if (window.innerWidth <= 768) {
      this.toggleMenu();
    }
  }

  isActive(route: string): boolean {
    return window.location.pathname === route;
  }
}