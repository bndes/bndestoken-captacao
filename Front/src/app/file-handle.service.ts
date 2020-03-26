import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ConstantesService } from './ConstantesService';
import { FileUploader } from 'ng2-file-upload';

import { Utils } from './shared/utils';

import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/do';


@Injectable()
export class FileHandleService {

  serverUrl: string;
  operationAPIURL: string;
  maxFileSize : number;
  CAMINHO_MODELO_DECLARACAO_CONTA_DIGITAL: string;
  CAMINHO_ROTEIRO_ASSINATURA_DIGITAL: string;

  public uploader: FileUploader;  

  constructor(private http: HttpClient, private constantes: ConstantesService) {

    this.serverUrl = ConstantesService.serverUrl;

    this.http.post<Object>(this.serverUrl + 'constantesFrontPJ', {}).subscribe(

      data => {

        this.operationAPIURL = data["operationAPIURL"];
        this.maxFileSize = data["maxFileSize"];
        this.CAMINHO_MODELO_DECLARACAO_CONTA_DIGITAL = data["CAMINHO_MODELO_DECLARACAO_CONTA_DIGITAL"];
        this.CAMINHO_ROTEIRO_ASSINATURA_DIGITAL = data["CAMINHO_ROTEIRO_ASSINATURA_DIGITAL"];		
      },
      error => {
          console.log("**** Erro ao buscar constantes do front");
      });

//    console.log("FileServiceService.ts :: Selecionou URL = " + this.serverUrl);

  }

  getCaminhoModeloDeclaracaoContaDigital(): String {
    return this.CAMINHO_MODELO_DECLARACAO_CONTA_DIGITAL;
  }

  getCaminhoRoteiroAssinaturaDigital(): String {
    return this.CAMINHO_ROTEIRO_ASSINATURA_DIGITAL;
  }

  buscaFileInfo(cnpj: string, contrato: string, blockchainAccount: string, hashFile: string, tipo: string): Observable<any> {

    let str_cnpj = new String(cnpj);

    if (str_cnpj.length < 14) {
      str_cnpj = Utils.completarCnpjComZero(str_cnpj)
    }

    let str_contrato = new String(contrato);
    if (str_contrato.length > 1 && str_contrato.length < 8) {
      str_contrato = Utils.completarContratoComZero(str_contrato)
    }


    return this.http.post<Object>(this.serverUrl + 'fileinfo', { cnpj: str_cnpj, contrato: str_contrato, 
      blockchainAccount: blockchainAccount, hashFile: hashFile, tipo: tipo })
      .catch(this.handleError);
  }

  atualizaUploaderComponent(_cnpj, _contrato, _contaBlockchain, _tipo, componenteComDeclaracao) {
    let self = this;
    this.uploader = new FileUploader({ 
                          url: ConstantesService.serverUrl + "upload",                          
                          maxFileSize: this.maxFileSize,
                          additionalParameter: {
                                cnpj:             _cnpj,
                                contrato:         _contrato,
                                contaBlockchain:  _contaBlockchain,
                                tipo: _tipo
                              },
                          
                          itemAlias:  "arquivo"});
    this.uploader.onAfterAddingFile = (fileItem) => 
    { fileItem.withCredentials = false;      
    };

    this.uploader.onWhenAddingFileFailed = (fileItem) => {
       console.log("fail upload: max file size exceeded! ", fileItem);
       componenteComDeclaracao.hashdeclaracao = "ERRO! Arquivo muito grande! Tente enviar um arquivo menor.";
        //this.failFlag = true;
    }

    this.uploader.onCompleteItem = (item:any, response:any, status:any, headers:any) => {
             console.log("upload feito.", item, status, response);
             componenteComDeclaracao.hashdeclaracao = response.toString().replace('\"','').replace('\"','');
             componenteComDeclaracao.flagUploadConcluido = true;
        };
  }

  chamaUpload() {
      let self = this
      this.uploader.uploadAll();
      console.log("chamaUpload() - this.uploader")
      console.log(this.uploader)
  }  

          
    private handleError(err: HttpErrorResponse) {
      console.log("handle errror em PJService");
      console.log(err);
      return Observable.throw(err.message);
    }          

}
