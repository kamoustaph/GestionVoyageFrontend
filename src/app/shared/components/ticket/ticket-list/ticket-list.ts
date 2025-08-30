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
    this.isAdmin = this.auth.isAdmin();
    this.displayedColumns = this.isAdmin ? this.allColumns : this.columnsWithoutActions;
    this.loadTickets();
    
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
        this.isLoading = true;
        if (query.length > 2) {
          return this.ticketService.searchGlobal(query, 0, this.pageSize);
        } else {
          return this.ticketService.getAllTickets(0, this.pageSize);
        }
      })
    ).subscribe({
      next: (page) => {
        console.log('Search results:', page);
        this.dataSource = page.content;
        this.totalElements = page.totalElements;
        this.isLoading = false;
        this.generateSuggestions();
      },
      error: (error) => {
        console.error('Search error:', error);
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
        error: (error) => {
          console.error('Search error:', error);
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
    console.log('🔄 Chargement des tickets...');
    
    this.ticketService.getAllTickets(this.currentPage, this.pageSize).subscribe({
      next: (page) => {
        console.log('✅ Réponse tickets reçue:', page);
        this.dataSource = page.content;
        this.totalElements = page.totalElements;
        this.isLoading = false;
        this.searchSuggestions = [];
      },
      error: (error) => {
        console.error('❌ Erreur chargement tickets:', error);
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
        error: (error) => {
          console.error('Page change error:', error);
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
          console.log('Détails du ticket reçus:', detail);
          this.showTicketDetails(detail);
        },
        error: (error) => {
          console.error('Detail error:', error);
          this.snackBar.open('Erreur lors du chargement des détails', 'Fermer', {
            duration: 3000
          });
        }
      });
    }
  }

  private showTicketDetails(detail: TicketDetail): void {
    console.log('Détails complets reçus:', detail);
    
    // Debug : afficher toutes les propriétés
    console.log('userPrenom:', detail.userPrenom);
    console.log('userNom:', detail.userNom);
    console.log('userEmail:', detail.userEmail);
    console.log('createdAt:', detail.createdAt);
    console.log('voyageDateDepart:', detail.voyageDateDepart);
    console.log('voyageDateRetour:', detail.voyageDateRetour);
    
    // Fonctions utilitaires améliorées
    const safeString = (value: any): string => {
      if (value === null || value === undefined || value === '' || 
          value === 'null' || value === 'undefined') {
        return 'N/A';
      }
      return String(value).trim();
    };

    const formatUserName = (): string => {
      let prenom = safeString(detail.userPrenom);
      const nom = safeString(detail.userNom);
      
      // Si userPrenom contient un email, essayer d'extraire le vrai prénom
      if (prenom.includes('@') && prenom !== 'N/A') {
        const emailParts = prenom.split('@')[0];
        const nameParts = emailParts.split('.');
        if (nameParts.length > 1) {
          prenom = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
          const extractedNom = nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1);
          return `${prenom} ${extractedNom}`;
        }
        return nom !== 'N/A' ? nom : emailParts;
      }
      
      if (prenom !== 'N/A' && nom !== 'N/A') {
        return `${prenom} ${nom}`;
      } else if (prenom !== 'N/A') {
        return prenom;
      } else if (nom !== 'N/A') {
        return nom;
      }
      return 'N/A';
    };

    const formatEmail = (): string => {
      const email = safeString(detail.userEmail);
      
      // Si l'email est undefined mais qu'on a l'email dans userPrenom
      if ((email === 'N/A' || !email) && detail.userPrenom && detail.userPrenom.includes('@')) {
        return safeString(detail.userPrenom);
      }
      
      return email !== 'N/A' ? email : 'N/A';
    };

    const formatRoute = (): string => {
      const depart = safeString(detail.voyageLieuDepart);
      const arrivee = safeString(detail.voyageLieuArrivee);
      
      if (depart !== 'N/A' && arrivee !== 'N/A') {
        return `${depart} → ${arrivee}`;
      } else if (depart !== 'N/A') {
        return `${depart} → N/A`;
      } else if (arrivee !== 'N/A') {
        return `N/A → ${arrivee}`;
      }
      return 'N/A';
    };

    // Affichage des détails
    Swal.fire({
      title: 'Détails du Ticket',
      html: `
        <div style="text-align: left; line-height: 1.8; font-size: 14px;">
          <p><strong>QR Code:</strong> ${safeString(detail.qrCode)}</p>
          <p><strong>Statut:</strong> ${safeString(detail.statut)}</p>
          <p><strong>Réservation ID:</strong> ${safeString(detail.reservationId)}</p>
          <p><strong>Utilisateur:</strong> ${formatUserName()}</p>
          <p><strong>Email:</strong> ${formatEmail()}</p>
          <p><strong>Voyage:</strong> ${formatRoute()}</p>
          <p><strong>Départ:</strong> ${this.safeFormatDate(detail.voyageDateDepart)}</p>
          <p><strong>Retour:</strong> ${this.safeFormatDate(detail.voyageDateRetour)}</p>
          <p><strong>Créé le:</strong> ${this.safeFormatDate(detail.createdAt)}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Fermer',
      width: '650px',
      customClass: {
        popup: 'ticket-details-popup'
      }
    });
  }

  private safeFormatDate(dateValue: any): string {
    // Vérifications strictes
    if (!dateValue || 
        dateValue === 'N/A' || 
        dateValue === 'null' || 
        dateValue === 'undefined' ||
        dateValue === null ||
        dateValue === undefined ||
        dateValue === '') {
      return 'N/A';
    }
    
    try {
      let date: Date;
      
      // Si c'est un tableau (format backend)
      if (Array.isArray(dateValue)) {
        console.log('Traitement tableau date:', dateValue);
        
        // Format: [année, mois, jour, heure, minute, seconde, millisecondes]
        const [year, month, day, hours = 0, minutes = 0, seconds = 0, milliseconds = 0] = dateValue;
        
        // Les mois en JavaScript sont 0-indexés (0 = janvier, 11 = décembre)
        date = new Date(year, month - 1, day, hours, minutes, seconds, milliseconds);
      }
      // Si c'est déjà un objet Date
      else if (dateValue instanceof Date) {
        date = dateValue;
      }
      // Si c'est une chaîne de caractères
      else if (typeof dateValue === 'string') {
        const cleanDateString = dateValue.trim();
        if (cleanDateString === '' || cleanDateString === 'null' || cleanDateString === 'undefined') {
          return 'N/A';
        }
        
        date = new Date(cleanDateString);
      }
      // Si c'est un nombre (timestamp)
      else if (typeof dateValue === 'number') {
        date = new Date(dateValue);
      }
      // Format inattendu
      else {
        console.warn('Format de date inattendu:', typeof dateValue, dateValue);
        return 'N/A';
      }
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        console.warn('Date invalide:', dateValue);
        return 'N/A';
      }
      
      // Formater la date
      return date.toLocaleString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error, dateValue);
      return 'N/A';
    }
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
        error: (error) => {
          console.error('Validation error:', error);
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
        error: (error) => {
          console.error('Statut change error:', error);
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
          error: (error) => {
            console.error('Delete error:', error);
            Swal.fire('Erreur !', 'Une erreur est survenue lors de la suppression.', 'error');
          }
        });
      }
    });
  }

  formatDate(dateValue: any): string {
    return this.safeFormatDate(dateValue);
  }

  formatStatut(statut: string | undefined): string {
    if (!statut) return 'N/A';
    return statut.charAt(0).toUpperCase() + statut.slice(1).toLowerCase();
  }

  // Méthodes pour les couleurs et icônes de statut
  getStatusColor(statut: string | undefined): 'primary' | 'accent' | 'warn' | undefined {
    if (!statut) return undefined;
    
    switch (statut.toUpperCase()) {
      case 'VALIDE':
        return 'primary';
      case 'UTILISE':
        return 'accent';
      case 'EXPIRE':
      case 'ANNULE':
        return 'warn';
      default:
        return undefined;
    }
  }

  getStatusIcon(statut: string | undefined): string {
    if (!statut) return 'help';
    
    switch (statut.toUpperCase()) {
      case 'VALIDE':
        return 'check_circle';
      case 'UTILISE':
        return 'done_all';
      case 'EXPIRE':
        return 'schedule';
      case 'ANNULE':
        return 'cancel';
      default:
        return 'help';
    }
  }
}