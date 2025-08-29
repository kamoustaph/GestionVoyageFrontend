import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Ticket, TicketDetail } from '../../../../core/models/ticket.model';
import { Breadcrumb } from '../../../../core/services/breadcrumb';
import Swal from 'sweetalert2';
import { Auth } from '../../../../core/services/auth';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { TicketService } from '../../../../core/services/ticket';
import { BreadcrumbVoyageComponent } from '../../breadcrumb/breadcrumb-voyage/breadcrumb-voyage';
import { TicketForm } from '../ticket-form/ticket-form';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatAutocompleteModule,
    BreadcrumbVoyageComponent
  ],
  templateUrl: './ticket-list.html',
  styleUrl: './ticket-list.css'
})
export class TicketList implements OnInit {
  displayedColumns: string[] = [];
  allColumns: string[] = ['id', 'qrCode', 'reservationId', 'statut', 'createdAt', 'actions'];
columnsWithoutActions: string[] = ['id', 'qrCode', 'reservationId', 'statut', 'createdAt'];

  dataSource: Ticket[] = [];
  totalElements = 0;
  pageSize = 5;
  currentPage = 0;
  
  // Recherche unifiée
  searchQuery = '';
  searchSuggestions: string[] = [];
  isLoading = false;

  isAdmin = false;
  statutOptions = ['VALIDE', 'UTILISE', 'EXPIRE', 'ANNULE'];

  private searchSubject = new Subject<string>();
  @ViewChild('searchInput') searchInput!: ElementRef;

  constructor(
    private ticketService: TicketService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private breadcrumbService: Breadcrumb,
    private auth: Auth
  ) {}

  ngOnInit(): void {
    this.setupBreadcrumb();
    this.loadTickets();
    this.isAdmin = this.auth.isAdmin();
    this.displayedColumns = this.isAdmin ? this.allColumns : this.columnsWithoutActions;
    
    // Configuration de la recherche en temps réel
    this.setupRealTimeSearch();
  }

  private setupBreadcrumb(): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Liste des Tickets', url: '/tickets' }
    ]);
  }

  private setupRealTimeSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.length > 2) {
          this.isLoading = true;
          return this.ticketService.searchGlobal(query, 0, this.pageSize);
        } else if (query.length === 0) {
          return this.ticketService.getAllTickets(0, this.pageSize);
        } else {
          return this.ticketService.getAllTickets(0, this.pageSize);
        }
      })
    ).subscribe({
      next: (page) => {
        this.dataSource = page.content;
        this.totalElements = page.totalElements;
        this.isLoading = false;
        this.generateSuggestions();
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Erreur lors de la recherche', 'Fermer', {
          duration: 3000
        });
      }
    });
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  openCreateDialog(): void {
  const dialogRef = this.dialog.open(TicketForm, {
    width: '600px',
    data: { mode: 'create' }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.loadTickets();
    }
  });
}

openEditDialog(ticket: Ticket): void {
  const dialogRef = this.dialog.open(TicketForm, {
    width: '600px',
    data: { mode: 'edit', ticket }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.loadTickets();
    }
  });
}

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.currentPage = 0;
      this.isLoading = true;
      this.ticketService.searchGlobal(this.searchQuery, this.currentPage, this.pageSize).subscribe({
        next: (page) => {
          this.dataSource = page.content;
          this.totalElements = page.totalElements;
          this.isLoading = false;
          this.generateSuggestions();
        },
        error: () => {
          this.isLoading = false;
          this.snackBar.open('Erreur lors de la recherche', 'Fermer', {
            duration: 3000
          });
        }
      });
    } else {
      this.loadTickets();
    }
  }

  private generateSuggestions(): void {
    const suggestions = new Set<string>();
    
    this.dataSource.forEach(t => {
      if (t.qrCode) suggestions.add(t.qrCode);
      if (t.statut) suggestions.add(t.statut);
      if (t.reservationId) suggestions.add(`Réservation: ${t.reservationId}`);
    });

    this.searchSuggestions = Array.from(suggestions)
      .filter(s => s && s.toLowerCase().includes(this.searchQuery.toLowerCase()))
      .slice(0, 10);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.currentPage = 0;
    this.searchSuggestions = [];
    this.loadTickets();
  }

  loadTickets(): void {
    this.isLoading = true;
    this.ticketService.getAllTickets(this.currentPage, this.pageSize).subscribe({
      next: (page) => {
        this.dataSource = page.content;
        this.totalElements = page.totalElements;
        this.isLoading = false;
        this.searchSuggestions = [];
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Erreur lors du chargement des tickets', 'Fermer', {
          duration: 3000
        });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    if (this.searchQuery.trim()) {
      this.ticketService.searchGlobal(this.searchQuery, this.currentPage, this.pageSize).subscribe({
        next: (page) => {
          this.dataSource = page.content;
          this.totalElements = page.totalElements;
        },
        error: () => {
          this.snackBar.open('Erreur lors du changement de page', 'Fermer', {
            duration: 3000
          });
        }
      });
    } else {
      this.loadTickets();
    }
  }

  viewTicketDetails(ticket: Ticket): void {
    if (ticket.id) {
      this.ticketService.getTicketDetail(ticket.id).subscribe({
        next: (detail: TicketDetail) => {
          this.showTicketDetails(detail);
        },
        error: () => {
          this.snackBar.open('Erreur lors du chargement des détails', 'Fermer', {
            duration: 3000
          });
        }
      });
    }
  }

  private showTicketDetails(detail: TicketDetail): void {
    Swal.fire({
      title: 'Détails du Ticket',
      html: `
        <div style="text-align: left;">
          <p><strong>QR Code:</strong> ${detail.qrCode}</p>
          <p><strong>Statut:</strong> ${detail.statut}</p>
          <p><strong>Réservation ID:</strong> ${detail.reservationId}</p>
          <p><strong>Utilisateur:</strong> ${detail.userPrenom} ${detail.userNom}</p>
          <p><strong>Email:</strong> ${detail.userEmail}</p>
          <p><strong>Voyage:</strong> ${detail.voyageLieuDepart} → ${detail.voyageLieuArrivee}</p>
          <p><strong>Départ:</strong> ${this.formatDate(detail.voyageDateDepart)}</p>
          <p><strong>Retour:</strong> ${this.formatDate(detail.voyageDateRetour)}</p>
          <p><strong>Créé le:</strong> ${this.formatDate(detail.createdAt || '')}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Fermer'
    });
  }

  validateTicket(ticket: Ticket): void {
    if (ticket.qrCode) {
      this.ticketService.validateTicket(ticket.qrCode).subscribe({
        next: (success) => {
          if (success) {
            this.snackBar.open('Ticket validé avec succès', 'Fermer', { duration: 3000 });
            this.loadTickets();
          } else {
            this.snackBar.open('Impossible de valider le ticket', 'Fermer', { duration: 3000 });
          }
        },
        error: () => {
          this.snackBar.open('Erreur lors de la validation', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  changeStatut(ticket: Ticket, newStatut: string): void {
    if (ticket.id) {
      this.ticketService.updateTicketStatut(ticket.id, newStatut).subscribe({
        next: () => {
          this.snackBar.open('Statut modifié avec succès', 'Fermer', { duration: 3000 });
          this.loadTickets();
        },
        error: () => {
          this.snackBar.open('Erreur lors de la modification du statut', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  deleteTicket(id: number): void {
    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: 'Vous ne pourrez pas annuler cette action !',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer !',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.ticketService.deleteTicket(id).subscribe({
          next: () => {
            Swal.fire('Supprimé !', 'Le ticket a été supprimé.', 'success');
            this.loadTickets();
          },
          error: () => {
            Swal.fire('Erreur !', 'Une erreur est survenue lors de la suppression.', 'error');
          }
        });
      }
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('fr-FR');
  }

  formatStatut(statut: string): string {
    return statut.charAt(0).toUpperCase() + statut.slice(1).toLowerCase();
  }
}