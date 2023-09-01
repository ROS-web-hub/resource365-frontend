import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddResourceTypeComponent } from './add-resource-type.component';

describe('AddResourceTypeComponent', () => {
  let component: AddResourceTypeComponent;
  let fixture: ComponentFixture<AddResourceTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddResourceTypeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddResourceTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
