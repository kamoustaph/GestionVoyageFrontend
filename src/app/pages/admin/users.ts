import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, messageErreur } from '../../core/api.service';
import { Auth } from '../../core/auth.service';
import { LibellePipe } from '../../core/format';
import { Role, Utilisateur } from '../../core/models';

@Component({
  selector: 'app-users',
  imports: [DatePipe, FormsModule, LibellePipe],
  template: `
    <div class="page-head">
      <div><h1>Comptes</h1><p>Créez les comptes des agents de contrôle. Les voyageurs s'inscrivent eux-mêmes.</p></div>
    </div>
    @if (erreur()) { <div class="alert">{{ erreur() }}</div> }

    <div class="layout">
      <div class="table-wrap">
        <table class="data">
          <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Inscrit le</th><th>État</th><th></th></tr></thead>
          <tbody>
            @for (u of utilisateurs(); track u.id) {
              <tr>
                <td><strong>{{ u.nomComplet }}</strong><br><small class="muted num">{{ u.telephone || '' }}</small></td>
                <td>{{ u.email }}</td>
                <td>
                  @if (u.id === moi) { {{ u.role | libelle }} }
                  @else {
                    <select class="input sm" [ngModel]="u.role" (ngModelChange)="changerRole(u, $event)" [attr.aria-label]="'Rôle de ' + u.nomComplet">
                      @for (r of roles; track r) { <option [value]="r">{{ r | libelle }}</option> }
                    </select>
                  }
                </td>
                <td class="num">{{ u.creeLe | date: 'd MMM y' }}</td>
                <td><span class="tag" [class.ok]="u.actif" [class.ko]="!u.actif">{{ u.actif ? 'Actif' : 'Désactivé' }}</span></td>
                <td class="right">
                  @if (u.id !== moi) {
                    <button type="button" class="btn btn-sm" [class.btn-danger]="u.actif" [class.btn-ghost]="!u.actif" (click)="basculer(u)">
                      {{ u.actif ? 'Désactiver' : 'Réactiver' }}
                    </button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <form class="panel stack" (ngSubmit)="creer()">
        <h2 class="h">Nouveau compte</h2>
        @if (erreurForm()) { <div class="alert" role="alert">{{ erreurForm() }}</div> }
        @if (succes()) { <div class="alert info">{{ succes() }}</div> }
        <label class="field"><span>Prénom et nom</span><input class="input" name="nom" [(ngModel)]="form.nomComplet" required /></label>
        <label class="field"><span>Email</span><input class="input" type="email" name="email" [(ngModel)]="form.email" required /></label>
        <label class="field"><span>Téléphone</span><input class="input" name="tel" [(ngModel)]="form.telephone" /></label>
        <label class="field"><span>Mot de passe provisoire</span><input class="input" name="mdp" [(ngModel)]="form.motDePasse" required minlength="8" /><small>8 caractères minimum, à transmettre à la personne.</small></label>
        <label class="field"><span>Rôle</span>
          <select class="input" name="role" [(ngModel)]="form.role">
            <option value="AGENT">Agent de contrôle</option>
            <option value="ADMIN">Administrateur</option>
          </select>
        </label>
        <button class="btn btn-primary" type="submit" [disabled]="envoi()">Créer le compte</button>
      </form>
    </div>
  `,
  styles: `
    .layout { display: grid; gap: 20px; align-items: start; }
    @media (min-width: 1040px) { .layout { grid-template-columns: 1fr 340px; } }
    .h { font-size: 1.15rem; margin: 0; }
    .input.sm { min-height: 36px; padding: 4px 8px; font-size: .9rem; width: auto; }
  `,
})
export class Users implements OnInit {
  private api = inject(Api);
  moi = inject(Auth).utilisateur()?.id;

  utilisateurs = signal<Utilisateur[]>([]);
  erreur = signal('');
  erreurForm = signal('');
  succes = signal('');
  envoi = signal(false);
  roles: Role[] = ['VOYAGEUR', 'AGENT', 'ADMIN'];
  form = { nomComplet: '', email: '', telephone: '', motDePasse: '', role: 'AGENT' as Role };

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.api.utilisateurs().subscribe({ next: (u) => this.utilisateurs.set(u), error: (e) => this.erreur.set(messageErreur(e)) });
  }

  creer(): void {
    this.envoi.set(true);
    this.erreurForm.set('');
    this.succes.set('');
    this.api.creerUtilisateur({ ...this.form, telephone: this.form.telephone || null }).subscribe({
      next: (u) => {
        this.envoi.set(false);
        this.succes.set(`Compte créé pour ${u.nomComplet}.`);
        this.form = { nomComplet: '', email: '', telephone: '', motDePasse: '', role: 'AGENT' };
        this.charger();
      },
      error: (e) => { this.envoi.set(false); this.erreurForm.set(messageErreur(e)); },
    });
  }

  basculer(u: Utilisateur): void {
    this.api.modifierUtilisateur(u.id, { actif: !u.actif }).subscribe({ next: () => this.charger(), error: (e) => this.erreur.set(messageErreur(e)) });
  }

  changerRole(u: Utilisateur, role: Role): void {
    this.api.modifierUtilisateur(u.id, { role }).subscribe({ next: () => this.charger(), error: (e) => this.erreur.set(messageErreur(e)) });
  }
}
