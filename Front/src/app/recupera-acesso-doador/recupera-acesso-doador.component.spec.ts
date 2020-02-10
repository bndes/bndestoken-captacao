import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RecuperaAcessoDoadorComponent } from './recupera-acesso-doador.component';

describe('RecuperaAcessoForncedorComponent', () => {
  let component: RecuperaAcessoDoadorComponent;
  let fixture: ComponentFixture<RecuperaAcessoDoadorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RecuperaAcessoDoadorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecuperaAcessoDoadorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
