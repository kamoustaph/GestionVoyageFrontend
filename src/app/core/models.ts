/** Types échangés avec l'API Spring (voir le backend, package dto). */

export type Role = 'VOYAGEUR' | 'AGENT' | 'ADMIN';
export type ClasseVoyage = 'STANDARD' | 'CONFORT' | 'VIP';
export type StatutVoyage = 'PROGRAMME' | 'EMBARQUEMENT' | 'PARTI' | 'ANNULE';
export type StatutReservation = 'EN_ATTENTE_PAIEMENT' | 'CONFIRMEE' | 'ANNULEE' | 'EXPIREE';
export type StatutBillet = 'EN_ATTENTE' | 'VALIDE' | 'UTILISE' | 'ANNULE';
export type MethodePaiement = 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY' | 'CARTE' | 'ESPECES';
export type ResultatControle =
  | 'ACCEPTE' | 'DEJA_UTILISE' | 'BILLET_ANNULE' | 'NON_PAYE' | 'VOYAGE_ANNULE'
  | 'MAUVAIS_VOYAGE' | 'HORS_DELAI' | 'SIGNATURE_INVALIDE' | 'INCONNU' | 'FORMAT_INVALIDE';

export interface Utilisateur {
  id: number;
  email: string;
  nomComplet: string;
  telephone: string | null;
  role: Role;
  actif: boolean;
  creeLe: string;
}

export interface AuthResponse {
  token: string;
  expireDansSecondes: number;
  utilisateur: Utilisateur;
}

export interface Voyage {
  id: number;
  villeDepart: string;
  villeArrivee: string;
  gareDepart: string | null;
  gareArrivee: string | null;
  dateDepart: string;
  dateArriveeEstimee: string;
  dureeMinutes: number;
  prix: number;
  placesTotal: number;
  placesDisponibles: number;
  classe: ClasseVoyage;
  bus: string | null;
  statut: StatutVoyage;
  reservable: boolean;
}

export interface VoyageRequest {
  villeDepart: string;
  villeArrivee: string;
  gareDepart: string | null;
  gareArrivee: string | null;
  dateDepart: string;
  dureeMinutes: number;
  prix: number;
  placesTotal: number;
  classe: ClasseVoyage;
  bus: string | null;
}

export interface Billet {
  id: number;
  code: string;
  nomPassager: string;
  siege: number;
  statut: StatutBillet;
  reservationReference: string;
  voyage: Voyage;
  /** Contenu signé à encoder dans le QR code ; absent si le billet n'est pas utilisable. */
  qrContenu: string | null;
  embarqueLe: string | null;
}

export interface Paiement {
  montant: number;
  methode: MethodePaiement;
  telephone: string | null;
  transactionRef: string;
  payeLe: string;
}

export interface Reservation {
  id: number;
  reference: string;
  statut: StatutReservation;
  nombrePlaces: number;
  montantTotal: number;
  creeLe: string;
  expireLe: string | null;
  voyage: Voyage;
  client: string;
  clientEmail: string;
  paiement: Paiement | null;
  billets: Billet[];
}

export interface ControleResultat {
  resultat: ResultatControle;
  accepte: boolean;
  message: string;
  billet: Billet | null;
}

export interface Controle {
  id: number;
  scanneLe: string;
  resultat: ResultatControle;
  message: string;
  agent: string;
  billetCode: string | null;
  nomPassager: string | null;
  trajet: string | null;
}

export interface PassagerManifeste {
  code: string;
  siege: number;
  nomPassager: string;
  reservationReference: string;
  telephone: string | null;
  statut: StatutBillet;
  embarqueLe: string | null;
}

export interface Stats {
  chiffreAffaires: number;
  billetsVendus: number;
  billetsEmbarques: number;
  voyagesAVenir: number;
  voyageurs: number;
  agents: number;
  controlesAujourdhui: number;
  refusAujourdhui: number;
  tauxRemplissage: number;
  ventes14Jours: { jour: string; montant: number; billets: number }[];
  topTrajets: { depart: string; arrivee: string; billets: number; montant: number }[];
}
