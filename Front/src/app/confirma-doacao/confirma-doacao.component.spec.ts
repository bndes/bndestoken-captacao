import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmaDoacaoComponent } from './confirma-doacao.component';

describe('ConfirmaDoacaoComponent', () => {
  let component: ConfirmaDoacaoComponent;
  let fixture: ComponentFixture<ConfirmaDoacaoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfirmaDoacaoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmaDoacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
