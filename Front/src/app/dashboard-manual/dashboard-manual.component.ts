import { Component, OnInit, NgZone } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import {DashboardIntervencaoManual} from './DashboardIntervencaoManual'
import { Web3Service } from './../Web3Service';
import { BnAlertsService } from 'bndes-ux4';


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


  constructor(protected bnAlertsService: BnAlertsService, private web3Service: Web3Service,
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

          console.log("Zerou lista de transacoes");

          this.registrarExibicaoEventos();
      }, 1500)

      setTimeout(() => {
          this.estadoLista = this.estadoLista === "undefined" ? "vazia" : "cheia"
          this.verificaExisteEventos();
          this.ref.detectChanges()
      }, 2300)
  }

  verificaExisteEventos() {
      if (this.listaTransacoes.length >0)  {
                this.estadoLista = "cheia";
            }
  }

  registrarExibicaoEventos() {

    this.blockchainNetworkPrefix = this.web3Service.getInfoBlockchainNetwork().blockchainNetworkPrefix;
    
    console.log("*** Executou o metodo de registrar exibicao eventos");


    let self = this;    
    this.web3Service.registraEventosIntervencaoManualMintBurn(function (error, event) {

        if (!error) {

            let transacao: DashboardIntervencaoManual;

            console.log("Evento Manual Mint e Burn");
            console.log(event);
                 
            transacao = {
                contaBlockchain: event.args.account,
                descricao: event.args.description,
                valor: self.web3Service.converteInteiroParaDecimal(parseInt(event.args.amount)) + "", 
                percentual: "",               
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


    this.web3Service.registraEventosIntervencaoManualFee(function (error, event) {

        if (!error) {

            let transacao: DashboardIntervencaoManual;

            console.log("Evento Manual Fee");
            console.log(event);
                 
            transacao = {
                contaBlockchain: "N/A",
                descricao: event.args.description,
                valor:  "",
                percentual: (self.web3Service.converteInteiroParaDecimal(parseInt(event.args.percent))*100) + "%",               
                dataHora: null,
                tipo: "Mudança do BNDESFee",
                hashID: event.transactionHash,
                uniqueIdentifier: event.transactionHash,
            }            
            self.includeIfNotExists(transacao);
            self.recuperaDataHora(self, event, transacao);

        } else {
            console.log("Erro no registro de eventos de intervenção manual");
            console.log(error);
        }
    });

    

    this.web3Service.registraEventosIntervencaoManualRoleOrAddress(function (error, event) {

        if (!error) {

            let transacao: DashboardIntervencaoManual;

            console.log("Evento Manual Role or Address");
            console.log(event);
                 
            transacao = {
                contaBlockchain: event.args.account,
                descricao: "-",
                valor: "",       
                percentual: "",         
                dataHora: null,
                tipo: event.args.eventType,
                hashID: event.transactionHash,
                uniqueIdentifier: event.transactionHash,
            }

            if (transacao.tipo=="0") transacao.descricao = "Configuração Endereço BNDESToken";
            else if (transacao.tipo=="1") transacao.descricao = "Configuração Endereço Conta de Liberação";
            else if (transacao.tipo=="2") transacao.descricao = "Configuração Endereço Papel Validador de Cadastro";
            else if (transacao.tipo=="3") transacao.descricao = "Configuração Endereço Papel Confirmador de Doações";
            else if (transacao.tipo=="4") transacao.descricao = "Configuração Endereço Papel Liberador";
            else if (transacao.tipo=="5") transacao.descricao = "Configuração Endereço Papel Liquidante";
            

            transacao.tipo = "Configuração de Endereço ou Papel"

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
