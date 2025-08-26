import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User, UserCredentials, UserRegistration, Role } from '../models/user.model';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../models/auth-response.model';
import { RoleType } from '../models/role.model';

export interface GoogleOAuthResponse {
  success: boolean;
  token: string;
  message: string;
  user?: {
    id: any;
    username: string;
    email: string;
    name: string;
    roles: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private apiUrl = `${environment.apiUrl}/utilisateurs`;
  private rolesUrl = `${environment.apiUrl}/roles`;
  private oauth2Url = `${environment.apiUrl}/oauth2`;

  constructor() {
    console.log('[AuthService] Initializing Auth Service');
    this.initializeUserFromStorage();
  }

  // === AUTHENTIFICATION GOOGLE OAUTH2 ===
  
  /**
   * Initie le processus d'authentification Google OAuth2
   */
  loginWithGoogle(): void {
    window.location.href = `${environment.apiUrl}/oauth2/authorization/google`;
  }

  /**
   * Traite la réponse OAuth2 après redirection
   */
  handleOAuth2Callback(): Observable<GoogleOAuthResponse> {
    return this.http.get<GoogleOAuthResponse>(`${this.oauth2Url}/user`).pipe(
      tap(response => {
        if (response.success && response.token) {
          this.setToken(response.token);
          
          if (response.user) {
            const userData: User = {
              id: response.user.id,
              username: response.user.username,
              name: response.user.name,
              phone: '', // Google ne fournit pas de téléphone
              roles: response.user.roles.map(role => ({
                id: 0,
                name: role.replace('ROLE_', '') as RoleType
              })),
              actif: true
            };
            this.setCurrentUser(userData);
          }
          
          this.router.navigate(['/dashboard']);
        }
      })
    );
  }

  /**
   * Vérifie si l'utilisateur est connecté via OAuth2
   */
  isOAuth2Authenticated(): boolean {
    return this.isAuthenticated && this.getToken()?.includes('oauth2') || false;
  }

  // === MÉTHODES EXISTANTES (MAINTENUES) ===

  // Activation de compte
  activateAccount(activationCode: string): Observable<{ success: boolean; message: string; status: number }> {
    return this.http.post<{ success: boolean; message: string; status: number }>(
      `${this.apiUrl}/activation`,
      { code: activationCode }
    );
  }

  // Récupération des rôles
  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.rolesUrl);
  }

  // Vérification de l'authentification
  get isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    return !this.isTokenExpired(token);
  }

  // Récupération du token
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Inscription
  register(user: UserRegistration): Observable<{ success: boolean; message: string; status: number }> {
    const registrationData = {
      ...user,
      actif: false
    };
    return this.http.post<{ success: boolean; message: string; status: number }>(
      `${this.apiUrl}/inscription`, 
      registrationData
    );
  }

  // Connexion standard
  login(credentials: UserCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/connexion`, credentials).pipe(
      tap(response => {
        console.log('[AuthService] Login response:', response);
        
        if (response.token) {
          this.setToken(response.token);
          
          // Décode le token pour obtenir les informations utilisateur
          const decodedToken = this.decodeToken(response.token);
          if (decodedToken) {
            const userData: User = {
              id: decodedToken.sub || decodedToken.id,
              username: decodedToken.sub || credentials.username,
              name: decodedToken.nom || decodedToken.name || '',
              phone: decodedToken.phone || '',
              roles: decodedToken.roles ? decodedToken.roles.map((role: string) => ({
                id: 0,
                name: role.replace('ROLE_', '') as RoleType
              })) : [],
              actif: decodedToken.actif !== undefined ? decodedToken.actif : true
            };
            this.setCurrentUser(userData);
          }
          
          this.router.navigate(['/dashboard']);
        }
      })
    );
  }

  // Déconnexion
  logout(): void {
    this.clearToken();
    this.currentUserSubject.next(null);
    localStorage.removeItem('current_user');
    this.router.navigate(['/login']);
  }

  // Récupération de l'utilisateur courant
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Vérification des rôles
  hasRole(requiredRole: RoleType): boolean {
    const user = this.getCurrentUser();
    if (!user?.roles) return false;

    return user.roles.some(role => 
      role.name === requiredRole || 
      role.name === `ROLE_${requiredRole}` ||
      role.name.replace('ROLE_', '') === requiredRole
    );
  }

  // Vérifications spécifiques de rôles
  isAdmin(): boolean {
    return this.hasRole(RoleType.ADMIN);
  }

  isAgent(): boolean {
    return this.hasRole(RoleType.AGENT);
  }

  isUser(): boolean {
    return this.hasRole(RoleType.USER);
  }

  // Rafraîchissement de l'utilisateur
  refreshCurrentUser(): void {
    this.initializeUserFromStorage();
  }

  // Mise à jour du profil utilisateur
  updateUserProfile(profileData: Partial<User>): Observable<User> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('Aucun utilisateur connecté');
    }

    return this.http.put<User>(`${this.apiUrl}/${currentUser.id}`, profileData).pipe(
      tap(updatedUser => {
        this.setCurrentUser(updatedUser);
      })
    );
  }

  // Récupération des détails utilisateur
  getUserDetails(): Observable<User> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('Aucun utilisateur connecté');
    }

    return this.http.get<User>(`${this.apiUrl}/${currentUser.id}`);
  }

  // === MÉTHODES PRIVÉES ===

  private setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  private clearToken(): void {
    localStorage.removeItem('auth_token');
  }

  private setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
    localStorage.setItem('current_user', JSON.stringify(user));
  }

  private clearAuthData(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('current_user');
    this.clearToken();
  }

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (e) {
      console.error('[AuthService] Error decoding token:', e);
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    const decodedToken = this.decodeToken(token);
    if (!decodedToken || !decodedToken.exp) return true;
    
    const expirationDate = new Date(decodedToken.exp * 1000);
    return expirationDate < new Date();
  }

  private initializeUserFromStorage(): void {
    const token = this.getToken();
    const storedUser = localStorage.getItem('current_user');
    
    if (token && !this.isTokenExpired(token)) {
      try {
        if (storedUser) {
          // Utiliser l'utilisateur stocké
          const user = JSON.parse(storedUser);
          this.currentUserSubject.next(user);
        } else {
          // Reconstruire l'utilisateur à partir du token
          const decodedToken = this.decodeToken(token);
          if (decodedToken) {
            const userData: User = {
              id: decodedToken.sub || decodedToken.id,
              username: decodedToken.sub || '',
              name: decodedToken.nom || decodedToken.name || '',
              phone: decodedToken.phone || '',
              roles: decodedToken.roles ? decodedToken.roles.map((role: string) => ({
                id: 0,
                name: role.replace('ROLE_', '') as RoleType
              })) : [],
              actif: decodedToken.actif !== undefined ? decodedToken.actif : true
            };
            this.setCurrentUser(userData);
          }
        }
      } catch (e) {
        console.error('[AuthService] Error initializing user from storage:', e);
        this.clearAuthData();
      }
    } else {
      console.log('[AuthService] No valid user session found');
      this.clearAuthData();
    }
  }
}