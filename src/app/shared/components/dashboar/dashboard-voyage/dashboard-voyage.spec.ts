import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardVoyage } from './dashboard-voyage';

describe('DashboardVoyage', () => {
  let component: DashboardVoyage;
  let fixture: ComponentFixture<DashboardVoyage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardVoyage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardVoyage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
