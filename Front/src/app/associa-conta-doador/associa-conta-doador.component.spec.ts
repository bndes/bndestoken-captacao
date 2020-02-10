import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssociaContaDoadorComponent } from './associa-conta-doador.component';

describe('AssociaContaDoadorComponent', () => {
  let component: AssociaContaDoadorComponent;
  let fixture: ComponentFixture<AssociaContaDoadorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AssociaContaDoadorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssociaContaDoadorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
