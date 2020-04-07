import { Component, OnInit, NgZone } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import {DashboardIntervencaoManual} from './DashboardIntervencaoManual'
import { Web3Service } from './../Web3Service';
import { PessoaJuridicaService } from '../pessoa-juridica.service';
import { BnAlertsService } from 'bndes-ux4';
import { ConstantesService } from '../ConstantesService';
import { Utils } from '../shared/utils';


@Component({
  selector: 'app-dashboard-manual',
  templateUrl: './dashboard-manual.component.html',
  styleUrls: ['./dashboard-manual.component.css']
})
export class DashboardManualComponent implements OnInit {

  listaTransacoes: DashboardIntervencaoManual[] = undefined;

  blockchainNetworkPrefix: string;

  estadoLista: string = "undefined";

  p: number = 1;
  order: string = 'dataHora';
  reverse: boolean = false;

  selectedAccount: any;


  constructor(private pessoaJuridicaService: PessoaJuridicaService, 
    protected bnAlertsService: BnAlertsService, private web3Service: Web3Service,
    private ref: ChangeDetectorRef, private zone: NgZone) { 

      let self = this;
      self.recuperaContaSelecionada();
                  
      setInterval(function () {
        self.recuperaContaSelecionada(), 
        1000}); 


    }

    ngOnInit() {
      setTimeout(() => {
          this.listaTransacoes = [];
          console.log("Zerou lista de doacoes");

          this.registrarExibicaoEventos();
      }, 1500)

      setTimeout(() => {
          this.estadoLista = this.estadoLista === "undefined" ? "vazia" : "cheia"
          this.ref.detectChanges()
      }, 2300)
  }

  registrarExibicaoEventos() {

    this.blockchainNetworkPrefix = this.web3Service.getInfoBlockchainNetwork().blockchainNetworkPrefix;

    this.estadoLista = "vazia"

    console.log("*** Executou o metodo de registrar exibicao eventos");

    let self = this;        
    this.web3Service.registraEventosIntervencaoManual(function (error, event) {

        if (!error) {

            let transacao: DashboardIntervencaoManual;

            console.log("Evento Registrar Doacao");
            console.log(event);

            let txAdm = self.web3Service.converteInteiroParaDecimal(parseInt(event.args.amount)) -
            self.web3Service.converteInteiroParaDecimal(parseInt(event.args.tokenMinted));
                 
            transacao = {
                cnpj: "",
                razaoSocial: "",
                contaBlockchain: event.args.account,
                descricao: event.args.description,
                valor: self.web3Service.converteInteiroParaDecimal(parseInt(event.args.amount)),                
                dataHora: null,
                tipo: event.args.eventType,
                hashID: event.transactionHash,
                uniqueIdentifier: event.transactionHash,
            }

            if (transacao.tipo=="1") transacao.tipo = "Mint Valor Doação";
            else if (transacao.tipo=="2") transacao.tipo = "Burn Valor Doação";
            else if (transacao.tipo=="3") transacao.tipo = "Mint BNDESToken";
            else if (transacao.tipo=="4") transacao.tipo = "Burn BNDESToken";
            
            self.includeIfNotExists(transacao);
            self.recuperaDataHora(self, event, transacao);


        } else {
            console.log("Erro no registro de eventos de intervenção manual");
            console.log(error);
        }
    });

    
}



  async recuperaContaSelecionada() {

      let self = this;
      
      let newSelectedAccount = await this.web3Service.getCurrentAccountSync();
  
      if ( !self.selectedAccount || (newSelectedAccount !== self.selectedAccount && newSelectedAccount)) {
  
        this.selectedAccount = newSelectedAccount;
        console.log("selectedAccount=" + this.selectedAccount);
      }
  
    }   




    includeIfNotExists(transacao) {
      let result = this.listaTransacoes.find(tr => tr.uniqueIdentifier == transacao.uniqueIdentifier);
      if (!result) this.listaTransacoes.push(transacao);        
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
  
  /*
  recuperaInfoDerivadaPorCnpj(self, pj) {
      self.pessoaJuridicaService.recuperaEmpresaPorCnpj(pj.cnpj).subscribe(
          data => {
              pj.razaoSocial = "Erro: Não encontrado";
              if (data && data.dadosCadastrais) {
                  pj.razaoSocial = data.dadosCadastrais.razaoSocial;
                }
                
              // Colocar dentro da zona do Angular para ter a atualização de forma correta
              self.zone.run(() => {
                  self.estadoLista = "cheia"
                  console.log("inseriu transacao Troca");
              });
  
          },
          error => {
              console.log("Erro ao buscar dados da empresa");
              pj.razaoSocial = "";
              pj.contaBlockchain = "";
          });
  
      if (pj.nomeConta=="0") pj.nomeConta="-";
  
  }
  */
  recuperaDataHora(self, event, transacaoPJ) {
      self.web3Service.getBlockTimestamp(event.blockHash,
          function (error, result) {
              if (!error) {
                  transacaoPJ.dataHora = new Date(result.timestamp * 1000);
                  self.ref.detectChanges();
              }
              else {
                  console.log("Erro ao recuperar data e hora do bloco");
                  console.error(error);
              }
      });
  
  }
  

}
