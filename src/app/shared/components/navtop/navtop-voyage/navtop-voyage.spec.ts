import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavtopVoyage } from './navtop-voyage';

describe('NavtopVoyage', () => {
  let component: NavtopVoyage;
  let fixture: ComponentFixture<NavtopVoyage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavtopVoyage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavtopVoyage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
