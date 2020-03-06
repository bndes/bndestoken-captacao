import { Component, OnInit, NgZone } from '@angular/core'
import { ChangeDetectorRef } from '@angular/core'
import { Router, ActivatedRoute, ParamMap } from '@angular/router';

import { Web3Service } from './../Web3Service'
import { PessoaJuridicaService } from '../pessoa-juridica.service';
import {FileHandleService} from "../file-handle.service";

import { BnAlertsService } from 'bndes-ux4'

import { LiquidacaoResgate } from './liquidacao-resgate';
import { ConstantesService } from '../ConstantesService';
import { Utils } from '../shared/utils';

@Component({
  selector: 'app-liquidacao-resgate',
  templateUrl: './liquidacao-resgate.component.html',
  styleUrls: ['./liquidacao-resgate.component.css']
})
export class LiquidacaoResgateComponent implements OnInit {

  liquidacaoResgate: LiquidacaoResgate;

  selectedAccount: any;

  solicitacaoResgateId: string;
  maskCnpj: any;  
  blockchainNetworkPrefix: string;  


  constructor(private pessoaJuridicaService: PessoaJuridicaService,
    private fileHandleService: FileHandleService,    
    private bnAlertsService: BnAlertsService,
    private web3Service: Web3Service,
    private ref: ChangeDetectorRef,
    private zone: NgZone, private router: Router, private route: ActivatedRoute ) { }

  ngOnInit() {

    this.maskCnpj = Utils.getMaskCnpj();      

    let self = this;
    setInterval(function () {
      self.recuperaContaSelecionada(), 1000});  
      
    this.liquidacaoResgate = new LiquidacaoResgate();
    this.liquidacaoResgate.hashResgate = this.route.snapshot.paramMap.get('solicitacaoResgateId');

    console.log(this.liquidacaoResgate.hashResgate);

    self.recuperaStatusResgate();
    self.recuperaStatusLiquidacaoResgate();    

  }



  async recuperaContaSelecionada() {
    
    let self = this;
    
    let newSelectedAccount = await this.web3Service.getCurrentAccountSync();

    if ( !self.selectedAccount || (newSelectedAccount !== self.selectedAccount && newSelectedAccount)) {

      this.selectedAccount = newSelectedAccount;
      console.log("selectedAccount=" + this.selectedAccount);
      this.atualizaIsResponsibleForSettlement()
    }
  }  


  recuperaStatusResgate() {

    let self = this;

    this.web3Service.registraEventosResgate(function (error, event) {
      if (!error) {
        let eventoResgate = event;

        if (self.liquidacaoResgate.hashResgate == eventoResgate.transactionHash) {

          self.liquidacaoResgate.cnpj = eventoResgate.args.cnpj;
          self.liquidacaoResgate.contratoFinanceiro = eventoResgate.args.idFinancialSupportAgreement;
          self.liquidacaoResgate.valorResgate = self.web3Service.converteInteiroParaDecimal(parseInt(eventoResgate.args.amount)),
      
          self.web3Service.getBlockTimestamp(eventoResgate.blockHash,
            function (error, result) {
              if (!error) {
                self.liquidacaoResgate.dataHoraResgate = new Date(result.timestamp * 1000);
               }
              else {
                console.log("Erro ao recuperar data e hora do bloco");
                console.error(error);
              }
            });

          self.pessoaJuridicaService.recuperaEmpresaPorCnpj(eventoResgate.args.cnpj).subscribe(
            data => {
              
              self.liquidacaoResgate.razaoSocial = "Erro: Não encontrado";
              if (data && data.dadosCadastrais) {
                self.liquidacaoResgate.razaoSocial = data.dadosCadastrais.razaoSocial;
              }              
            })          
        }

      }
      else {
        console.log("Erro no registro de eventos de resgate");
        console.log(error);
      }

    });
  }


  recuperaStatusLiquidacaoResgate() {
    let self = this;
    this.blockchainNetworkPrefix = this.web3Service.getInfoBlockchainNetwork().blockchainNetworkPrefix;    

    this.web3Service.registraEventosLiquidacaoResgate(function (error, event) {

      if (!error) {   

          console.log("Encontrou algum dado ao recuperar status liquidacao resgate")
          console.log(event)
          console.log(self.liquidacaoResgate.hashResgate)          

          if (self.liquidacaoResgate.hashResgate == event.args.redemptionTransactionHash) { //resgate jah foi liquidado

            self.liquidacaoResgate.hashID       = event.transactionHash;
            self.liquidacaoResgate.hashComprovacao = event.args.receiptHash;
            self.liquidacaoResgate.isLiquidado = true;

            self.web3Service.getBlockTimestamp(event.blockHash,
              function (error, result) {
                if (!error) {
                  self.liquidacaoResgate.dataHoraLiquidacao = new Date(result.timestamp * 1000);
                 }
                else {
                  console.log("Erro ao recuperar data e hora do bloco");
                  console.error(error);
                }
              });

              self.recuperaFilePathAndName(self,self.liquidacaoResgate);

          }

      } else {
        console.log("Erro no registro de eventos de liquidacao do resgate");
        console.log(error);

      }
    })
  }

  async atualizaIsResponsibleForSettlement() {

    this.liquidacaoResgate.isSelectedAccountResponsibleForSettlement = false;    
    let bRS = await this.web3Service.isResponsibleForSettlementSync(this.selectedAccount);
    if(bRS) {
      this.liquidacaoResgate.isSelectedAccountResponsibleForSettlement = true;
    }
  }

  recuperaFilePathAndName(self,transacao) {

    self.fileHandleService.buscaFileInfo(transacao.cnpj, transacao.contratoFinanceiro, "0", transacao.hashComprovacao, "comp_liq").subscribe(
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
          console.log("contratoFinanceiro=" + transacao.contratoFinanceiro);          
          console.log("hashComprovante=" + transacao.hashComprovacao);
//              Utils.criarAlertaErro( self.bnAlertsService, texto,error);
        }) //fecha busca fileInfo

}


  async liquidar() {
    
    console.log("Liquidando o resgate..");
    console.log("hashResgate" + this.liquidacaoResgate.hashResgate);
    console.log("hashComprovacao" + this.liquidacaoResgate.hashComprovacao);    


    let bRS = await this.web3Service.isResponsibleForSettlementSync(this.selectedAccount);
    if (!bRS) {
      let s = "Conta não é do responsável pela liquidação";
      this.bnAlertsService.criarAlerta("error", "Erro", s, 5);
      return;
    }

    if (this.liquidacaoResgate.hashComprovacao==undefined || this.liquidacaoResgate.hashComprovacao==null) {
      let s = "O hash da comprovação é um Campo Obrigatório";
      this.bnAlertsService.criarAlerta("error", "Erro", s, 2);
      return;
    }
    else if (!Utils.isValidHash(this.liquidacaoResgate.hashComprovacao)) {
      let s = "O Hash do comprovante está preenchido com valor inválido";
      this.bnAlertsService.criarAlerta("error", "Erro", s, 2)
      return;
    }


    let self= this;


    this.web3Service.liquidaResgate(this.liquidacaoResgate.hashResgate, this.liquidacaoResgate.hashComprovacao, true,

      (txHash) => {
 
        Utils.criarAlertasAvisoConfirmacao( txHash, 
                                            self.web3Service, 
                                            self.bnAlertsService, 
                                            "Liquidação do resgate foi enviada. Aguarde a confirmação.", 
                                            "Liquidação do resgate foi confirmada na blockchain.", 
                                            self.zone)    
            self.router.navigate(['sociedade/dash-transf']);          
        }        
      ,(error) => {
        Utils.criarAlertaErro( self.bnAlertsService, 
                               "Erro ao liquidar resgate.", 
                               error )  
       });
       Utils.criarAlertaAcaoUsuario( self.bnAlertsService, 
                                   "Confirme a operação no metamask e aguarde a liquidação da conta." )


  }

}
