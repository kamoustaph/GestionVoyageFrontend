import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BreadcrumbVoyage } from './breadcrumb-voyage';

describe('BreadcrumbVoyage', () => {
  let component: BreadcrumbVoyage;
  let fixture: ComponentFixture<BreadcrumbVoyage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreadcrumbVoyage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BreadcrumbVoyage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
