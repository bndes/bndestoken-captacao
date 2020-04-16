import { Component, OnInit, NgZone } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';

import { Web3Service } from './../Web3Service';
import { PessoaJuridicaService } from '../pessoa-juridica.service';
import { BnAlertsService } from 'bndes-ux4';
import { Router } from '@angular/router';


import { DashboardTransferencia } from './DashboardTransferencia';

@Component({
  selector: 'app-dashboard-transferencias',
  templateUrl: './dashboard-transferencias.component.html',
  styleUrls: ['./dashboard-transferencias.component.css']
})
export class DashboardTransferenciasComponent implements OnInit {

  public contadorLiberacao: number;
  public contadorSolicitacaoResgate: number;
  public contadorLiquidacaoResgate: number;

  public volumeLiberacao: number;
  public volumeResgate: number;
  //public volumeLiquidacaoResgate: number;
  
  public confirmedTotalSupply : number;
  public saldoBNDESToken: number;

  public tokensEmitidosDoacao: number;
  public tokensEmCirculacao: number;
  public saldoAjustesExtraordinarios: number;

  listaTransferencias: DashboardTransferencia[] = undefined;
  estadoLista: string = "undefined"

  p: number = 1;
  order: string = 'valor';
  reverse: boolean = false;

  razaoSocialBNDES: string = "Banco Nacional De Desenvolvimento Econômico E Social";
  selectedAccount: any;  
  blockchainNetworkPrefix: string;  

  constructor(private pessoaJuridicaService: PessoaJuridicaService, 
    private router: Router,
    protected bnAlertsService: BnAlertsService, private web3Service: Web3Service,
    private ref: ChangeDetectorRef, private zone: NgZone) {

      let self = this;
      self.recuperaContaSelecionada();
      
      setInterval(function () {
        self.recuperaContaSelecionada(), 
        1000}); 

    }

  ngOnInit() {

    this.contadorLiberacao = 0;
    this.contadorSolicitacaoResgate = 0;
    this.contadorLiquidacaoResgate = 0;

    this.volumeLiberacao = 0;
    this.volumeResgate = 0;

    this.confirmedTotalSupply = 0;
    this.tokensEmitidosDoacao = 0;
    this.tokensEmCirculacao = 0;
    this.saldoAjustesExtraordinarios = 0;

    this.listaTransferencias = [];


    setTimeout(() => {
      this.registrarExibicaoEventos();
    }, 1500)

    setTimeout(() => {
      this.estadoLista = this.estadoLista === "undefined" ? "vazia" : "cheia"
      this.ref.detectChanges()
    }, 2300)

    setInterval(() => {
      this.getConfirmedTotalSupply();
      this.recuperaSaldoBNDESToken();
    }, 1000)

  }

  async recuperaContaSelecionada() {

    let self = this;
    
    let newSelectedAccount = await this.web3Service.getCurrentAccountSync();

    if ( !self.selectedAccount || (newSelectedAccount !== self.selectedAccount && newSelectedAccount)) {

      this.selectedAccount = newSelectedAccount;
      console.log("selectedAccount=" + this.selectedAccount);
    }

  }    


  routeToLiquidacaoResgate(solicitacaoResgateId) {
    this.router.navigate(['bndes/liquidar/' + solicitacaoResgateId]);

  }  

  getConfirmedTotalSupply() {
    let self = this;

    this.web3Service.getConfirmedTotalSupply(

      function (result) {
        console.log("getConfirmedTotalSupply eh " + result);
        self.confirmedTotalSupply = result;
        this.calculaSaldos();
        self.ref.detectChanges();
      },
      function (error) {
        console.log("Erro ao ler getConfirmedTotalSupply ");
        console.log(error);
      });

  }

  calculaSaldos() {
    this.tokensEmitidosDoacao = this.volumeResgate+this.confirmedTotalSupply;
    this.tokensEmCirculacao = this.confirmedTotalSupply - this.saldoBNDESToken;
    this.saldoAjustesExtraordinarios = (this.confirmedTotalSupply + this.volumeResgate) - (this.saldoBNDESToken + this.volumeLiberacao);
  }

  async recuperaSaldoBNDESToken() {

    let self = this;
  
    this.web3Service.getDisbursementAddressBalance(
      function (result) {
        console.log("Saldo eh " + result);
        self.saldoBNDESToken = result;
        this.calculaSaldos();
        self.ref.detectChanges();
      },
      function (error) {
        console.log("Erro ao ler o saldo do BNDES ");
        console.log(error);
        self.saldoBNDESToken = 0;
      });
  }  

  registrarExibicaoEventos() {

    let self = this; 
    
    this.blockchainNetworkPrefix = this.web3Service.getInfoBlockchainNetwork().blockchainNetworkPrefix;

    // EVENTOS LIBERAÇÃO
    this.registrarExibicaoEventosLiberacao()

    // EVENTOS SOLICITACAO DE RESGATE
    this.registrarExibicaoEventosSolicitacaoResgate()

    console.log("antes de atualizar - contador liberacao " + self.contadorLiberacao);
    console.log("antes de atualizar - contador liquidacao resgate " + self.contadorLiquidacaoResgate);
    console.log("antes de atualizar - contador solicitacao resgate " + self.contadorSolicitacaoResgate);

    console.log("antes de atualizar - volume liberacao " + self.volumeLiberacao);
    console.log("antes de atualizar - volume resgate " + self.volumeResgate);

  }

  setOrder(value: string) {
    if (this.order === value) {
      this.reverse = !this.reverse;
    }
    this.order = value;
    this.ref.detectChanges();
  }

  customComparator(itemA, itemB) {
    return itemB - itemA;
  }

  
  registrarExibicaoEventosLiberacao() {
    let self = this

    this.web3Service.registraEventosLiberacao(function (error, event) {
      if (!error) {
        let liberacao: DashboardTransferencia;
        let eventoLiberacao = event

        self.pessoaJuridicaService.recuperaEmpresaPorCnpj(eventoLiberacao.args.cnpj).subscribe(
          data => {

            liberacao = {
              deRazaoSocial: self.razaoSocialBNDES,
              deCnpj: "BNDES",
              deConta: "0",
              paraRazaoSocial: "Erro: Não encontrado",
              paraCnpj: eventoLiberacao.args.cnpj,
              paraConta: eventoLiberacao.args.idFinancialSupportAgreement,
              valor: self.web3Service.converteInteiroParaDecimal(parseInt(eventoLiberacao.args.amount)),
              tipo: "Liberação",
              hashID: eventoLiberacao.transactionHash,
              dataHora: null
            };

            if (data && data.dadosCadastrais) {
              liberacao.paraRazaoSocial = data.dadosCadastrais.razaoSocial;
            }

            // Colocar dentro da zona do Angular para ter a atualização de forma correta
            self.zone.run(() => {
              self.estadoLista = "cheia";
              let incluiu = self.includeIfNotExists(liberacao);              
              if (incluiu) {

                self.contadorLiberacao++;
                self.volumeLiberacao += self.web3Service.converteInteiroParaDecimal(parseInt(eventoLiberacao.args.amount));

                console.log("inseriu liberacao " + liberacao.hashID);
                console.log("contador liberacao " + self.contadorLiberacao);
                console.log("volume liberacao " + self.volumeLiberacao);    
              }
            });


            self.web3Service.getBlockTimestamp(eventoLiberacao.blockHash,
              function (error, result) {
                if (!error) {
                  liberacao.dataHora = new Date(result.timestamp * 1000);
                  console.log("data hora:" + liberacao.dataHora);
                  self.ref.detectChanges();
                  //TODO: adicionar tratamento para o grafico de barras
                }
                else {
                  console.log("Erro ao recuperar data e hora do bloco");
                  console.error(error);
                }
              });


              console.log("Chegou no final da função");
          },
          error => {
            console.log("Erro ao recuperar empresa por CNPJ do evento liberação")
          }
        )

      }
      else {
        console.log("Erro no registro de eventos de liberacao");
        console.log(error);
      }

    });
  }


  registrarExibicaoEventosSolicitacaoResgate() {
    let self = this

    this.web3Service.registraEventosResgate(function (error, event) {
      if (!error) {
        let resgate: DashboardTransferencia;
        let eventoResgate = event

        self.pessoaJuridicaService.recuperaEmpresaPorCnpj(eventoResgate.args.cnpj).subscribe(
          data => {

            resgate = {
              deRazaoSocial: "Erro: Não encontrado",
              deCnpj: eventoResgate.args.cnpj,
              deConta: eventoResgate.args.idFinancialSupportAgreement,
              paraRazaoSocial: self.razaoSocialBNDES,
              paraCnpj: "BNDES",
              paraConta: "0",
              valor: self.web3Service.converteInteiroParaDecimal(parseInt(eventoResgate.args.amount)),
              tipo: "Solicitação de Resgate",
              hashID: eventoResgate.transactionHash,
              dataHora: null
            };

            if (data && data.dadosCadastrais) {
              resgate.deRazaoSocial = data.dadosCadastrais.razaoSocial;
            }

            // Colocar dentro da zona do Angular para ter a atualização de forma correta
            self.zone.run(() => {
              self.estadoLista = "cheia"

              let incluiu = self.includeIfNotExists(resgate); 
              if (incluiu) {

                self.contadorSolicitacaoResgate++;
                self.volumeResgate += self.web3Service.converteInteiroParaDecimal(parseInt(eventoResgate.args.amount));
    
                console.log("inseriu resg " + resgate.hashID);
                console.log("contador resg " + self.contadorSolicitacaoResgate);
                console.log("volume resg " + self.volumeResgate);
    
              }
            });
 

            self.web3Service.getBlockTimestamp(eventoResgate.blockHash,
              function (error, result) {
                if (!error) {
                  resgate.dataHora = new Date(result.timestamp * 1000);
                  self.ref.detectChanges();
                }
                else {
                  console.log("Erro ao recuperar data e hora do bloco");
                  console.error(error);
                }
              });
          })
      }
      else {
        console.log("Erro no registro de eventos de resgate");
        console.log(error);
      }

    });
  }


  includeIfNotExists(transacaoPJ) {
    let result = this.listaTransferencias.find(tr => tr.hashID == transacaoPJ.hashID);
    if (!result) {
        this.listaTransferencias.push(transacaoPJ);
        return true;
      }
    return (false);        
 } 
 



 
} 