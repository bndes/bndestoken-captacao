var Governance = artifacts.require("./appGovernanceUpgrade/Governance.sol");
var UpgraderInfo = artifacts.require("./appGovernanceUpgrade/UpgraderInfo.sol");
var Resolver = artifacts.require("./appGovernanceUpgrade/Resolver.sol");

var PreUpgrader1 = artifacts.require("./appUpgraders/PreUpgrader1.sol");
var PreUpgrader2 = artifacts.require("./appUpgraders/PreUpgrader2.sol");
var PreUpgrader3A = artifacts.require("./appUpgraders/PreUpgrader3A.sol");
var PreUpgrader3B = artifacts.require("./appUpgraders/PreUpgrader3B.sol");
var Upgrader1 = artifacts.require("./appUpgraders/upgrader1.sol");
var Upgrader2 = artifacts.require("./appUpgraders/Upgrader2.sol");

var BNDESRegistry = artifacts.require("./BNDESRegistry.sol");


module.exports = async (deployer, network, accounts) => {

    let governanceAddr;
    let governanceInstance;
    let resolver;
    let bndesRegistry;

    let preUpgrader1;
    let preUpgrader2;
    let preUpgrader3A;
    let preUpgrader3B;

    //PreUpgrader1 - governance
    let governanceMembersId = [];
    preUpgrader1 = await PreUpgrader1.new(accounts[0],accounts[0],governanceMembersId, accounts[0]);
    governanceAddr = await preUpgrader1.governanceAddr();
    governanceInstance = await Governance.at(governanceAddr);
    
    //PreUpgrader2 - resolver + storage
    let hashChangeMotivation = web3.utils.asciiToHex('justification preUpgrader2');
    preUpgrader2 = await PreUpgrader2.new(preUpgrader1.address);    
    let upgraderContractAddr = preUpgrader2.address;
    await governanceInstance.createNewChange(hashChangeMotivation, [upgraderContractAddr], 0);
    await governanceInstance.executeChange(0);

    //PreUpgrader3 - legalEntity + BndesRegistry
    preUpgrader3A = await PreUpgrader3A.new(preUpgrader2.address);
    preUpgrader3B = await PreUpgrader3B.new(preUpgrader3A.address);
    hashChangeMotivation = web3.utils.asciiToHex('justification upgrader3');
    let upgraderContractAddrA = preUpgrader3A.address;
    let upgraderContractAddrB = preUpgrader3B.address;
    await governanceInstance.createNewChange(hashChangeMotivation, [upgraderContractAddrA, upgraderContractAddrB], 0);
    await governanceInstance.executeChange(1,0);
    await governanceInstance.executeChange(1,1);    
    let resolverAddr = await preUpgrader3B.resolverAddr();
    resolver = await Resolver.at(resolverAddr);
    let bndesRegistryAddrByResolver = await resolver.getAddr("BNDESRegistry");
    bndesRegistry = await BNDESRegistry.at(bndesRegistryAddrByResolver);

    let cnpjConst = 12345678901; //******** */
    await bndesRegistry.registryLegalEntity(cnpjConst);
    let cnpjById = await bndesRegistry.getId(accounts[0]);
    
    
    console.log("ADDR BNDESRegistry");
    console.log(bndesRegistryAddrByResolver);
    console.log("Valores");
    console.log(cnpjConst);
    console.log(cnpjById + "");
    cnpjById = await bndesRegistry.getId(accounts[1]);
    console.log(cnpjById + "");

};
