import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewResourceTypeComponent } from './view-resource-type.component';

describe('ViewResourceTypeComponent', () => {
  let component: ViewResourceTypeComponent;
  let fixture: ComponentFixture<ViewResourceTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewResourceTypeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewResourceTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
