import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReservationService } from '../../../../core/services/reservation';
import { 
  PaiementCreateDto, 
  MethodePaiement, 
} from '../../../../core/models/payment.model';
import { PaymentService } from '../../../../core/services/payment';
import { ReservationDetail } from '../../../../core/models/reservation.model';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatRadioModule
  ],
  templateUrl: './payment-form.html',
  styleUrl: './payment-form.css'
})
export class PaymentFormComponent implements OnInit {
  paymentForm: FormGroup;
  isLoading = false;
  reservationDetail: ReservationDetail | null = null;
  
  // Méthodes de paiement disponibles
  paymentMethods = [
    { 
      value: MethodePaiement.WAVE, 
      label: 'Wave', 
      icon: 'account_balance_wallet',
      description: 'Paiement mobile sécurisé',
      color: '#FF6B35'
    },
    { 
      value: MethodePaiement.ORANGE_MONEY, 
      label: 'Orange Money', 
      icon: 'smartphone',
      description: 'Paiement mobile Orange',
      color: '#FF8C00' 
    },
    { 
      value: MethodePaiement.CREDIT_CARD, 
      label: 'Carte de Crédit', 
      icon: 'credit_card',
      description: 'Visa, MasterCard, etc.',
      color: '#4A90E2' 
    },
    { 
      value: MethodePaiement.FREE_MONEY, 
      label: 'Free Money', 
      icon: 'account_balance',
      description: 'Paiement Free Money',
      color: '#7B68EE' 
    },
    { 
      value: MethodePaiement.WIZALL, 
      label: 'Wizall', 
      icon: 'payment',
      description: 'Paiement Wizall',
      color: '#32CD32' 
    }
  ];

  constructor(
    private fb: FormBuilder,
    public paymentService: PaymentService,    
    private reservationService: ReservationService,
    private dialogRef: MatDialogRef<PaymentFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      reservationId: number, 
      montant?: number,
      mode?: 'create' | 'edit'
    },
    private snackBar: MatSnackBar
  ) {
    this.paymentForm = this.fb.group({
      reservationId: [data.reservationId, [Validators.required]],
      montant: [data.montant || 0, [Validators.required, Validators.min(100)]],
      methode: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadReservationDetails();
    
    // Si le montant n'est pas fourni, le désactiver jusqu'au chargement des détails
    if (!this.data.montant) {
      this.paymentForm.get('montant')?.disable();
    }
  }

  loadReservationDetails(): void {
    if (this.data.reservationId) {
      this.isLoading = true;
      this.reservationService.getReservationDetail(this.data.reservationId).subscribe({
        next: (detail) => {
          this.reservationDetail = detail;
          // Mettre à jour le montant si non fourni
          if (!this.data.montant && detail.prixTotal) {
            this.paymentForm.patchValue({
              montant: detail.prixTotal
            });
            this.paymentForm.get('montant')?.enable();
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur chargement réservation:', error);
          this.snackBar.open('Erreur lors du chargement des détails de la réservation', 'Fermer', {
            duration: 3000
          });
          this.isLoading = false;
        }
      });
    }
  }

  

  onSubmit(): void {
    if (this.paymentForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    const paymentData: PaiementCreateDto = {
      ...this.paymentForm.value,
      montant: this.paymentForm.get('montant')?.value
    };

    // Créer le paiement et initier le processus selon la méthode choisie
    this.paymentService.createPayment(paymentData).subscribe({
      next: (payment) => {
        this.snackBar.open('Paiement initié avec succès', 'Fermer', { duration: 2000 });
        
        // Selon la méthode choisie, rediriger vers le processus approprié
        const selectedMethod = this.paymentForm.get('methode')?.value;
        if (selectedMethod === MethodePaiement.WAVE) {
          this.initiateWavePayment(payment.montant, payment.reservationId);
        } else if (selectedMethod === MethodePaiement.ORANGE_MONEY) {
          this.initiateOrangeMoneyPayment(payment.montant, payment.reservationId);
        } else {
          // Pour les autres méthodes, fermer le dialog
          this.dialogRef.close({ success: true, payment: payment });
        }
      },
      error: (error) => {
        console.error('Erreur création paiement:', error);
        this.snackBar.open(
          error.error?.message || 'Erreur lors de la création du paiement',
          'Fermer',
          { duration: 3000 }
        );
        this.isLoading = false;
      }
    });
  }

  private initiateWavePayment(amount: number, reservationId: number): void {
    this.paymentService.initiateWavePayment(amount, reservationId).subscribe({
      next: (waveResponse) => {
        // Rediriger vers Wave
        window.location.href = waveResponse.wave_launch_url;
      },
      error: (error) => {
        console.error('Erreur Wave:', error);
        this.snackBar.open('Erreur lors de l\'initialisation du paiement Wave', 'Fermer', {
          duration: 3000
        });
        this.isLoading = false;
      }
    });
  }

  private initiateOrangeMoneyPayment(amount: number, reservationId: number): void {
    this.paymentService.initiateOrangeMoneyPayment(amount, reservationId).subscribe({
      next: (orangeResponse) => {
        // Rediriger vers Orange Money
        window.location.href = orangeResponse.pay_url;
      },
      error: (error) => {
        console.error('Erreur Orange Money:', error);
        this.snackBar.open('Erreur lors de l\'initialisation du paiement Orange Money', 'Fermer', {
          duration: 3000
        });
        this.isLoading = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close({ success: false });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.paymentForm.controls).forEach(key => {
      const control = this.paymentForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.paymentForm.get(controlName);

    if (control?.hasError('required')) {
      return 'Ce champ est obligatoire';
    } else if (control?.hasError('min')) {
      return 'Le montant minimum est de 100 F CFA';
    }

    return '';
  }

  formatAmount(amount: number): string {
    return this.paymentService.formatAmount(amount);
  }

  getMethodIcon(method: MethodePaiement): string {
    const methodObj = this.paymentMethods.find(m => m.value === method);
    return methodObj?.icon || 'payment';
  }

  getMethodColor(method: MethodePaiement): string {
    const methodObj = this.paymentMethods.find(m => m.value === method);
    return methodObj?.color || '#666';
  }

  isMethodSelected(method: MethodePaiement): boolean {
    return this.paymentForm.get('methode')?.value === method;
  }
}