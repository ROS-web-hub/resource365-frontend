import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewScheduleTypeComponent } from './view-schedule-type.component';

describe('ViewScheduleTypeComponent', () => {
  let component: ViewScheduleTypeComponent;
  let fixture: ComponentFixture<ViewScheduleTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewScheduleTypeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewScheduleTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
