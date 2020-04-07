import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardManualComponent } from './dashboard-manual.component';

describe('DashboardManualComponent', () => {
  let component: DashboardManualComponent;
  let fixture: ComponentFixture<DashboardManualComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DashboardManualComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardManualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
