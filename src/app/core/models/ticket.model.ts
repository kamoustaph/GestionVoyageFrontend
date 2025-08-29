export interface Ticket {
  id?: number;
  reservationId: number;
  qrCode: string;
  statut: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TicketDetail {
  id?: number;
  reservationId: number;
  userId: number;
  userNom: string;
  userPrenom: string;
  userEmail: string;
  voyageId: number;
  voyageLieuDepart: string;
  voyageLieuArrivee: string;
  voyageDateDepart: string;
  voyageDateRetour: string;
  qrCode: string;
  statut: string;
  createdAt?: string;
  updatedAt?: string;
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

export interface TicketCreateDto {
  reservationId: number;
}

export interface TicketFilterDto {
  reservationId?: number;
  userId?: number;
  voyageId?: number;
  statut?: string;
  createdAtStart?: string;
  createdAtEnd?: string;
  qrCode?: string;
  sortBy?: string;
  sortDirection?: string;
  page?: number;
  size?: number;
}