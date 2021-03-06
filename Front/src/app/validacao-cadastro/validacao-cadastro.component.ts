import { Component, OnInit, NgZone  } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import {FileHandleService} from "../file-handle.service";
import { Web3Service } from './../Web3Service';
import { PessoaJuridicaService } from '../pessoa-juridica.service';
import { PessoaJuridica } from '../PessoaJuridica';
import { BnAlertsService } from 'bndes-ux4';
import { Router } from '@angular/router';
import { Utils } from '../shared/utils';
import { ConstantesService } from '../ConstantesService';

@Component({
  selector: 'app-validacao-cadastro',
  templateUrl: './validacao-cadastro.component.html',
  styleUrls: ['./validacao-cadastro.component.css']
})
export class ValidacaoCadastroComponent implements OnInit {

  pj: PessoaJuridica;
  isHashInvalido: boolean = false;
  selectedAccount: any;
  contaBuscadaENaoAssociada: boolean = false;
  urlArquivo = "";

  constructor(private pessoaJuridicaService: PessoaJuridicaService, 
      private fileHandleService: FileHandleService,
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
    self.contaBuscadaENaoAssociada = false;

    if ( conta != undefined && conta != "" && conta.length == 42 ) {

      console.log("#### conta a recuperar PJInfo " + conta);      
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

              this.fileHandleService.buscaFileInfo(self.pj.cnpj, self.pj.idSubcredito, self.pj.contaBlockchain, 
                self.pj.hashDeclaracao, "declaracao").subscribe(
                result => {
                  if (result && result.pathAndName) {
                    self.pj.filePathAndName=ConstantesService.serverUrlRoot+result.pathAndName;
                  }
                  else {
                    let texto = "Não foi possível encontrar informações associadas ao arquivo desse cadastro.";
                    console.log(texto);
                    Utils.criarAlertaAcaoUsuario( this.bnAlertsService, texto);       
                  }                  
                }, 
                error => {
                  let texto = "Erro ao buscar dados de arquivo";
                  console.log(texto);
                  Utils.criarAlertaErro( this.bnAlertsService, texto,error);
                }) //fecha busca fileInfo
  

           } //fecha if de PJ valida

           else {
            self.contaBuscadaENaoAssociada = true;
            let texto = "Nenhuma empresa encontrada associada a conta blockchain";
            console.log(texto);
            Utils.criarAlertaAcaoUsuario( this.bnAlertsService, texto);       
            self.apagaCamposDaEstrutura();
           }
           
          },
          (error) => {
            self.apagaCamposDaEstrutura();
            console.warn("Erro ao buscar dados da conta na blockchain")
          })
    } 
    else {
        self.apagaCamposDaEstrutura();      
    }
}

  estaContaEstadoAguardandoValidacao() {
    if (this.pj && this.pj.status == "Aguardando validação do Cadastro") {
      return true;
    }
    else {
      return false;
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



  async validarCadastro() {

    if (this.pj.contaBlockchain === undefined) {
      let s = "A conta blockchain é um Campo Obrigatório";
      this.bnAlertsService.criarAlerta("error", "Erro", s, 2);
      return;
    }

    if (this.pj.hashDeclaracao === undefined) {
      let s = "O envio da declaração é obrigatório";
      this.bnAlertsService.criarAlerta("error", "Erro", s, 2);
      return;
    }


    let bRV = await this.web3Service.isResponsibleForRegistryValidationSync(this.selectedAccount);
    if (!bRV) 
    {
        let s = "Conta selecionada no Metamask não pode executar uma validação.";
        this.bnAlertsService.criarAlerta("error", "Erro", s, 5);
        return;
    }
  

    let self = this;
    console.log("validarConta(): " + self.pj.contaBlockchain + " - " + self.pj.hashDeclaracao);

    let booleano = this.web3Service.validarCadastro(self.pj.contaBlockchain, self.pj.hashDeclaracao, 

      
         (txHash) => {
          Utils.criarAlertasAvisoConfirmacao( txHash, 
                                              self.web3Service, 
                                              self.bnAlertsService, 
                                              "Validação de conta enviada. Aguarde a confirmação.", 
                                              "O cadastro da conta foi validado e confirmado na blockchain.", 
                                              self.zone)
          self.router.navigate(['sociedade/dash-empresas']);                                                     
          }        
        ,(error) => {
          Utils.criarAlertaErro( self.bnAlertsService, 
                                 "Erro ao validar cadastro na blockchain", 
                                 error )  
        }
      );
      Utils.criarAlertaAcaoUsuario( self.bnAlertsService, 
                                    "Confirme a operação no metamask e aguarde a confirmação." )         
  }

  async invalidarCadastro() {

    let self = this;

    if (this.pj.contaBlockchain === undefined) {
      let s = "A conta blockchain é um Campo Obrigatório";
      this.bnAlertsService.criarAlerta("error", "Erro", s, 2)
      return;
    }

    let bRV = await this.web3Service.isResponsibleForRegistryValidationSync(this.selectedAccount);
    if (!bRV) 
    {
        let s = "Conta selecionada no Metamask não pode executar a ação de invalidar.";
        this.bnAlertsService.criarAlerta("error", "Erro", s, 5);
        return;
    }

    let booleano = this.web3Service.invalidarCadastro(self.pj.contaBlockchain, 
      (result) => {
          let s = "O cadastro da conta foi invalidado.";
          self.bnAlertsService.criarAlerta("info", "Sucesso", s, 5);
          console.log(s);

          self.router.navigate(['sociedade/dash-empresas'])
    },
    (error) => {
      console.log("Erro ao invalidar cadastro")
    });
  }


  apagaCamposDaEstrutura() {

    let self = this;
    self.pj.cnpj = "";
    self.pj.razaoSocial = "";
    self.pj.idSubcredito = "";
    self.pj.status = "";
    self.pj.hashDeclaracao = "";
    self.pj.filePathAndName="";
  }


}

