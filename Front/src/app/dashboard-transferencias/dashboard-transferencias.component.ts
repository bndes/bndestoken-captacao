declare var google: any;

import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardTransferencia } from './DashboardTransferencia';
import { Web3Service } from './../Web3Service';
import { PessoaJuridicaService } from '../pessoa-juridica.service';

import { GoogleMapsService, Marcador, MarcadorLinha } from '../shared/google-maps.service';

import { BnAlertsService } from 'bndes-ux4';


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

  listaTransferencias: DashboardTransferencia[] = undefined;
  estadoLista: string = "undefined"

  p: number = 1;
  order: string = 'dataHora';
  reverse: boolean = false;

  marcadores: Marcador[] = []
  marcadoresLinha: MarcadorLinha[] = []
  latitudeInicial: number = -15.7942287;
  longitudeInicial: number = -47.8821658;
  zoom: number = 6;

  isActive: boolean[] = []
  mapaEstaAtivo: boolean = false
  labelMap: string[] = ["A", "B"]

  razaoSocialBNDES: string = "Banco Nacional De Desenvolvimento Econômico E Social";
  selectedAccount: any;  
  blockchainNetworkPrefix: string;  

  constructor(private pessoaJuridicaService: PessoaJuridicaService, 
    protected bnAlertsService: BnAlertsService,
    private web3Service: Web3Service, private ref: ChangeDetectorRef, private zone: NgZone, 
    private router: Router, private mapa: GoogleMapsService) { 

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
    //this.volumeLiquidacaoResgate = 0;

    this.confirmedTotalSupply = 0;

    this.listaTransferencias = [];


    setTimeout(() => {
      this.registrarExibicaoEventos();
      this.getConfirmedTotalSupply();
    }, 1500)

    setTimeout(() => {
      this.estadoLista = this.estadoLista === "undefined" ? "vazia" : "cheia"
      this.ref.detectChanges()
    }, 2300)

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
      },
      function (error) {
        console.log("Erro ao ler getConfirmedTotalSupply ");
        console.log(error);
      });

  }

  registrarExibicaoEventos() {

    let self = this; 
    
    this.blockchainNetworkPrefix = this.web3Service.getInfoBlockchainNetwork().blockchainNetworkPrefix;

    // EVENTOS LIBERAÇÃO
    this.registrarExibicaoEventosLiberacao()

    // EVENTOS SOLICITACAO DE RESGATE
    this.registrarExibicaoEventosSolicitacaoResgate()

    // EVENTOS LIQUIDACAO DE RESGATE
    this.registrarExibicaoEventosLiquidacaoResgate()

    console.log("antes de atualizar - contador liberacao " + self.contadorLiberacao);
    console.log("antes de atualizar - contador liquidacao resgate " + self.contadorLiquidacaoResgate);
    console.log("antes de atualizar - contador solicitacao resgate " + self.contadorSolicitacaoResgate);

    console.log("antes de atualizar - volume liberacao " + self.volumeLiberacao);
    //console.log("antes de atualizar - volume transferencia " + self.volumeLiquidacaoResgate);
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
              self.includeIfNotExists(liberacao);              
              self.estadoLista = "cheia"
            });

            self.contadorLiberacao++;
            self.volumeLiberacao += self.web3Service.converteInteiroParaDecimal(parseInt(eventoLiberacao.args.amount));

            console.log("inseriu liberacao " + liberacao.hashID);
            console.log("contador liberacao " + self.contadorLiberacao);
            console.log("volume liberacao " + self.volumeLiberacao);

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

              self.isActive = new Array(self.listaTransferencias.length).fill(false)

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

  registrarExibicaoEventosLiquidacaoResgate() {
    let self = this

    this.web3Service.registraEventosLiquidacaoResgate(function (error, event) {
      if (!error) {
        let liberacao: DashboardTransferencia;
        let eventoLiquidacaoResgate = event
        console.log("contador liberacao " + self.contadorLiquidacaoResgate);
        //console.log("volume liberacao " + self.volumeLiquidacaoResgate);    
        self.contadorLiquidacaoResgate++;
        //self.volumeLiquidacaoResgate += self.web3Service.converteInteiroParaDecimal(parseInt(eventoLiquidacaoResgate.args.amount));            
/** * 
        self.pessoaJuridicaService.recuperaEmpresaPorCnpj(eventoLiquidacaoResgate.args.cnpj).subscribe(
          data => {

            liberacao = {
              deRazaoSocial: self.razaoSocialBNDES,
              deCnpj: "BNDES",
              deConta: "0",
              paraRazaoSocial: "Erro: Não encontrado",
              paraCnpj: eventoLiquidacaoResgate.args.cnpj,
              paraConta: eventoLiquidacaoResgate.args.idFinancialSupportAgreement,
              valor: self.web3Service.converteInteiroParaDecimal(parseInt(eventoLiquidacaoResgate.args.amount)),
              tipo: "Liberação",
              hashID: eventoLiquidacaoResgate.transactionHash,
              dataHora: null
            };

            if (data && data.dadosCadastrais) {
              liberacao.paraRazaoSocial = data.dadosCadastrais.razaoSocial;
            }

            // Colocar dentro da zona do Angular para ter a atualização de forma correta
            self.zone.run(() => {
              self.includeIfNotExists(liberacao);              
              self.estadoLista = "cheia"
            });

            self.contadorLiberacao++;
            self.volumeLiberacao += self.web3Service.converteInteiroParaDecimal(parseInt(eventoLiquidacaoResgate.args.amount));

            console.log("inseriu liberacao " + liberacao.hashID);
            console.log("contador liberacao " + self.contadorLiberacao);
            console.log("volume liberacao " + self.volumeLiberacao);

            self.web3Service.getBlockTimestamp(eventoLiquidacaoResgate.blockHash,
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

              self.isActive = new Array(self.listaTransferencias.length).fill(false)

              console.log("Chegou no final da função");
          },
          error => {
            console.log("Erro ao recuperar empresa por CNPJ do evento liberação")
          }
        )
/**/
      }
      else {
        console.log("Erro no registro de eventos de liquidacao de resgate");
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
              self.includeIfNotExists(resgate); 
              self.estadoLista = "cheia"
            });
 
            self.contadorSolicitacaoResgate++;
            self.volumeResgate += self.web3Service.converteInteiroParaDecimal(parseInt(eventoResgate.args.amount));

            console.log("inseriu resg " + resgate.hashID);
            console.log("contador resg " + self.contadorSolicitacaoResgate);
            console.log("volume resg " + self.volumeResgate);

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

              self.isActive = new Array(self.listaTransferencias.length).fill(false)
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
    if (!result) this.listaTransferencias.push(transacaoPJ);        
 } 
 
 
} 



/* Necessario rever
  selecionaTransacao(position: number, transferencia: DashboardTransferencia) {

    this.marcadores = []
    this.marcadoresLinha = []

    if (this.isActive[position]) {
      this.isActive[position] = false
      this.mapaEstaAtivo = false
    } else {
      scrollTo(0, 100000);

      this.isActive = new Array(this.listaTransferencias.length).fill(false)
      this.isActive[position] = true
      this.mapaEstaAtivo = true

      let cnpjOrigem = transferencia.deCnpj
      let cnpjDestino = transferencia.paraCnpj

      this.exibirTransferenciaNoMapa([transferencia.deCnpj, transferencia.paraCnpj])
    }

  }

  
  exibirTransferenciaNoMapa(listaCnpj: string[]) {

    let self = this

    for (var i = 0; i < listaCnpj.length; i++) {

      this.pessoaJuridicaService.recuperaEmpresaPorCnpj(listaCnpj[i]).subscribe(
        data => {
          console.log("EMPRESA RECUPERADA PELO CNPJ")

          let cidade = data ? data.dadosCadastrais.cidade : "Rio de janeiro"

          this.mapa.converteCidadeEmCoordenadas(cidade, (result) => {

            this.marcadores.push({
              lat: result[0],
              lng: result[1],
              draggable: true,
              info: data ? data.dadosCadastrais.razaoSocial : "Banco Nacional de Desenvolvimento Econômico e Social"
            })

          })

          setTimeout(() => {
            this.latitudeInicial = this.marcadores[0].lat
            this.longitudeInicial = this.marcadores[0].lng

            this.marcadoresLinha.push({
              latA: this.marcadores[0].lat,
              lngA: this.marcadores[0].lng,
              latB: this.marcadores[1].lat,
              lngB: this.marcadores[1].lng
            })

            this.ref.detectChanges()
          }, 500)

        },
        error => {
          console.log("Erro ao encontrar a empresa")
        }
      )
    }

  }
*/