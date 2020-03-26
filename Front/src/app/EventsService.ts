import { Injectable  } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConstantesService } from './ConstantesService';
import { ethers } from 'ethers';

@Injectable()
export class EventsService {

    private serverUrl: string;

    private addrContratoBNDESRegistry: string = '';
    private addrContratoBNDESToken: string = '';    
    private blockchainNetwork: string = '';
    private ethereum: any;
    private web3Instance: any;                  // Current instance of web3

    private bndesTokenSmartContract: any;
    private bndesRegistrySmartContract: any;

    // Application Binary Interface so we can use the question contract
    private ABIBndesToken;
    private ABIBndesRegistry;
    

constructor(private http: HttpClient, private constantes: ConstantesService) {
       

    this.serverUrl = ConstantesService.serverUrl;
    console.log("########### EventsService.ts :: Selecionou URL = " + this.serverUrl)

    this.http.post<Object>(this.serverUrl + 'constantesFront', {}).subscribe(
        data => {

            this.addrContratoBNDESRegistry = data["addrContratoBNDESRegistry"];
            this.addrContratoBNDESToken = data["addrContratoBNDESToken"];
            this.blockchainNetwork = data["blockchainNetwork"];
            this.ABIBndesToken = data['abiBNDESToken'];
            this.ABIBndesRegistry = data['abiBNDESRegistry'];

//            console.log("###########  abis EventsService");
//            console.log(this.ABIBndesRegistry);

            let provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:9545/");        
            this.bndesRegistrySmartContract = new ethers.Contract(this.addrContratoBNDESRegistry, 
                this.ABIBndesRegistry, provider);
 
//            console.log("###########");
//            console.log(bndesRegistrySmartContract);

//            this.intializeWeb3();
//            this.inicializaQtdDecimais();

        },
        error => {
            console.log("**** Erro ao buscar constantes do front");
        });
    }


    public registraEventosCadatro(callback) {

        this.bndesRegistrySmartContract.on("AccountRegistration", callback);

    }


    public getInfoBlockchainNetwork(): any {

        let blockchainNetworkAsString = "Localhost";
        let blockchainNetworkPrefix = "";
        if (this.blockchainNetwork=="4") {
            blockchainNetworkAsString = "Rinkeby";
            blockchainNetworkPrefix = "rinkeby."
        }
        else if (this.blockchainNetwork=="1") {
            blockchainNetworkAsString = "Mainnet";
        }

        return {
            blockchainNetwork:this.blockchainNetwork,
            blockchainNetworkAsString:blockchainNetworkAsString,
            blockchainNetworkPrefix: blockchainNetworkPrefix,
            contractAddr: this.addrContratoBNDESToken 
        };
    }   
    
    
}