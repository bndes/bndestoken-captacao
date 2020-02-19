import { Component, OnInit, NgZone } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

import { BnAlertsService } from 'bndes-ux4';

import { Web3Service } from './../Web3Service';
import { PessoaJuridicaService } from '../pessoa-juridica.service';
import {Doacao} from './Doacao';
import { Utils } from '../shared/utils';

@Component({
  selector: 'app-registra-doacao',
  templateUrl: './registra-doacao.component.html',
  styleUrls: ['./registra-doacao.component.css']
})
export class RegistraDoacaoComponent implements OnInit {

  doacao: Doacao = new Doacao();
  maskCnpj: any;  
  selectedAccount: any;   

  constructor(private pessoaJuridicaService: PessoaJuridicaService, protected bnAlertsService: BnAlertsService, private web3Service: Web3Service,
    private ref: ChangeDetectorRef, private zone: NgZone, private router: Router) {

      let self = this;
      setInterval(function () {
        self.recuperaContaSelecionada(), 1000});
  }

  ngOnInit() {
    this.maskCnpj = Utils.getMaskCnpj();         
  }

  async recuperaContaSelecionada() {

    let self = this;

    let newSelectedAccount = await this.web3Service.getCurrentAccountSync();
  
    if ( !self.selectedAccount || (newSelectedAccount !== self.selectedAccount && newSelectedAccount)) {
  
      self.selectedAccount = newSelectedAccount;
      console.log("selectedAccount=" + self.selectedAccount);
      this.doacao.contaBlockchainOrigem = newSelectedAccount+"";
      this.recuperaInformacoesDerivadasConta();
      
    }
  } 

  inicializaDoacao() {
    this.doacao.razaoSocialOrigem = "";
    this.doacao.cnpjOrigem = "";
    this.doacao.valor = 0;

  }  

  recuperaInformacoesDerivadasConta() {

    let self = this;

    let contaBlockchain = this.doacao.contaBlockchainOrigem.toLowerCase();

    console.log("ContaBlockchain" + contaBlockchain);

    if ( contaBlockchain != undefined && contaBlockchain != "" && contaBlockchain.length == 42 ) {

      this.web3Service.getPJInfo(contaBlockchain,

          (result) => {

            if ( result.cnpj != 0 ) { //encontrou uma PJ valida  

              console.log(result);
              self.doacao.cnpjOrigem = result.cnpj;

              this.pessoaJuridicaService.recuperaEmpresaPorCnpj(self.doacao.cnpjOrigem).subscribe(
                data => {
                    if (data && data.dadosCadastrais) {
                    console.log("RECUPERA EMPRESA ORIGEM")
                    console.log(data)
                    self.doacao.razaoSocialOrigem = data.dadosCadastrais.razaoSocial;
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
                this.inicializaDoacao();
              });              

              self.ref.detectChanges();

           } //fecha if de PJ valida

           else {
            let texto = "Nenhuma empresa encontrada associada a conta blockchain";
            console.log(texto);
            Utils.criarAlertaAcaoUsuario( this.bnAlertsService, texto);
            this.inicializaDoacao();
           }
           
          },
          (error) => {
            this.inicializaDoacao();
            console.warn("Erro ao buscar dados da conta na blockchain")
          })

                 
    } 
    else {
        this.inicializaDoacao();
    }
}  


async registrarDoacao() {

  let self = this;

  let bDoador = await this.web3Service.isDoadorSync(this.doacao.contaBlockchainOrigem);
  if (!bDoador) {
    let s = "O registro da doação deve ser realizado para a conta de um doador.";
    this.bnAlertsService.criarAlerta("error", "Erro", s, 5);
    return;
  }

  let bValidadaOrigem = await this.web3Service.isContaValidadaSync(this.doacao.contaBlockchainOrigem);
  if (!bValidadaOrigem) {
    let s = "Conta do doador não validada";
    this.bnAlertsService.criarAlerta("error", "Erro", s, 5);
    return;
  }

  this.web3Service.registrarDoacao(this.doacao.valor,

      (txHash) => {

      Utils.criarAlertasAvisoConfirmacao( txHash, 
                                          self.web3Service, 
                                          self.bnAlertsService, 
                                          "Doação do cnpj " + self.doacao.cnpjOrigem + "  enviado. Aguarde a confirmação.", 
                                          "A doação foi confirmada na blockchain. Aguarde recebimento de email com o boleto da doação.", 
                                          self.zone)       
      self.router.navigate(['sociedade/dash-doacao']);

      }
    ,(error) => {
      Utils.criarAlertaErro( self.bnAlertsService, 
                              "Erro ao registrar doacao na blockchain", 
                              error )

    }
  );
  Utils.criarAlertaAcaoUsuario( self.bnAlertsService, 
                                "Confirme a operação no metamask e aguarde a confirmação do registro." )    

}


}
