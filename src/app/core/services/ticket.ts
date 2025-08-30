import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Page, Ticket, TicketCreateDto, TicketDetail, TicketFilterDto } from '../models/ticket.model';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8093/api/tickets';

  // Méthodes de base - CORRIGÉE pour gérer les deux formats de réponse
  getAllTickets(page: number = 0, size: number = 5): Observable<Page<Ticket>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => {
        console.log('Réponse brute getAllTickets:', response);
        return this.normalizePageResponse(response, page, size);
      }),
      catchError(error => {
        console.error('Error fetching tickets:', error);
        throw error;
      })
    );
  }

  // Méthode utilitaire pour normaliser la réponse en format Page<T>
  private normalizePageResponse(response: any, page: number, size: number): Page<Ticket> {
    console.log('Normalisation de la réponse:', response);
    
    // Si la réponse est déjà au format Page avec content
    if (response && response.content !== undefined) {
      console.log('Format Page détecté');
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
    
    // Si la réponse est un tableau simple
    if (Array.isArray(response)) {
      console.log('Format tableau détecté, longueur:', response.length);
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
    
    // Si la réponse est vide ou dans un format inattendu
    console.warn('Format de réponse inattendu:', response);
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

  getTicketById(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        console.log('getTicketById réponse:', response);
        return response;
      }),
      catchError(error => {
        console.error('Error fetching ticket by id:', error);
        throw error;
      })
    );
  }

  getTicketDetail(id: number): Observable<TicketDetail> {
    return this.http.get<TicketDetail>(`${this.apiUrl}/${id}/detail`).pipe(
      map(response => {
        console.log('getTicketDetail réponse brute:', response);
        // Nettoyage des données reçues
        const cleanDetail: TicketDetail = {
          ...response,
          userPrenom: this.cleanString(response.userPrenom),
          userNom: this.cleanString(response.userNom),
          userEmail: this.cleanString(response.userEmail),
          qrCode: this.cleanString(response.qrCode),
          statut: this.cleanString(response.statut),
          voyageLieuDepart: this.cleanString(response.voyageLieuDepart),
          voyageLieuArrivee: this.cleanString(response.voyageLieuArrivee),
          createdAt: this.cleanDateValue(response.createdAt),
          voyageDateDepart: this.cleanDateValue(response.voyageDateDepart),
          voyageDateRetour: this.cleanDateValue(response.voyageDateRetour)
        };
        console.log('getTicketDetail réponse nettoyée:', cleanDetail);
        return cleanDetail;
      }),
      catchError(error => {
        console.error('Error fetching ticket detail:', error);
        throw error;
      })
    );
  }

  // Méthode utilitaire pour nettoyer les chaînes
  private cleanString(value: any): string | undefined {
    if (value === null || value === undefined || value === 'null' || value === 'undefined' || value === '') {
      return undefined;
    }
    return String(value).trim();
  }

  // Méthode utilitaire pour nettoyer les valeurs de date (tableaux ou strings)
  private cleanDateValue(value: any): any {
    if (value === null || value === undefined || value === 'null' || value === 'undefined' || value === '') {
      return undefined;
    }
    
    // Si c'est déjà un tableau, le retourner tel quel
    if (Array.isArray(value)) {
      return value;
    }
    
    // Si c'est une chaîne, essayer de la convertir en tableau si nécessaire
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return undefined;
      
      // Vérifier si c'est une chaîne JSON de tableau
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        // Ce n'est pas du JSON, retourner la chaîne telle quelle
        return trimmed;
      }
    }
    
    return value;
  }

  createTicket(ticket: TicketCreateDto): Observable<Ticket> {
    return this.http.post<Ticket>(this.apiUrl, ticket).pipe(
      map(response => {
        console.log('createTicket réponse:', response);
        return response;
      }),
      catchError(error => {
        console.error('Error creating ticket:', error);
        throw error;
      })
    );
  }

  updateTicketStatut(id: number, statut: string): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.apiUrl}/${id}/statut`, null, {
      params: new HttpParams().set('statut', statut)
    }).pipe(
      map(response => {
        console.log('updateTicketStatut réponse:', response);
        return response;
      }),
      catchError(error => {
        console.error('Error updating ticket status:', error);
        throw error;
      })
    );
  }

  deleteTicket(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Error deleting ticket:', error);
        throw error;
      })
    );
  }

  // Recherche globale - CORRIGÉE
  searchGlobal(query: string, page: number = 0, size: number = 10): Observable<Page<Ticket>> {
    const params = new HttpParams()
      .set('query', query)
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<any>(`${this.apiUrl}/search/global`, { params }).pipe(
      map(response => {
        console.log('searchGlobal réponse brute:', response);
        return this.normalizePageResponse(response, page, size);
      }),
      catchError(error => {
        console.error('Error in global search:', error);
        throw error;
      })
    );
  }

  // Recherches spécifiques - CORRIGÉES
  searchByQrCode(qrCode: string, page: number = 0, size: number = 5): Observable<Page<Ticket>> {
    const params = new HttpParams()
      .set('qrCode', qrCode)
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<any>(`${this.apiUrl}/qr/paginated`, { params }).pipe(
      map(response => this.normalizePageResponse(response, page, size)),
      catchError(error => {
        console.error('Error searching by QR code:', error);
        throw error;
      })
    );
  }

  searchByReservationId(reservationId: number, page: number = 0, size: number = 5): Observable<Page<Ticket>> {
    const params = new HttpParams()
      .set('reservationId', reservationId.toString())
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<any>(`${this.apiUrl}/reservation/${reservationId}/paginated`, { params }).pipe(
      map(response => this.normalizePageResponse(response, page, size)),
      catchError(error => {
        console.error('Error searching by reservation ID:', error);
        throw error;
      })
    );
  }

  searchByUserId(userId: number, page: number = 0, size: number = 5): Observable<Page<Ticket>> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<any>(`${this.apiUrl}/user/${userId}/paginated`, { params }).pipe(
      map(response => this.normalizePageResponse(response, page, size)),
      catchError(error => {
        console.error('Error searching by user ID:', error);
        throw error;
      })
    );
  }

  searchByVoyageId(voyageId: number, page: number = 0, size: number = 5): Observable<Page<Ticket>> {
    const params = new HttpParams()
      .set('voyageId', voyageId.toString())
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<any>(`${this.apiUrl}/voyage/${voyageId}/paginated`, { params }).pipe(
      map(response => this.normalizePageResponse(response, page, size)),
      catchError(error => {
        console.error('Error searching by voyage ID:', error);
        throw error;
      })
    );
  }

  searchByStatut(statut: string, page: number = 0, size: number = 5): Observable<Page<Ticket>> {
    const params = new HttpParams()
      .set('statut', statut)
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<any>(`${this.apiUrl}/statut/${statut}/paginated`, { params }).pipe(
      map(response => this.normalizePageResponse(response, page, size)),
      catchError(error => {
        console.error('Error searching by status:', error);
        throw error;
      })
    );
  }

  searchWithFilters(filterDto: TicketFilterDto): Observable<Page<Ticket>> {
    return this.http.post<any>(`${this.apiUrl}/search`, filterDto).pipe(
      map(response => this.normalizePageResponse(response, filterDto.page || 0, filterDto.size || 5)),
      catchError(error => {
        console.error('Error searching with filters:', error);
        throw error;
      })
    );
  }

  // Méthodes de validation
  validateTicket(qrCode: string): Observable<boolean> {
    return this.http.put<boolean>(`${this.apiUrl}/validate/${qrCode}`, null).pipe(
      map(response => {
        console.log('validateTicket réponse:', response);
        return response;
      }),
      catchError(error => {
        console.error('Error validating ticket:', error);
        throw error;
      })
    );
  }

  // Statistiques
  getTotalTickets(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/stats/total`).pipe(
      catchError(error => {
        console.error('Error getting total tickets:', error);
        throw error;
      })
    );
  }

  getTicketsByStatutCount(statut: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/stats/statut/${statut}`).pipe(
      catchError(error => {
        console.error('Error getting tickets count by status:', error);
        throw error;
      })
    );
  }

  getTicketsByUserIdCount(userId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/stats/user/${userId}`).pipe(
      catchError(error => {
        console.error('Error getting tickets count by user:', error);
        throw error;
      })
    );
  }

  getTicketsByVoyageIdCount(voyageId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/stats/voyage/${voyageId}`).pipe(
      catchError(error => {
        console.error('Error getting tickets count by voyage:', error);
        throw error;
      })
    );
  }
}