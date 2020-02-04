pragma solidity ^0.5.0;

import "./appChangeManagementUpgrade/Storage.sol";
import "./appChangeManagementUpgrade/UpdatableHandleable.sol";

/*
    Links Legal Entity to Ethereum address.
    cnpj + idFinancialSupportAgreement => address
     
    mapping(uint => mapping(uint => address)) cnpjFSAddr;

*/
contract ReverseLegalEntityClientMapping is UpdatableHandleable {

    Storage storageContract;

    constructor (address upgraderInfo, address storageContractAddr) UpdatableHandleable (upgraderInfo) public {
        storageContract = Storage(storageContractAddr);
    }

//Address
    function getAddress(uint id, uint idFinancialSupportAgreement) view public returns (address) {
        bytes32 key = keccak256(abi.encodePacked("ReverseLegalEntityClientMapping",id, idFinancialSupportAgreement,"address"));
        return storageContract.getAddress(key);
    }

    function setAddress(uint id, uint idFinancialSupportAgreement, address addr) public onlyHandler {
        bytes32 key = keccak256(abi.encodePacked("ReverseLegalEntityClientMapping",id, idFinancialSupportAgreement,"address"));
        storageContract.setAddress(key, addr);
    }

//TODO: FALTA SUBIR ESSA CLASSE NO preUpgrader


}
