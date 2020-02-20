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
  public uploader: FileUploader;  

  constructor(private http: HttpClient, private constantes: ConstantesService) {

    this.serverUrl = ConstantesService.serverUrl;

    this.http.post<Object>(this.serverUrl + 'constantesFrontPJ', {}).subscribe(

      data => {

        this.operationAPIURL = data["operationAPIURL"];

      },
      error => {
          console.log("**** Erro ao buscar constantes do front");
      });

    console.log("FileServiceService.ts :: Selecionou URL = " + this.serverUrl)

  }


  buscaFileInfo(cnpj: string, contrato: string, blockchainAccount: string): Observable<any> {

    let str_cnpj = new String(cnpj);

    if (str_cnpj.length < 14) {
      str_cnpj = Utils.completarCnpjComZero(str_cnpj)
    }
    return this.http.post<Object>(this.serverUrl + 'fileinfo', { cnpj: str_cnpj, contrato: contrato, blockchainAccount: blockchainAccount })
      .catch(this.handleError);
  }

  atualizaUploaderComponent(_cnpj, _contrato, _contaBlockchain, componenteComDeclaracao) {
    let self = this;
    this.uploader = new FileUploader({ 
                          url: ConstantesService.serverUrl + "upload",                          
                          additionalParameter: {
                                cnpj:             _cnpj,
                                contrato:         _contrato,
                                contaBlockchain:  _contaBlockchain
                              },
                          
                          itemAlias:  "arquivo"});
    this.uploader.onAfterAddingFile = (fileItem) => 
    { fileItem.withCredentials = false;      
    };

    this.uploader.onCompleteItem = (item:any, response:any, status:any, headers:any) => {
             console.log("upload feito.", item, status, response);
             componenteComDeclaracao.hashdeclaracao = response.toString().replace('\"','').replace('\"','');
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