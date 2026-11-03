import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { messageErreur } from '../../core/api.service';
import { Auth } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth">
      <aside class="side" aria-hidden="true">
        <div class="codes">DKR<br>STL<br>ZIG</div>
        <div>
          <h2>Bon retour parmi nous.</h2>
          <p>Retrouvez vos billets, réservez votre prochain trajet, ou commencez votre service de contrôle.</p>
        </div>
      </aside>
      <div class="form-side">
        <div class="card">
          <h1>Se connecter</h1>
          <p>Avec l'email de votre compte Yoon.</p>
          @if (expire()) { <div class="alert info">Votre session a expiré, reconnectez-vous.</div> }
          @if (erreur()) { <div class="alert" role="alert">{{ erreur() }}</div> }
          <form (ngSubmit)="valider()" class="stack">
            <label class="field">
              <span>Email</span>
              <input class="input" type="email" name="email" [(ngModel)]="email" autocomplete="email" required />
            </label>
            <label class="field">
              <span>Mot de passe</span>
              <input class="input" type="password" name="mdp" [(ngModel)]="motDePasse" autocomplete="current-password" required />
            </label>
            <button class="btn btn-primary btn-block" type="submit" [disabled]="envoi()">
              {{ envoi() ? 'Connexion…' : 'Se connecter' }}
            </button>
          </form>
          <p class="switch">Pas encore de compte ? <a routerLink="/inscription" [queryParams]="{ retour: retour() }">Créer un compte</a></p>

          <div class="demo">
            <strong>Comptes de démonstration</strong>
            <button type="button" class="link-btn" (click)="remplir('voyageur@yoon.sn', 'Voyageur123!')">Voyageur : voyageur&#64;yoon.sn</button>
            <button type="button" class="link-btn" (click)="remplir('agent@yoon.sn', 'Agent123!')">Agent de contrôle : agent&#64;yoon.sn</button>
            <button type="button" class="link-btn" (click)="remplir('admin@yoon.sn', 'Admin123!')">Administrateur : admin&#64;yoon.sn</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './auth-layout.css',
})
export class Login {
  private auth = inject(Auth);
  private router = inject(Router);

  retour = input<string>();
  expire = input<string>();

  email = '';
  motDePasse = '';
  envoi = signal(false);
  erreur = signal('');

  remplir(email: string, mdp: string): void {
    this.email = email;
    this.motDePasse = mdp;
  }

  valider(): void {
    this.envoi.set(true);
    this.erreur.set('');
    this.auth.connexion(this.email.trim(), this.motDePasse).subscribe({
      next: (r) => this.router.navigateByUrl(this.retour() || this.auth.accueil(r.utilisateur.role)),
      error: (e) => { this.erreur.set(messageErreur(e)); this.envoi.set(false); },
    });
  }
}
