// payment-list.component.ts
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
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { Paiement, PaiementDetail, StatutPaiement, MethodePaiement } from '../../../../core/models/payment.model';
import { Auth } from '../../../../core/services/auth';
import { Breadcrumb } from '../../../../core/services/breadcrumb';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import Swal from 'sweetalert2';
import { PaymentService } from '../../../../core/services/payment';

@Component({
  selector: 'app-payment-list',
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
    MatChipsModule,
    MatBadgeModule
  ],
  templateUrl: './payment-list.html',
  styleUrl: './payment-list.css'
})
export class PaymentListComponent implements OnInit {

  displayedColumns: string[] = [];
  allColumns: string[] = ['id', 'reservationId', 'montant', 'methode', 'statut', 'datePaiement', 'actions'];
  columnsWithoutActions: string[] = ['id', 'reservationId', 'montant', 'methode', 'statut', 'datePaiement'];

  dataSource: Paiement[] = [];
  totalElements = 0;
  pageSize = 10;
  currentPage = 0;
  isLoading = false;
  isAdmin = false;

  selectedStatus: StatutPaiement | '' = '';
  selectedMethod: MethodePaiement | '' = '';
  searchQuery = '';

  StatutPaiement = StatutPaiement;

  statutOptions = Object.values(StatutPaiement);
  methodOptions = Object.values(MethodePaiement);
  stats = {
    total: 0,
    enAttente: 0,
    valides: 0,
    refuses: 0,
    totalRevenu: 0
  };

  private searchSubject = new Subject<string>();
  @ViewChild('searchInput') searchInput!: ElementRef;

  constructor(
    private paymentService: PaymentService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private breadcrumbService: Breadcrumb,
    private auth: Auth
  ) {}

  ngOnInit(): void {
    this.setupBreadcrumb();
    this.isAdmin = this.auth.isAdmin();
    this.displayedColumns = this.isAdmin ? this.allColumns : this.columnsWithoutActions;
    this.loadPayments();
    this.loadStats();
    this.setupRealTimeSearch();
  }

  private setupBreadcrumb(): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Gestion des Paiements', url: '/payments' }
    ]);
  }

  private setupRealTimeSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 0;
      this.loadPayments();
    });
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  loadPayments(): void {
    this.isLoading = true;

    // Si on a des filtres, utiliser la recherche avancée
    if (this.selectedStatus || this.selectedMethod || this.searchQuery.trim()) {
      const filterDto = {
        statut: this.selectedStatus || undefined,
        methode: this.selectedMethod || undefined,
        page: this.currentPage,
        size: this.pageSize,
        sortBy: 'datePaiement',
        sortDirection: 'desc'
      };

      this.paymentService.searchPaymentsWithFilters(filterDto).subscribe({
        next: (response) => {
          this.dataSource = response.content || [];
          this.totalElements = response.totalElements || 0;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur chargement paiements:', error);
          this.isLoading = false;
          this.snackBar.open('Erreur lors du chargement des paiements', 'Fermer', {
            duration: 3000
          });
        }
      });
    } else {
      // Chargement normal
      this.paymentService.getAllPaymentsPaginated(this.currentPage, this.pageSize).subscribe({
        next: (response) => {
          this.dataSource = response.content || [];
          this.totalElements = response.totalElements || 0;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur chargement paiements:', error);
          this.isLoading = false;
          this.snackBar.open('Erreur lors du chargement des paiements', 'Fermer', {
            duration: 3000
          });
        }
      });
    }
  }

  loadStats(): void {
    // Charger les statistiques
    this.paymentService.getTotalPayments().subscribe(total => this.stats.total = total);
    this.paymentService.getPaymentsByStatusCount(StatutPaiement.EN_ATTENTE).subscribe(count => this.stats.enAttente = count);
    this.paymentService.getPaymentsByStatusCount(StatutPaiement.VALIDE).subscribe(count => this.stats.valides = count);
    this.paymentService.getPaymentsByStatusCount(StatutPaiement.REFUSE).subscribe(count => this.stats.refuses = count);
    this.paymentService.getTotalRevenue().subscribe(revenue => this.stats.totalRevenu = revenue);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPayments();
  }

  onStatusFilterChange(): void {
    this.currentPage = 0;
    this.loadPayments();
  }

  onMethodFilterChange(): void {
    this.currentPage = 0;
    this.loadPayments();
  }

  clearFilters(): void {
    this.selectedStatus = '';
    this.selectedMethod = '';
    this.searchQuery = '';
    this.currentPage = 0;
    this.loadPayments();
  }

  viewPaymentDetails(payment: Paiement): void {
    if (payment.id) {
      this.isLoading = true;
      this.paymentService.getPaymentDetail(payment.id).subscribe({
        next: (detail: PaiementDetail) => {
          this.isLoading = false;
          this.showPaymentDetails(detail);
        },
        error: (error) => {
          console.error('Erreur détails paiement:', error);
          this.isLoading = false;
          this.snackBar.open('Erreur lors du chargement des détails', 'Fermer', {
            duration: 3000
          });
        }
      });
    }
  }

  private showPaymentDetails(detail: PaiementDetail): void {
    const htmlContent = `
      <div style="text-align: left; max-height: 60vh; overflow-y: auto;">
        <h3 style="color: #1976d2; margin-bottom: 20px;">Détails du Paiement</h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <!-- Colonne 1 -->
          <div>
            <h4 style="color: #388e3c; margin-bottom: 10px;">Informations Paiement</h4>
            <p><strong>ID Paiement:</strong> ${detail.id || 'N/A'}</p>
            <p><strong>Montant:</strong> ${this.formatAmount(detail.montant)}</p>
            <p><strong>Méthode:</strong> ${this.getMethodLabel(detail.methode)}</p>
            <p><strong>Statut:</strong> <span style="color: ${this.getStatusColor(detail.statut)}">${this.getStatusLabel(detail.statut)}</span></p>
            <p><strong>Date Paiement:</strong> ${this.formatDate(detail.datePaiement || '')}</p>
            <p><strong>ID Réservation:</strong> ${detail.reservationId || 'N/A'}</p>
          </div>

          <!-- Colonne 2 -->
          <div>
            <h4 style="color: #388e3c; margin-bottom: 10px;">Informations Client</h4>
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
            </div>
            <div>
              <p><strong>ID Voyage:</strong> ${detail.voyageId || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    Swal.fire({
      title: 'Détails Complets du Paiement',
      html: htmlContent,
      icon: 'info',
      confirmButtonText: 'Fermer',
      width: '800px',
      customClass: {
        popup: 'custom-swal-popup'
      }
    });
  }

  updatePaymentStatus(payment: Paiement, newStatus: StatutPaiement): void {
    if (payment.id) {
      Swal.fire({
        title: 'Confirmer la modification',
        text: `Voulez-vous changer le statut vers "${this.getStatusLabel(newStatus)}" ?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Oui, modifier',
        cancelButtonText: 'Annuler'
      }).then((result) => {
        if (result.isConfirmed) {
          this.paymentService.updatePaymentStatus(payment.id!, newStatus).subscribe({
            next: () => {
              this.snackBar.open('Statut modifié avec succès', 'Fermer', { duration: 3000 });
              this.loadPayments();
              this.loadStats();
            },
            error: (error) => {
              console.error('Erreur modification statut:', error);
              this.snackBar.open('Erreur lors de la modification du statut', 'Fermer', { duration: 3000 });
            }
          });
        }
      });
    }
  }

  deletePayment(id: number): void {
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
        this.paymentService.deletePayment(id).subscribe({
          next: () => {
            Swal.fire('Supprimé !', 'Le paiement a été supprimé.', 'success');
            this.loadPayments();
            this.loadStats();
          },
          error: (error) => {
            console.error('Erreur suppression:', error);
            Swal.fire('Erreur !', 'Une erreur est survenue lors de la suppression.', 'error');
          }
        });
      }
    });
  }

  // Méthodes utilitaires
  formatAmount(amount: number): string {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '0 F CFA';
    }
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  }

  getMethodLabel(methode: MethodePaiement): string {
  const methodLabels: { [key in MethodePaiement]: string } = {
    [MethodePaiement.WAVE]: 'Wave',
    [MethodePaiement.ORANGE_MONEY]: 'Orange Money',
    [MethodePaiement.CREDIT_CARD]: 'Carte de Crédit',
    [MethodePaiement.FREE_MONEY]: 'Free Money',
    [MethodePaiement.PAYPAL]: 'PayPal',
    [MethodePaiement.WIZALL]: 'Wizall',
    [MethodePaiement.E_MONEY]: 'E-Money'
  };
  return methodLabels[methode] || methode;
}

getMethodIcon(methode: MethodePaiement): string {
  const methodIcons: { [key in MethodePaiement]: string } = {
    [MethodePaiement.WAVE]: 'account_balance_wallet',
    [MethodePaiement.ORANGE_MONEY]: 'smartphone',
    [MethodePaiement.CREDIT_CARD]: 'credit_card',
    [MethodePaiement.FREE_MONEY]: 'attach_money',
    [MethodePaiement.PAYPAL]: 'paypal', 
    [MethodePaiement.WIZALL]: 'account_balance', 
    [MethodePaiement.E_MONEY]: 'smartphone'
  };
  return methodIcons[methode] || 'payment';
}
  getStatusLabel(statut: StatutPaiement): string {
    const statusLabels: { [key in StatutPaiement]: string } = {
      [StatutPaiement.EN_ATTENTE]: 'En Attente',
      [StatutPaiement.VALIDE]: 'Validé',
      [StatutPaiement.REFUSE]: 'Refusé',
      [StatutPaiement.REMBOURSE]: 'Remboursé'
    };
    return statusLabels[statut] || statut;
  }

  getStatusColor(statut: StatutPaiement): string {
    const statusColors: { [key in StatutPaiement]: string } = {
      [StatutPaiement.EN_ATTENTE]: '#ff9800',
      [StatutPaiement.VALIDE]: '#4caf50',
      [StatutPaiement.REFUSE]: '#f44336',
      [StatutPaiement.REMBOURSE]: '#2196f3'
    };
    return statusColors[statut] || '#000';
  }

  formatDate(dateValue: any): string {
    if (!dateValue || dateValue === 'N/A' || dateValue === null || dateValue === undefined) {
      return 'N/A';
    }
    
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
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