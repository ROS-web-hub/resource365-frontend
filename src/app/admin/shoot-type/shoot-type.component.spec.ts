import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShootTypeComponent } from './shoot-type.component';

describe('ShootTypeComponent', () => {
  let component: ShootTypeComponent;
  let fixture: ComponentFixture<ShootTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShootTypeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShootTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
