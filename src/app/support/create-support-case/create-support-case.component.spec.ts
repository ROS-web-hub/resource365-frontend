import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateSupportCaseComponent } from './create-support-case.component';

describe('CreateSupportCaseComponent', () => {
  let component: CreateSupportCaseComponent;
  let fixture: ComponentFixture<CreateSupportCaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateSupportCaseComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateSupportCaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
