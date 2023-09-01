import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditShootTypeComponent } from './edit-shoot-type.component';

describe('EditShootTypeComponent', () => {
  let component: EditShootTypeComponent;
  let fixture: ComponentFixture<EditShootTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditShootTypeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditShootTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
