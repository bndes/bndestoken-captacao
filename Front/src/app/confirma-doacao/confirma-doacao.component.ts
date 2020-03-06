import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BnAlertsService } from 'bndes-ux4';
import { FileHandleService } from '../file-handle.service';
import { DeclarationComponentInterface } from '../shared/declaration-component.interface';

import { Doacao } from "./Doacao";
import { PessoaJuridicaService } from '../pessoa-juridica.service';
import { Web3Service } from './../Web3Service';
import { Utils } from '../shared/utils';

@Component({
  selector: 'app-confirma-doacao',
  templateUrl: './confirma-doacao.component.html',
  styleUrls: ['./confirma-doacao.component.css']
})
export class ConfirmaDoacaoComponent implements OnInit, DeclarationComponentInterface {

  doacao: Doacao = new Doacao();

  selectedAccount: any;

  maskCnpj            : any;
  hashdeclaracao      : string;
  flagUploadConcluido : boolean;

  CONTRATO_DOADOR = 0;  

  constructor(private pessoaJuridicaService: PessoaJuridicaService, protected bnAlertsService: BnAlertsService,
    private web3Service: Web3Service, private router: Router, private zone: NgZone, private ref: ChangeDetectorRef,
    private fileHandleService: FileHandleService) {       

      let self = this;
      setInterval(function () {
        self.recuperaContaSelecionada(), 
        1000});
    }

  ngOnInit() {
    this.maskCnpj = Utils.getMaskCnpj(); 
    this.doacao = new Doacao();

  }

  inicializaDoacao() {
    this.doacao.dadosCadastrais = undefined;
    this.doacao.cnpj = "";
    this.doacao.saldo = undefined;
    this.doacao.valor = 0;
    this.hashdeclaracao = "";   
    this.flagUploadConcluido = false;     
  }

    async recuperaContaSelecionada() {
    
        
    let self = this;    
    let newSelectedAccount = await this.web3Service.getCurrentAccountSync();
    if ( !self.selectedAccount || (newSelectedAccount !== self.selectedAccount && newSelectedAccount)) {
        if ( this.flagUploadConcluido == false ) {
          this.selectedAccount = newSelectedAccount;
          console.log("selectedAccount=" + this.selectedAccount);
          //this.verificaEstadoContaBlockchainSelecionada(this.selectedAccount);
          this.preparaUpload(this.doacao.cnpj, this.selectedAccount, this);
        }
        else {
          console.log( "Upload has already made! You should not change your account. Reseting... " );
          this.cancelar();
        }
    }
    
  }

  preparaUpload(cnpj, selectedAccount, self) {

    const tipo = "comp_doacao";

    if (cnpj &&  selectedAccount) {
      this.fileHandleService.atualizaUploaderComponent(cnpj, this.CONTRATO_DOADOR, selectedAccount, tipo, self);
    }
  }

    changeCnpj() {

      this.doacao.cnpj = Utils.removeSpecialCharacters(this.doacao.cnpjWithMask);
      let cnpj = this.doacao.cnpj;
  
      if ( cnpj.length == 14 ) { 
        console.log (" Buscando o CNPJ do doador (14 digitos fornecidos)...  " + cnpj)
        this.recuperaDoadorPorCNPJ(cnpj);
      } 

      this.fileHandleService.atualizaUploaderComponent(this.doacao.cnpj, this.CONTRATO_DOADOR, this.selectedAccount, "comp_doacao", this);
    }
  
    cancelar() { 
      this.doacao = new Doacao();
      this.inicializaDoacao();
    }

    recuperaDoadorPorCNPJ(cnpj) {
      console.log("RECUPERA Doador com CNPJ =" + cnpj)
  
      this.pessoaJuridicaService.recuperaEmpresaPorCnpj(cnpj).subscribe(
        empresa => {
          if (empresa && empresa.dadosCadastrais) {
            console.log("empresa encontrada - ")
            console.log(empresa)
  
            this.doacao.dadosCadastrais = empresa["dadosCadastrais"];
            this.recuperaSaldo(cnpj);
  
          }
          else {
            let texto = "CNPJ não identificado";
            console.log(texto);
            Utils.criarAlertaAcaoUsuario( this.bnAlertsService, texto);
          }
        },
        error => {
          let texto = "Erro ao buscar dados da empresa";
          console.log(texto);
          Utils.criarAlertaErro( this.bnAlertsService, texto,error);
        })
    }


    async recuperaSaldo(cnpj) {

      let self = this;
  
      let contaBlockchainDoador = await this.web3Service.getContaBlockchainFromDoadorSync(this.doacao.cnpj);
      console.log("contaBlockchainDoador=" + contaBlockchainDoador);
      
      this.web3Service.getBookedBalanceOf(contaBlockchainDoador+"",
  
        function (result) {
          console.log("Saldo do endereco " + cnpj + " eh " + result);
          self.doacao.saldo = result;
          self.ref.detectChanges();
        },
        function (error) {
          console.log("Erro ao ler o saldo do endereco " + cnpj);
          console.log(error);
          self.doacao.saldo = 0;
        });
    }

    async receberDoacao() {

      let self = this;


      let bRD = await this.web3Service.isResponsibleForDonationConfirmationSync(this.selectedAccount);    
      if (!bRD) 
      {
        let s = "Conta selecionada no Metamask não pode executar a Confirmação.";
          this.bnAlertsService.criarAlerta("error", "Erro", s, 5);
          return;
      } 

      let contaBlockchainDoador = await this.web3Service.getContaBlockchainFromDoadorSync(this.doacao.cnpj);
      console.log("contaBlockchainDoador=" + contaBlockchainDoador);

      if (!contaBlockchainDoador) {
        let s = "CNPJ não é de um doador";
        this.bnAlertsService.criarAlerta("error", "Erro", s, 5);
        return;
      }
  
      let bDoadorValidado = await this.web3Service.isContaValidadaSync(contaBlockchainDoador+"");
      if (!bDoadorValidado) {
        let s = "CNPJ não está associado a conta blockchain validada";
        this.bnAlertsService.criarAlerta("error", "Erro", s, 5);
        return;
      }
  
        
      //Multipliquei por 1 para a comparacao ser do valor (e nao da string)
      if ((this.doacao.valor * 1) > (this.doacao.saldo * 1)) {
  
        console.log("saldo=" + this.doacao.saldo);
        console.log("valor=" + this.doacao.valor);
  
        let s = "Não é possível receber uma doação maior do que o valor do saldo do doador.";
        this.bnAlertsService.criarAlerta("error", "Erro", s, 5);
        return;
      }
  
  
      this.web3Service.receberDoacao(this.doacao.cnpj, this.doacao.valor, this.hashdeclaracao,
  
          (txHash) => {
          Utils.criarAlertasAvisoConfirmacao( txHash, 
                                              self.web3Service, 
                                              self.bnAlertsService, 
                                              "O recebimento da doação vindo do CNPJ " + self.doacao.cnpj + "  foi enviado. Aguarde a confirmação.", 
                                              "O recebimento da doação foi confirmado na blockchain.", 
                                              self.zone);       
          self.router.navigate(['sociedade/dash-doacao']);
          
          }        
        ,(error) => {
          Utils.criarAlertaErro( self.bnAlertsService, 
                                  "Erro ao receber doação na blockchain", 
                                  error)  
        }
      );
      Utils.criarAlertaAcaoUsuario( self.bnAlertsService, 
                                    "Confirme a operação no metamask e aguarde a confirmação do recebimento da doação." )  
      }
  
  
  
  }

  

