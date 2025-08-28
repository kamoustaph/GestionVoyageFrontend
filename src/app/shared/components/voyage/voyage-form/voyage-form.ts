import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { Voyage, VoyageCreateDto } from '../../../../core/models/voyage.model';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { Breadcrumb } from '../../../../core/services/breadcrumb';
import { BreadcrumbVoyageComponent } from '../../breadcrumb/breadcrumb-voyage/breadcrumb-voyage';
import { VoyageService } from '../../../../core/services/voyage-service';

function dateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const dateDepart = control.get('dateDepart')?.value;
    const dateRetour = control.get('dateRetour')?.value;

    if (dateDepart && dateRetour && new Date(dateRetour) <= new Date(dateDepart)) {
      return { dateInvalid: true };
    }
    return null;
  };
}

function placesValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const placesDisponibles = control.get('placesDisponibles')?.value;
    const placesTotal = control.get('placesTotal')?.value;

    if (placesDisponibles !== null && placesTotal !== null && placesDisponibles > placesTotal) {
      return { placesInvalid: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-voyage-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    BreadcrumbVoyageComponent
  ],
  templateUrl: './voyage-form.html',
  styleUrl: './voyage-form.css',
})
export class VoyageForm implements OnInit {
  voyageForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  statutOptions = ['ACTIF', 'PLANIFIE', 'TERMINE', 'ANNULE'];

  constructor(
    private fb: FormBuilder,
    private voyageService: VoyageService,
    private dialogRef: MatDialogRef<VoyageForm>,
    @Inject(MAT_DIALOG_DATA)
    public data: { mode: 'create' | 'edit'; voyage?: Voyage },
    private snackBar: MatSnackBar,
    private breadcrumbService: Breadcrumb
  ) {
    this.voyageForm = this.fb.group({
      id: [null],
      lieuDepart: ['', [Validators.required, Validators.maxLength(100)]],
      lieuArrivee: ['', [Validators.required, Validators.maxLength(100)]],
      dateDepart: ['', [Validators.required]],
      dateRetour: ['', [Validators.required]],
      prix: [0, [Validators.required, Validators.min(0)]],
      placesDisponibles: [0, [Validators.required, Validators.min(0)]],
      placesTotal: [0, [Validators.required, Validators.min(1)]],
      statut: ['ACTIF', [Validators.required]]
    }, { validators: [dateValidator(), placesValidator()] });

    this.isEditMode = this.data.mode === 'edit';
  }

  ngOnInit(): void {
    this.setupBreadcrumb();

    if (this.isEditMode && this.data.voyage) {
      this.voyageForm.patchValue(this.data.voyage);
    }
  }

  private setupBreadcrumb(): void {
    const breadcrumbs = [];
    
    if (this.isEditMode) {
      breadcrumbs.push({ label: 'Modifier Voyage', url: '' });
    } else {
      breadcrumbs.push({ label: 'Nouveau Voyage', url: '' });
    }

    this.breadcrumbService.setBreadcrumbs(breadcrumbs);
  }

  onSubmit(): void {
    if (this.voyageForm.invalid) {
      return;
    }

    this.isLoading = true;
    const voyageData: VoyageCreateDto = this.voyageForm.value;

    const operation = this.isEditMode
      ? this.voyageService.updateVoyage(voyageData.id!, voyageData)
      : this.voyageService.createVoyage(voyageData);

    operation.subscribe({
      next: () => {
        this.snackBar.open(
          `Voyage ${this.isEditMode ? 'modifié' : 'créé'} avec succès`,
          'Fermer',
          { duration: 3000 }
        );
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error:', error);
        this.snackBar.open(
          `Erreur lors de ${
            this.isEditMode ? 'la modification' : 'la création'
          } du voyage`,
          'Fermer',
          { duration: 3000 }
        );
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getErrorMessage(controlName: string): string {
    const control = this.voyageForm.get(controlName);

    if (control?.hasError('required')) {
      return 'Ce champ est obligatoire';
    } else if (control?.hasError('min')) {
      return 'La valeur doit être positive';
    } else if (control?.hasError('maxlength')) {
      return `Maximum ${control.errors?.['maxlength'].requiredLength} caractères`;
    }

    return '';
  }

  getFormError(): string {
    if (this.voyageForm.hasError('dateInvalid')) {
      return 'La date de retour doit être après la date de départ';
    }
    if (this.voyageForm.hasError('placesInvalid')) {
      return 'Les places disponibles ne peuvent pas dépasser le total des places';
    }
    return '';
  }
}