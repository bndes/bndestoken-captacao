import { AgGridModule } from 'ag-grid-angular';

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './/app-routing.module';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { BndesUx4 } from 'bndes-ux4';

import { Ng2GoogleChartsModule } from 'ng2-google-charts';

import { OrderModule, OrderPipe } from 'ngx-order-pipe';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { NgxPaginationModule } from 'ngx-pagination'
import { CurrencyMaskModule } from "ng2-currency-mask";
import { CurrencyMaskConfig, CURRENCY_MASK_CONFIG } from "ng2-currency-mask/src/currency-mask.config";
import { TextMaskModule } from 'angular2-text-mask';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { BlocoAnimadoComponent } from './shared/bloco-animado/bloco-animado.component';

/* BNDES */
import { ConfirmaDoacaoComponent } from './confirma-doacao/confirma-doacao.component';
import { LiberacaoComponent } from './liberacao/liberacao.component';
import { LiquidacaoResgateComponent } from './liquidacao-resgate/liquidacao-resgate.component';

/* Cliente */
import { AssociaContaClienteComponent } from './associa-conta-cliente/associa-conta-cliente.component';
import { RecuperaAcessoClienteComponent } from './recupera-acesso-cliente/recupera-acesso-cliente.component';
import { ResgateComponent } from './resgate/resgate.component';

/* Doador */
import { RegistraDoacaoComponent } from './registra-doacao/registra-doacao.component'
import { AssociaContaDoadorComponent } from './associa-conta-doador/associa-conta-doador.component';
import { RecuperaAcessoDoadorComponent } from './recupera-acesso-doador/recupera-acesso-doador.component';

/* Sociedade */
import { DashboardIdEmpresaComponent } from './dashboard-id-empresa/dashboard-id-empresa.component';
import { DashboardDoacaoComponent } from './dashboard-doacao/dashboard-doacao.component';
import { DashboardTransferenciasComponent } from './dashboard-transferencias/dashboard-transferencias.component';



/* Services */
import { Web3Service } from './Web3Service';
import { EventsService } from './EventsService';
import { PessoaJuridicaService } from './pessoa-juridica.service';
import { FileHandleService } from './file-handle.service';
import { ConstantesService } from './ConstantesService';
import { GoogleMapsService } from './shared/google-maps.service';


import { MetamsgComponent } from './shared/metamsg/metamsg.component';
import { AssinadorComponent } from './shared/assinador/assinador.component';
import { InputValidationComponent } from './shared/input-validation/input-validation.component';

import { Utils } from './shared/utils';
import { CnpjPipe } from './pipes/cnpj.pipe'
import { ContratoPipe } from './pipes/contrato.pipe'
import { HashPipe } from './pipes/hash.pipe'
import { registerLocaleData } from '@angular/common';
import localePT from '@angular/common/locales/pt';

import { FileUploadModule } from 'ng2-file-upload';
import { ValidacaoCadastroComponent } from './validacao-cadastro/validacao-cadastro.component';
import { HabilitaCadastroComponent } from './habilita-cadastro/habilita-cadastro.component';



registerLocaleData(localePT);



const bndesUxConfig = {
  baseUrl: 'coin_spa'
};

export const optionsMaskCurrencyBND: CurrencyMaskConfig = {
  align: "left",
  allowNegative: true,
  decimal: ",",
  precision: 2,
  prefix: "BND ",
  suffix: "",
  thousands: "."
};



@NgModule({
  declarations: [
    AppComponent,
    LiberacaoComponent,
    DashboardIdEmpresaComponent,
    DashboardTransferenciasComponent,
    HomeComponent,
    LiquidacaoResgateComponent,
    AssociaContaClienteComponent,
    RecuperaAcessoClienteComponent,
    ResgateComponent,
    HomeComponent,
    AssociaContaDoadorComponent,
    RecuperaAcessoDoadorComponent,
    BlocoAnimadoComponent,
    MetamsgComponent,
    AssinadorComponent,
    InputValidationComponent,
    CnpjPipe,
    ContratoPipe,
    HashPipe,
    ValidacaoCadastroComponent,
    DashboardDoacaoComponent,
    RegistraDoacaoComponent,
    ConfirmaDoacaoComponent,
    HabilitaCadastroComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    AppRoutingModule,
    HttpClientModule,
    BndesUx4.forRoot(bndesUxConfig),
    [AgGridModule.withComponents([])],
    Ng2GoogleChartsModule,
    Ng2SearchPipeModule,
    OrderModule,
    NgxPaginationModule,
    CurrencyMaskModule,
    TextMaskModule,
    FileUploadModule,
    NgbModule.forRoot()
  ],
  providers: [PessoaJuridicaService, Web3Service, EventsService, ConstantesService, GoogleMapsService, FileHandleService,
    { provide: CURRENCY_MASK_CONFIG, useValue: optionsMaskCurrencyBND }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
