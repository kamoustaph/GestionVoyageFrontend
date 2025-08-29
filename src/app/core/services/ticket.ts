import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Page, Ticket, TicketCreateDto, TicketDetail, TicketFilterDto } from '../models/ticket.model';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8093/api/tickets';

  // Méthodes de base
  getAllTickets(page: number = 0, size: number = 5): Observable<Page<Ticket>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<Page<Ticket>>(this.apiUrl, { params });
  }

  getTicketById(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/${id}`);
  }

  getTicketDetail(id: number): Observable<TicketDetail> {
    return this.http.get<TicketDetail>(`${this.apiUrl}/${id}/detail`);
  }

  createTicket(ticket: TicketCreateDto): Observable<Ticket> {
    return this.http.post<Ticket>(this.apiUrl, ticket);
  }

  updateTicketStatut(id: number, statut: string): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.apiUrl}/${id}/statut`, null, {
      params: new HttpParams().set('statut', statut)
    });
  }

  deleteTicket(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Recherche globale
  searchGlobal(query: string, page: number = 0, size: number = 10): Observable<Page<Ticket>> {
    const params = new HttpParams()
      .set('query', query)
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<Page<Ticket>>(`${this.apiUrl}/search/global`, { params });
  }

  // Recherches spécifiques
  searchByQrCode(qrCode: string, page: number = 0, size: number = 5): Observable<Page<Ticket>> {
    const params = new HttpParams()
      .set('qrCode', qrCode)
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<Page<Ticket>>(`${this.apiUrl}/qr/paginated`, { params });
  }

  searchByReservationId(reservationId: number, page: number = 0, size: number = 5): Observable<Page<Ticket>> {
    const params = new HttpParams()
      .set('reservationId', reservationId.toString())
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<Page<Ticket>>(`${this.apiUrl}/reservation/${reservationId}/paginated`, { params });
  }

  searchByUserId(userId: number, page: number = 0, size: number = 5): Observable<Page<Ticket>> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<Page<Ticket>>(`${this.apiUrl}/user/${userId}/paginated`, { params });
  }

  searchByVoyageId(voyageId: number, page: number = 0, size: number = 5): Observable<Page<Ticket>> {
    const params = new HttpParams()
      .set('voyageId', voyageId.toString())
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<Page<Ticket>>(`${this.apiUrl}/voyage/${voyageId}/paginated`, { params });
  }

  searchByStatut(statut: string, page: number = 0, size: number = 5): Observable<Page<Ticket>> {
    const params = new HttpParams()
      .set('statut', statut)
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<Page<Ticket>>(`${this.apiUrl}/statut/${statut}/paginated`, { params });
  }

  searchWithFilters(filterDto: TicketFilterDto): Observable<Page<Ticket>> {
    return this.http.post<Page<Ticket>>(`${this.apiUrl}/search`, filterDto);
  }

  // Méthodes de validation
  validateTicket(qrCode: string): Observable<boolean> {
    return this.http.put<boolean>(`${this.apiUrl}/validate/${qrCode}`, null);
  }

  // Statistiques
  getTotalTickets(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/stats/total`);
  }

  getTicketsByStatutCount(statut: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/stats/statut/${statut}`);
  }

  getTicketsByUserIdCount(userId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/stats/user/${userId}`);
  }

  getTicketsByVoyageIdCount(voyageId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/stats/voyage/${voyageId}`);
  }
}