export interface Paiement {
  id?: number;
  reservationId: number;
  montant: number;
  methode: MethodePaiement;
  statut: StatutPaiement;
  datePaiement?: string;
  updatedAt?: string;
}

export interface PaiementDetail {
  id?: number;
  reservationId: number;
  userId: number;
  userNom: string;
  userPrenom: string;
  userEmail?: string;
  voyageId: number;
  voyageLieuDepart: string;
  voyageLieuArrivee: string;
  montant: number;
  methode: MethodePaiement;
  statut: StatutPaiement;
  datePaiement?: string;
  updatedAt?: string;
}

export interface PaiementCreateDto {
  reservationId: number;
  montant: number;
  methode: MethodePaiement;
}

export interface PaiementFilterDto {
  reservationId?: number;
  userId?: number;
  statut?: StatutPaiement;
  methode?: MethodePaiement;
  montantMin?: number;
  montantMax?: number;
  datePaiementStart?: string;
  datePaiementEnd?: string;
  sortBy?: string;
  sortDirection?: string;
  page?: number;
  size?: number;
}

export enum MethodePaiement {
  CREDIT_CARD = 'CREDIT_CARD',
  WAVE = 'WAVE',
  ORANGE_MONEY = 'ORANGE_MONEY',
  PAYPAL = 'PAYPAL',
  FREE_MONEY = 'FREE_MONEY',
  WIZALL = 'WIZALL',
  E_MONEY = 'E_MONEY'
}

export enum StatutPaiement {
  EN_ATTENTE = 'EN_ATTENTE',
  VALIDE = 'VALIDE',
  REFUSE = 'REFUSE',
  REMBOURSE = 'REMBOURSE'
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface WavePaymentRequest {
  amount: number;
  currency: string;
  error_url: string;
  success_url: string;
  checkout_intent: string;
  client_reference?: string;
}

export interface WavePaymentResponse {
  id: string;
  checkout_status: string;
  client_reference: string;
  currency: string;
  error_url: string;
  last_payment_error: any;
  payment_status: string;
  success_url: string;
  wave_launch_url: string;
  when_completed: string;
  when_created: string;
  when_expires: string;
}

export interface OrangeMoneyPaymentRequest {
  amount: number;
  currency: string;
  order_id: string;
  return_url: string;
  cancel_url: string;
  notif_url: string;
  lang: string;
  reference: string;
}

export interface OrangeMoneyPaymentResponse {
  order_id: string;
  pay_url: string;
  payment_token: string;
  status: string;
}

export interface PaymentStats {
  totalPaiements: number;
  paiementsEnAttente: number;
  paiementsValides: number;
  paiementsRefuses: number;
  paiementsRembourses: number;
  revenuTotal: number;
  paiementsCeMois: number;
}