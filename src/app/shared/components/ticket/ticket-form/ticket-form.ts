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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { Breadcrumb } from '../../../../core/services/breadcrumb';
import { Ticket, TicketCreateDto } from '../../../../core/models/ticket.model';
import { BreadcrumbVoyageComponent } from '../../breadcrumb/breadcrumb-voyage/breadcrumb-voyage';
import { TicketService } from '../../../../core/services/ticket';

@Component({
  selector: 'app-ticket-form',
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
  templateUrl: './ticket-form.html',
  styleUrl: './ticket-form.css',
})
export class TicketForm implements OnInit {
  ticketForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  statutOptions = ['VALIDE', 'UTILISE', 'EXPIRE', 'ANNULE'];

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    private dialogRef: MatDialogRef<TicketForm>,
    @Inject(MAT_DIALOG_DATA)
    public data: { mode: 'create' | 'edit'; ticket?: Ticket },
    private snackBar: MatSnackBar,
    private breadcrumbService: Breadcrumb
  ) {
    this.ticketForm = this.fb.group({
      id: [null],
      reservationId: ['', [Validators.required, Validators.min(1)]],
      qrCode: ['', [Validators.required, Validators.maxLength(100)]],
      statut: ['VALIDE', [Validators.required]]
    });

    this.isEditMode = this.data.mode === 'edit';
  }

  ngOnInit(): void {
    this.setupBreadcrumb();

    if (this.isEditMode && this.data.ticket) {
      this.ticketForm.patchValue(this.data.ticket);
      
      // Désactiver certains champs en mode édition
      if (this.data.ticket.id) {
        this.ticketForm.get('reservationId')?.disable();
        this.ticketForm.get('qrCode')?.disable();
      }
    }
  }

  private setupBreadcrumb(): void {
    const breadcrumbs = [];
    
    if (this.isEditMode) {
      breadcrumbs.push({ label: 'Modifier Ticket', url: '' });
    } else {
      breadcrumbs.push({ label: 'Nouveau Ticket', url: '' });
    }

    this.breadcrumbService.setBreadcrumbs(breadcrumbs);
  }

  onSubmit(): void {
    if (this.ticketForm.invalid) {
      return;
    }

    this.isLoading = true;
    
    // Préparer les données du formulaire
    const formValue = this.ticketForm.getRawValue();
    const ticketData: TicketCreateDto = {
      reservationId: formValue.reservationId
    };

    if (this.isEditMode && formValue.id) {
      // Mode édition - mettre à jour le statut seulement
      this.ticketService.updateTicketStatut(formValue.id, formValue.statut).subscribe({
        next: (updatedTicket) => {
          this.snackBar.open('Ticket modifié avec succès', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error:', error);
          this.snackBar.open('Erreur lors de la modification du ticket', 'Fermer', { duration: 3000 });
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } else {
      // Mode création - créer un nouveau ticket
      this.ticketService.createTicket(ticketData).subscribe({
        next: (createdTicket) => {
          this.snackBar.open('Ticket créé avec succès', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error:', error);
          this.snackBar.open('Erreur lors de la création du ticket', 'Fermer', { duration: 3000 });
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getErrorMessage(controlName: string): string {
    const control = this.ticketForm.get(controlName);

    if (control?.hasError('required')) {
      return 'Ce champ est obligatoire';
    } else if (control?.hasError('min')) {
      return 'La valeur doit être positive';
    } else if (control?.hasError('maxlength')) {
      return `Maximum ${control.errors?.['maxlength'].requiredLength} caractères`;
    }

    return '';
  }

  generateQrCode(): void {
    // Générer un code QR unique
    const randomCode = 'TKT-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    this.ticketForm.patchValue({ qrCode: randomCode });
  }
}