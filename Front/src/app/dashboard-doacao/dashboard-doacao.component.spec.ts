import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardDoacaoComponent } from './dashboard-doacao.component';

describe('DashboardDoacaoComponent', () => {
  let component: DashboardDoacaoComponent;
  let fixture: ComponentFixture<DashboardDoacaoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DashboardDoacaoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardDoacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
