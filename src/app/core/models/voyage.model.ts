export interface Voyage {
  id?: number;
  lieuDepart: string;
  lieuArrivee: string;
  dateDepart: string;
  dateRetour: string;
  prix: number;
  placesDisponibles: number;
  placesTotal: number;
  statut: string;
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

export interface VoyageCreateDto {
  id?: number;
  lieuDepart: string;
  lieuArrivee: string;
  dateDepart: string;
  dateRetour: string;
  prix: number;
  placesDisponibles: number;
  placesTotal: number;
  statut: string;
}