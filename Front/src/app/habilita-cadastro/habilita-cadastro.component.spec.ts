import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HabilitaCadastroComponent } from './habilita-cadastro.component';

describe('HabilitaCadastroComponent', () => {
  let component: HabilitaCadastroComponent;
  let fixture: ComponentFixture<HabilitaCadastroComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HabilitaCadastroComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HabilitaCadastroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
