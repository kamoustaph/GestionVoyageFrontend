import { Component, OnInit } from '@angular/core';
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
import { Voyage } from '../../../../core/models/voyage.model';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VoyageForm } from '../voyage-form/voyage-form';
import { Breadcrumb } from '../../../../core/services/breadcrumb';
import Swal from 'sweetalert2';
import { Auth } from '../../../../core/services/auth';
import { VoyageService } from '../../../../core/services/voyage-service';
import { BreadcrumbVoyageComponent } from '../../breadcrumb/breadcrumb-voyage/breadcrumb-voyage';

@Component({
  selector: 'app-voyage-list',
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
    BreadcrumbVoyageComponent
  ],
  templateUrl: './voyage-list.html',
  styleUrl: './voyage-list.css'
})
export class VoyageList implements OnInit {
  displayedColumns: string[] = [];
  allColumns: string[] = ['id', 'lieuDepart', 'lieuArrivee', 'dateDepart', 'dateRetour', 'prix', 'placesDisponibles', 'placesTotal', 'statut', 'actions'];
  columnsWithoutActions: string[] = ['id', 'lieuDepart', 'lieuArrivee', 'dateDepart', 'dateRetour', 'prix', 'placesDisponibles', 'placesTotal', 'statut'];

  dataSource: Voyage[] = [];
  totalElements = 0;
  pageSize = 5;
  currentPage = 0;
  searchCriteria = {
    lieuDepart: '',
    lieuArrivee: '',
    statut: '',
    prixMin: undefined as number | undefined,
    prixMax: undefined as number | undefined
  };
  isLoading = false;

  isAdmin = false;
  statutOptions = ['ACTIF', 'PLANIFIE', 'TERMINE', 'ANNULE'];

  constructor(
    private voyageService: VoyageService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private breadcrumbService: Breadcrumb,
    private auth: Auth
  ) {}

  ngOnInit(): void {
    this.setupBreadcrumb();
    this.loadVoyages();
    this.isAdmin = this.auth.isAdmin();
    this.displayedColumns = this.isAdmin ? this.allColumns : this.columnsWithoutActions;
  }

  private setupBreadcrumb(): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Liste des Voyages', url: '/voyages' }
    ]);
  }

  loadVoyages(): void {
    this.isLoading = true;
    this.voyageService.getAllVoyages(this.currentPage, this.pageSize).subscribe({
      next: (page) => {
        this.dataSource = page.content;
        this.totalElements = page.totalElements;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Erreur lors du chargement des voyages', 'Fermer', {
          duration: 3000
        });
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.isLoading = true;
    this.voyageService.searchByCriteria(this.searchCriteria, this.currentPage, this.pageSize).subscribe({
      next: (page) => {
        this.dataSource = page.content;
        this.totalElements = page.totalElements;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Erreur lors de la recherche', 'Fermer', {
          duration: 3000
        });
      }
    });
  }

  clearSearch(): void {
    this.searchCriteria = {
      lieuDepart: '',
      lieuArrivee: '',
      statut: '',
      prixMin: undefined,
      prixMax: undefined
    };
    this.currentPage = 0;
    this.loadVoyages();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    if (this.isSearchActive()) {
      this.onSearch();
    } else {
      this.loadVoyages();
    }
  }

  isSearchActive(): boolean {
    return Object.values(this.searchCriteria).some(val => 
      val !== '' && val !== undefined && val !== null
    );
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(VoyageForm, {
      width: '800px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadVoyages();
      }
    });
  }

  openEditDialog(voyage: Voyage): void {
    const dialogRef = this.dialog.open(VoyageForm, {
      width: '800px',
      data: { mode: 'edit', voyage }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadVoyages();
      }
    });
  }

  deleteVoyage(id: number): void {
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
        this.voyageService.deleteVoyage(id).subscribe({
          next: () => {
            Swal.fire('Supprimé !', 'Le voyage a été supprimé.', 'success');
            this.loadVoyages();
          },
          error: () => {
            Swal.fire('Erreur !', 'Une erreur est survenue lors de la suppression.', 'error');
          }
        });
      }
    });
  }

  changeStatut(voyage: Voyage, newStatut: string): void {
    if (voyage.id) {
      this.voyageService.changeStatutVoyage(voyage.id, newStatut).subscribe({
        next: () => {
          this.snackBar.open('Statut modifié avec succès', 'Fermer', { duration: 3000 });
          this.loadVoyages();
        },
        error: () => {
          this.snackBar.open('Erreur lors de la modification du statut', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('fr-FR');
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(price);
  }
}