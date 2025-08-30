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
import { Reservation, ReservationDetail } from '../../../../core/models/reservation.model';
import { Breadcrumb } from '../../../../core/services/breadcrumb';
import Swal from 'sweetalert2';
import { Auth } from '../../../../core/services/auth';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { BreadcrumbVoyageComponent } from '../../breadcrumb/breadcrumb-voyage/breadcrumb-voyage';
import { ReservationForm } from '../reservation-form/reservation-form';
import { ReservationService } from '../../../../core/services/reservation';

@Component({
  selector: 'app-reservation-list',
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
  templateUrl: './reservation-list.html',
  styleUrl: './reservation-list.css'
})
export class ReservationList implements OnInit {

  displayedColumns: string[] = [];
  allColumns: string[] = ['id', 'userEmail', 'voyageLieuDepart', 'voyageLieuArrivee', 'statut', 'dateReservation', 'nombrePlaces', 'prixTotal', 'actions'];
  columnsWithoutActions: string[] = ['id', 'userEmail', 'voyageLieuDepart', 'voyageLieuArrivee', 'statut', 'dateReservation', 'nombrePlaces', 'prixTotal'];

  dataSource: Reservation[] = [];
  totalElements = 0;
  pageSize = 5;
  currentPage = 0;
  searchQuery = '';
  searchSuggestions: string[] = [];
  isLoading = false;

  isAdmin = false;
  statutOptions = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];

  private searchSubject = new Subject<string>();
  @ViewChild('searchInput') searchInput!: ElementRef;

  constructor(
    private reservationService: ReservationService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private breadcrumbService: Breadcrumb,
    private auth: Auth
  ) {}

  ngOnInit(): void {
    this.setupBreadcrumb();
    this.loadReservations();
    this.isAdmin = this.auth.isAdmin();
    this.displayedColumns = this.isAdmin ? this.allColumns : this.columnsWithoutActions;
    this.setupRealTimeSearch();
  }
    

  private setupBreadcrumb(): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Liste des Réservations', url: '/reservations' }
    ]);
  }

  private setupRealTimeSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.length > 2) {
          this.isLoading = true;
          return this.reservationService.searchGlobal(query, 0, this.pageSize);
        } else if (query.length === 0) {
          return this.reservationService.getAllReservations(0, this.pageSize);
        } else {
          return this.reservationService.getAllReservations(0, this.pageSize);
        }
      })
    ).subscribe({
      next: (page) => {
        this.dataSource = page.content;
        this.totalElements = page.totalElements;
        this.isLoading = false;
        this.generateSuggestions();
      },
      error: (error) => {
        console.error('Erreur recherche:', error);
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

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.currentPage = 0;
      this.isLoading = true;
      this.reservationService.searchGlobal(this.searchQuery, this.currentPage, this.pageSize).subscribe({
        next: (page) => {
          this.dataSource = page.content;
          this.totalElements = page.totalElements;
          this.isLoading = false;
          this.generateSuggestions();
        },
        error: (error) => {
          console.error('Erreur recherche:', error);
          this.isLoading = false;
          this.snackBar.open('Erreur lors de la recherche', 'Fermer', {
            duration: 3000
          });
        }
      });
    } else {
      this.loadReservations();
    }
  }

  private generateSuggestions(): void {
    const suggestions = new Set<string>();
    
    this.dataSource.forEach(r => {
      if (r.userEmail) suggestions.add(r.userEmail);
      if (r.voyageLieuDepart) suggestions.add(`Départ: ${r.voyageLieuDepart}`);
      if (r.voyageLieuArrivee) suggestions.add(`Arrivée: ${r.voyageLieuArrivee}`);
      if (r.statut) suggestions.add(`Statut: ${r.statut}`);
      if (r.nombrePlaces) suggestions.add(`${r.nombrePlaces} place(s)`);
    });

    this.searchSuggestions = Array.from(suggestions)
      .filter(s => s && s.toLowerCase().includes(this.searchQuery.toLowerCase()))
      .slice(0, 10);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.currentPage = 0;
    this.searchSuggestions = [];
    this.loadReservations();
  }

  loadReservations(): void {
    this.isLoading = true;
    console.log('🔄 Chargement des réservations...');
    
    this.reservationService.getAllReservations(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        console.log('✅ Réponse complète reçue:', response);
        
        // Debug: Afficher la structure des données
        if (response.content && response.content.length > 0) {
          console.log('📋 Structure de la première réservation:', response.content[0]);
          console.log('🔢 nombrePlaces:', response.content[0].nombrePlaces);
          console.log('💰 prixTotal:', response.content[0].prixTotal);
        }
        
        this.dataSource = response.content || [];
        this.totalElements = response.totalElements || 0;
        this.isLoading = false;
        this.searchSuggestions = [];
      },
      error: (error) => {
        console.error('❌ Erreur chargement:', error);
        this.isLoading = false;
        this.snackBar.open('Erreur lors du chargement des réservations', 'Fermer', {
          duration: 3000
        });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    if (this.searchQuery.trim()) {
      this.reservationService.searchGlobal(this.searchQuery, this.currentPage, this.pageSize).subscribe({
        next: (page) => {
          this.dataSource = page.content;
          this.totalElements = page.totalElements;
        },
        error: (error) => {
          console.error('Erreur pagination recherche:', error);
          this.snackBar.open('Erreur lors du changement de page', 'Fermer', {
            duration: 3000
          });
        }
      });
    } else {
      this.loadReservations();
    }
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(ReservationForm, {
      width: '800px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Réservation créée avec succès', 'Fermer', { duration: 2000 });
        this.loadReservations();
      }
    });
  }

  viewReservationDetails(reservation: Reservation): void {
    if (reservation.id) {
      this.isLoading = true;
      console.log('Loading details for reservation:', reservation.id);
      
      this.reservationService.getReservationDetail(reservation.id).subscribe({
        next: (detail: ReservationDetail) => {
          console.log('Reservation detail received:', detail);
          this.checkForInvalidDates(detail);
          this.isLoading = false;
          this.showReservationDetails(detail);
        },
        error: (error) => {
          console.error('Erreur détails:', error);
          this.isLoading = false;
          this.snackBar.open('Erreur lors du chargement des détails', 'Fermer', {
            duration: 3000
          });
        }
      });
    }
  }

  private checkForInvalidDates(detail: ReservationDetail): void {
    const dateFields = [
      'dateReservation', 
      'dateExpiration', 
      'voyageDateDepart', 
      'voyageDateRetour'
    ];
    
    dateFields.forEach(field => {
      if (detail[field as keyof ReservationDetail]) {
        const date = this.safeParseDate(detail[field as keyof ReservationDetail] as string);
        if (!date) {
          console.warn(`Invalid date in field ${field}:`, detail[field as keyof ReservationDetail]);
        }
      }
    });
  }

  private showReservationDetails(detail: ReservationDetail): void {
    const htmlContent = `
      <div style="text-align: left; max-height: 60vh; overflow-y: auto;">
        <h3 style="color: #1976d2; margin-bottom: 20px;">Informations de la Réservation</h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <!-- Colonne 1 -->
          <div>
            <h4 style="color: #388e3c; margin-bottom: 10px;">Informations Générales</h4>
            <p><strong>ID Réservation:</strong> ${detail.id || 'N/A'}</p>
            <p><strong>Statut:</strong> <span style="color: ${this.getStatusColor(detail.statut)}">${this.formatStatut(detail.statut)}</span></p>
            <p><strong>Date Réservation:</strong> ${this.formatDate(detail.dateReservation || '')}</p>
            ${detail.dateExpiration ? `<p><strong>Date Expiration:</strong> ${this.formatDate(detail.dateExpiration)}</p>` : ''}
            <p><strong>Nombre de Places:</strong> ${detail.nombrePlaces !== undefined ? detail.nombrePlaces : 'N/A'}</p>
            <p><strong>Prix Total:</strong> ${this.formatPrice(detail.prixTotal !== undefined ? detail.prixTotal : 0)}</p>
          </div>

          <!-- Colonne 2 -->
          <div>
            <h4 style="color: #388e3c; margin-bottom: 10px;">Informations Utilisateur</h4>
            <p><strong>Nom Complet:</strong> ${detail.userPrenom || 'N/A'} ${detail.userNom || 'N/A'}</p>
            <p><strong>Email:</strong> ${detail.userEmail || 'N/A'}</p>
            <p><strong>ID Utilisateur:</strong> ${detail.userId || 'N/A'}</p>
          </div>
        </div>

        <div style="margin-top: 20px;">
          <h4 style="color: #388e3c; margin-bottom: 10px;">Détails du Voyage</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <p><strong>Lieu Départ:</strong> ${detail.voyageLieuDepart || 'N/A'}</p>
              <p><strong>Lieu Arrivée:</strong> ${detail.voyageLieuArrivee || 'N/A'}</p>
              <p><strong>ID Voyage:</strong> ${detail.voyageId || 'N/A'}</p>
            </div>
            <div>
              <p><strong>Date Départ:</strong> ${this.formatDate(detail.voyageDateDepart || '')}</p>
              <p><strong>Date Retour:</strong> ${this.formatDate(detail.voyageDateRetour || '')}</p>
              <p><strong>Prix Unitaire:</strong> ${this.formatPrice(detail.voyagePrix || 0)}</p>
            </div>
          </div>
        </div>

        ${this.getAdditionalDetails(detail)}
      </div>
    `;

    Swal.fire({
      title: 'Détails Complets de la Réservation',
      html: htmlContent,
      icon: 'info',
      confirmButtonText: 'Fermer',
      width: '800px',
      customClass: {
        popup: 'custom-swal-popup'
      }
    });
  }

  private getStatusColor(statut: string): string {
    const colors: { [key: string]: string } = {
      'PENDING': '#ff9800',
      'CONFIRMED': '#4caf50',
      'CANCELLED': '#f44336',
      'COMPLETED': '#2196f3'
    };
    return colors[statut] || '#000';
  }

  private getAdditionalDetails(detail: ReservationDetail): string {
    let additionalHtml = '';

    if (detail.hasOwnProperty('dateCreation')) {
      additionalHtml += `<p><strong>Date Création:</strong> ${this.formatDate((detail as any).dateCreation || '')}</p>`;
    }

    if (detail.hasOwnProperty('dateModification')) {
      additionalHtml += `<p><strong>Dernière Modification:</strong> ${this.formatDate((detail as any).dateModification || '')}</p>`;
    }

    if (additionalHtml) {
      return `
        <div style="margin-top: 20px;">
          <h4 style="color: #388e3c; margin-bottom: 10px;">Informations Supplémentaires</h4>
          ${additionalHtml}
        </div>
      `;
    }

    return '';
  }

  confirmReservation(reservation: Reservation): void {
    if (reservation.id) {
      this.reservationService.confirmReservation(reservation.id).subscribe({
        next: (success) => {
          if (success) {
            this.snackBar.open('Réservation confirmée avec succès', 'Fermer', { duration: 3000 });
            this.loadReservations();
          } else {
            this.snackBar.open('Impossible de confirmer la réservation', 'Fermer', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Erreur confirmation:', error);
          this.snackBar.open('Erreur lors de la confirmation', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  cancelReservation(reservation: Reservation): void {
    if (reservation.id) {
      this.reservationService.cancelReservation(reservation.id).subscribe({
        next: (success) => {
          if (success) {
            this.snackBar.open('Réservation annulée avec succès', 'Fermer', { duration: 3000 });
            this.loadReservations();
          } else {
            this.snackBar.open('Impossible d\'annuler la réservation', 'Fermer', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Erreur annulation:', error);
          this.snackBar.open('Erreur lors de l\'annulation', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  changeStatut(reservation: Reservation, newStatut: string): void {
    if (reservation.id) {
      this.reservationService.updateReservationStatut(reservation.id, newStatut).subscribe({
        next: () => {
          this.snackBar.open('Statut modifié avec succès', 'Fermer', { duration: 3000 });
          this.loadReservations();
        },
        error: (error) => {
          console.error('Erreur changement statut:', error);
          this.snackBar.open('Erreur lors de la modification du statut', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  deleteReservation(id: number): void {
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
        this.reservationService.deleteReservation(id).subscribe({
          next: () => {
            Swal.fire('Supprimé !', 'La réservation a été supprimée.', 'success');
            this.loadReservations();
          },
          error: (error) => {
            console.error('Erreur suppression:', error);
            Swal.fire('Erreur !', 'Une erreur est survenue lors de la suppression.', 'error');
          }
        });
      }
    });
  }

  private safeParseDate(dateString: any): Date | null {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      console.warn('Error parsing date:', error, dateString);
      return null;
    }
  }

  formatPrice(price: number): string {
    if (price === undefined || price === null || isNaN(price)) {
      return '0 F CFA';
    }
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(price);
  }

  formatStatut(statut: string): string {
    const statutMap: { [key: string]: string } = {
      'PENDING': '⏳ En attente',
      'CONFIRMED': '✅ Confirmée',
      'CANCELLED': '❌ Annulée',
      'COMPLETED': '🏁 Terminée'
    };
    return statutMap[statut] || statut;
  }

  formatDate(dateValue: any): string {
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
      
      if (Array.isArray(dateValue)) {
        const [year, month, day, hours = 0, minutes = 0, seconds = 0, milliseconds = 0] = dateValue;
        date = new Date(year, month - 1, day, hours, minutes, seconds, milliseconds);
      }
      else if (dateValue instanceof Date) {
        date = dateValue;
      }
      else if (typeof dateValue === 'string') {
        const cleanDateString = dateValue.trim();
        if (cleanDateString === '' || cleanDateString === 'null' || cleanDateString === 'undefined') {
          return 'N/A';
        }
        date = new Date(cleanDateString);
      }
      else if (typeof dateValue === 'number') {
        date = new Date(dateValue);
      }
      else {
        console.warn('Format de date inattendu:', typeof dateValue, dateValue);
        return 'N/A';
      }
      
      if (isNaN(date.getTime())) {
        console.warn('Date invalide:', dateValue);
        return 'N/A';
      }
      
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
}