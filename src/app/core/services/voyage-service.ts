import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Page, Voyage } from '../models/voyage.model';

@Injectable({
  providedIn: 'root'
})
export class VoyageService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8093/api/voyages';

  getAllVoyages(page: number = 0, size: number = 5): Observable<Page<Voyage>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<Page<Voyage>>(this.apiUrl, { params });
  }

  searchGlobal(query: string, page: number = 0, size: number = 10): Observable<Page<Voyage>> {
  const params = new HttpParams()
    .set('query', query)
    .set('page', page.toString())
    .set('size', size.toString());
  
  return this.http.get<Page<Voyage>>(`${this.apiUrl}/search/global`, { params });
}

  searchByLieuDepart(lieuDepart: string, page: number = 0, size: number = 5): Observable<Page<Voyage>> {
    const params = new HttpParams()
      .set('lieuDepart', lieuDepart)
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<Page<Voyage>>(`${this.apiUrl}/search/depart-paginated`, { params });
  }

  searchByLieuArrivee(lieuArrivee: string, page: number = 0, size: number = 5): Observable<Page<Voyage>> {
    const params = new HttpParams()
      .set('lieuArrivee', lieuArrivee)
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<Page<Voyage>>(`${this.apiUrl}/search/arrivee-paginated`, { params });
  }

  searchByRoute(lieuDepart: string, lieuArrivee: string, page: number = 0, size: number = 5): Observable<Page<Voyage>> {
    const params = new HttpParams()
      .set('lieuDepart', lieuDepart)
      .set('lieuArrivee', lieuArrivee)
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<Page<Voyage>>(`${this.apiUrl}/search/route-paginated`, { params });
  }

  searchByCriteria(
    criteria: {
      lieuDepart?: string,
      lieuArrivee?: string,
      statut?: string,
      prixMin?: number,
      prixMax?: number
    },
    page: number = 0,
    size: number = 5
  ): Observable<Page<Voyage>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (criteria.lieuDepart) params = params.set('lieuDepart', criteria.lieuDepart);
    if (criteria.lieuArrivee) params = params.set('lieuArrivee', criteria.lieuArrivee);
    if (criteria.statut) params = params.set('statut', criteria.statut);
    if (criteria.prixMin) params = params.set('prixMin', criteria.prixMin.toString());
    if (criteria.prixMax) params = params.set('prixMax', criteria.prixMax.toString());

    return this.http.get<Page<Voyage>>(`${this.apiUrl}/search/filters`, { 
      params,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  getTotalVoyages(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/stats/total`);
  }

  getVoyageById(id: number): Observable<Voyage> {
    return this.http.get<Voyage>(`${this.apiUrl}/${id}`);
  }

  createVoyage(voyage: Voyage): Observable<Voyage> {
    return this.http.post<Voyage>(this.apiUrl, voyage);
  }

  updateVoyage(id: number, voyage: Voyage): Observable<Voyage> {
    return this.http.put<Voyage>(`${this.apiUrl}/${id}`, voyage);
  }

  deleteVoyage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  changeStatutVoyage(id: number, statut: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/statut`, null, {
      params: new HttpParams().set('statut', statut)
    });
  }
}