import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LiquidarDoacaoComponent } from './liquidar-doacao.component';

describe('LiquidarDoacaoComponent', () => {
  let component: LiquidarDoacaoComponent;
  let fixture: ComponentFixture<LiquidarDoacaoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LiquidarDoacaoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LiquidarDoacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
