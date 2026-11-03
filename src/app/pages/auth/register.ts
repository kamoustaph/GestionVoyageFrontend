import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { messageErreur } from '../../core/api.service';
import { Auth } from '../../core/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth">
      <aside class="side" aria-hidden="true">
        <div class="codes">TBA<br>KLK<br>TBC</div>
        <div>
          <h2>Un compte, tous vos billets.</h2>
          <p>Gratuit. Vos billets QR sont gardés dans votre espace, prêts à être scannés à la gare.</p>
        </div>
      </aside>
      <div class="form-side">
        <div class="card">
          <h1>Créer un compte</h1>
          <p>Il faut moins d'une minute.</p>
          @if (erreur()) { <div class="alert" role="alert">{{ erreur() }}</div> }
          <form (ngSubmit)="valider()" class="stack">
            <label class="field">
              <span>Prénom et nom</span>
              <input class="input" name="nom" [(ngModel)]="nomComplet" autocomplete="name" required minlength="2" />
            </label>
            <label class="field">
              <span>Email</span>
              <input class="input" type="email" name="email" [(ngModel)]="email" autocomplete="email" required />
            </label>
            <label class="field">
              <span>Téléphone</span>
              <input class="input" name="tel" [(ngModel)]="telephone" inputmode="tel" autocomplete="tel-national" placeholder="77 123 45 67" />
              <small>Pour vous prévenir en cas de changement d'horaire.</small>
            </label>
            <label class="field">
              <span>Mot de passe</span>
              <input class="input" type="password" name="mdp" [(ngModel)]="motDePasse" autocomplete="new-password" required minlength="8" />
              <small>8 caractères minimum.</small>
            </label>
            <button class="btn btn-primary btn-block" type="submit" [disabled]="envoi()">
              {{ envoi() ? 'Création…' : 'Créer mon compte' }}
            </button>
          </form>
          <p class="switch">Déjà inscrit ? <a routerLink="/connexion" [queryParams]="{ retour: retour() }">Se connecter</a></p>
        </div>
      </div>
    </div>
  `,
  styleUrl: './auth-layout.css',
})
export class Register {
  private auth = inject(Auth);
  private router = inject(Router);

  retour = input<string>();
  nomComplet = '';
  email = '';
  telephone = '';
  motDePasse = '';
  envoi = signal(false);
  erreur = signal('');

  valider(): void {
    if (this.motDePasse.length < 8) {
      this.erreur.set('Le mot de passe doit faire au moins 8 caractères.');
      return;
    }
    this.envoi.set(true);
    this.erreur.set('');
    this.auth.inscription({
      nomComplet: this.nomComplet.trim(), email: this.email.trim(), telephone: this.telephone.trim() || null, motDePasse: this.motDePasse,
    }).subscribe({
      next: () => this.router.navigateByUrl(this.retour() || '/mes-voyages'),
      error: (e) => { this.erreur.set(messageErreur(e)); this.envoi.set(false); },
    });
  }
}
