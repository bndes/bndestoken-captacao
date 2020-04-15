import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { BnAlertsService } from 'bndes-ux4'

import { ConstantesService } from '../ConstantesService';
import { FileHandleService } from '../file-handle.service';
import { DeclarationComponentInterface } from '../shared/declaration-component.interface';

import { Doador } from './Doador';
import { PessoaJuridicaService } from '../pessoa-juridica.service';
import { Web3Service } from '../Web3Service';
import { Utils } from '../shared/utils';

@Component({ 
  selector: 'app-associa-conta-doador',
  templateUrl: './associa-conta-doador.component.html',
  styleUrls: ['./associa-conta-doador.component.css']
})

export class AssociaContaDoadorComponent implements OnInit, DeclarationComponentInterface {

  doador: Doador
  
  filename: any;
  hashdeclaracao: string;      
  flagUploadConcluido: boolean;
  contaEstaValida: boolean;
  selectedAccount: any;

  maskCnpj: any;

  CONTRATO_DOADOR = 0;

  constructor(private pessoaJuridicaService: PessoaJuridicaService, protected bnAlertsService: BnAlertsService,
    private web3Service: Web3Service, private router: Router, private zone: NgZone, private ref: ChangeDetectorRef,
    private fileHandleService: FileHandleService) { 

      let self = this;      
      
      setInterval(function () {
        self.recuperaContaSelecionada(), 1000});

    }

  ngOnInit() {
    this.doador = new Doador()
    this.maskCnpj = Utils.getMaskCnpj();     
    this.inicializaDadosDerivadosPessoaJuridica();
    this.recuperaContaSelecionada();
 
    
  }


  inicializaDadosDerivadosPessoaJuridica() {
    this.doador.cnpj = ""
    this.doador.dadosCadastrais = undefined
    this.flagUploadConcluido = false;
  }

  changeCnpj() { 
    this.doador.cnpj = Utils.removeSpecialCharacters(this.doador.cnpjWithMask);
    let cnpj = this.doador.cnpj;
    this.hashdeclaracao = undefined;

    if ( cnpj.length == 14 ) {
      console.log (" Buscando o CNPJ do doador (14 digitos fornecidos)...  " + cnpj)
      this.recuperaDoadorPorCNPJ(cnpj);
      this.preparaUpload(this.doador.cnpj, this.selectedAccount, this);
    }   
    else {
      this.inicializaDadosDerivadosPessoaJuridica();
    }  
    
  }

  cancelar() {
    this.doador = new Doador();
    this.inicializaDadosDerivadosPessoaJuridica();    
  }


  async recuperaContaSelecionada() {
    
        
    let self = this;    
    let newSelectedAccount = await this.web3Service.getCurrentAccountSync();
    if ( !self.selectedAccount || (newSelectedAccount !== self.selectedAccount && newSelectedAccount)) {
        if ( this.flagUploadConcluido == false ) {
          this.selectedAccount = newSelectedAccount;
          console.log("selectedAccount=" + this.selectedAccount);
          this.verificaEstadoContaBlockchainSelecionada(this.selectedAccount);
          this.preparaUpload(this.doador.cnpj, this.selectedAccount, this);
        }
        else {
          console.log( "Upload has already made! You should not change your account. Reseting... " );
          this.cancelar();
        }
    }
    
  }

  preparaUpload(cnpj, selectedAccount, self) {

    const tipo = "declaracao";

    if (cnpj &&  selectedAccount) {
      this.fileHandleService.atualizaUploaderComponent(cnpj, this.CONTRATO_DOADOR, selectedAccount, tipo, self);
    }
  }


  verificaEstadoContaBlockchainSelecionada(contaBlockchainSelecionada) {

    let self = this;    
    if (contaBlockchainSelecionada) {

        this.web3Service.getEstadoContaAsString(contaBlockchainSelecionada,
          result => {

            self.contaEstaValida = result
            
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
    console.log("RECUPERA Doador com CNPJ =" + cnpj)

    this.pessoaJuridicaService.recuperaEmpresaPorCnpj(cnpj).subscribe(
      empresa => {
        if (empresa && empresa.dadosCadastrais) {
          console.log("empresa encontrada - ")
          console.log(empresa)

          this.doador.dadosCadastrais = empresa["dadosCadastrais"];

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
        this.inicializaDadosDerivadosPessoaJuridica()
      })
  }

  async associaContaDoador() {

    let self = this

    if (this.hashdeclaracao==undefined || this.hashdeclaracao==null) {
      let s = "O envio da declaração é obrigatório";
      this.bnAlertsService.criarAlerta("error", "Erro", s, 2)
      return
    }  
    else if (!Utils.isValidHash(this.hashdeclaracao)) {
      let s = "O Hash da declaração está preenchido com valor inválido";
      this.bnAlertsService.criarAlerta("error", "Erro", s, 2)
      return;
    }


    let isContaDisponivel = await this.web3Service.isContaDisponivelSync(this.selectedAccount);
    if (!isContaDisponivel) {
      let msg = "A conta "+ this.selectedAccount +" não está disponível para associação"; 
      Utils.criarAlertaErro( self.bnAlertsService, "Conta não disponível para associação", msg);  
      return;
    }

    let estaCadastrado = await this.web3Service.isDoadorJaCadastrado(parseInt(this.doador.cnpj));
    if (estaCadastrado) {
      let s = "Já existe uma conta cadastrada para esse cnpj";
      this.bnAlertsService.criarAlerta("error", "Erro", s, 2)
      return;
    }

    let bChangeAccountSync = await this.web3Service.isChangeAccountEnabledSync(this.selectedAccount);
    if (!bChangeAccountSync) {
      let s = "A conta não está habilitada para associação. Contacte o BNDES";
      this.bnAlertsService.criarAlerta("error", "Erro", s, 5);
      return;
    }

    
      this.web3Service.cadastra(parseInt(this.doador.cnpj), 0, this.hashdeclaracao.toString(),

      (txHash) => {

        Utils.criarAlertasAvisoConfirmacao( txHash, 
                                            self.web3Service, 
                                            self.bnAlertsService, 
                                            "Associação do cnpj " + self.doador.cnpj + "  enviada. Aguarde a confirmação.", 
                                            "A associação de conta foi confirmada na blockchain.", 
                                            self.zone)    
        self.router.navigate(['sociedade/dash-empresas']);
        }        
      ,(error) => {
        Utils.criarAlertaErro( self.bnAlertsService, 
                              "Erro ao associar na blockchain.", 
                              error )
      });
      Utils.criarAlertaAcaoUsuario( self.bnAlertsService, 
                                  "Confirme a operação no metamask e aguarde a confirmação da associação da conta." )         


  }



}
