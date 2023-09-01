import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddScheduleTypeComponent } from './add-schedule-type.component';

describe('AddScheduleTypeComponent', () => {
  let component: AddScheduleTypeComponent;
  let fixture: ComponentFixture<AddScheduleTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddScheduleTypeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddScheduleTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
