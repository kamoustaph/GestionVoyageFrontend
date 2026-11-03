import { Pipe, PipeTransform } from '@angular/core';
import {
  ClasseVoyage, MethodePaiement, ResultatControle, StatutBillet, StatutReservation, StatutVoyage,
} from './models';

/** Codes de gare affichés sur les billets et le tableau des départs. */
const CODES: Record<string, string> = {
  Dakar: 'DKR', 'Thiès': 'THS', Mbour: 'MBR', 'Saint-Louis': 'STL', Louga: 'LGA', Touba: 'TBA',
  Diourbel: 'DBL', Kaolack: 'KLK', Fatick: 'FTK', Kaffrine: 'KFR', Tambacounda: 'TBC',
  'Kédougou': 'KDG', Kolda: 'KLD', 'Sédhiou': 'SDH', Ziguinchor: 'ZIG', Matam: 'MTM', Podor: 'PDR',
};

export function codeVille(ville: string): string {
  return CODES[ville] ?? ville.slice(0, 3).toUpperCase();
}

@Pipe({ name: 'codeVille' })
export class CodeVillePipe implements PipeTransform {
  transform(ville: string): string {
    return codeVille(ville);
  }
}

/** 6500 → « 6 500 F CFA » */
@Pipe({ name: 'fcfa' })
export class FcfaPipe implements PipeTransform {
  transform(montant: number | null | undefined, court = false): string {
    if (montant == null) return '';
    const n = new Intl.NumberFormat('fr-FR').format(montant).replace(/ | /g, ' ');
    return court ? `${n} F` : `${n} F CFA`;
  }
}

/** 270 → « 4 h 30 » */
@Pipe({ name: 'duree' })
export class DureePipe implements PipeTransform {
  transform(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`;
  }
}

const LIBELLES: Record<string, string> = {
  STANDARD: 'Standard', CONFORT: 'Confort', VIP: 'VIP',
  PROGRAMME: 'Programmé', EMBARQUEMENT: 'Embarquement', PARTI: 'Parti', ANNULE: 'Annulé',
  EN_ATTENTE_PAIEMENT: 'À payer', CONFIRMEE: 'Confirmée', ANNULEE: 'Annulée', EXPIREE: 'Expirée',
  EN_ATTENTE: 'Non payé', VALIDE: 'Valide', UTILISE: 'Embarqué',
  WAVE: 'Wave', ORANGE_MONEY: 'Orange Money', FREE_MONEY: 'Free Money', CARTE: 'Carte bancaire', ESPECES: 'Espèces',
  VOYAGEUR: 'Voyageur', AGENT: 'Agent de contrôle', ADMIN: 'Administrateur',
  ACCEPTE: 'Accepté', DEJA_UTILISE: 'Déjà utilisé', BILLET_ANNULE: 'Billet annulé', NON_PAYE: 'Non payé',
  VOYAGE_ANNULE: 'Voyage annulé', MAUVAIS_VOYAGE: 'Autre départ', HORS_DELAI: 'Hors délai',
  SIGNATURE_INVALIDE: 'QR falsifié', INCONNU: 'Inconnu', FORMAT_INVALIDE: 'QR étranger',
};

@Pipe({ name: 'libelle' })
export class LibellePipe implements PipeTransform {
  transform(valeur: string | null | undefined): string {
    return valeur ? LIBELLES[valeur] ?? valeur : '';
  }
}

type Ton = 'ok' | 'warn' | 'ko' | 'info' | '';

/** Couleur de pastille selon le statut. */
@Pipe({ name: 'ton' })
export class TonPipe implements PipeTransform {
  transform(
    valeur: StatutVoyage | StatutReservation | StatutBillet | ResultatControle | ClasseVoyage | MethodePaiement | string,
  ): Ton {
    switch (valeur) {
      case 'CONFIRMEE': case 'VALIDE': case 'ACCEPTE': case 'PROGRAMME':
        return 'ok';
      case 'EN_ATTENTE_PAIEMENT': case 'EN_ATTENTE': case 'EMBARQUEMENT': case 'HORS_DELAI': case 'MAUVAIS_VOYAGE':
        return 'warn';
      case 'ANNULEE': case 'ANNULE': case 'VOYAGE_ANNULE': case 'BILLET_ANNULE': case 'DEJA_UTILISE':
      case 'SIGNATURE_INVALIDE': case 'INCONNU': case 'FORMAT_INVALIDE': case 'NON_PAYE':
        return 'ko';
      case 'UTILISE': case 'VIP':
        return 'info';
      default:
        return '';
    }
  }
}

export const FORMAT_PIPES = [CodeVillePipe, FcfaPipe, DureePipe, LibellePipe, TonPipe] as const;

/** Date du jour au format AAAA-MM-JJ, heure locale. */
export function aujourdhuiIso(decalageJours = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + decalageJours);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
