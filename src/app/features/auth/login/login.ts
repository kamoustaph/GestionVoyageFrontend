import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserCredentials } from '../../../core/models/user.model';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
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
    MatDividerModule,
    RouterLink
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(Auth);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  loginForm = this.fb.group({
    username: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  hidePassword = true;
  isLoading = false;

  onSubmit() {
    if (this.loginForm.invalid) {
      this.showSnackBar('Veuillez remplir tous les champs correctement.', 'error');
      return;
    }

    this.isLoading = true;
    const credentials: UserCredentials = {
      username: this.loginForm.value.username!,
      password: this.loginForm.value.password!
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.showSnackBar('Connexion réussie! Redirection en cours...', 'success');
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Login error:', error);

        let errorMessage = "Une erreur est survenue lors de la connexion.";
        if (error.status === 401) {
          errorMessage = "Identifiants incorrects. Veuillez réessayer.";
        } else if (error.status === 403) {
          errorMessage = "Compte non activé. Veuillez vérifier votre email.";
        } else if (error.status === 400) {
          errorMessage = error.error?.message || "Données de connexion invalides.";
        }

        this.showSnackBar(errorMessage, 'error');
      }
    });
  }

  loginWithGoogle() {
    this.authService.loginWithGoogle();
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  private showSnackBar(message: string, type: 'success' | 'error' | 'warning') {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: [`snackbar-${type}`]
    });
  }

  get username() { return this.loginForm.get('username'); }
  get password() { return this.loginForm.get('password'); }
}