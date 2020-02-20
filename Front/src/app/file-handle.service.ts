import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ConstantesService } from './ConstantesService';

import { Utils } from './shared/utils';

import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/do';


@Injectable()
export class FileHandleService {

  serverUrl: string;
  operationAPIURL: string;


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

  

    private handleError(err: HttpErrorResponse) {
      console.log("handle errror em PJService");
      console.log(err);
      return Observable.throw(err.message);
    }          

}
