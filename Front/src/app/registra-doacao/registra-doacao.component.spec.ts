import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistraDoacaoComponent } from './registra-doacao.component';

describe('RegistraDoacaoComponent', () => {
  let component: RegistraDoacaoComponent;
  let fixture: ComponentFixture<RegistraDoacaoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RegistraDoacaoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistraDoacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
