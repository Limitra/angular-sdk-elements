import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PageInfoComponent } from './page-info.component';

describe('PageInfoComponent', () => {
  let component: PageInfoComponent;
  let fixture: ComponentFixture<PageInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PageInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PageInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
