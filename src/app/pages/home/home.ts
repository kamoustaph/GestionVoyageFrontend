import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api } from '../../core/api.service';
import { CodeVillePipe, DureePipe, FcfaPipe } from '../../core/format';
import { Voyage } from '../../core/models';
import { SearchForm } from '../../shared/search-form';

interface Ligne { de: string; a: string; duree: number; }

@Component({
  selector: 'app-home',
  imports: [RouterLink, DatePipe, CodeVillePipe, FcfaPipe, DureePipe, SearchForm],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  private api = inject(Api);

  departs = signal<Voyage[]>([]);
  chargement = signal(true);
  horsLigne = signal(false);
  heure = signal(new Date());
  private minuterie?: ReturnType<typeof setInterval>;

  lignes: Ligne[] = [
    { de: 'Dakar', a: 'Saint-Louis', duree: 270 },
    { de: 'Dakar', a: 'Touba', duree: 240 },
    { de: 'Dakar', a: 'Ziguinchor', duree: 600 },
    { de: 'Dakar', a: 'Thiès', duree: 75 },
    { de: 'Dakar', a: 'Kaolack', duree: 210 },
    { de: 'Dakar', a: 'Tambacounda', duree: 480 },
  ];

  ngOnInit(): void {
    this.charger();
    // Horloge du tableau et rafraîchissement des places toutes les 60 s.
    this.minuterie = setInterval(() => {
      this.heure.set(new Date());
      if (new Date().getSeconds() < 1) this.charger();
    }, 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.minuterie);
  }

  charger(): void {
    this.api.prochainsDeparts(7).subscribe({
      next: (v) => { this.departs.set(v); this.chargement.set(false); this.horsLigne.set(false); },
      error: () => { this.chargement.set(false); this.horsLigne.set(true); },
    });
  }

  statut(v: Voyage): { texte: string; classe: string } {
    if (v.statut === 'EMBARQUEMENT') return { texte: 'Embarquement', classe: 'board-go' };
    if (v.placesDisponibles === 0) return { texte: 'Complet', classe: 'board-full' };
    if (v.placesDisponibles <= 5) return { texte: `${v.placesDisponibles} places`, classe: 'board-few' };
    return { texte: 'À l’heure', classe: '' };
  }
}
