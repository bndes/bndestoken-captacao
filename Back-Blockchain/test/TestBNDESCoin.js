var BNDESToken      = artifacts.require("./BNDESToken.sol");
var BNDESRegistry   = artifacts.require("./BNDESRegistry.sol");
var expectThrow     = require('./helper.js');
var coin;
var cnpjCliente = 2222;
var cnpjDonor = 3333;
var subCreditoCliente = 12345670001;
var subcredito2 = 12345670002;
var subcreditoFornecedor = 0;
var cnpjOrigemVazio = 0;
var isNotRepassador = false;

contract('BNDESToken', function (accounts) {

  var bndesAddr = accounts[0];
  var clienteAddr = accounts[1];
  var donorAddr = accounts[2];
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

  it("should create a DONOR BNDESToken registration", async () => {

    let idProofHash = "e96c7ffef33869246069ebcb32bc72a59fb488c4893c9eb9b3306de7ba74f6d8"
    await bndesTokenInstance.registryLegalEntity( cnpjDonor, 0, idProofHash, { from: donorAddr } );    
    let cnpjReturned = await bndesRegistryInstance.getCNPJ(donorAddr);
    assert.equal(cnpjReturned, cnpjDonor, "The retrieved CNPJ should be " + cnpjDonor );    

  });   

   it("should check BNDESRegistry DONOR validation", async () => {

    let validatedDonor = await bndesRegistryInstance.isValidatedDonor( donorAddr );
    assert.equal(validatedDonor, false, "The DONOR should NOT be valid " + donorAddr );    

  });  

   it("should validate a DONOR BNDESRegistry registration", async () => {

    let idProofHash = "e96c7ffef33869246069ebcb32bc72a59fb488c4893c9eb9b3306de7ba74f6d8"
    await bndesRegistryInstance.validateRegistryLegalEntity( donorAddr, idProofHash );    
    let validatedDonor = await bndesRegistryInstance.isValidatedDonor( donorAddr );
    assert.equal(validatedDonor, true, "The DONOR should be valid " + donorAddr );    

  });  

  
   it("should create a CLIENT BNDESToken registration", async () => {

    let idProofHash = "35c3ad1f0a2e1c105effb946a06ddc53abcee2b92ffb97043325818290f0e99f"
    await bndesTokenInstance.registryLegalEntity( cnpjCliente, subCreditoCliente, idProofHash, { from: clienteAddr } );    
    let cnpjReturned = await bndesRegistryInstance.getCNPJ(clienteAddr);
    assert.equal(cnpjReturned, cnpjCliente, "The retrieved CNPJ should be " + cnpjCliente );    

  });   

   it("should check BNDESRegistry CLIENT validation", async () => {

    let validatedClient = await bndesRegistryInstance.isValidatedClient( clienteAddr );
    assert.equal(validatedClient, false, "The CLIENT should NOT be valid " + clienteAddr );    

  });  

   it("should validate a CLIENT BNDESRegistry registration", async () => {

    let idProofHash = "35c3ad1f0a2e1c105effb946a06ddc53abcee2b92ffb97043325818290f0e99f"
    await bndesRegistryInstance.validateRegistryLegalEntity( clienteAddr, idProofHash );    
    let validatedClient = await bndesRegistryInstance.isValidatedClient( clienteAddr );
    assert.equal(validatedClient, true, "The CLIENT should be valid " + clienteAddr );    

  });  

  it("should book a donation", async () => {
    
    let amount = 10000;
    await bndesTokenInstance.bookDonation( amount , { from: donorAddr } );        
    let amountReturned = await bndesTokenInstance.bookedBalanceOf(donorAddr);
    assert.equal(amountReturned, amount, "The DONOR should have a booked balance of " + amount + " but found " + amountReturned);    
    
  });  

  /*
  it("should run a BNDESToken simple transaction", async () => {
    
    //await bndesTokenInstance.redeem(bndesTokenInstance.address, 0);    
    
    
  });  
 */ 
  
  
  
});

