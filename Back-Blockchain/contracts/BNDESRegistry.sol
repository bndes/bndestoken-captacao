pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";

import "./appCommonUpgrade/IdRegistry.sol";
import "./appChangeManagementUpgrade/Updatable.sol";

import "./LegalEntityMapping.sol";

contract BNDESRegistry is Updatable {


    LegalEntityMapping public legalEntityMapping;

    address public bndesReserveAccountAddress;
    address public responsibleForRegistryValidation;
    address public responsibleForDisbursement;
    address public responsibleForSettlement;
    address public redemptionAddress;
    address public tokenAddress;


    event AccountRegistration(address addr, uint cnpj, uint idFinancialSupportAgreement, string idProofHash);
    event AccountChange(address oldAddr, address newAddr, uint cnpj, uint64 idFinancialSupportAgreement, string idProofHash);
    event AccountValidation(address addr, uint cnpj, uint idFinancialSupportAgreement);
    event AccountInvalidation(address addr, uint cnpj, uint idFinancialSupportAgreement);

    /**
        Links Ethereum addresses to the possibility to change the account
        Since the Ethereum account can be changed once, it is not necessary to put the bool to false.
        TODO: Discuss later what is the best data structure
     */
    mapping(address => bool) public legalEntitiesChangeAccount;


    constructor (address upgraderInfo, address legalEntityMappingAddr) Updatable (upgraderInfo) public {
        legalEntityMapping = LegalEntityMapping(legalEntityMappingAddr);
    }

    function setLegalEntityMapping (address newAddr) public onlyAllowedUpgrader {
        legalEntityMapping = LegalEntityMapping(newAddr);
    }

    function registryLegalEntity(uint64 id) public {
        legalEntityMapping.setId(msg.sender, id);
    }

    //Implemented because of IdRegistry
    function getId(address addr) external view returns (uint) {
        return legalEntityMapping.getId(addr);
    }

    function kill() external onlyAllowedUpgrader {
        selfdestruct(address(0));
    }

/*
//TEST
    function isAvailable(address addr) public view returns (bool) {
        return legalEntityMapping.isAvailable(addr);
    }
*/

}