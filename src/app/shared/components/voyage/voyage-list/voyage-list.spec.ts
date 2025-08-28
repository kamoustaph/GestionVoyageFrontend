import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoyageList } from './voyage-list';

describe('VoyageList', () => {
  let component: VoyageList;
  let fixture: ComponentFixture<VoyageList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoyageList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoyageList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
