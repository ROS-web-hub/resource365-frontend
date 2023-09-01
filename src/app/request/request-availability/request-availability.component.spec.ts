import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestAvailabilityComponent } from './request-availability.component';

describe('RequestAvailabilityComponent', () => {
  let component: RequestAvailabilityComponent;
  let fixture: ComponentFixture<RequestAvailabilityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RequestAvailabilityComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestAvailabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
