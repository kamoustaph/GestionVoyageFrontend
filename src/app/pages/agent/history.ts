import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Api, messageErreur } from '../../core/api.service';
import { LibellePipe, TonPipe } from '../../core/format';
import { Controle } from '../../core/models';

@Component({
  selector: 'app-history',
  imports: [DatePipe, LibellePipe, TonPipe],
  template: `
    <div class="page-head"><div><h1>Mes contrôles du jour</h1><p>Embarquements et refus enregistrés depuis minuit.</p></div></div>
    @if (erreur()) { <div class="alert">{{ erreur() }}</div> }
    <div class="table-wrap">
      <table class="data">
        <thead><tr><th>Heure</th><th>Résultat</th><th>Passager</th><th>Trajet</th><th>Billet</th></tr></thead>
        <tbody>
          @for (c of controles(); track c.id) {
            <tr>
              <td class="num">{{ c.scanneLe | date: 'HH:mm:ss' }}</td>
              <td><span class="tag {{ c.resultat | ton }}">{{ c.resultat | libelle }}</span></td>
              <td>{{ c.nomPassager || '-' }}</td>
              <td>{{ c.trajet || '-' }}</td>
              <td class="num">{{ c.billetCode || '-' }}</td>
            </tr>
          } @empty {
            <tr><td colspan="5" class="empty">Aucun contrôle aujourd'hui</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class History implements OnInit {
  private api = inject(Api);
  controles = signal<Controle[]>([]);
  erreur = signal('');

  ngOnInit(): void {
    this.api.historique().subscribe({
      next: (c) => this.controles.set(c),
      error: (e) => this.erreur.set(messageErreur(e)),
    });
  }
}
