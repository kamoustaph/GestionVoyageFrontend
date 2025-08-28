import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { HttpErrorResponse } from '@angular/common/http';
import { trigger, transition, style, animate } from '@angular/animations';
import Swal from 'sweetalert2';
import { Role, RoleType } from '../../../core/models/role.model'; 
import { UserRegistration } from '../../../core/models/user.model';
import { Auth } from '../../../core/services/auth';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate(
          '600ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
  ],
})
export class Register implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(Auth);
  private router = inject(Router);

  roles: Role[] = [];
  hidePassword = true;
  errorMessage: string | null = null;
  isLoading = false;

  registerForm = this.fb.group({
    username: ['', [Validators.required, Validators.email]],
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{9,13}$/)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: [null as Role | null, Validators.required],
  });

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.authService.getRoles().subscribe({
      next: (roles: Role[]) => {
        this.roles = roles;
        if (this.roles.length > 0) {
          this.registerForm.patchValue({ role: this.roles[0] });
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load roles', error);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de charger les rôles. Veuillez réessayer.',
        });
      },
    });
  }

  onSubmit() {
    this.errorMessage = null;
    this.isLoading = true;

    if (this.registerForm.invalid) {
      Swal.fire({
        icon: 'error',
        title: 'Formulaire invalide',
        text: 'Veuillez remplir tous les champs correctement.',
      });
      this.isLoading = false;
      return;
    }

    const selectedRole = this.registerForm.value.role;
    if (!selectedRole) {
      Swal.fire({
        icon: 'error',
        title: 'Rôle manquant',
        text: 'Veuillez sélectionner un rôle.',
      });
      this.isLoading = false;
      return;
    }
    const formData: UserRegistration = {
      username: this.registerForm.value.username || '',
      name: this.registerForm.value.name || '',
      phone: this.registerForm.value.phone || '',
      password: this.registerForm.value.password || '',
      roleName: selectedRole.name, 
    };

    this.authService.register(formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: 'Inscription réussie!',
            text: response.message,
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false,
            willClose: () => {
              this.router.navigate(['/activation']);
            }
          });
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'Attention',
            text: response.message,
          });
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        console.error('Registration failed', error);
        
        let errorMessage = "Une erreur est survenue lors de l'inscription.";
        if (error.status === 400) {
          errorMessage = error.error?.message || 'Données invalides. Vérifiez les informations saisies.';
        } else if (error.status === 409) {
          errorMessage = 'Cet email est déjà utilisé.';
        } else if (error.status === 500) {
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
        }

        Swal.fire({
          icon: 'error',
          title: 'Erreur d\'inscription',
          text: errorMessage,
        });
      },
    });
  }

  loginWithGoogle() {
    this.authService.loginWithGoogle();
  }

  getRoleDisplay(role: Role): string {
    switch (role.name) {
      case RoleType.ADMIN:
        return 'Administrateur';
      case RoleType.AGENT:
        return 'Agent';
      case RoleType.USER:
        return 'Utilisateur';
      default:
        return role.name;
    }
  }

  get username() { return this.registerForm.get('username'); }
  get name() { return this.registerForm.get('name'); }
  get phone() { return this.registerForm.get('phone'); }
  get password() { return this.registerForm.get('password'); }
  get role() { return this.registerForm.get('role'); }
}