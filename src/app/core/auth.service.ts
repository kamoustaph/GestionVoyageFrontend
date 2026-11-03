import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { Api } from './api.service';
import { AuthResponse, Role, Utilisateur } from './models';

const TOKEN_KEY = 'yoon_token';
const USER_KEY = 'yoon_user';

/** Session de l'utilisateur : jeton JWT et profil, conservés dans localStorage. */
@Injectable({ providedIn: 'root' })
export class Auth {
  private api = inject(Api);
  private router = inject(Router);

  readonly utilisateur = signal<Utilisateur | null>(null);
  readonly connecte = computed(() => this.utilisateur() !== null);
  readonly role = computed<Role | null>(() => this.utilisateur()?.role ?? null);
  readonly estPersonnel = computed(() => this.role() === 'AGENT' || this.role() === 'ADMIN');

  constructor() {
    const token = lire(TOKEN_KEY);
    const user = lire(USER_KEY);
    if (token && user && !expire(token)) {
      try {
        this.utilisateur.set(JSON.parse(user) as Utilisateur);
      } catch {
        this.effacer();
      }
    } else {
      this.effacer();
    }
  }

  get token(): string | null {
    const t = lire(TOKEN_KEY);
    return t && !expire(t) ? t : null;
  }

  connexion(email: string, motDePasse: string): Observable<AuthResponse> {
    return this.api.connexion(email, motDePasse).pipe(tap((r) => this.ouvrir(r)));
  }

  inscription(data: { email: string; nomComplet: string; telephone: string | null; motDePasse: string }): Observable<AuthResponse> {
    return this.api.inscription(data).pipe(tap((r) => this.ouvrir(r)));
  }

  deconnexion(): void {
    this.effacer();
    this.router.navigateByUrl('/');
  }

  /** Page d'arrivée après connexion, selon le rôle. */
  accueil(role: Role | null = this.role()): string {
    return role === 'ADMIN' ? '/admin' : role === 'AGENT' ? '/agent' : '/mes-voyages';
  }

  effacer(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch { /* stockage indisponible */ }
    this.utilisateur.set(null);
  }

  private ouvrir(r: AuthResponse): void {
    try {
      localStorage.setItem(TOKEN_KEY, r.token);
      localStorage.setItem(USER_KEY, JSON.stringify(r.utilisateur));
    } catch { /* navigation privée : la session reste en mémoire */ }
    this.utilisateur.set(r.utilisateur);
  }
}

function lire(cle: string): string | null {
  try {
    return localStorage.getItem(cle);
  } catch {
    return null;
  }
}

function expire(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}
