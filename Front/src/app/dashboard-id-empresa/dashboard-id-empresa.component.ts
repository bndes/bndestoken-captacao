import { Component, OnInit, NgZone } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
import { DashboardPessoaJuridica } from './DashboardPessoaJuridica';
import {FileHandleService} from "../file-handle.service";
import { Web3Service } from './../Web3Service';
import { EventsService } from './../EventsService';
import { PessoaJuridicaService } from '../pessoa-juridica.service';
import { Utils } from '../shared/utils';
import { ConstantesService } from '../ConstantesService';


import {Grid, GridOptions} from "@ag-grid-community/all-modules";
import "@ag-grid-community/all-modules/dist/styles/ag-grid.css";
import "@ag-grid-community/all-modules/dist/styles/ag-theme-balham.css";

import { BnAlertsService } from 'bndes-ux4';

@Component({
    selector: 'app-dashboard-id-empresa',
    templateUrl: './dashboard-id-empresa.component.html',
    styleUrls: ['./dashboard-id-empresa.component.css']
})



export class DashboardIdEmpresaComponent implements OnInit {

    listaTransacoesPJ: DashboardPessoaJuridica[] = undefined;
    listaTransacoesJson = [];

    blockchainNetworkPrefix: string;

    estadoLista: string = "undefined";

    p: number = 1;
    order: string = 'dataHora';
    reverse: boolean = false;

    selectedAccount: any;

    private gridOptions: GridOptions = <GridOptions>{};

    //https://www.ag-grid.com/angular-grid/

    columnDefs = [
        {headerName: 'Razão Social', field: 'razaoSocial', sortable: true, filter: true},
        {headerName: 'CNPJ', field: 'cnpj', sortable: true, filter: true},
        {headerName: 'Contrato Financeiro', field: 'nomeConta', sortable: true, filter: true},
        {headerName: 'Perfil', field: 'perfil', sortable: true, filter: true},
        {headerName: 'Data/Hora', field: 'dataHora', sortable: true, filter: true},
        {headerName: 'Conta Blockchain', field: 'contaBlockchain', sortable: true, filter: true},
        {headerName: 'Status', field: 'status', sortable: true, filter: true},
        {headerName: 'Link Etherscan', field: 'linkEtherscan', sortable: true, filter: true}
    ];

    transacaoPJ: any = {
    cnpj: 123456789,
    razaoSocial: "",
    contaBlockchain: "conta",
    hashID: "",
    uniqueIdentifier: "",
    dataHora: null,
    hashDeclaracao: "hashDeclaracao que preciso alterar",
    nomeConta: "nomeconta",
    status: "Conta Cadastrada",
    filePathAndName: "",
    perfil: ""
    }

//https://www.ag-grid.com/javascript-grid-api/


    constructor(private pessoaJuridicaService: PessoaJuridicaService, 
        private fileHandleService: FileHandleService,
        protected bnAlertsService: BnAlertsService, private web3Service: Web3Service,
        private eventsService: EventsService,
        private ref: ChangeDetectorRef, private zone: NgZone) {

            let self = this;
            self.recuperaContaSelecionada();
            this.listaTransacoesJson.push(this.transacaoPJ);

                        
            setInterval(function () {
              self.recuperaContaSelecionada(), 
              1000}); 


              this.gridOptions = {
                columnDefs: this.columnDefs,
                rowData: this.listaTransacoesJson
            };
    

    }

    ngOnInit() {
        setTimeout(() => {
            this.listaTransacoesPJ = [];
            console.log("Zerou lista de transacoes");

            this.registrarExibicaoEventos();

        }, 1500)

        setTimeout(() => {
            this.estadoLista = this.estadoLista === "undefined" ? "vazia" : "cheia"
            this.ref.detectChanges()
        }, 2300)
    }

    ngAfterViewInit() {
        let eGridDiv:HTMLElement = <HTMLElement>document.querySelector('#myGrid');
        new Grid(eGridDiv, this.gridOptions);

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

        this.blockchainNetworkPrefix = this.eventsService.getInfoBlockchainNetwork().blockchainNetworkPrefix;

        console.log("blockchainNetworkPrefix abaixo");
        console.log(this.blockchainNetworkPrefix);

//        this.estadoLista = "vazia"




        this.registraEventosCadastro();

//       this.registraEventosTroca();

//        this.registraEventosValidacao();

//        this.registraEventosInvalidacao();
        
    }

    registraEventosCadastro() {

        console.log("*** Executou o metodo de registrar eventos CADASTRO");
/*
        let tc = function trataCadastro (address, cnpj) {

            console.log("##### ESTOU DENTRO DE TRATA CADASTRO");
            console.log(address);
        }
*/
        this.eventsService.registraEventosCadatro(
            
        (address,cnpj,idFinancialSupportAgreement,idProofHash) => {
            
            let transacaoPJ: any;
            transacaoPJ = {
                cnpj: 123456789,
                razaoSocial: "",
                contaBlockchain: address,
                hashID: address,
                uniqueIdentifier: address,
                dataHora: null,
                hashDeclaracao: "hashDeclaracao que preciso alterar",
                nomeConta: idFinancialSupportAgreement,
                status: "Conta Cadastrada",
                filePathAndName: "",
                perfil: ""
            }

            console.log("##### ESTOU DENTRO DE TRATA CADASTRO com arrow e events simplificado");           
            console.log(transacaoPJ);

            this.listaTransacoesJson.push(transacaoPJ);

        });
    }



    /*
    registraEventosCadastro() {

        console.log("*** Executou o metodo de registrar eventos CADASTRO");

        let tc = function trataCadastro (address, cnpj) {

            console.log("##### ESTOU DENTRO DE TRATA CADASTRO");
            console.log(address);
        }

        this.eventsService.registraEventosCadatro(tc);

    //                self.listaTransacoesJson.push(transacaoPJ);   
            
    //                self.includeIfNotExists(transacaoPJ);
    //                self.recuperaInfoDerivadaPorCnpj(self, transacaoPJ);
    //                self.recuperaDataHora(self, event, transacaoPJ);
    //                self.recuperaFilePathAndName(self,transacaoPJ); 
 
    }

*/
/*
    registraEventosCadastro() {

        console.log("*** Executou o metodo de registrar eventos CADASTRO");

        let self = this;
        this.web3Service.registraEventosCadastro(function (error, event) {
            
//            (event) => {
            
                console.log("##Evento Cadastro");
                console.log(event);

                let transacaoPJ: any;
                transacaoPJ = {
                    cnpj: event.args.cnpj,
                    razaoSocial: "",
                    contaBlockchain: event.args.addr,
                    hashID: event.transactionHash,
                    uniqueIdentifier: event.transactionHash,
                    dataHora: null,
                    hashDeclaracao: event.args.idProofHash,
                    nomeConta: event.args.idFinancialSupportAgreement,
                    status: "Conta Cadastrada",
                    filePathAndName: "",
                    perfil: ""
                }

    //                self.listaTransacoesJson.push(transacaoPJ);   
            
    //                self.includeIfNotExists(transacaoPJ);
    //                self.recuperaInfoDerivadaPorCnpj(self, transacaoPJ);
    //                self.recuperaDataHora(self, event, transacaoPJ);
    //                self.recuperaFilePathAndName(self,transacaoPJ); 
            }
        );
    }
*/
/*
    registraEventosTroca() {

        console.log("*** Executou o metodo de registrar eventos TROCA");

        let self = this;

        self.web3Service.registraEventosTroca(function (error, event) {

            let transacaoPJ: DashboardPessoaJuridica
            let eventoTroca = event

            console.log("Evento Troca");
            console.log(eventoTroca);

            if (!error) {

                let transacaoPJContaInativada = {
                    cnpj: eventoTroca.args.cnpj,
                    razaoSocial: "",
                    contaBlockchain: eventoTroca.args.oldAddr,
                    hashID: eventoTroca.transactionHash,
                    uniqueIdentifier: eventoTroca.transactionHash + "Old",
                    dataHora: null,
                    hashDeclaracao: eventoTroca.args.idProofHash,
                    nomeConta: eventoTroca.args.idFinancialSupportAgreement,
                    status: "Conta Inativada por Troca",
                    filePathAndName: "",                    
                    perfil: ""
                };

                self.includeIfNotExists(transacaoPJContaInativada);
                self.recuperaInfoDerivadaPorCnpj(self, transacaoPJContaInativada);
                self.recuperaDataHora(self, event, transacaoPJContaInativada);
                self.recuperaFilePathAndName(self,transacaoPJ);


                transacaoPJ = {
                    cnpj: eventoTroca.args.cnpj,
                    razaoSocial: "",
                    contaBlockchain: eventoTroca.args.newAddr,
                    hashID: eventoTroca.transactionHash,
                    uniqueIdentifier: eventoTroca.transactionHash + "New",                    
                    dataHora: null,
                    hashDeclaracao: eventoTroca.args.idProofHash,
                    nomeConta: eventoTroca.args.idFinancialSupportAgreement,
                    status: "Conta Associada por Troca",
                    filePathAndName: "",                    
                    perfil: ""
                };

                //TODO: nao precisa chamar novamente
                self.includeIfNotExists(transacaoPJ);
                self.recuperaInfoDerivadaPorCnpj(self, transacaoPJ);
                self.recuperaDataHora(self, event, transacaoPJ);
                self.recuperaFilePathAndName(self,transacaoPJ);                
            }    

        });        
    }

/*    
    registraEventosValidacao() {

        console.log("*** Executou o metodo de registrar eventos VALIDACAO");        

        let self = this;        
        this.web3Service.registraEventosValidacao(function (error, event) {

            if (!error) {

                let transacaoPJ: DashboardPessoaJuridica;

                console.log("Evento validacao");
                console.log(event);

                      
                transacaoPJ = {
                    cnpj: event.args.cnpj,
                    razaoSocial: "",
                    contaBlockchain: event.args.addr,
                    hashID: event.transactionHash,
                    uniqueIdentifier: event.transactionHash,
                    dataHora: null,
                    hashDeclaracao: "",
                    nomeConta: event.args.idFinancialSupportAgreement,
                    status: "Conta Validada",
                    filePathAndName: "",                    
                    perfil: ""
                }
                self.includeIfNotExists(transacaoPJ);
                self.recuperaInfoDerivadaPorCnpj(self, transacaoPJ);
                self.recuperaDataHora(self, event, transacaoPJ);
//nao tem hash para recuperar arquivo
//                self.recuperaFilePathAndName(self,transacaoPJ);                

            } else {
                console.log("Erro no registro de eventos de validacao");
                console.log(error);
            }
        });
        
    }


    registraEventosInvalidacao() {

        console.log("*** Executou o metodo de registrar eventos INVALIDACAO");                

        let self = this;        
        this.web3Service.registraEventosInvalidacao(function (error, event) {

            if (!error) {

                let transacaoPJ: any;

                console.log("Evento invalidacao");
                console.log(event);
                      
                transacaoPJ = {
                    cnpj: event.args.cnpj,
                    razaoSocial: "",
                    contaBlockchain: event.args.addr,
                    hashID: event.transactionHash,
                    uniqueIdentifier: event.transactionHash,                    
                    dataHora: null,
                    hashDeclaracao: "",
                    nomeConta: event.args.idFinancialSupportAgreement,
                    status: "Conta Invalidada por Validador",
                    filePathAndName: "",                    
                    perfil: ""
                }

                self.includeIfNotExists(transacaoPJ);
                self.recuperaInfoDerivadaPorCnpj(self, transacaoPJ);                
                self.recuperaDataHora(self, event, transacaoPJ);
//nao tem hash para recuperar arquivo
//                self.recuperaFilePathAndName(self,transacaoPJ);                


            } else {
                console.log("Erro no registro de eventos de invalidacao");
                console.log(error);
            }
        });
        
    }

    //fixme para listatransacoesJson
    includeIfNotExists(transacaoPJ) {
        let result = this.listaTransacoesPJ.find(tr => tr.uniqueIdentifier == transacaoPJ.uniqueIdentifier);
        if (!result) this.listaTransacoesPJ.push(transacaoPJ);        

    }
*/
/*
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
*/

/*
    recuperaInfoDerivadaPorCnpj(self, transacaoPJ) {
        self.pessoaJuridicaService.recuperaEmpresaPorCnpj(transacaoPJ.cnpj).subscribe(
            data => {
                transacaoPJ.razaoSocial = "Erro: Não encontrado";
                if (data && data.dadosCadastrais) {
                    transacaoPJ.razaoSocial = data.dadosCadastrais.razaoSocial;
                  }
                  
                // Colocar dentro da zona do Angular para ter a atualização de forma correta
                self.zone.run(() => {
                    self.estadoLista = "cheia"
                    console.log("inseriu transacao Troca");
                });

            },
            error => {
                console.log("Erro ao buscar dados da empresa");
                transacaoPJ.razaoSocial = "";
                transacaoPJ.contaBlockchain = "";
            });

        if (transacaoPJ.nomeConta != "0") {
            transacaoPJ.perfil="Cliente";            
        }
        else {
            transacaoPJ.perfil="Doador";
        }


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

    recuperaFilePathAndName(self,transacaoPJ) {

        self.fileHandleService.buscaFileInfo(transacaoPJ.cnpj, transacaoPJ.nomeConta, 
            transacaoPJ.contaBlockchain, transacaoPJ.hashDeclaracao, "declaracao").subscribe(
            result => {
              if (result && result.pathAndName) {
                transacaoPJ.filePathAndName=ConstantesService.serverUrlRoot+result.pathAndName;
              }
              else {
                let texto = "Não foi possível encontrar informações associadas ao arquivo desse cadastro.";
                console.log(texto);
                Utils.criarAlertaAcaoUsuario( self.bnAlertsService, texto);       
              }                  
            }, 
            error => {
              let texto = "Erro ao buscar dados de arquivo";
              console.log(texto);
              console.log("cnpj=" + transacaoPJ.cnpj);
              console.log("nomeConta=" + transacaoPJ.nomeConta);
              console.log("contaBlockchain=" + transacaoPJ.contaBlockchain);
            }) //fecha busca fileInfo


    }
*/
}
