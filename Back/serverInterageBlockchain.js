const ethers = require('ethers');
const config = require('./config.json');
const contrato_json_BNDESRegistry = require(config.infra.contrato_json_BNDESRegistry);
const ABI = contrato_json_BNDESRegistry['abi'];

main();

    async function main() {

        console.log("inicio serverblockchain.js");

        // Connect to the network
        let provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:9545/");        
        //let provider = ethers.getDefaultProvider('rinkeby');
        
        provider.getBlockNumber().then((blockNumber) => {
            console.log("Current block number: " + blockNumber);
        });
        
        // The address from the above deployment example
        let contractAddress = config.endereco_BNDESRegistry;
        
        // We connect to the Contract using a Provider, so we will only
        // have read-only access to the Contract
        let contract = new ethers.Contract(contractAddress, ABI, provider);
        //console.log(contract);
        
        console.log("chamarah o metodo do contrato");
        await contract.getResponsibleForSettlement();
        //console.log(value);
        
        

    };

    
    