import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InputTimeComponent } from './input-time.component';

describe('InputDateComponent', () => {
  let component: InputTimeComponent;
  let fixture: ComponentFixture<InputTimeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InputTimeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
