import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-activation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink
  ],  
  templateUrl: './activation.html',
  styleUrls: ['./activation.css']
})
export class Activation {
  private fb = inject(FormBuilder);
  private authService = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  activationForm = this.fb.group({
    activationCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
  });

  isLoading = false;

  constructor() {
    this.route.queryParams.subscribe(params => {
      if (params['code']) {
        this.activationForm.patchValue({ activationCode: params['code'] });
      }
    });
  }

  onSubmit() {
    if (this.activationForm.invalid) {
      this.showSnackBar('Veuillez entrer un code d\'activation valide (6 caractères exactement).', 'error');
      return;
    }

    this.isLoading = true;
    const activationCode = this.activationForm.value.activationCode!;

    this.authService.activateAccount(activationCode).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSnackBar(response.message, 'success');
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.showSnackBar(response.message, 'warning');
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Activation error:', error);
        
        let errorMessage = "Le code d'activation est invalide ou a expiré. Veuillez réessayer.";
        if (error.status === 400) {
          errorMessage = error.error?.message || 'Code d\'activation invalide.';
        } else if (error.status === 404) {
          errorMessage = 'Code d\'activation introuvable.';
        } else if (error.status === 410) {
          errorMessage = 'Le code d\'activation a expiré. Veuillez en demander un nouveau.';
        }

        this.showSnackBar(errorMessage, 'error');
      }
    });
  }

  private showSnackBar(message: string, type: 'success' | 'error' | 'warning') {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: [`snackbar-${type}`]
    });
  }

  get activationCode() { return this.activationForm.get('activationCode'); }
}