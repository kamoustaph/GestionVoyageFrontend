import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
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
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { Breadcrumb } from '../../../../core/services/breadcrumb';
import { ReservationCreateDto } from '../../../../core/models/reservation.model';
import { BreadcrumbVoyageComponent } from '../../breadcrumb/breadcrumb-voyage/breadcrumb-voyage';
import { ReservationService } from '../../../../core/services/reservation';

@Component({
  selector: 'app-reservation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    BreadcrumbVoyageComponent
  ],
  templateUrl: './reservation-form.html',
  styleUrl: './reservation-form.css',
})
export class ReservationForm implements OnInit {
  reservationForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private reservationService: ReservationService,
    private dialogRef: MatDialogRef<ReservationForm>,
    @Inject(MAT_DIALOG_DATA)
    public data: { voyageId?: number, userId?: number },
    private snackBar: MatSnackBar,
    private breadcrumbService: Breadcrumb
  ) {
    this.reservationForm = this.fb.group({
      userId: [data.userId || '', [Validators.required, Validators.min(1)]],
      voyageId: [data.voyageId || '', [Validators.required, Validators.min(1)]],
      nombrePlaces: [1, [Validators.required, Validators.min(1), Validators.max(10)]]
    });
  }

  ngOnInit(): void {
    this.setupBreadcrumb();
  }

  private setupBreadcrumb(): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Nouvelle Réservation', url: '' }
    ]);
  }

  onSubmit(): void {
    if (this.reservationForm.invalid) {
      return;
    }

    this.isLoading = true;
    const reservationData: ReservationCreateDto = this.reservationForm.value;

    this.reservationService.createReservation(reservationData).subscribe({
      next: (createdReservation) => {
        this.snackBar.open('Réservation créée avec succès', 'Fermer', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error:', error);
        this.snackBar.open(
          error.error?.message || 'Erreur lors de la création de la réservation',
          'Fermer',
          { duration: 3000 }
        );
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getErrorMessage(controlName: string): string {
    const control = this.reservationForm.get(controlName);

    if (control?.hasError('required')) {
      return 'Ce champ est obligatoire';
    } else if (control?.hasError('min')) {
      return 'La valeur doit être positive';
    } else if (control?.hasError('max')) {
      return 'Maximum 10 places par réservation';
    }

    return '';
  }
}