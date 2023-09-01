import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditScheduleTypeComponent } from './edit-schedule-type.component';

describe('EditScheduleTypeComponent', () => {
  let component: EditScheduleTypeComponent;
  let fixture: ComponentFixture<EditScheduleTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditScheduleTypeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditScheduleTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
