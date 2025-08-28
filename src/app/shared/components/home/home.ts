import { Component, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { Subject, takeUntil } from 'rxjs';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatMenuModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(50px)' }),
        animate('800ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideInLeft', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-100px)' }),
        animate('600ms 200ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('slideInRight', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100px)' }),
        animate('600ms 400ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('staggerCards', [
      transition(':enter', [
        query('.feature-card', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger('150ms', [
            animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('buttonHover', [
      transition(':enter', [
        style({ transform: 'scale(0.95)' }),
        animate('200ms ease-out', style({ transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class Home implements OnInit, OnDestroy {
  private authService = inject(Auth);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  isAuthenticated = false;
  userInfo: any = null;
  isMobileMenuOpen = false;

  features = [
    {
      icon: 'flight_takeoff',
      title: 'Réservation de Vols',
      description: 'Trouvez et réservez les meilleurs vols aux prix les plus avantageux',
      color: 'primary'
    },
    {
      icon: 'hotel',
      title: 'Hébergements',
      description: 'Découvrez une large sélection d\'hôtels et logements de qualité',
      color: 'accent'
    },
    {
      icon: 'directions_car',
      title: 'Location de Voitures',
      description: 'Louez facilement des véhicules pour vos déplacements',
      color: 'warn'
    },
    {
      icon: 'explore',
      title: 'Excursions & Activités',
      description: 'Explorez des expériences uniques et des activités passionnantes',
      color: 'primary'
    },
    {
      icon: 'support_agent',
      title: 'Support 24/7',
      description: 'Une assistance client disponible à tout moment',
      color: 'accent'
    },
    {
      icon: 'security',
      title: 'Paiement Sécurisé',
      description: 'Transactions protégées et données personnelles sécurisées',
      color: 'warn'
    }
  ];

  testimonials = [
    {
      name: 'Ameth Faye',
      rating: 5,
      comment: 'Service exceptionnel ! J\'ai organisé mon voyage de rêve en quelques clics.',
      avatar: 'M'
    },
    {
      name: 'Samba Sarr',
      rating: 5,
      comment: 'Interface intuitive et prix compétitifs. Je recommande vivement !',
      avatar: 'J'
    },
    {
      name: 'Mor Thiane',
      rating: 5,
      comment: 'Support client réactif et professionnel. Voyage parfaitement organisé.',
      avatar: 'S'
    }
  ];

  ngOnInit() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isAuthenticated = !!user;
        if (user) {
          this.userInfo = user;
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (this.isMobileMenuOpen && 
        !menuToggle?.contains(event.target as Node) && 
        !mobileMenu?.contains(event.target as Node)) {
      this.closeMobileMenu();
    }
  }

  scrollToSectionAndClose(sectionId: string) {
    this.scrollToSection(sectionId);
    this.closeMobileMenu();
  }

  onLoginAndClose() {
    this.onLogin();
    this.closeMobileMenu();
  }

  onRegisterAndClose() {
    this.onRegister();
    this.closeMobileMenu();
  }

  onLogoutAndClose() {
    this.onLogout();
    this.closeMobileMenu();
  }

  onLogin() {
    this.router.navigate(['/login']);
  }

  onRegister() {
    this.router.navigate(['/register']);
  }

  onLogout() {
    try {
      this.authService.logout();
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Logout error:', error);
      this.router.navigate(['/home']);
    }
  }

  onGetStarted() {
    if (this.isAuthenticated) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  getRatingStars(rating: number): string[] {
    return Array(rating).fill('star');
  }
}