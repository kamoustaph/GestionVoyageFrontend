import { Component, ElementRef, Injectable, effect, inject, signal, viewChild } from '@angular/core';

export interface DemandeConfirmation {
  titre: string;
  message: string;
  /** Libellé du bouton de confirmation. */
  ok?: string;
  /** Libellé du bouton qui renonce. */
  non?: string;
  /** Action destructrice : bouton rouge et icône d'alerte. */
  danger?: boolean;
}

interface EnCours extends DemandeConfirmation { repondre: (oui: boolean) => void; }

/**
 * Remplace window.confirm() par une boîte de dialogue aux couleurs de Yoon.
 * Usage : `if (!(await this.confirmation.demander({ titre, message, danger: true }))) return;`
 */
@Injectable({ providedIn: 'root' })
export class Confirmation {
  readonly demande = signal<EnCours | null>(null);

  demander(d: DemandeConfirmation): Promise<boolean> {
    this.demande()?.repondre(false);
    return new Promise((resolve) => {
      this.demande.set({
        ...d,
        repondre: (oui) => {
          this.demande.set(null);
          resolve(oui);
        },
      });
    });
  }
}

/** Boîte affichée une seule fois, dans le composant racine. */
@Component({
  selector: 'app-confirm-dialog',
  template: `
    <dialog #dlg class="confirm" [class.danger]="affiche()?.danger" aria-labelledby="confirm-titre" aria-describedby="confirm-msg"
            (cancel)="$event.preventDefault(); repondre(false)" (click)="clicFond($event)">
      @if (affiche(); as d) {
        <div class="body">
          <span class="icon" aria-hidden="true">
            @if (d.danger) {
              <svg viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
            } @else {
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v5h1" /></svg>
            }
          </span>
          <div>
            <h2 id="confirm-titre">{{ d.titre }}</h2>
            <p id="confirm-msg">{{ d.message }}</p>
          </div>
        </div>
        <div class="actions">
          <button type="button" class="btn btn-ghost" (click)="repondre(false)">{{ d.non ?? 'Retour' }}</button>
          <button type="button" class="btn" [class.btn-primary]="!d.danger" [class.btn-red]="d.danger"
                  (click)="repondre(true)" autofocus>{{ d.ok ?? 'Confirmer' }}</button>
        </div>
      }
    </dialog>
  `,
  styles: `
    .confirm { width: min(460px, calc(100vw - 32px)); }
    .body { display: flex; gap: 16px; padding: 26px 26px 8px; }
    .icon {
      flex: none; width: 46px; height: 46px; border-radius: 14px; display: grid; place-items: center;
      background: var(--leaf); color: var(--baobab); animation: yoon-pulse .6s var(--ease-spring) .15s both;
    }
    .danger .icon { background: var(--red-soft); color: var(--red); }
    .icon svg { width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    h2 { font-size: 1.25rem; margin: 2px 0 6px; }
    p { margin: 0; color: var(--muted); }
    .actions { display: flex; justify-content: flex-end; gap: 10px; padding: 18px 26px 24px; flex-wrap: wrap; }
    .btn-red { background: var(--red); color: #fff; }
    .btn-red:hover:not(:disabled) { background: #a3101f; }
  `,
})
export class ConfirmDialog {
  private svc = inject(Confirmation);
  d = this.svc.demande;
  /** Dernière demande, gardée affichée pendant l'animation de fermeture. */
  affiche = signal<DemandeConfirmation | null>(null);
  private dlg = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');

  constructor() {
    effect(() => {
      const el = this.dlg().nativeElement;
      const d = this.d();
      if (d) this.affiche.set(d);
      if (d && !el.open) el.showModal();
      if (!this.d() && el.open) el.close();
    });
  }

  repondre(oui: boolean): void {
    this.d()?.repondre(oui);
  }

  /** Clic sur le fond assombri (hors de la boîte) : renoncer. */
  clicFond(e: MouseEvent): void {
    if (e.target === this.dlg().nativeElement) this.repondre(false);
  }
}
