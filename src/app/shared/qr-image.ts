import { Component, effect, input, signal } from '@angular/core';
import QRCode from 'qrcode';

/** Affiche un QR code généré dans le navigateur (aucun appel réseau). */
@Component({
  selector: 'app-qr-image',
  template: `
    @if (src()) {
      <img [src]="src()" [attr.width]="taille()" [attr.height]="taille()" [alt]="alt()" />
    } @else {
      <div class="placeholder" [style.width.px]="taille()" [style.height.px]="taille()"></div>
    }
  `,
  styles: `
    img { image-rendering: pixelated; }
    .placeholder { background: var(--line-soft); border-radius: 4px; }
  `,
})
export class QrImage {
  contenu = input.required<string>();
  taille = input(180);
  alt = input('QR code du billet');
  src = signal<string | null>(null);

  constructor() {
    effect(() => {
      const contenu = this.contenu();
      QRCode.toDataURL(contenu, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: this.taille() * 2,
        color: { dark: '#13221b', light: '#ffffff' },
      }).then((url) => this.src.set(url)).catch(() => this.src.set(null));
    });
  }
}
