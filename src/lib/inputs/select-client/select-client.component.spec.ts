import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectClientComponent } from './select-client.component';

describe('SelectClientComponent', () => {
  let component: SelectClientComponent;
  let fixture: ComponentFixture<SelectClientComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectClientComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectClientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
