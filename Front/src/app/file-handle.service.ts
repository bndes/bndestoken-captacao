import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ConstantesService } from './ConstantesService';

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


  cadastraDeclaracao(dadosArquivo, declaracao) : void {

    let formData:FormData = new FormData();
    formData.append('declaracao', declaracao, declaracao.name);
    formData.append('pasta', dadosArquivo.nome_tecnico + '-' + dadosArquivo._id);

    this.http.post<Object>(this.serverUrl + 'declaracao', formData)
      .catch(this.handleError);
    
  };

          
    private handleError(err: HttpErrorResponse) {
      console.log("handle errror em PJService");
      console.log(err);
      return Observable.throw(err.message);
    }          

}
