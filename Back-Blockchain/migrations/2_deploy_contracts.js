var BNDESRegistry = artifacts.require("./BNDESRegistry.sol");
var BNDESToken = artifacts.require("./BNDESToken.sol");

module.exports = async (deployer) => {
	await deployer.deploy(BNDESRegistry, {gas: 6721975})    
    await deployer.deploy(BNDESToken, BNDESRegistry.address, 2 ) 
	BNDESRegistryInstance = await BNDESRegistry.deployed();
	BNDESTokenInstance = await BNDESToken.deployed();
	await BNDESRegistryInstance.setTokenAddress(BNDESTokenInstance.address);	
	
};