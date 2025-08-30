// payment.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { 
  Paiement, 
  PaiementDetail, 
  PaiementCreateDto, 
  PaiementFilterDto, 
  Page, 
  StatutPaiement, 
  MethodePaiement,
  WavePaymentRequest,
  WavePaymentResponse,
  OrangeMoneyPaymentRequest,
  OrangeMoneyPaymentResponse 
} from '../models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8093/api/paiements';

  // URLs des APIs de paiement
  private waveApiUrl = 'https://api.wave.com/v1/checkout/sessions';
  private orangeMoneyApiUrl = 'https://api.orange.com/orange-money-webpay/dev/v1';

  // Méthodes CRUD de base
  getAllPayments(): Observable<Paiement[]> {
    return this.http.get<Paiement[]>(this.apiUrl);
  }

  getAllPaymentsPaginated(page: number = 0, size: number = 10, sortBy: string = 'datePaiement', sortDirection: string = 'desc'): Observable<Page<Paiement>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    
    return this.http.get<Page<Paiement>>(`${this.apiUrl}/paginated`, { params });
  }

  getPaymentById(id: number): Observable<Paiement> {
    return this.http.get<Paiement>(`${this.apiUrl}/${id}`);
  }

  getPaymentDetail(id: number): Observable<PaiementDetail> {
    return this.http.get<PaiementDetail>(`${this.apiUrl}/${id}/detail`);
  }

  getPaymentByReservationId(reservationId: number): Observable<Paiement> {
    return this.http.get<Paiement>(`${this.apiUrl}/reservation/${reservationId}`);
  }

  createPayment(payment: PaiementCreateDto): Observable<Paiement> {
    return this.http.post<Paiement>(this.apiUrl, payment);
  }

  updatePaymentStatus(id: number, statut: StatutPaiement): Observable<Paiement> {
    const params = new HttpParams().set('statut', statut);
    return this.http.put<Paiement>(`${this.apiUrl}/${id}/statut`, null, { params });
  }

  deletePayment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Méthodes de recherche et filtrage
  getPaymentsByStatus(statut: StatutPaiement, page: number = 0, size: number = 10): Observable<Page<Paiement>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<Page<Paiement>>(`${this.apiUrl}/statut/${statut}/paginated`, { params });
  }

  getPaymentsByMethod(methode: MethodePaiement, page: number = 0, size: number = 10): Observable<Page<Paiement>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<Page<Paiement>>(`${this.apiUrl}/methode/${methode}/paginated`, { params });
  }

  getPaymentsByUserId(userId: number, page: number = 0, size: number = 10): Observable<Page<Paiement>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<Page<Paiement>>(`${this.apiUrl}/user/${userId}/paginated`, { params });
  }

  searchPaymentsWithFilters(filterDto: PaiementFilterDto): Observable<Page<Paiement>> {
    return this.http.post<Page<Paiement>>(`${this.apiUrl}/search`, filterDto);
  }

  // Méthodes de statistiques
  getTotalPayments(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/stats/total`);
  }

  getPaymentsByStatusCount(statut: StatutPaiement): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/stats/statut/${statut}`);
  }

  getPaymentsByMethodCount(methode: MethodePaiement): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/stats/methode/${methode}`);
  }

  getTotalRevenue(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/stats/revenue/total`);
  }

  // Intégration Wave Money
  initiateWavePayment(amount: number, reservationId: number): Observable<WavePaymentResponse> {
    const waveRequest: WavePaymentRequest = {
      amount: amount,
      currency: 'XOF', // Franc CFA
      checkout_intent: 'PAY', 
      error_url: `${window.location.origin}/payment/error`,
      success_url: `${window.location.origin}/payment/success`,
      client_reference: `reservation-${reservationId}`
    };

    // Headers pour Wave API
    const headers = {
      'Authorization': 'Bearer YOUR_WAVE_API_KEY', // À remplacer par votre clé API
      'Content-Type': 'application/json'
    };

    return this.http.post<WavePaymentResponse>(this.waveApiUrl, waveRequest, { headers });
  }

  // Intégration Orange Money
  initiateOrangeMoneyPayment(amount: number, reservationId: number): Observable<OrangeMoneyPaymentResponse> {
    const orangeRequest: OrangeMoneyPaymentRequest = {
      amount: amount,
      currency: 'XOF',
      order_id: `order-${reservationId}-${Date.now()}`,
      return_url: `${window.location.origin}/payment/success`,
      cancel_url: `${window.location.origin}/payment/cancel`,
      notif_url: `${window.location.origin}/api/payment/orange-callback`,
      lang: 'fr',
      reference: `reservation-${reservationId}`
    };

    // Headers pour Orange Money API
    const headers = {
      'Authorization': 'Bearer YOUR_ORANGE_API_KEY', // À remplacer par votre clé API
      'Content-Type': 'application/json'
    };

    return this.http.post<OrangeMoneyPaymentResponse>(this.orangeMoneyApiUrl, orangeRequest, { headers });
  }

  // Vérifier le statut d'un paiement Wave
  checkWavePaymentStatus(paymentId: string): Observable<WavePaymentResponse> {
    const headers = {
      'Authorization': 'Bearer YOUR_WAVE_API_KEY'
    };

    return this.http.get<WavePaymentResponse>(`${this.waveApiUrl}/${paymentId}`, { headers });
  }

  // Processus de paiement complet
  processPayment(reservationId: number, amount: number, methode: MethodePaiement): Observable<any> {
    // Créer d'abord le paiement en base avec statut EN_ATTENTE
    const paymentDto: PaiementCreateDto = {
      reservationId: reservationId,
      montant: amount,
      methode: methode
    };

    return this.createPayment(paymentDto).pipe(
      map(payment => {
        // Selon la méthode choisie, initier le paiement approprié
        switch (methode) {
          case MethodePaiement.WAVE:
            return this.initiateWavePayment(amount, reservationId);
          case MethodePaiement.ORANGE_MONEY:
            return this.initiateOrangeMoneyPayment(amount, reservationId);
          default:
            // Pour les autres méthodes, retourner le paiement créé
            return payment;
        }
      })
    );
  }

  // Confirmer un paiement après succès
  confirmPayment(paymentId: number, transactionId?: string): Observable<Paiement> {
    return this.updatePaymentStatus(paymentId, StatutPaiement.VALIDE);
  }

  // Refuser un paiement après échec
  rejectPayment(paymentId: number, reason?: string): Observable<Paiement> {
    return this.updatePaymentStatus(paymentId, StatutPaiement.REFUSE);
  }

  // Méthodes utilitaires
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  }

  getMethodLabel(methode: MethodePaiement): string {
    const labels: { [key in MethodePaiement]: string } = {
      [MethodePaiement.WAVE]: 'Wave',
      [MethodePaiement.ORANGE_MONEY]: 'Orange Money',
      [MethodePaiement.CREDIT_CARD]: 'Carte de Crédit',
      [MethodePaiement.PAYPAL]: 'PayPal',
      [MethodePaiement.FREE_MONEY]: 'Free Money',
      [MethodePaiement.WIZALL]: 'Wizall',
      [MethodePaiement.E_MONEY]: 'E-Money'
    };
    return labels[methode] || methode;
  }

  getStatusLabel(statut: StatutPaiement): string {
    const labels: { [key in StatutPaiement]: string } = {
      [StatutPaiement.EN_ATTENTE]: '⏳ En Attente',
      [StatutPaiement.VALIDE]: '✅ Validé',
      [StatutPaiement.REFUSE]: '❌ Refusé',
      [StatutPaiement.REMBOURSE]: '💰 Remboursé'
    };
    return labels[statut] || statut;
  }

  getStatusColor(statut: StatutPaiement): string {
    const colors: { [key in StatutPaiement]: string } = {
      [StatutPaiement.EN_ATTENTE]: '#ff9800',
      [StatutPaiement.VALIDE]: '#4caf50',
      [StatutPaiement.REFUSE]: '#f44336',
      [StatutPaiement.REMBOURSE]: '#2196f3'
    };
    return colors[statut] || '#000000';
  }
}