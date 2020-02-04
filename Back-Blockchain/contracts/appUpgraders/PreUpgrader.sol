pragma solidity ^0.5.0;

import "../appChangeManagementUpgrade/Upgrader.sol";
import "../appChangeManagementUpgrade/ChangeManagement.sol";
import "../appChangeManagementUpgrade/Resolver.sol";
import "../appChangeManagementUpgrade/Storage.sol";
import "../BNDESRegistry.sol";


contract PreUpgrader is Upgrader {

    address public changeManagementAddr;
    ChangeManagement public changeManagementInstance;
    Resolver public resolverInstance;
    Storage public storageContractInstance;
    LegalEntityMapping public legalEntityMappingInstance;
    BNDESRegistry public bndesRegistryInstance;


    constructor(address _changeManagementAddr, address _resolverAddr, address _storageContractAddr,
            address _legalEntityMappingAddr, address _bndesRegistryAddr) public {
        
        changeManagementAddr = _changeManagementAddr;
        changeManagementInstance = ChangeManagement(_changeManagementAddr);
        resolverInstance = Resolver(_resolverAddr);
        storageContractInstance = Storage(_storageContractAddr);
        legalEntityMappingInstance = LegalEntityMapping(_legalEntityMappingAddr);
        bndesRegistryInstance = BNDESRegistry(_bndesRegistryAddr);
    }


    modifier onlyChangeManagement() {
        require(msg.sender==changeManagementAddr, "PreUpgrader - This function can only be executed by the ChangeManagement");
        _;
    }

    function upgrade () external onlyChangeManagement {

        storageContractInstance.addHandler(address(legalEntityMappingInstance));
        legalEntityMappingInstance.addHandler(address(bndesRegistryInstance));
        resolverInstance.changeContract("BNDESRegistry", address(bndesRegistryInstance));

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