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
import { Voyage } from '../../../../core/models/voyage.model';
import { VoyageForm } from '../voyage-form/voyage-form';
import { Breadcrumb } from '../../../../core/services/breadcrumb';
import Swal from 'sweetalert2';
import { Auth } from '../../../../core/services/auth';
import { VoyageService } from '../../../../core/services/voyage-service';
import { BreadcrumbVoyageComponent } from '../../breadcrumb/breadcrumb-voyage/breadcrumb-voyage';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

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
    MatAutocompleteModule,
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
  
  // Recherche unifiée
  searchQuery = '';
  searchSuggestions: string[] = [];
  isLoading = false;

  isAdmin = false;
  statutOptions = ['ACTIF', 'COMPLET', 'ANNULE', 'TERMINE'];

  private searchSubject = new Subject<string>();
  @ViewChild('searchInput') searchInput!: ElementRef;

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
    
    // Configuration de la recherche en temps réel
    this.setupRealTimeSearch();
  }

  private setupBreadcrumb(): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Liste des Voyages', url: '/voyages' }
    ]);
  }

  private setupRealTimeSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300), // Attendre 300ms après la dernière frappe
      distinctUntilChanged(), // Ignorer si la valeur n'a pas changé
      switchMap(query => {
        if (query.length > 2) { // Seulement si au moins 3 caractères
          this.isLoading = true;
          return this.voyageService.searchGlobal(query, 0, this.pageSize);
        } else if (query.length === 0) {
          // Si vide, recharger tous les voyages
          return this.voyageService.getAllVoyages(0, this.pageSize);
        } else {
          // Si moins de 3 caractères mais pas vide, retourner un observable vide
          return this.voyageService.getAllVoyages(0, this.pageSize);
        }
      })
    ).subscribe({
      next: (page) => {
        this.dataSource = page.content;
        this.totalElements = page.totalElements;
        this.isLoading = false;
        
        // Générer des suggestions basées sur les résultats
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

  onSearch(): void {
    // Forcer la recherche même si moins de 3 caractères
    if (this.searchQuery.trim()) {
      this.currentPage = 0;
      this.isLoading = true;
      this.voyageService.searchGlobal(this.searchQuery, this.currentPage, this.pageSize).subscribe({
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
      this.loadVoyages();
    }
  }

  private generateSuggestions(): void {
    // Générer des suggestions basées sur les données actuelles
    const suggestions = new Set<string>();
    
    // Suggestions de lieux de départ
    this.dataSource.forEach(v => {
      if (v.lieuDepart) suggestions.add(v.lieuDepart);
      if (v.lieuArrivee) suggestions.add(v.lieuArrivee);
      if (v.statut) suggestions.add(v.statut);
      if (v.prix) suggestions.add(Math.round(v.prix / 1000) * 1000 + ' XOF');
    });

    this.searchSuggestions = Array.from(suggestions)
      .filter(s => s && s.toLowerCase().includes(this.searchQuery.toLowerCase()))
      .slice(0, 10); // Limiter à 10 suggestions
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.currentPage = 0;
    this.searchSuggestions = [];
    this.loadVoyages();
  }

  loadVoyages(): void {
    this.isLoading = true;
    this.voyageService.getAllVoyages(this.currentPage, this.pageSize).subscribe({
      next: (page) => {
        this.dataSource = page.content;
        this.totalElements = page.totalElements;
        this.isLoading = false;
        this.searchSuggestions = [];
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Erreur lors du chargement des voyages', 'Fermer', {
          duration: 3000
        });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    if (this.searchQuery.trim()) {
      this.voyageService.searchGlobal(this.searchQuery, this.currentPage, this.pageSize).subscribe({
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
      this.loadVoyages();
    }
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