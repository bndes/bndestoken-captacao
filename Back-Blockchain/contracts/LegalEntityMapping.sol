pragma solidity ^0.5.0;

import "./appGovernanceUpgrade/Storage.sol";
import "./appGovernanceUpgrade/UpdatableHandleable.sol";

/*
    struct LegalEntityInfo {
        uint64 id; //Brazilian identification of legal entity (cnpj)
        string idProofHash; //hash of declaration
        BlockchainAccountState state;
        Role role;
        uint64 idFinancialSupportAgreement; //SCC contract (only to clients)
    }
    
    //Links Ethereum addresses to LegalEntityInfo
    mapping(address => LegalEntityInfo) public legalEntitiesInfo;

    The user should registry once for each role.
    The client should registry once for EACH contract in order to segregate the money to each project --- TODO: improve this

*/
contract LegalEntityMapping is UpdatableHandleable {

    /**
        The account of clients and suppliers are assigned to states.
        AVAILABLE - The account is not yet assigned any role (any of them - client, supplier or any reserved addresses).
        WAITING_VALIDATION - The account was linked to a legal entity but it still needs to be validated
        VALIDATED - The account was validated
        INVALIDATED_BY_VALIDATOR - The account was invalidated
        INVALIDATED_BY_CHANGE - The client or supplier changed the ethereum account so the original one must be invalidated.
     */
    enum BlockchainAccountState {AVAILABLE,WAITING_VALIDATION,VALIDATED,INVALIDATED_BY_VALIDATOR,INVALIDATED_BY_CHANGE}
    BlockchainAccountState blockchainStateEnum; //Not used. Defined to create the enum type.

    enum Role {DONOR, CLIENT, SUPPLIER, OTHER}
    Role roleEnum; //Not used. Defined to create the enum type


    Storage storageContract;

    constructor (address upgraderInfo, address storageContractAddr) UpdatableHandleable (upgraderInfo) public {
        storageContract = Storage(storageContractAddr);
    }

//Id
    function getId(address addrLegalEntity) view public returns (uint) {
        bytes32 key = keccak256(abi.encodePacked("LegalEntityInfo",addrLegalEntity,"id"));
        return storageContract.getUint(key);
    }

    function setId(address addrLegalEntity, uint id) public onlyHandler {
        bytes32 key = keccak256(abi.encodePacked("LegalEntityInfo",addrLegalEntity,"id"));
        storageContract.setUint(key, id);
    }

//IdProofHash
    function getIdProofHash(address addrLegalEntity) view public returns (string memory) {
        bytes32 key = keccak256(abi.encodePacked("LegalEntityInfo",addrLegalEntity,"idProofHash"));
        return storageContract.getString(key);
    }

    function setIdProofHash(address addrLegalEntity, string memory idProofHash) public onlyHandler {
        bytes32 key = keccak256(abi.encodePacked("LegalEntityInfo",addrLegalEntity,"idProofHash"));
        storageContract.setString(key, idProofHash);
    }

//State
    function isAvailable(address addrLegalEntity) view public returns (bool) {
        return _getStateAsUint(addrLegalEntity) == 0;
    }

    function isWaitingValidation(address addrLegalEntity) view public returns (bool) {
        BlockchainAccountState state = BlockchainAccountState.WAITING_VALIDATION;
        return _getStateAsUint(addrLegalEntity) == (uint) (state);
    }

    function isValidated(address addrLegalEntity) view public returns (bool) {
        BlockchainAccountState state = BlockchainAccountState.VALIDATED;
        return _getStateAsUint(addrLegalEntity) == (uint) (state);
    }

    function isInvalidatedByValidator(address addrLegalEntity) view public returns (bool) {
        BlockchainAccountState state = BlockchainAccountState.INVALIDATED_BY_VALIDATOR;
        return _getStateAsUint(addrLegalEntity) == (uint) (state);
    }

    function isValidatedByChange(address addrLegalEntity) view public returns (bool) {
        BlockchainAccountState state = BlockchainAccountState.INVALIDATED_BY_CHANGE;
        return _getStateAsUint(addrLegalEntity) == (uint) (state);
    }

    function _getStateAsUint(address addrLegalEntity) view private returns (uint) {
        bytes32 key = keccak256(abi.encodePacked("LegalEntityInfo",addrLegalEntity,"state"));
        return storageContract.getUint(key);
    }

    function _setStateAsUint(address addrLegalEntity, uint id) private onlyHandler {
        bytes32 key = keccak256(abi.encodePacked("LegalEntityInfo",addrLegalEntity,"state"));
        storageContract.setUint(key, id);
    }

//IdFinancialSupportAgreement
    function getIdFinancialSupportAgreement(address addrLegalEntity) view public returns (uint) {
        bytes32 key = keccak256(abi.encodePacked("LegalEntityInfo",addrLegalEntity,"idFinancialSupportAgreement"));
        return storageContract.getUint(key);
    }

    function setIdFinancialSupportAgreement(address addrLegalEntity, uint id) public onlyHandler {
        bytes32 key = keccak256(abi.encodePacked("LegalEntityInfo",addrLegalEntity,"idFinancialSupportAgreement"));
        storageContract.setUint(key, id);
    }

//Role
    function _getRoleAsUint(address addrLegalEntity) view private returns (uint) {
        bytes32 key = keccak256(abi.encodePacked("LegalEntityInfo",addrLegalEntity,"role"));
        return storageContract.getUint(key);
    }

    function _setRoleAsUint(address addrLegalEntity, uint id) private onlyHandler {
        bytes32 key = keccak256(abi.encodePacked("LegalEntityInfo",addrLegalEntity,"role"));
        storageContract.setUint(key, id);
    }

    function isDonor(address addrLegalEntity) view public returns (bool) {
        Role role = Role.DONOR;
        return _getRoleAsUint(addrLegalEntity) == (uint) (role);
    }

    function isClient(address addrLegalEntity) view public returns (bool) {
        Role role = Role.CLIENT;
        return _getRoleAsUint(addrLegalEntity) == (uint) (role);
    }

    function isSupplier(address addrLegalEntity) view public returns (bool) {
        Role role = Role.SUPPLIER;
        return _getRoleAsUint(addrLegalEntity) == (uint) (role);
    }

    function isOtherRole(address addrLegalEntity) view public returns (bool) {
        Role role = Role.OTHER;
        return _getRoleAsUint(addrLegalEntity) == (uint) (role);
    }

}