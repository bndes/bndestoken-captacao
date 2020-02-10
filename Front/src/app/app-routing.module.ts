import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';

/* BNDES */
import { LiberacaoComponent } from './liberacao/liberacao.component';
import { LiquidacaoResgateComponent } from './liquidacao-resgate/liquidacao-resgate.component';
import { ValidacaoCadastroComponent } from './validacao-cadastro/validacao-cadastro.component';

/* Cliente */
import { AssociaContaClienteComponent } from './associa-conta-cliente/associa-conta-cliente.component';
import { ConfirmaDoacaoComponent } from './confirma-doacao/confirma-doacao.component';
import { RecuperaAcessoClienteComponent } from './recupera-acesso-cliente/recupera-acesso-cliente.component';
import { ResgateComponent } from './resgate/resgate.component';


/* Doador */
import { AssociaContaDoadorComponent } from './associa-conta-doador/associa-conta-doador.component';
import { RegistraDoacaoComponent } from './registra-doacao/registra-doacao.component';
import { RecuperaAcessoDoadorComponent } from './recupera-acesso-doador/recupera-acesso-doador.component';

/* Sociedade */
import { DashboardIdEmpresaComponent } from './dashboard-id-empresa/dashboard-id-empresa.component';
import { DashboardDoacaoComponent } from './dashboard-doacao/dashboard-doacao.component';
import { DashboardTransferenciasComponent } from './dashboard-transferencias/dashboard-transferencias.component';

const routes: Routes = [
  { path: 'bndes', component: HomeComponent },
  { path: 'cliente', component: HomeComponent },
  { path: 'doador', component: HomeComponent },
  { path: 'sociedade', component: HomeComponent },
  { path: 'bndes/confirma-doacao', component:ConfirmaDoacaoComponent },
  { path: 'bndes/liberacao', component: LiberacaoComponent },
  { path: 'bndes/val-cadastro', component: ValidacaoCadastroComponent},
  { path: 'bndes/liquidar/:solicitacaoResgateId', component: LiquidacaoResgateComponent},
  { path: 'cliente/associa-conta-cliente', component: AssociaContaClienteComponent },
  { path: 'cliente/recupera-acesso-cliente', component: RecuperaAcessoClienteComponent},
  { path: 'doador/associa-conta-doador', component: AssociaContaDoadorComponent},
  { path: 'doador/registra-doacao', component: RegistraDoacaoComponent},  
  { path: 'cliente/resgate', component: ResgateComponent },
  { path: 'doador/recupera-acesso-doador', component: RecuperaAcessoDoadorComponent},
  { path: 'sociedade/dash-empresas', component: DashboardIdEmpresaComponent },
  { path: 'sociedade/dash-doacao', component: DashboardDoacaoComponent },
  { path: 'sociedade/dash-transf', component: DashboardTransferenciasComponent },
  { path: '', redirectTo: '/sociedade', pathMatch: 'full' },
];


@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}
