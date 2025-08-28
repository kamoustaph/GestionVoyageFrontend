import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  trigger,
  transition,
  style,
  animate,
  stagger,
  query,
  state,
} from '@angular/animations';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs/operators';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Breadcrumb } from '../../../../core/services/breadcrumb';
import { BreadcrumbVoyageComponent } from "../../breadcrumb/breadcrumb-voyage/breadcrumb-voyage";
// Services à implémenter plus tard
// import { VoyageService } from '../../../../core/services/voyage';
// import { TicketService } from '../../../../core/services/ticket';
// import { ReservationService } from '../../../../core/services/reservation';
// import { PaiementService } from '../../../../core/services/paiement';

@Component({
  selector: 'app-dashboard-voyage',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatCardModule,
    BreadcrumbVoyageComponent
],
  templateUrl: './dashboard-voyage.html',
  styleUrls: ['./dashboard-voyage.css'],
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        query(
          '.dashboard-card',
          [
            style({ opacity: 0, transform: 'translateY(30px)' }),
            stagger('100ms', [
              animate(
                '500ms cubic-bezier(0.35, 0, 0.25, 1)',
                style({ opacity: 1, transform: 'translateY(0)' })
              ),
            ]),
          ],
          { optional: true }
        ),
      ]),
    ]),
    trigger('hoverAnimation', [
      state(
        'normal',
        style({
          transform: 'translateY(0)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        })
      ),
      state(
        'hover',
        style({
          transform: 'translateY(-10px)',
          boxShadow: '0 10px 20px rgba(0, 0, 0, 0.15)',
        })
      ),
      transition('normal <=> hover', [animate('300ms ease-in-out')]),
    ]),
    trigger('pulseAnimation', [
      state(
        'normal',
        style({
          transform: 'scale(1)',
        })
      ),
      state(
        'hover',
        style({
          transform: 'scale(1.05)',
        })
      ),
      transition('normal <=> hover', [animate('200ms ease-in-out')]),
    ]),
  ],
})
export class DashboardVoyage implements OnInit {
  cards = [
    {
      title: 'Voyages',
      count: 0,
      icon: 'flight',
      color: '#1976d2',
      loading: false,
    },
    {
      title: 'Tickets',
      count: 0,
      icon: 'confirmation_number',
      color: '#388e3c',
      loading: false,
    },
    {
      title: 'Réservations',
      count: 0,
      icon: 'event_seat',
      color: '#f57c00',
      loading: false,
    },
    {
      title: 'Paiements',
      count: 0,
      icon: 'payment',
      color: '#7b1fa2',
      loading: false,
    },
  ];

  hoverStates: string[] = Array(this.cards.length).fill('normal');
  isLoading = true;

  constructor(private breadcrumbService: Breadcrumb) {
    // Services à injecter plus tard :
    // private voyageService: VoyageService,
    // private ticketService: TicketService,
    // private reservationService: ReservationService,
    // private paiementService: PaiementService
  }

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([{ label: '', url: '/' }]);
    this.loadInitialData();
  }

  loadInitialData() {
    this.loadVoyagesCount();
    this.loadTicketsCount();
    this.loadReservationsCount();
    this.loadPaiementsCount();
  }

  loadVoyagesCount() {
    const voyagesCard = this.cards.find((c) => c.title === 'Voyages');
    if (voyagesCard) {
      voyagesCard.loading = true;
      
      // Simulation temporaire - remplacer par le vrai service
      setTimeout(() => {
        voyagesCard.count = Math.floor(Math.random() * 100) + 10;
        voyagesCard.loading = false;
        this.checkAllLoaded();
      }, 1000);
      
      // Code à utiliser quand le service sera disponible :
      /*
      this.voyageService
        .getTotalVoyages()
        .pipe(
          finalize(() => {
            voyagesCard.loading = false;
            this.checkAllLoaded();
          })
        )
        .subscribe({
          next: (count: number) => {
            voyagesCard.count = count;
          },
          error: () => {
            voyagesCard.count = 0;
          },
        });
      */
    }
  }

  loadTicketsCount() {
    const ticketsCard = this.cards.find((c) => c.title === 'Tickets');
    if (ticketsCard) {
      ticketsCard.loading = true;
      
      // Simulation temporaire - remplacer par le vrai service
      setTimeout(() => {
        ticketsCard.count = Math.floor(Math.random() * 200) + 50;
        ticketsCard.loading = false;
        this.checkAllLoaded();
      }, 1200);
      
      // Code à utiliser quand le service sera disponible :
      /*
      this.ticketService
        .getTotalTickets()
        .pipe(
          finalize(() => {
            ticketsCard.loading = false;
            this.checkAllLoaded();
          })
        )
        .subscribe({
          next: (count: number) => {
            ticketsCard.count = count;
          },
          error: () => {
            ticketsCard.count = 0;
          },
        });
      */
    }
  }

  loadReservationsCount() {
    const reservationsCard = this.cards.find((c) => c.title === 'Réservations');
    if (reservationsCard) {
      reservationsCard.loading = true;
      
      // Simulation temporaire - remplacer par le vrai service
      setTimeout(() => {
        reservationsCard.count = Math.floor(Math.random() * 150) + 25;
        reservationsCard.loading = false;
        this.checkAllLoaded();
      }, 800);
      
      // Code à utiliser quand le service sera disponible :
      /*
      this.reservationService
        .getTotalReservations()
        .pipe(
          finalize(() => {
            reservationsCard.loading = false;
            this.checkAllLoaded();
          })
        )
        .subscribe({
          next: (count: number) => {
            reservationsCard.count = count;
          },
          error: () => {
            reservationsCard.count = 0;
          },
        });
      */
    }
  }

  loadPaiementsCount() {
    const paiementsCard = this.cards.find((c) => c.title === 'Paiements');
    if (paiementsCard) {
      paiementsCard.loading = true;
      
      // Simulation temporaire - remplacer par le vrai service
      setTimeout(() => {
        paiementsCard.count = Math.floor(Math.random() * 80) + 15;
        paiementsCard.loading = false;
        this.checkAllLoaded();
      }, 1500);
      
      // Code à utiliser quand le service sera disponible :
      /*
      this.paiementService
        .getTotalPaiements()
        .pipe(
          finalize(() => {
            paiementsCard.loading = false;
            this.checkAllLoaded();
          })
        )
        .subscribe({
          next: (count: number) => {
            paiementsCard.count = count;
          },
          error: () => {
            paiementsCard.count = 0;
          },
        });
      */
    }
  }

  checkAllLoaded() {
    this.isLoading = this.cards.some((card) => card.loading);
  }

  refreshData() {
    this.isLoading = true;
    this.loadInitialData();
  }

  setHoverState(index: number, state: string) {
    this.hoverStates[index] = state;
  }
}