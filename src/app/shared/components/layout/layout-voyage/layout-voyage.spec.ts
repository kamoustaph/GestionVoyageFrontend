import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayoutVoyage } from './layout-voyage';

describe('LayoutVoyage', () => {
  let component: LayoutVoyage;
  let fixture: ComponentFixture<LayoutVoyage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutVoyage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LayoutVoyage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
