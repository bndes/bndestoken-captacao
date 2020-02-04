var ChangeManagement = artifacts.require("./appGovernanceUpgrade/ChangeManagement.sol");
var Resolver = artifacts.require("./appGovernanceUpgrade/Resolver.sol");
var Storage = artifacts.require("./appGovernanceUpgrade/Storage.sol");
var BNDESRegistry = artifacts.require("./BNDESRegistry.sol");
var LegalEntityMapping = artifacts.require("./LegalEntityMapping.sol");
var PreUpgrader = artifacts.require("./appUpgraders/PreUpgrader.sol");

module.exports = async (deployer, network, accounts) => {

    let adminOfNewContractsAddr = accounts[0];

    let changeManagementInstance = await ChangeManagement.new(adminOfNewContractsAddr);
    console.log("ChangeManagement=" + changeManagementInstance.address);

    let uiAddr = await changeManagementInstance.upgraderInfoAddr();
    let resolverInstance = await Resolver.new(uiAddr);
    console.log("Resolver=" + resolverInstance.address);    
 
    let storageContractInstance = await Storage.new(uiAddr);
    console.log("Storage=" + storageContractInstance.address);

    let legalEntityMappingInstance = await LegalEntityMapping.new(uiAddr,storageContractInstance.address);
    console.log("LegalEntityMapping=" + legalEntityMappingInstance.address);

    let bndesRegistryInstance = await BNDESRegistry.new(uiAddr, legalEntityMappingInstance.address);
    console.log("BNDESRegistry=" + bndesRegistryInstance.address);

    console.log("*** --- Add Pausers --- ***");    
    let changeManagementOwner = await changeManagementInstance.owner();
    if (changeManagementOwner!=adminOfNewContractsAddr) {
        await changeManagementInstance.addPauser(adminOfNewContractsAddr);
        await resolverInstance.addPauser(adminOfNewContractsAddr);
        await storageContractInstance.addPauser(adminOfNewContractsAddr);
        await legalEntityMappingInstance.addPauser(adminOfNewContractsAddr);
        await bndesRegistryInstance.addPauser(adminOfNewContractsAddr);
    }
    await bndesRegistryInstance.addPauser(resolverInstance.address);

    console.log("*** --- Pre Upgrader --- ***"); 
    let preUpgrader = await PreUpgrader.new(changeManagementInstance.address, resolverInstance.address, storageContractInstance.address,
            legalEntityMappingInstance.address, bndesRegistryInstance.address);
    let hashChangeMotivation = web3.utils.asciiToHex('justification preUpgrader');
    let upgraderContractAddr = preUpgrader.address;
    await changeManagementInstance.createNewChange(hashChangeMotivation, [upgraderContractAddr]);
    await changeManagementInstance.executeChange(0);

    console.log("Final");

    //TESTS
    let cnpjConst = 12345678901; //******** * /
    await bndesRegistryInstance.registryLegalEntity(cnpjConst);
    let cnpjById = await bndesRegistryInstance.getId(accounts[0]);
    console.log("\n*** Valores de testes *** ");
    console.log(cnpjById + "");
};
