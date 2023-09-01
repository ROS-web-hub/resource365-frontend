import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewShootTypeComponent } from './view-shoot-type.component';

describe('ViewShootTypeComponent', () => {
  let component: ViewShootTypeComponent;
  let fixture: ComponentFixture<ViewShootTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewShootTypeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewShootTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
