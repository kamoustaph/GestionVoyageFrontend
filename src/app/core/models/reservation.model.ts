export interface Reservation {
  id?: number;
  userId: number;
  userEmail?: string;
  voyageId: number;
  voyageLieuDepart?: string;
  voyageLieuArrivee?: string;
  statut: string;
  dateReservation?: string;
  dateExpiration?: string;
  nombrePlaces?: number;
  prixTotal?: number;
  dateCreation?: string;
  dateModification?: string;
}

export interface ReservationDetail {
  id?: number;
  userId: number;
  userNom: string;
  userPrenom: string;
  userEmail: string;
  voyageId: number;
  voyageLieuDepart: string;
  voyageLieuArrivee: string;
  voyageDateDepart?: string; 
  voyageDateRetour?: string; 
  voyagePrix: number;
  statut: string;
  dateReservation?: string;
  dateExpiration?: string;
  nombrePlaces: number;
  prixTotal: number;
  dateCreation?: string;
  dateModification?: string;
  dureeSejour?: number;
  estExpiree?: boolean;
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

export interface ReservationCreateDto {
  userId: number;
  voyageId: number;
  nombrePlaces: number;
  dateReservation?: string;
}

export interface ReservationFilterDto {
  userId?: number;
  voyageId?: number;
  statut?: string;
  dateReservationStart?: string;
  dateReservationEnd?: string;
  dateExpirationStart?: string;
  dateExpirationEnd?: string;
  nombrePlacesMin?: number;
  nombrePlacesMax?: number;
  sortBy?: string;
  sortDirection?: string;
  page?: number;
  size?: number;
}

export interface ReservationStats {
  totalReservations: number;
  reservationsEnAttente: number;
  reservationsConfirmees: number;
  reservationsAnnulees: number;
  reservationsTerminees: number;
  chiffreAffaireTotal: number;
  reservationsCeMois: number;
}