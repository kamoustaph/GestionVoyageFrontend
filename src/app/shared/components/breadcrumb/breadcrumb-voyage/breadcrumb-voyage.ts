import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Breadcrumb } from '../../../../core/services/breadcrumb';

@Component({
  selector: 'app-breadcrumb-voyage',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './breadcrumb-voyage.html',
  styleUrl: './breadcrumb-voyage.css'
})
export class BreadcrumbVoyageComponent {
  breadcrumbs: {label: string, url: string, icon?: string}[] = [];

  constructor(private breadcrumbService: Breadcrumb) {
    this.breadcrumbService.getBreadcrumbs().subscribe(breadcrumbs => {
      this.breadcrumbs = breadcrumbs;
    });
  }
}