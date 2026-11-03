import { Component, input } from '@angular/core';

/** Marque Yoon : un chevron jaune (la route) sur pastille verte. */
@Component({
  selector: 'app-logo',
  template: `
    <svg viewBox="0 0 64 64" [attr.width]="taille()" [attr.height]="taille()" aria-hidden="true">
      <rect width="64" height="64" rx="14" [attr.fill]="inverse() ? '#ffffff' : '#0E5E3B'" />
      <path d="M14 44 L32 18 L50 44" fill="none" stroke="#F5C400" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="32" cy="46" r="4" [attr.fill]="inverse() ? '#0E5E3B' : '#ffffff'" />
    </svg>
    <span>yoon</span>
  `,
  styles: `
    :host { display: inline-flex; align-items: center; gap: 10px; font-family: var(--font-display); font-weight: 800; font-size: 1.55rem; letter-spacing: -0.04em; line-height: 1; }
  `,
})
export class Logo {
  taille = input(34);
  inverse = input(false);
}
