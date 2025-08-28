import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoyageForm } from './voyage-form';

describe('VoyageForm', () => {
  let component: VoyageForm;
  let fixture: ComponentFixture<VoyageForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoyageForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoyageForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
