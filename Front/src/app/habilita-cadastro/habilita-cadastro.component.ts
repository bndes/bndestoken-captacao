import { Component, OnInit, NgZone  } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Web3Service } from './../Web3Service';
import { PessoaJuridicaService } from '../pessoa-juridica.service';
import { PessoaJuridica } from '../PessoaJuridica';
import { BnAlertsService } from 'bndes-ux4';
import { Router } from '@angular/router';
import { Utils } from '../shared/utils';

@Component({
  selector: 'app-habilita-cadastro',
  templateUrl: './habilita-cadastro.component.html',
  styleUrls: ['./habilita-cadastro.component.css']
})
export class HabilitaCadastroComponent implements OnInit {

  pj: PessoaJuridica;
  isHashInvalido: boolean = false;
  selectedAccount: any;
  contaHabilitada: boolean=false;  


  constructor(private pessoaJuridicaService: PessoaJuridicaService, 
      protected bnAlertsService: BnAlertsService, private web3Service: Web3Service,
      private router: Router, private ref: ChangeDetectorRef, private zone: NgZone) { 

      let self = this;
      setInterval(function () {
        self.recuperaContaSelecionada(), 1000});

    }

    ngOnInit() {   
      this.pj = {
        id: -1,
        cnpj: "",
        razaoSocial: "",
        idSubcredito: "",
        contaBlockchain: "",
        hashDeclaracao: "",
        filePathAndName: "",
        dadosBancarios: undefined,
        status: status
     };
    }
  
    recuperaClientePorContaBlockchain(conta) {
      let self = this;    
  
      if ( conta != undefined && conta != "" && conta.length == 42 ) {
  
        console.log("#### conta a recuperar PJInfo " + conta);      

        self.web3Service.isAccountEnabled(conta,
          (result) => {

            if (result) self.contaHabilitada=true;
            else self.contaHabilitada=false;
          },
          (error) => {
              console.warn("Erro ao buscar info de habilitada")
          })



        self.web3Service.getPJInfo(conta,
            (result) => {
  
              if ( result.cnpj != 0 ) { //encontrou uma PJ valida  
  
                console.log("#### result da validacao cadastro da conta " + conta);
                console.log(result);
                self.pj.cnpj = result.cnpj;
                self.pj.idSubcredito = result.idSubcredito;
                self.pj.hashDeclaracao = result.hashDeclaracao;
                self.pj.status = self.web3Service.getEstadoContaAsStringByCodigo(result.status);
  
                this.pessoaJuridicaService.recuperaEmpresaPorCnpj(self.pj.cnpj).subscribe(
                  empresa => {
                    if (empresa && empresa.dadosCadastrais) {
                      self.pj.razaoSocial = empresa.dadosCadastrais.razaoSocial;
                    }
                    else {
                      let texto = "Nenhuma empresa encontrada associada ao CNPJ";
                      console.log(texto);
                      Utils.criarAlertaAcaoUsuario( this.bnAlertsService, texto);       
                    }
                },
                error => {
                  let texto = "Erro ao buscar dados da empresa";
                  console.log(texto);                
                  Utils.criarAlertaErro( this.bnAlertsService, texto,error);
                }) //fecha busca PJInfo
     
  
             } //fecha if de PJ valida
  
             else {

              console.log("Não encontrou PJ para essa conta");

              self.pj.cnpj = "0";
              self.pj.idSubcredito = "0";
              self.pj.status = "N/A";
              self.pj.razaoSocial = "N/A";
             }
             
            },
            (error) => {
              self.apagaCamposDaEstrutura();
              console.log(error);
              console.warn("Erro ao buscar dados da conta na blockchain")
            })
      } 
      else {
          self.apagaCamposDaEstrutura();      
      }
  }
  
 
    async recuperaContaSelecionada() {
      
      let self = this;
      
      let newSelectedAccount = await this.web3Service.getCurrentAccountSync();
  
      if ( !self.selectedAccount || (newSelectedAccount !== self.selectedAccount && newSelectedAccount)) {
  
        this.selectedAccount = newSelectedAccount;
        console.log("selectedAccount=" + this.selectedAccount);
  
      }
    }
  
  
  
    async habilitarCadastro() {
  
      if (!this.pj.contaBlockchain) {
        let s = "A conta blockchain é um Campo Obrigatório";
        this.bnAlertsService.criarAlerta("error", "Erro", s, 2);
        return;
      }
 
  
      let bRV = await this.web3Service.isResponsibleForRegistryValidationSync(this.selectedAccount);
      if (!bRV) 
      {
          let s = "Conta selecionada no Metamask não pode executar uma habilitação.";
          this.bnAlertsService.criarAlerta("error", "Erro", s, 5);
          return;
      }

      let self = this;

      let bRA = await this.web3Service.isReservedAccountSync(self.pj.contaBlockchain);
      if (bRA) 
      {
          let s = "Conta digitada é reservada e não pode ser habilitada.";
          this.bnAlertsService.criarAlerta("error", "Erro", s, 5);
          return;
      }  

      let bContaDisponivel = await this.web3Service.isContaDisponivelSync(self.pj.contaBlockchain);
      let bContaAguardandoAprovacao = await this.web3Service.isContaAguardandoValidacaoSync(self.pj.contaBlockchain);
      let bValidada = await this.web3Service.isContaValidadaSync(self.pj.contaBlockchain);            

      if (!(bContaDisponivel || bContaAguardandoAprovacao || bValidada)) {
        let s = "Conta digitada não pode mais ser habilitada por causa de seu status.";
        this.bnAlertsService.criarAlerta("error", "Erro", s, 5);
        return;
      }
  
      console.log("habilitarCadastro(): " + self.pj.contaBlockchain);
  
      let booleano = this.web3Service.habilitarCadastro(self.pj.contaBlockchain,  
  
        
           (txHash) => {
            Utils.criarAlertasAvisoConfirmacao( txHash, 
                                                self.web3Service, 
                                                self.bnAlertsService, 
                                                "Habilitação de conta enviada. Aguarde a confirmação.", 
                                                "A habilitação da conta foi confirmada na blockchain.", 
                                                self.zone)
            self.pj.contaBlockchain="";
            self.apagaCamposDaEstrutura();
            }        
          ,(error) => {
            Utils.criarAlertaErro( self.bnAlertsService, 
                                   "Erro ao validar habilitar cadastro na blockchain", 
                                   error )  
          }
        );
        Utils.criarAlertaAcaoUsuario( self.bnAlertsService, 
                                      "Confirme a operação no metamask e aguarde a confirmação." )         
    }
  
 
  
    apagaCamposDaEstrutura() {
  
      let self = this;
      self.pj.cnpj = "";
      self.pj.razaoSocial = "";
      self.pj.idSubcredito = "";
      self.pj.status = "";
    }
  


}
