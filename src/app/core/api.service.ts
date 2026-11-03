import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AuthResponse, Billet, Controle, ControleResultat, MethodePaiement, PassagerManifeste, Reservation, Role,
  Stats, StatutVoyage, Utilisateur, Voyage, VoyageRequest,
} from './models';

/** Point d'accès unique à l'API REST. */
@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // --- Public ---
  villes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/villes`);
  }
  rechercher(depart?: string | null, arrivee?: string | null, date?: string | null): Observable<Voyage[]> {
    let params = new HttpParams();
    if (depart) params = params.set('depart', depart);
    if (arrivee) params = params.set('arrivee', arrivee);
    if (date) params = params.set('date', date);
    return this.http.get<Voyage[]>(`${this.base}/voyages`, { params });
  }
  prochainsDeparts(limite = 8): Observable<Voyage[]> {
    return this.http.get<Voyage[]>(`${this.base}/voyages/prochains`, { params: { limite } });
  }
  voyage(id: number): Observable<Voyage> {
    return this.http.get<Voyage>(`${this.base}/voyages/${id}`);
  }

  // --- Authentification ---
  connexion(email: string, motDePasse: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/connexion`, { email, motDePasse });
  }
  inscription(data: { email: string; nomComplet: string; telephone: string | null; motDePasse: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/inscription`, data);
  }

  // --- Voyageur ---
  reserver(voyageId: number, passagers: string[]): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.base}/reservations`, {
      voyageId, passagers: passagers.map((nom) => ({ nom })),
    });
  }
  payer(reservationId: number, methode: MethodePaiement, telephone: string | null): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.base}/reservations/${reservationId}/paiement`, { methode, telephone });
  }
  annuler(reservationId: number): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.base}/reservations/${reservationId}/annulation`, {});
  }
  mesReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.base}/reservations/miennes`);
  }
  reservation(id: number): Observable<Reservation> {
    return this.http.get<Reservation>(`${this.base}/reservations/${id}`);
  }
  mesBillets(): Observable<Billet[]> {
    return this.http.get<Billet[]>(`${this.base}/billets/miens`);
  }
  billet(code: string): Observable<Billet> {
    return this.http.get<Billet>(`${this.base}/billets/${encodeURIComponent(code)}`);
  }

  // --- Agent ---
  verifier(contenu: string, voyageId: number | null): Observable<ControleResultat> {
    return this.http.post<ControleResultat>(`${this.base}/controle/verification`, { contenu, voyageId });
  }
  embarquer(contenu: string, voyageId: number | null): Observable<ControleResultat> {
    return this.http.post<ControleResultat>(`${this.base}/controle/embarquement`, { contenu, voyageId });
  }
  historique(): Observable<Controle[]> {
    return this.http.get<Controle[]>(`${this.base}/controle/historique`);
  }
  departsAControler(): Observable<Voyage[]> {
    return this.http.get<Voyage[]>(`${this.base}/controle/departs`);
  }
  manifeste(voyageId: number): Observable<PassagerManifeste[]> {
    return this.http.get<PassagerManifeste[]>(`${this.base}/controle/departs/${voyageId}/passagers`);
  }

  // --- Admin ---
  stats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.base}/admin/statistiques`);
  }
  tousLesVoyages(): Observable<Voyage[]> {
    return this.http.get<Voyage[]>(`${this.base}/admin/voyages`);
  }
  creerVoyage(v: VoyageRequest): Observable<Voyage> {
    return this.http.post<Voyage>(`${this.base}/admin/voyages`, v);
  }
  modifierVoyage(id: number, v: VoyageRequest): Observable<Voyage> {
    return this.http.put<Voyage>(`${this.base}/admin/voyages/${id}`, v);
  }
  statutVoyage(id: number, statut: StatutVoyage): Observable<Voyage> {
    return this.http.patch<Voyage>(`${this.base}/admin/voyages/${id}/statut`, null, { params: { statut } });
  }
  toutesReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.base}/admin/reservations`);
  }
  utilisateurs(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${this.base}/admin/utilisateurs`);
  }
  creerUtilisateur(u: { email: string; nomComplet: string; telephone: string | null; motDePasse: string; role: Role }): Observable<Utilisateur> {
    return this.http.post<Utilisateur>(`${this.base}/admin/utilisateurs`, u);
  }
  modifierUtilisateur(id: number, changes: { actif?: boolean; role?: Role }): Observable<Utilisateur> {
    let params = new HttpParams();
    if (changes.actif !== undefined) params = params.set('actif', changes.actif);
    if (changes.role) params = params.set('role', changes.role);
    return this.http.patch<Utilisateur>(`${this.base}/admin/utilisateurs/${id}`, null, { params });
  }
  controles(): Observable<Controle[]> {
    return this.http.get<Controle[]>(`${this.base}/admin/controles`);
  }
}

/** Message lisible à partir d'une erreur HTTP (format ErreurDto du backend). */
export function messageErreur(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return "Le serveur ne répond pas. Vérifiez votre connexion et réessayez.";
    const body = err.error as { message?: string; champs?: Record<string, string> } | null;
    if (body?.champs) {
      const premier = Object.values(body.champs)[0];
      if (premier) return premier;
    }
    if (body?.message) return body.message;
    return `Erreur ${err.status}`;
  }
  return 'Une erreur inattendue est survenue.';
}
