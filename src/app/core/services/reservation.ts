import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Page, Reservation, ReservationCreateDto, ReservationDetail, ReservationFilterDto } from '../models/reservation.model';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8093/api/reservations';

  // Méthode pour mapper les données de l'API vers l'interface Reservation
  private mapReservationData(data: any): Reservation {
    return {
      id: data.id,
      userId: data.userId,
      userEmail: data.userEmail,
      voyageId: data.voyageId,
      voyageLieuDepart: data.voyageLieuDepart,
      voyageLieuArrivee: data.voyageLieuArrivee,
      statut: data.statut,
      dateReservation: data.dateReservation,
      dateExpiration: data.dateExpiration,
      // Gestion des différents noms de champs possibles pour nombrePlaces
      nombrePlaces: data.nombrePlaces || data.nbPlaces || data.nombre_places || data.nb_places || 0,
      // Gestion des différents noms de champs possibles pour prixTotal
      prixTotal: data.prixTotal || data.totalPrice || data.prix_total || data.total_price || 0,
      dateCreation: data.dateCreation,
      dateModification: data.dateModification
    };
  }

  // Méthode pour normaliser les réponses paginées
  private normalizePageResponse(response: any, page: number, size: number): Page<any> {
    if (response && response.content !== undefined) {
      return {
        content: response.content || [],
        totalElements: response.totalElements || 0,
        totalPages: response.totalPages || 0,
        size: response.size || size,
        number: response.number || page,
        first: response.first !== undefined ? response.first : page === 0,
        last: response.last !== undefined ? response.last : true
      };
    }
    
    if (Array.isArray(response)) {
      const totalPages = Math.ceil(response.length / size);
      return {
        content: response,
        totalElements: response.length,
        totalPages: totalPages,
        size: size,
        number: page,
        first: page === 0,
        last: page >= totalPages - 1
      };
    }
    
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: size,
      number: page,
      first: true,
      last: true
    };
  }

  searchGlobal(query: string, page: number = 0, size: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('query', query)
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<any>(`${this.apiUrl}/search/global`, { params }).pipe(
      map(response => {
        const normalized = this.normalizePageResponse(response, page, size);
        // Mapper chaque réservation
        if (normalized.content && Array.isArray(normalized.content)) {
          normalized.content = normalized.content.map(item => this.mapReservationData(item));
        }
        return normalized;
      })
    );
  }

  getAllReservations(page: number = 0, size: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<any>(`${this.apiUrl}`, { params }).pipe(
      map(response => {
        const normalized = this.normalizePageResponse(response, page, size);
        // Mapper chaque réservation
        if (normalized.content && Array.isArray(normalized.content)) {
          normalized.content = normalized.content.map(item => this.mapReservationData(item));
        }
        return normalized;
      })
    );
  }

  getReservationById(id: number): Observable<Reservation> {
    return this.http.get<Reservation>(`${this.apiUrl}/${id}`).pipe(
      map(data => this.mapReservationData(data))
    );
  }

  getReservationDetail(id: number): Observable<ReservationDetail> {
    return this.http.get<ReservationDetail>(`${this.apiUrl}/${id}/detail`).pipe(
      map(detail => this.cleanReservationDetail(detail))
    );
  }

  private cleanReservationDetail(detail: ReservationDetail): ReservationDetail {
    return {
      ...detail,
      userPrenom: this.cleanString(detail.userPrenom),
      userNom: this.cleanString(detail.userNom),
      userEmail: this.cleanString(detail.userEmail),
      statut: this.cleanString(detail.statut),
      voyageLieuDepart: this.cleanString(detail.voyageLieuDepart),
      voyageLieuArrivee: this.cleanString(detail.voyageLieuArrivee),
      
      dateReservation: this.cleanDateValue(detail.dateReservation),
      dateExpiration: this.cleanDateValue(detail.dateExpiration),
      voyageDateDepart: this.cleanDateValue(detail.voyageDateDepart),
      voyageDateRetour: this.cleanDateValue(detail.voyageDateRetour),
      
      // Calculer le prix total si nécessaire
      prixTotal: detail.prixTotal || (detail.voyagePrix * (detail.nombrePlaces || 1))
    };
  }

  private cleanString(value: any): string {
    if (value === null || value === undefined || value === 'null' || value === 'undefined' || value === '') {
      return ''; 
    }
    return String(value).trim();
  }

  private cleanDateValue(value: any): string | undefined {
    if (value === null || value === undefined || value === 'null' || value === 'undefined' || value === '') {
      return undefined;
    }
    
    if (Array.isArray(value)) {
      try {
        const [year, month, day, hours = 0, minutes = 0, seconds = 0, milliseconds = 0] = value;
        const date = new Date(year, month - 1, day, hours, minutes, seconds, milliseconds);
        return isNaN(date.getTime()) ? undefined : date.toISOString();
      } catch (error) {
        console.warn('Erreur conversion tableau date:', error, value);
        return undefined;
      }
    }
    
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return undefined;
      
      try {
        const date = new Date(trimmed);
        return isNaN(date.getTime()) ? undefined : date.toISOString();
      } catch (error) {
        console.warn('Erreur parsing date string:', error, value);
        return undefined;
      }
    }
    
    if (value instanceof Date) {
      return value.toISOString();
    }
    
    if (typeof value === 'number') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date.toISOString();
    }
    
    return undefined;
  }

  // Les autres méthodes restent inchangées...
  createReservation(reservation: ReservationCreateDto): Observable<Reservation> {
    return this.http.post<Reservation>(this.apiUrl, reservation);
  }

  updateReservationStatut(id: number, statut: string): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/${id}/statut`, null, {
      params: new HttpParams().set('statut', statut)
    });
  }

  confirmReservation(id: number): Observable<boolean> {
    return this.http.put<boolean>(`${this.apiUrl}/${id}/confirm`, null);
  }

  cancelReservation(id: number): Observable<boolean> {
    return this.http.put<boolean>(`${this.apiUrl}/${id}/cancel`, null);
  }

  deleteReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  searchByUserId(userId: number, page: number = 0, size: number = 5): Observable<Page<Reservation>> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<Page<Reservation>>(`${this.apiUrl}/user/${userId}/paginated`, { params });
  }

  searchByVoyageId(voyageId: number, page: number = 0, size: number = 5): Observable<Page<Reservation>> {
    const params = new HttpParams()
      .set('voyageId', voyageId.toString())
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<Page<Reservation>>(`${this.apiUrl}/voyage/${voyageId}/paginated`, { params });
  }

  searchByStatut(statut: string, page: number = 0, size: number = 5): Observable<Page<Reservation>> {
    const params = new HttpParams()
      .set('statut', statut)
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<Page<Reservation>>(`${this.apiUrl}/statut/${statut}/paginated`, { params });
  }

  searchWithFilters(filterDto: ReservationFilterDto): Observable<Page<Reservation>> {
    return this.http.post<Page<Reservation>>(`${this.apiUrl}/search`, filterDto);
  }

  setExpirationDate(id: number, dateExpiration: string): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/${id}/expiration`, null, {
      params: new HttpParams().set('dateExpiration', dateExpiration)
    });
  }

  getTotalReservations(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/stats/total`);
  }

  getReservationsByStatutCount(statut: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/stats/statut/${statut}`);
  }

  getReservationsByUserIdCount(userId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/stats/user/${userId}`);
  }

  getReservationsByVoyageIdCount(voyageId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/stats/voyage/${voyageId}`);
  }

  getExpiredReservations(page: number = 0, size: number = 5): Observable<Page<Reservation>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<Page<Reservation>>(`${this.apiUrl}/expired/paginated`, { params });
  }
}