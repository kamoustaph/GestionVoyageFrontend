import QRCode from 'qrcode';
import { FUSEAU, codeVille } from '../core/format';
import { Billet, Reservation } from '../core/models';

/**
 * Billets au format PDF, générés dans le navigateur (aucun appel réseau) et téléchargés directement.
 * Une page A5 par passager : trajet, horaires (heure de Dakar), siège, QR code signé et code de secours.
 * Couleurs Yoon à plat, sans dégradé.
 */

const VERT: [number, number, number] = [14, 94, 59];
const VERT_NUIT: [number, number, number] = [11, 61, 39];
const SOLEIL: [number, number, number] = [245, 196, 0];
const ENCRE: [number, number, number] = [19, 34, 27];
const GRIS: [number, number, number] = [86, 101, 93];
const LIGNE: [number, number, number] = [211, 220, 213];
const FEUILLE: [number, number, number] = [226, 239, 230];

const CLASSES: Record<string, string> = { STANDARD: 'Standard', CONFORT: 'Confort', VIP: 'VIP' };
const METHODES: Record<string, string> = {
  WAVE: 'Wave', ORANGE_MONEY: 'Orange Money', FREE_MONEY: 'Free Money', CARTE: 'Carte bancaire', ESPECES: 'Espèces',
};

/** Les polices standard du PDF ne connaissent pas les espaces fines insécables produites par Intl. */
const propre = (t: string) => t.replace(/[\u202f\u00a0]/g, ' ');

const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

const jourCourt = (iso: string) => majuscule(propre(new Intl.DateTimeFormat('fr-FR', {
  timeZone: FUSEAU, weekday: 'short', day: 'numeric', month: 'short',
}).format(new Date(iso))));

const annee = (iso: string) => new Intl.DateTimeFormat('fr-FR', { timeZone: FUSEAU, year: 'numeric' }).format(new Date(iso));

const heure = (iso: string) => propre(new Intl.DateTimeFormat('fr-FR', {
  timeZone: FUSEAU, hour: '2-digit', minute: '2-digit',
}).format(new Date(iso)));

const fcfa = (n: number) => `${propre(new Intl.NumberFormat('fr-FR').format(n))} F CFA`;

const duree = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`;
};


/** Nom du fichier : billets-YN-ABC123.pdf, ou billet-<code>.pdf pour un seul billet hors réservation. */
export function nomFichier(billets: Billet[], reference?: string): string {
  return reference ? `billets-${reference}.pdf` : `billet-${billets[0]?.code ?? 'yoon'}.pdf`;
}

/** Génère le PDF et lance son téléchargement. Renvoie le nom du fichier. */
export async function telechargerBillets(billets: Billet[], reservation?: Reservation | null): Promise<string> {
  const utilisables = billets.filter((b) => b.qrContenu);
  if (utilisables.length === 0) throw new Error('Aucun billet utilisable à télécharger.');

  // Chargé à la demande : la bibliothèque PDF ne pèse pas sur le premier affichage du site.
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' });
  doc.setProperties({ title: `Billets Yoon ${reservation?.reference ?? utilisables[0].code}`, author: 'Yoon', creator: 'Yoon' });

  for (let i = 0; i < utilisables.length; i++) {
    if (i > 0) doc.addPage();
    const qr = await QRCode.toDataURL(utilisables[i].qrContenu!, {
      errorCorrectionLevel: 'M', margin: 1, width: 600, color: { dark: '#13221b', light: '#ffffff' },
    });
    dessinerBillet(doc, utilisables[i], qr, i + 1, utilisables.length, reservation);
  }

  const nom = nomFichier(utilisables, reservation?.reference);
  doc.save(nom);
  return nom;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dessinerBillet(doc: any, b: Billet, qr: string, n: number, total: number, r?: Reservation | null): void {
  const L = 148; // largeur A5
  const M = 12; // marge
  const v = b.voyage;

  // ---------- Bandeau ----------
  doc.setFillColor(...VERT);
  doc.rect(0, 0, L, 30, 'F');
  // Logo : pastille blanche, chevron jaune, point vert.
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(M, 8, 14, 14, 3, 3, 'F');
  doc.setDrawColor(...SOLEIL);
  doc.setLineWidth(1.6);
  doc.setLineCap('round');
  doc.setLineJoin('round');
  doc.lines([[4, -6], [4, 6]], M + 3, 19.2, [1, 1], 'S', false);
  doc.setFillColor(...VERT);
  doc.circle(M + 7, 19.5, 0.9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('yoon', M + 18, 18.6);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('BILLET DE CAR', L - M, 13, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(r?.reference ?? b.reservationReference, L - M, 19.5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(total > 1 ? `Billet ${n} sur ${total}` : 'Billet nominatif', L - M, 24.5, { align: 'right' });

  // ---------- Trajet ----------
  let y = 47;
  doc.setTextColor(...ENCRE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.text(codeVille(v.villeDepart), M, y);
  doc.text(codeVille(v.villeArrivee), L - M, y, { align: 'right' });
  // Flèche du trajet entre les deux codes.
  doc.setDrawColor(...ENCRE);
  doc.setLineWidth(0.6);
  doc.line(M + 32, y - 4, L - M - 34, y - 4);
  doc.setFillColor(...ENCRE);
  doc.triangle(L - M - 34, y - 4, L - M - 37, y - 5.8, L - M - 37, y - 2.2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...GRIS);
  doc.text(v.villeDepart, M, y + 6);
  doc.text(v.villeArrivee, L - M, y + 6, { align: 'right' });

  // ---------- Horaires (encadré vert clair) ----------
  y = 60;
  doc.setFillColor(...FEUILLE);
  doc.roundedRect(M, y, L - 2 * M, 22, 3, 3, 'F');
  const col = (L - 2 * M) / 3;
  const horaire = (x: number, titre: string, valeur: string, detail: string) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...GRIS);
    doc.text(titre, x, y + 6);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(...VERT_NUIT);
    doc.text(valeur, x, y + 13.5);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...GRIS);
    doc.text(detail, x, y + 18.5);
  };
  horaire(M + 5, 'DATE', jourCourt(v.dateDepart), annee(v.dateDepart));
  horaire(M + 5 + col, 'DÉPART', heure(v.dateDepart), 'heure de Dakar');
  horaire(M + 5 + 2 * col, 'ARRIVÉE ESTIMÉE', heure(v.dateArriveeEstimee), `durée ${duree(v.dureeMinutes)}`);

  // ---------- Passager et détails ----------
  y = 93;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...GRIS);
  doc.text('PASSAGER', M, y);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(...ENCRE);
  doc.text(doc.splitTextToSize(b.nomPassager, L - 2 * M - 30)[0], M, y + 7);
  // Siège mis en avant, pastille jaune.
  doc.setFillColor(...SOLEIL);
  doc.roundedRect(L - M - 24, y - 4.5, 24, 15, 3, 3, 'F');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...ENCRE);
  doc.text('SIÈGE', L - M - 12, y, { align: 'center' });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
  doc.text(String(b.siege), L - M - 12, y + 7.5, { align: 'center' });

  y = 109;
  const details: [string, string][] = [
    ['Gare de départ', v.gareDepart ?? v.villeDepart],
    ['Classe', CLASSES[v.classe] ?? v.classe],
    ['Car', v.bus ?? '-'],
  ];
  const largeur = (L - 2 * M) / 3;
  details.forEach(([t, val], i) => {
    const x = M + i * largeur;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...GRIS);
    doc.text(t.toUpperCase(), x, y);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...ENCRE);
    doc.text(doc.splitTextToSize(val, largeur - 3).slice(0, 2), x, y + 5);
  });

  // ---------- Ligne de découpe ----------
  y = 124;
  doc.setDrawColor(...LIGNE);
  doc.setLineWidth(0.4);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(M, y, L - M, y);
  doc.setLineDashPattern([], 0);
  doc.setFillColor(243, 245, 241);
  doc.circle(0, y, 4, 'F');
  doc.circle(L, y, 4, 'F');

  // ---------- QR code ----------
  const tailleQr = 48;
  const xQr = (L - tailleQr) / 2;
  y = 131;
  doc.setDrawColor(...LIGNE);
  doc.setLineWidth(0.3);
  doc.roundedRect(xQr - 3, y - 3, tailleQr + 6, tailleQr + 6, 3, 3, 'S');
  doc.addImage(qr, 'PNG', xQr, y, tailleQr, tailleQr);
  doc.setFont('courier', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...ENCRE);
  doc.text(b.code.split('').join(' '), L / 2, y + tailleQr + 9.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRIS);
  doc.text('Code à saisir par le contrôleur si le QR ne se lit pas', L / 2, y + tailleQr + 14.5, { align: 'center' });

  // ---------- Pied de page ----------
  doc.setFillColor(...VERT_NUIT);
  doc.rect(0, 200, L, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  const paiement = r?.paiement
    ? `Payé ${fcfa(r.paiement.montant)} par ${METHODES[r.paiement.methode] ?? r.paiement.methode} · ${r.paiement.transactionRef}`
    : 'Billet payé';
  doc.text(paiement, M, 206);
  doc.text('Valable pour un seul embarquement', L - M, 206, { align: 'right' });
  doc.setTextColor(...GRIS);
  doc.text('Présentez-vous 30 minutes avant le départ avec une pièce d\'identité.', L / 2, 197, { align: 'center' });
}
