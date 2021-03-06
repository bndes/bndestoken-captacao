import { Component, OnInit, NgZone } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';

import { Web3Service } from './../Web3Service';
import { PessoaJuridicaService } from '../pessoa-juridica.service';
import { BnAlertsService } from 'bndes-ux4';
import { ConstantesService } from '../ConstantesService';
import { Utils } from '../shared/utils';
import {FileHandleService} from "../file-handle.service";
import {DashboardDoacao} from "./DashboardDoacao";

@Component({
  selector: 'app-dashboard-doacao',
  templateUrl: './dashboard-doacao.component.html',
  styleUrls: ['./dashboard-doacao.component.css']
})
export class DashboardDoacaoComponent implements OnInit {

  listaDoacoes: DashboardDoacao[] = undefined;

  blockchainNetworkPrefix: string;

  estadoLista: string = "undefined";

  p: number = 1;
  order: string = 'dataHora';
  reverse: boolean = false;

  selectedAccount: any;

  constructor(private pessoaJuridicaService: PessoaJuridicaService, 
    private fileHandleService: FileHandleService,
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
          this.listaDoacoes = [];
          console.log("Zerou lista de doacoes");

          this.registrarExibicaoEventos();
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
    
    registrarExibicaoEventos() {

      this.blockchainNetworkPrefix = this.web3Service.getInfoBlockchainNetwork().blockchainNetworkPrefix;

//      this.estadoLista = "vazia"

      console.log("*** Executou o metodo de registrar exibicao eventos");

      this.registraEventosRegistroDoacao();

      this.registraEventosRecebimentoDoacao();
      
  }

  registraEventosRegistroDoacao() {

    console.log("*** Executou o metodo de registrar eventos REGISTRAR DOACAO");

    let self = this;        
    this.web3Service.registraEventosRegistrarDoacao(function (error, event) {

        if (!error) {

            let transacao: DashboardDoacao;

            console.log("Evento Registrar Doacao");
            console.log(event);

            let txAdm = self.web3Service.converteInteiroParaDecimal(parseInt(event.args.amount)) -
            self.web3Service.converteInteiroParaDecimal(parseInt(event.args.tokenMinted));
                 
            transacao = {
                cnpj: event.args.cnpj,
                razaoSocial: "",
                valor: self.web3Service.converteInteiroParaDecimal(parseInt(event.args.amount)),                
                tokenMinted: self.web3Service.converteInteiroParaDecimal(parseInt(event.args.tokenMinted)),                
                txAdm: txAdm,
                dataHora: null,
                tipo: "Intenção Registrada",
                hashID: event.transactionHash,
                uniqueIdentifier: event.transactionHash,
                hashComprovante: "",
                filePathAndName: ""
            }

            self.includeIfNotExists(transacao);
            self.recuperaInfoDerivadaPorCnpj(self, transacao);
            self.recuperaDataHora(self, event, transacao);


        } else {
            console.log("Erro no registro de eventos de cadastro");
            console.log(error);
        }
    });
  }


  registraEventosRecebimentoDoacao() {

    console.log("*** Executou o metodo de registrar eventos RECEBER DOACAO");

    let self = this;        
    this.web3Service.registraEventosRecebimentoDoacao(function (error, event) {

        if (!error) {

            let transacao: DashboardDoacao;

            console.log("Evento Receber Doacao");
            console.log(event);

            let txAdm = self.web3Service.converteInteiroParaDecimal(parseInt(event.args.amount)) -
                    self.web3Service.converteInteiroParaDecimal(parseInt(event.args.tokenMinted));
                 
            transacao = {
                cnpj: event.args.cnpj,
                razaoSocial: "",
                valor      : self.web3Service.converteInteiroParaDecimal(parseInt(event.args.amount)),
                tokenMinted: self.web3Service.converteInteiroParaDecimal(parseInt(event.args.tokenMinted)),
                txAdm: txAdm,
                dataHora: null,
                tipo: "Doação Confirmada",
                hashID: event.transactionHash,
                uniqueIdentifier: event.transactionHash,
                hashComprovante: event.args.docHash,
                filePathAndName: ""                
            }

            self.includeIfNotExists(transacao);
            self.recuperaInfoDerivadaPorCnpj(self, transacao);
            self.recuperaDataHora(self, event, transacao);
            self.recuperaFilePathAndName(self,transacao);

        } else {
            console.log("Erro no registro de eventos de cadastro");
            console.log(error);
        }
    });
  }




 includeIfNotExists(transacao) {
    let result = this.listaDoacoes.find(tr => tr.uniqueIdentifier == transacao.uniqueIdentifier);
    if (!result) this.listaDoacoes.push(transacao);        
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

recuperaFilePathAndName(self,transacao) {

    if ( transacao == undefined ||  (transacao.cnpj == undefined || transacao.cnpj == "" ) || ( transacao.hashComprovante == undefined || transacao.hashComprovante == "") ) {
        console.log("Transacao incompleta no recuperaFilePathAndName do dashboard-doacao");
        return;
    }

    self.fileHandleService.buscaFileInfo(transacao.cnpj, "0", "0", transacao.hashComprovante, "comp_doacao").subscribe(
        result => {
          if (result && result.pathAndName) {
            transacao.filePathAndName=ConstantesService.serverUrlRoot+result.pathAndName;
          }
          else {
            let texto = "Não foi possível encontrar informações associadas ao arquivo.";
            console.log(texto);
            Utils.criarAlertaAcaoUsuario( self.bnAlertsService, texto);       
          }                  
        }, 
        error => {
          let texto = "Erro ao buscar dados de arquivo";
          console.log(texto);
          console.log("cnpj=" + transacao.cnpj);
          console.log("hashComprovante=" + transacao.hashComprovante);
//              Utils.criarAlertaErro( self.bnAlertsService, texto,error);
        }) //fecha busca fileInfo

}


}
