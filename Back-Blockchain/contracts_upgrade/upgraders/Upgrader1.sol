pragma solidity ^0.5.0;

import "../appChangeManagementUpgrade/Upgrader.sol";
import "../appChangeManagementUpgrade/ChangeManagement.sol";
import "../appChangeManagementUpgrade/Storage.sol";
import "../appChangeManagementUpgrade/Resolver.sol";

import {PreUpgrader as LastUpgrader} from '../appUpgraders/PreUpgrader.sol';
import "../appTestUpgrade/LegalEntityMapping.sol";
import "../appTestUpgrade/BNDESRegistryApp.sol";


contract Upgrader1 is Upgrader {

    LastUpgrader lastUpgrader;
    
    address public changeManagementAddr;
    ChangeManagement public changeManagementInstance;
    Resolver public resolverInstance;
    Storage public storageContractInstance;
    LegalEntityMapping public legalEntityMappingInstance;
    BNDESRegistryApp public bndesRegistryInstance;

    constructor (address lastUpgraderAddr) public {
       
        lastUpgrader = LastUpgrader(lastUpgraderAddr);
        changeManagementInstance = ChangeManagement(lastUpgrader.getChangeManagementAddr());
        resolverInstance = Resolver(lastUpgrader.getResolverAddr());
        storageContractInstance = Storage(lastUpgrader.getStorageContractAddr());
        legalEntityMappingInstance = LegalEntityMapping(lastUpgrader.getLegalEntityMappingAddr());
        bndesRegistryInstance = BNDESRegistryApp(lastUpgrader.getBNDESRegistryAddr());
    }

    modifier onlyChangeManagement() {
        require(msg.sender==changeManagementAddr, "Upgrader 1 - This function can only be executed by the ChangeManagement");
        _;
    }

    function upgrade () external onlyChangeManagement {

        //Change data in storage
        address ownerOfCMAddr = changeManagementInstance.owner();

        legalEntityMappingInstance.addHandler(address(this));

        legalEntityMappingInstance.setId(ownerOfCMAddr, 666);

        legalEntityMappingInstance.removeHandler(address(this));
    }


    function getChangeManagementAddr() public view returns (address) {
        return changeManagementAddr;
    }

    function getResolverAddr() public view returns (address) {
        return address(resolverInstance);
    }

    function getStorageContractAddr() public view returns (address) {
        return address(storageContractInstance);
    }

    function getLegalEntityMappingAddr() public view returns (address) {
        return address(legalEntityMappingInstance);
    }

    function getBNDESRegistryAddr() public view returns (address) {
        return address(bndesRegistryInstance);
    }

}
