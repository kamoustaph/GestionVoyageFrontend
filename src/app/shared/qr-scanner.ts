import { Component, ElementRef, OnDestroy, effect, input, output, signal, viewChild } from '@angular/core';
import jsQR from 'jsqr';

/**
 * Lecteur de QR code par la caméra (getUserMedia + jsQR), sans dépendance à un service externe.
 * La caméra exige HTTPS (ou localhost). Pendant que `pause` est vrai, aucune lecture n'est émise.
 */
@Component({
  selector: 'app-qr-scanner',
  template: `
    <div class="viewport" [class.off]="etat() !== 'actif'">
      <video #video playsinline muted></video>
      <canvas #canvas hidden></canvas>
      @if (etat() === 'actif') {
        <div class="frame" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      }
      @switch (etat()) {
        @case ('arret') {
          <div class="overlay">
            <button type="button" class="btn btn-sun" (click)="demarrer()">Activer la caméra</button>
          </div>
        }
        @case ('demarrage') {
          <div class="overlay"><div class="spinner"></div></div>
        }
        @case ('erreur') {
          <div class="overlay">
            <p>{{ erreur() }}</p>
            <button type="button" class="btn btn-sun btn-sm" (click)="demarrer()">Réessayer</button>
          </div>
        }
      }
    </div>
  `,
  styles: `
    .viewport { position: relative; aspect-ratio: 1; width: 100%; background: #08281a; border-radius: var(--r-lg); overflow: hidden; }
    video { width: 100%; height: 100%; object-fit: cover; }
    .off video { visibility: hidden; }
    .overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 24px; text-align: center; color: #fff; }
    .overlay p { max-width: 32ch; margin: 0; }
    .overlay .spinner { border-color: rgba(255,255,255,.25); border-top-color: var(--sun); }
    .frame { position: absolute; inset: 16%; }
    .frame i { position: absolute; width: 34px; height: 34px; border: 5px solid var(--sun); }
    .frame i:nth-child(1) { top: 0; left: 0; border-right: 0; border-bottom: 0; border-top-left-radius: 10px; }
    .frame i:nth-child(2) { top: 0; right: 0; border-left: 0; border-bottom: 0; border-top-right-radius: 10px; }
    .frame i:nth-child(3) { bottom: 0; left: 0; border-right: 0; border-top: 0; border-bottom-left-radius: 10px; }
    .frame i:nth-child(4) { bottom: 0; right: 0; border-left: 0; border-top: 0; border-bottom-right-radius: 10px; }
  `,
})
export class QrScanner implements OnDestroy {
  pause = input(false);
  lu = output<string>();

  etat = signal<'arret' | 'demarrage' | 'actif' | 'erreur'>('arret');
  erreur = signal('');

  private video = viewChild.required<ElementRef<HTMLVideoElement>>('video');
  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private flux: MediaStream | null = null;
  private boucle = 0;
  private dernier = { valeur: '', quand: 0 };

  constructor() {
    // Après une pause (résultat affiché), on autorise de nouveau le même QR.
    effect(() => {
      if (!this.pause()) this.dernier = { valeur: '', quand: 0 };
    });
  }

  async demarrer(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.echec("Ce navigateur ne donne pas accès à la caméra. Utilisez la saisie du code ou une photo.");
      return;
    }
    this.etat.set('demarrage');
    try {
      this.flux = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      const video = this.video().nativeElement;
      video.srcObject = this.flux;
      await video.play();
      this.etat.set('actif');
      this.lire();
    } catch (e) {
      const nom = (e as DOMException)?.name;
      this.echec(nom === 'NotAllowedError'
        ? "Accès à la caméra refusé. Autorisez-le dans les réglages du navigateur."
        : location.protocol !== 'https:' && location.hostname !== 'localhost'
          ? 'La caméra ne fonctionne que sur une adresse https.'
          : 'Aucune caméra disponible.');
    }
  }

  arreter(): void {
    cancelAnimationFrame(this.boucle);
    this.flux?.getTracks().forEach((t) => t.stop());
    this.flux = null;
    if (this.etat() === 'actif') this.etat.set('arret');
  }

  ngOnDestroy(): void {
    this.arreter();
  }

  private lire = (): void => {
    const video = this.video().nativeElement;
    if (!this.flux) return;
    if (!this.pause() && video.readyState >= video.HAVE_ENOUGH_DATA) {
      const canvas = this.canvas().nativeElement;
      const echelle = Math.min(1, 640 / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * echelle);
      canvas.height = Math.round(video.videoHeight * echelle);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' });
        if (code?.data) this.emettre(code.data);
      }
    }
    this.boucle = requestAnimationFrame(this.lire);
  };

  private emettre(valeur: string): void {
    const maintenant = Date.now();
    if (valeur === this.dernier.valeur && maintenant - this.dernier.quand < 3000) return;
    this.dernier = { valeur, quand: maintenant };
    this.lu.emit(valeur);
  }

  private echec(message: string): void {
    this.arreter();
    this.erreur.set(message);
    this.etat.set('erreur');
  }
}

/** Décode un QR code depuis une image (photo d'un billet). Renvoie null si aucun QR n'est trouvé. */
export async function lireQrDepuisImage(fichier: File): Promise<string | null> {
  const bitmap = await createImageBitmap(fichier);
  const echelle = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * echelle);
  canvas.height = Math.round(bitmap.height * echelle);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' })?.data ?? null;
}
