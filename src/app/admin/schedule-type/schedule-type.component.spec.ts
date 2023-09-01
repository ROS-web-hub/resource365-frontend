import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleTypeComponent } from './schedule-type.component';

describe('ScheduleTypeComponent', () => {
  let component: ScheduleTypeComponent;
  let fixture: ComponentFixture<ScheduleTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScheduleTypeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduleTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
