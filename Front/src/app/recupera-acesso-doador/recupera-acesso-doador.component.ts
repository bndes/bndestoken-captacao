import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { Router } from '@angular/router';

import { BnAlertsService } from 'bndes-ux4';
import { FileHandleService } from '../file-handle.service';
import { DeclarationComponentInterface } from '../shared/declaration-component.interface';

import { Doador } from './Doador'
import { PessoaJuridicaService } from '../pessoa-juridica.service';
import { Web3Service } from '../Web3Service';
import { Utils } from '../shared/utils';

@Component({
  selector: 'app-recupera-conta-doador',
  templateUrl: './recupera-acesso-doador.component.html',
  styleUrls: ['./recupera-acesso-doador.component.css']
})
export class RecuperaAcessoDoadorComponent implements OnInit, DeclarationComponentInterface  {

  doador: Doador;
  contaBlockchainAssociada: string
  contaEstaValida: boolean;
  selectedAccount: any;
  maskCnpj: any;
  hashdeclaracao: string;
  flagUploadConcluido: boolean;

  CONTRATO_DOADOR = 0;
  

  constructor(private pessoaJuridicaService: PessoaJuridicaService, protected bnAlertsService: BnAlertsService,
    private web3Service: Web3Service, private ref: ChangeDetectorRef, private zone: NgZone, private router: Router,
    private fileHandleService: FileHandleService) { 

      let self = this;
      const tipo = "declaracao";

      setInterval(function () {
        self.recuperaContaSelecionada(), 1000});

    }

  ngOnInit() {
    this.maskCnpj = Utils.getMaskCnpj(); 
    this.doador = new Doador();
    this.inicializaDadosTroca();
  }

  inicializaDadosTroca() {
    this.doador.cnpj = "";
    this.doador.dadosCadastrais = undefined;
    this.hashdeclaracao = "";   
    this.flagUploadConcluido = false; 
  }

  
  changeCnpj() {

    console.log("Entrou no changelog");
    
    this.doador.cnpj = Utils.removeSpecialCharacters(this.doador.cnpjWithMask);
    let cnpj = this.doador.cnpj;

    if ( cnpj.length == 14 ) { 
      console.log (" Buscando o CNPJ do cliente (14 digitos fornecidos)...  " + cnpj)
      this.recuperaDoadorPorCNPJ(cnpj);
    } 
    else {
      this.inicializaDadosTroca();
    } 
    this.fileHandleService.atualizaUploaderComponent(cnpj, this.CONTRATO_DOADOR, this.selectedAccount, "declaracao", this);

  }


  cancelar() {
    this.doador = new Doador();    
    this.inicializaDadosTroca();
  }


  async recuperaContaSelecionada() {

    let newSelectedAccount = await this.web3Service.getCurrentAccountSync();

    if ( !this.selectedAccount || (newSelectedAccount !== this.selectedAccount && newSelectedAccount)) {
      if ( this.flagUploadConcluido == false ) {
        this.selectedAccount = newSelectedAccount;
        console.log("selectedAccount=" + this.selectedAccount);
        this.verificaContaBlockchainSelecionada(this.selectedAccount); 
      }
      else {
        console.log( "Upload has already made! You should not change your account. Reseting... " );
        this.cancelar();
      }        
    }

  }


  verificaContaBlockchainSelecionada(contaBlockchainSelecionada) {
    
    if (contaBlockchainSelecionada) {

        this.web3Service.getEstadoContaAsString(contaBlockchainSelecionada,
          result => {

            this.contaEstaValida = result
                  
            setTimeout(() => {
              this.ref.detectChanges()
            }, 1000)

          },
          error => {
            console.error("Erro ao verificar o estado da conta")
          }
        )

    }

  }

  recuperaDoadorPorCNPJ(cnpj) {
    console.log("Recupera Doador com CNPJ = " + cnpj);

    this.pessoaJuridicaService.recuperaEmpresaPorCnpj(cnpj).subscribe(
      empresa => {
        if (empresa && empresa.dadosCadastrais) {
          console.log("Empresa encontrada - ");
          console.log(empresa);

          this.doador.dadosCadastrais = empresa["dadosCadastrais"];
          this.recuperaContaBlockchainDoador();

        }
        else {
          let texto = "nenhuma empresa encontrada";
          console.log(texto);
          Utils.criarAlertaAcaoUsuario( this.bnAlertsService, texto);
        }
      },
      error => {
        let texto = "Erro ao buscar dados da empresa";
        console.log(texto);
        Utils.criarAlertaErro( this.bnAlertsService, texto,error);
        this.inicializaDadosTroca();
      });
      
  }


  recuperaContaBlockchainDoador() {

    let self = this;

    this.web3Service.getContaBlockchain(this.doador.cnpj, 0,
      function (result) {
        console.log("Conta blockchain associada a " + self.doador.cnpj +  " é " + result);
        self.contaBlockchainAssociada = result;
        self.ref.detectChanges();
      },
      function (error) {
        console.log("Erro ao ler o conta blockchain " + self.contaBlockchainAssociada);
        console.log(error);
      });  

  }   


  async trocaAssociacaoConta() {

    let self = this;
    let subcredito = 0

    if (!this.contaBlockchainAssociada) {
      let s = "O campo Conta Blockchain Atual é Obrigatório"
      this.bnAlertsService.criarAlerta("error", "Erro", s, 2)
      return;
    }

    let bFornc = await this.web3Service.isDoadorSync(this.contaBlockchainAssociada);
    if (!bFornc) {
      let s = "Conta não é de um doador";
      this.bnAlertsService.criarAlerta("error", "Erro", s, 5);
      return;
    }

    if (this.hashdeclaracao==undefined || this.hashdeclaracao==null) {
      let s = "O envio da declaração é obrigatório";
      this.bnAlertsService.criarAlerta("error", "Erro", s, 2)
      return;
    }
    else if (!Utils.isValidHash(this.hashdeclaracao)) {
      let s = "O Hash da declaração está preenchido com valor inválido";
      this.bnAlertsService.criarAlerta("error", "Erro", s, 2)
      return;
    }


    let bChangeAccountSync = await this.web3Service.isChangeAccountEnabledSync(this.selectedAccount);
    if (!bChangeAccountSync) {
      let s = "A conta não está habilitada para troca. Contacte o BNDES";
      this.bnAlertsService.criarAlerta("error", "Erro", s, 5);
      return;
    }

    let isNewAccountAvailable = await this.web3Service.isContaDisponivelSync(this.selectedAccount);
    if (!isNewAccountAvailable) {
      let msg = "A nova conta não está disponível"
      console.log(msg);
      self.bnAlertsService.criarAlerta("error", "Erro", msg, 2);
      return;
    } 


    this.web3Service.trocaAssociacaoDeConta(parseInt(this.doador.cnpj), 0, this.hashdeclaracao,
    
         (txHash) => {

          Utils.criarAlertasAvisoConfirmacao( txHash, 
                                              self.web3Service, 
                                              self.bnAlertsService, 
                                              "Troca de conta do cnpj " + self.doador.cnpj + "  enviada. Aguarde a confirmação.", 
                                              "A troca foi confirmada na blockchain.", 
                                              self.zone) 
          self.router.navigate(['sociedade/dash-empresas']);

          }        
        ,(error) => {
          Utils.criarAlertaErro( self.bnAlertsService, 
                                 "Erro ao associar na blockchain\nUma possibilidade é você já ter se registrado utilizando essa conta ethereum.", 
                                 error )  
        }
      );
      Utils.criarAlertaAcaoUsuario( self.bnAlertsService, 
                                    "Confirme a operação no metamask e aguarde a confirmação da associação da conta." )      

  }

}
