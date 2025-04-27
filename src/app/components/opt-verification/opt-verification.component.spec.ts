import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptVerificationComponent } from './opt-verification.component';

describe('OptVerificationComponent', () => {
  let component: OptVerificationComponent;
  let fixture: ComponentFixture<OptVerificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OptVerificationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OptVerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
