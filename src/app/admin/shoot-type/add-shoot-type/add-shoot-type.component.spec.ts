import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddShootTypeComponent } from './add-shoot-type.component';

describe('AddShootTypeComponent', () => {
  let component: AddShootTypeComponent;
  let fixture: ComponentFixture<AddShootTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddShootTypeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddShootTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
