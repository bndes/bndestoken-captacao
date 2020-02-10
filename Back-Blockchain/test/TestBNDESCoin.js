var BNDESToken      = artifacts.require("./BNDESToken.sol");
var BNDESRegistry   = artifacts.require("./BNDESRegistry.sol");
var expectThrow     = require('./helper.js');
var coin;
var cnpjCliente = 2222;
var cnpj2 = 3333;
var subCreditoCliente = 12345670001;
var subcredito2 = 12345670002;
var subcreditoFornecedor = 0;
var cnpjOrigemVazio = 0;
var isNotRepassador = false;

contract('BNDESToken', function (accounts) {

  var bndesAddr = accounts[0];
  var clienteAddr = accounts[1];
  var emp2Addr = accounts[2];
  var emp3Addr = accounts[3];

  
  it("should create a BNDESRegistry instance and run a simple call", async () => {

    bndesRegistryInstance = await BNDESRegistry.new();
    let redemptionAddress = await bndesRegistryInstance.getRedemptionAddress.call();
    
    assert.notEqual(redemptionAddress, "0x0", "Address should not be 0x0");
    assert.notEqual(redemptionAddress, undefined, "Address should not be undefined");

  });  

  it("should call the owner of BNDESRegistry instance", async () => {
    
    let ownerAddress = await bndesRegistryInstance.owner.call();
   
    assert.notEqual(ownerAddress, "0x0", "Address should not be 0x0");
    assert.notEqual(ownerAddress, undefined, "Address should not be undefined");

  });    
  
  it("should run a BNDESRegistry simple transaction", async () => {
    
    await bndesRegistryInstance.setResponsibleForDisbursement(bndesAddr);    
    
  });    
  
  it("should create a BNDESToken instance and run a simple call", async () => {

    bndesTokenInstance = await BNDESToken.new(bndesRegistryInstance.address, 2);
    let decimals = await bndesTokenInstance.getDecimals.call();
    
    assert.equal(decimals, 2, "The decimals number should be 2");    

  });      

   it("should set a reference to BNDESToken in the BNDESRegistry", async () => {
   
    await bndesRegistryInstance.setTokenAddress( bndesTokenInstance.address );    

  });     

   it("should create a BNDESToken registration", async () => {

    let idProofHash = "35c3ad1f0a2e1c105effb946a06ddc53abcee2b92ffb97043325818290f0e99f"
    await bndesTokenInstance.registryLegalEntity( cnpjCliente, subCreditoCliente, idProofHash, { from: clienteAddr } );    
    let cnpjReturned = await bndesRegistryInstance.getCNPJ(clienteAddr);
    assert.equal(cnpjReturned, cnpjCliente, "The retrieved CNPJ should be " + cnpjCliente );    

  });   
/*
   it("should validate a BNDESToken registration", async () => {

    let idProofHash = "35c3ad1f0a2e1c105effb946a06ddc53abcee2b92ffb97043325818290f0e99f"
    //function validateRegistryLegalEntity(address addr, string memory idProofHash) public {
    await bndesRegistryInstance.validateRegistryLegalEntity( clienteAddr, idProofHash );    
    let cnpjReturned = await bndesRegistryInstance.getCNPJ( clienteAddr );
    assert.equal(cnpjReturned, cnpjCliente, "The retrieved CNPJ should be " + cnpjCliente );    

  });  
*/
  /*
  it("should run a BNDESToken simple transaction", async () => {
    
    //await bndesTokenInstance.redeem(bndesTokenInstance.address, 0);    
    
    
  });  
 */ 
  
  
  
});

