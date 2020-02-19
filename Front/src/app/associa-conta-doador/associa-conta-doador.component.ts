import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { BnAlertsService } from 'bndes-ux4'
import { FileUploader } from 'ng2-file-upload';
import { ConstantesService } from '../ConstantesService';

import { Doador } from './Doador'
import { PessoaJuridicaService } from '../pessoa-juridica.service'
import { Web3Service } from '../Web3Service'
import { Utils } from '../shared/utils';

@Component({
  selector: 'app-associa-conta-doador',
  templateUrl: './associa-conta-doador.component.html',
  styleUrls: ['./associa-conta-doador.component.css']
})
export class AssociaContaDoadorComponent implements OnInit {

  doador: Doador

  uploader: FileUploader;  
  filename: any;
  hashdeclaracao: string;

  contaEstaValida: boolean;
  selectedAccount: any;

  maskCnpj: any;

  CONTRATO_DOADOR = 0;

  constructor(private pessoaJuridicaService: PessoaJuridicaService, protected bnAlertsService: BnAlertsService,
    private web3Service: Web3Service, private router: Router, private zone: NgZone, private ref: ChangeDetectorRef) { 

      let self = this;      
      
      this.atualizaUploaderComponent("", this.CONTRATO_DOADOR);

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
  }

  changeCnpj() { 
    this.doador.cnpj = Utils.removeSpecialCharacters(this.doador.cnpjWithMask);
    let cnpj = this.doador.cnpj;

    if ( cnpj.length == 14 ) {
      console.log (" Buscando o CNPJ do doador (14 digitos fornecidos)...  " + cnpj)
      this.recuperaDoadorPorCNPJ(cnpj);
    }   
    else {
      this.inicializaDadosDerivadosPessoaJuridica();
    }  
    this.atualizaUploaderComponent(this.doador.cnpj, this.CONTRATO_DOADOR);
  }


  atualizaUploaderComponent(_cnpj, _contrato) {
    let self = this;
    this.uploader = new FileUploader({ 
                          url: ConstantesService.serverUrl + "upload",                          
                          additionalParameter: {
                                cnpj: _cnpj,
                                contrato: _contrato
                              },
                          
                          itemAlias:  "arquivo"});
    this.uploader.onAfterAddingFile = (fileItem) => 
    { fileItem.withCredentials = false;      
    };

    this.uploader.onCompleteItem = (item:any, response:any, status:any, headers:any) => {
             console.log("upload feito.", item, status, response);
             self.hashdeclaracao = response.toString().replace('\"','').replace('\"','');
        };
  }

  chamaUpload() {
      let self = this
      this.uploader.uploadAll()           
      console.log("chamaUpload() - this.uploader")
      console.log(this.uploader)
  }

  cancelar() {
    this.doador = new Doador();
    this.inicializaDadosDerivadosPessoaJuridica();    
  }

  async recuperaContaSelecionada() {
    
    let self = this;
    
    let newSelectedAccount = await this.web3Service.getCurrentAccountSync();

    if ( !self.selectedAccount || (newSelectedAccount !== self.selectedAccount && newSelectedAccount)) {

      this.selectedAccount = newSelectedAccount;
      console.log("selectedAccount=" + this.selectedAccount);
      this.verificaEstadoContaBlockchainSelecionada(this.selectedAccount); 
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
          let texto = "Nenhuma empresa encontrada";
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
      let s = "O Hash da declaração é um Campo Obrigatório";
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
