pragma solidity ^0.5.0;

//import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import '@openzeppelin/contracts/ownership/Ownable.sol';
import '@openzeppelin/contracts/lifecycle/Pausable.sol';

contract BNDESRegistry is Ownable() {

    /**
        The account of clients and suppliers are assigned to states. 
        Reserved accounts (e.g. from BNDES and ANCINE) do not have state.
        AVAILABLE - The account is not yet assigned any role (any of them - client, donor or any reserved addresses).
        WAITING_VALIDATION - The account was linked to a legal entity but it still needs to be validated
        VALIDATED - The account was validated
        INVALIDATED_BY_VALIDATOR - The account was invalidated
        INVALIDATED_BY_CHANGE - The client or donor changed the ethereum account so the original one must be invalidated.
     */
    enum BlockchainAccountState {AVAILABLE,WAITING_VALIDATION,VALIDATED,INVALIDATED_BY_VALIDATOR,INVALIDATED_BY_CHANGE} 
    BlockchainAccountState blockchainState; //Not used. Defined to create the enum type.

    address public responsibleForSettlement;
    address public responsibleForRegistryValidation;
    address public responsibleForDonationConfirmation;
    address public responsibleForDisbursement;
    address public disbursementAddress;
    address public tokenAddress;

    /**
        Describes the Legal Entity - clients or donors
     */
    struct LegalEntityInfo {
        uint64 cnpj; //Brazilian identification of legal entity
        uint64 idFinancialSupportAgreement; //SCC contract        
        string idProofHash; //hash of declaration
        BlockchainAccountState state;
    } 

    /**
        Links Ethereum addresses to LegalEntityInfo        
     */
    mapping(address => LegalEntityInfo) public legalEntitiesInfo;

    /**
        Links Legal Entity to Ethereum address. 
        cnpj => (idFinancialSupportAgreement => address)
     */
    mapping(uint64 => mapping(uint64 => address)) public cnpjFSAddr; 


    /**
        Links Ethereum addresses to the possibility to change the account
        Since the Ethereum account can be changed once, it is not necessary to put the bool to false.
        TODO: Discuss later what is the best data structure
     */
    mapping(address => bool) public legalEntitiesChangeAccount;


    event AccountRegistration(address addr, uint64 cnpj, uint64 idFinancialSupportAgreement, string idProofHash);
    event AccountChange(address oldAddr, address newAddr, uint64 cnpj, uint64 idFinancialSupportAgreement, string idProofHash);
    event AccountValidation(address addr, uint64 cnpj, uint64 idFinancialSupportAgreement);
    event AccountInvalidation(address addr, uint64 cnpj, uint64 idFinancialSupportAgreement);

    /**
     * @dev Throws if called by any account other than the token address.
     */
    modifier onlyTokenAddress() {
        require(isTokenAddress());
        _;
    }

    constructor() public {
        responsibleForSettlement = msg.sender;
        responsibleForRegistryValidation = msg.sender;
        responsibleForDisbursement = msg.sender;
        disbursementAddress = msg.sender;
        responsibleForDonationConfirmation = msg.sender;
    }


   /**
    * Link blockchain address with CNPJ - It can be a cliente or a donor
    * The link still needs to be validated by BNDES
    * This method can only be called by BNDESToken contract because BNDESToken can pause.
    * @param cnpj Brazilian identifier to legal entities
    * @param idFinancialSupportAgreement contract number of financial contract with BNDES. It assumes 0 if it is a donor.
    * @param addr the address to be associated with the legal entity.
    * @param idProofHash The legal entities have to send BNDES a PDF where it assumes as responsible for an Ethereum account. 
    *                   This PDF is signed with eCNPJ and send to BNDES. 
    */
    function registryLegalEntity(uint64 cnpj, uint64 idFinancialSupportAgreement, 
        address addr, string memory idProofHash) onlyTokenAddress public { 

        // Endereço não pode ter sido cadastrado anteriormente
        require (isAvailableAccount(addr), "Endereço não pode ter sido cadastrado anteriormente");

        require (isValidHash(idProofHash), "O hash da declaração é inválido");

        require (isChangeAccountEnabled(addr), "A conta informada não está habilitada para cadastro");

        legalEntitiesInfo[addr] = LegalEntityInfo(cnpj, idFinancialSupportAgreement, idProofHash, BlockchainAccountState.WAITING_VALIDATION);
        
        // Não pode haver outro endereço cadastrado para esse mesmo subcrédito
        if (idFinancialSupportAgreement > 0) {
            address account = getBlockchainAccount(cnpj,idFinancialSupportAgreement);
            require (isAvailableAccount(account), "Cliente já está associado a outro endereço. Use a função Troca.");
        }
        else {
            address account = getBlockchainAccount(cnpj,0);
            require (isAvailableAccount(account), "Fornecedor já está associado a outro endereço. Use a função Troca.");
        }
        
        cnpjFSAddr[cnpj][idFinancialSupportAgreement] = addr;

        emit AccountRegistration(addr, cnpj, idFinancialSupportAgreement, idProofHash);
    }

   /**
    * Changes the original link between CNPJ and Ethereum account. 
    * The new link still needs to be validated by BNDES.
    * This method can only be called by BNDESToken contract because BNDESToken can pause and because there are 
    * additional instructions there.
    * @param cnpj Brazilian identifier to legal entities
    * @param idFinancialSupportAgreement contract number of financial contract with BNDES. It assumes 0 if it is a donor.
    * @param newAddr the new address to be associated with the legal entity
    * @param idProofHash The legal entities have to send BNDES a PDF where it assumes as responsible for an Ethereum account. 
    *                   This PDF is signed with eCNPJ and send to BNDES. 
    */
    function changeAccountLegalEntity(uint64 cnpj, uint64 idFinancialSupportAgreement, 
        address newAddr, string memory idProofHash) onlyTokenAddress public {

        address oldAddr = getBlockchainAccount(cnpj, idFinancialSupportAgreement);
    
        // Tem que haver um endereço associado a esse cnpj/subcrédito
        require(!isReservedAccount(oldAddr), "Não pode trocar endereço de conta reservada");

        require(!isAvailableAccount(oldAddr), "Tem que haver um endereço associado a esse cnpj/subcrédito");

        require(isAvailableAccount(newAddr), "Novo endereço não está disponível");

        require (isChangeAccountEnabled(newAddr), "A conta nova não está habilitada para troca");

        require (isValidHash(idProofHash), "O hash da declaração é inválido");        

        require(legalEntitiesInfo[oldAddr].cnpj==cnpj 
                    && legalEntitiesInfo[oldAddr].idFinancialSupportAgreement ==idFinancialSupportAgreement, 
                    "Dados inconsistentes de cnpj ou subcrédito");

        // Aponta o novo endereço para o novo LegalEntityInfo
        legalEntitiesInfo[newAddr] = LegalEntityInfo(cnpj, idFinancialSupportAgreement, idProofHash, BlockchainAccountState.WAITING_VALIDATION);

        // Apaga o mapping do endereço antigo
        legalEntitiesInfo[oldAddr].state = BlockchainAccountState.INVALIDATED_BY_CHANGE;

        // Aponta mapping CNPJ e Subcredito para newAddr
        cnpjFSAddr[cnpj][idFinancialSupportAgreement] = newAddr;

        emit AccountChange(oldAddr, newAddr, cnpj, idFinancialSupportAgreement, idProofHash); 

    }

   /**
    * Validates the initial registry of a legal entity or the change of its registry
    * @param addr Ethereum address that needs to be validated
    * @param idProofHash The legal entities have to send BNDES a PDF where it assumes as responsible for an Ethereum account. 
    *                   This PDF is signed with eCNPJ and send to BNDES. 
    */
    function validateRegistryLegalEntity(address addr, string memory idProofHash) public {

        require(isResponsibleForRegistryValidation(msg.sender), "Somente o responsável pela validação pode validar contas");

        require(legalEntitiesInfo[addr].state == BlockchainAccountState.WAITING_VALIDATION, "A conta precisa estar no estado Aguardando Validação");

        require(keccak256(abi.encodePacked(legalEntitiesInfo[addr].idProofHash)) == keccak256(abi.encodePacked(idProofHash)), "O hash recebido é diferente do esperado");

        legalEntitiesInfo[addr].state = BlockchainAccountState.VALIDATED;

        emit AccountValidation(addr, legalEntitiesInfo[addr].cnpj, 
            legalEntitiesInfo[addr].idFinancialSupportAgreement);
    }

   /**
    * Invalidates the initial registry of a legal entity or the change of its registry
    * The invalidation can be called at any time in the lifecycle of the address (not only when it is WAITING_VALIDATION)
    * @param addr Ethereum address that needs to be validated
    */
    function invalidateRegistryLegalEntity(address addr) public {

        require(isResponsibleForRegistryValidation(msg.sender), "Somente o responsável pela validação pode invalidar contas");

        require(!isReservedAccount(addr), "Não é possível invalidar conta reservada");

        legalEntitiesInfo[addr].state = BlockchainAccountState.INVALIDATED_BY_VALIDATOR;
        
        emit AccountInvalidation(addr, legalEntitiesInfo[addr].cnpj, 
            legalEntitiesInfo[addr].idFinancialSupportAgreement);
    }


   /**
    * By default, the owner is also the Responsible for Settlement. 
    * The owner can assign other address to be the Responsible for Settlement. 
    * @param rs Ethereum address to be assigned as Responsible for Settlement.
    */
    function setResponsibleForSettlement(address rs) onlyOwner public {
        responsibleForSettlement = rs;
    }

   /**
    * By default, the owner is also the Responsible for Donation Confirmation. 
    * The owner can assign other address to be the Responsible for Donation Confirmation. 
    * @param rs Ethereum address to be assigned as Responsible for Donation Confirmation.
    */
    function setResponsibleForDonationConfirmation(address rs) onlyOwner public {
        responsibleForDonationConfirmation = rs;
    }

   /**
    * By default, the owner is also the Responsible for Validation. 
    * The owner can assign other address to be the Responsible for Validation. 
    * @param rs Ethereum address to be assigned as Responsible for Validation.
    */
    function setResponsibleForRegistryValidation(address rs) onlyOwner public {
        responsibleForRegistryValidation = rs;
    }

   /**
    * By default, the owner is also the Responsible for Disbursment. 
    * The owner can assign other address to be the Responsible for Disbursment. 
    * @param rs Ethereum address to be assigned as Responsible for Disbursment.
    */
    function setResponsibleForDisbursement(address rs) onlyOwner public {
        responsibleForDisbursement = rs;
    }

   /**
    * The account where the token is stored to futher disbursement. 
    * By default, the disbursement address is the address of the owner. 
    * The owner can change the disbursement address using this function. 
    * @param rs new Disbursement address
    */
    function setDisbursementAddress(address rs) onlyOwner public {
        disbursementAddress = rs;
    }

   /**
    * @param rs Ethereum address to be assigned to the token address.
    */
    function setTokenAddress(address rs) onlyOwner public {
        tokenAddress = rs;
    }

   /**
    * Enable the legal entity to change the account
    * @param rs account that can be changed.
    */
    function enableChangeAccount (address rs) public {
        require(isResponsibleForRegistryValidation(msg.sender), "Somente o responsável pela validação pode habilitar a troca de conta");
        require(legalEntitiesChangeAccount[rs] == false, "Should not enable the already enabled account");
        legalEntitiesChangeAccount[rs] = true;
    }

    function isChangeAccountEnabled (address rs) view public returns (bool) {
        return legalEntitiesChangeAccount[rs] == true;
    }    

    function isTokenAddress() public view returns (bool) {
        return tokenAddress == msg.sender;
    } 
    function isResponsibleForSettlement(address addr) view public returns (bool) {
        return (addr == responsibleForSettlement);
    }
    function isResponsibleForRegistryValidation(address addr) view public returns (bool) {
        return (addr == responsibleForRegistryValidation);
    }
    function isResponsibleForDonationConfirmation(address addr) view public returns (bool) {
        return (addr == responsibleForDonationConfirmation);
    }
    function isResponsibleForDisbursement(address addr) view public returns (bool) {
        return (addr == responsibleForDisbursement);
    }
    function isDisbursementAddress(address addr) view public returns (bool) {
        return (addr == disbursementAddress);
    }

    function isReservedAccount(address addr) view public returns (bool) {

        if (owner()==addr
                           || isResponsibleForSettlement(addr)
                           || isResponsibleForRegistryValidation(addr)
                           || isResponsibleForDisbursement(addr)
                           || isResponsibleForDonationConfirmation(addr)
                           || isDisbursementAddress(addr)  ) {
            return true;
        }
        return false;
    }

    function isDonor(address addr) view public returns (bool) {

        if (isReservedAccount(addr))
            return false;

        if (isAvailableAccount(addr))
            return false;

        return legalEntitiesInfo[addr].idFinancialSupportAgreement == 0;
    }

    function isValidatedDonor (address addr) view public returns (bool) {
        return isDonor(addr) && (legalEntitiesInfo[addr].state == BlockchainAccountState.VALIDATED);
    }

    function isClient (address addr) view public returns (bool) {
        if (isReservedAccount(addr)) {
            return false;
        }
        return legalEntitiesInfo[addr].idFinancialSupportAgreement != 0;
    }

    function isValidatedClient (address addr) view public returns (bool) {
        return isClient(addr) && (legalEntitiesInfo[addr].state == BlockchainAccountState.VALIDATED);
    }

    function isAvailableAccount(address addr) view public returns (bool) {
        if ( isReservedAccount(addr) ) {
            return false;
        } 
        return legalEntitiesInfo[addr].state == BlockchainAccountState.AVAILABLE;
    }

    function isWaitingValidationAccount(address addr) view public returns (bool) {
        return legalEntitiesInfo[addr].state == BlockchainAccountState.WAITING_VALIDATION;
    }

    function isValidatedAccount(address addr) view public returns (bool) {
        return legalEntitiesInfo[addr].state == BlockchainAccountState.VALIDATED;
    }

    function isInvalidatedByValidatorAccount(address addr) view public returns (bool) {
        return legalEntitiesInfo[addr].state == BlockchainAccountState.INVALIDATED_BY_VALIDATOR;
    }

    function isInvalidatedByChangeAccount(address addr) view public returns (bool) {
        return legalEntitiesInfo[addr].state == BlockchainAccountState.INVALIDATED_BY_CHANGE;
    }

    function getResponsibleForSettlement() view public returns (address) {
        return responsibleForSettlement;
    }
    function getResponsibleForRegistryValidation() view public returns (address) {
        return responsibleForRegistryValidation;
    }
    function getResponsibleForDisbursement() view public returns (address) {
        return responsibleForDisbursement;
    }
    function getResponsibleForDonationConfirmation() view public returns (address) {
        return responsibleForDonationConfirmation;
    }    
    function getDisbursementAddress() view public returns (address) {
        return disbursementAddress;
    }
    function getCNPJ(address addr) view public returns (uint64) {
        return legalEntitiesInfo[addr].cnpj;
    }

    function getIdLegalFinancialAgreement(address addr) view public returns (uint64) {
        return legalEntitiesInfo[addr].idFinancialSupportAgreement;
    }

    function getLegalEntityInfo (address addr) view public returns (uint64, uint64, string memory, uint, address) {
        return (legalEntitiesInfo[addr].cnpj, legalEntitiesInfo[addr].idFinancialSupportAgreement, 
             legalEntitiesInfo[addr].idProofHash, (uint) (legalEntitiesInfo[addr].state),
             addr);
    }

    function getBlockchainAccount(uint64 cnpj, uint64 idFinancialSupportAgreement) view public returns (address) {
        return cnpjFSAddr[cnpj][idFinancialSupportAgreement];
    }

    function getBlockchainAccountOfDonor(uint64 cnpj) view public returns (address) {
        return cnpjFSAddr[cnpj][0];
    }    

    function getLegalEntityInfoByCNPJ (uint64 cnpj, uint64 idFinancialSupportAgreement) 
        view public returns (uint64, uint64, string memory, uint, address) {
        
        address addr = getBlockchainAccount(cnpj,idFinancialSupportAgreement);
        return getLegalEntityInfo (addr);
    }

    function getAccountState(address addr) view public returns (int) {

        if ( isReservedAccount(addr) ) {
            return 100;
        } 
        else {
            return ((int) (legalEntitiesInfo[addr].state));
        }

    }


  function isValidHash(string memory str) pure public returns (bool)  {

    bytes memory b = bytes(str);
    if(b.length != 64) return false;

    for (uint i=0; i<64; i++) {
        if (b[i] < "0") return false;
        if (b[i] > "9" && b[i] <"a") return false;
        if (b[i] > "f") return false;
    }
        
    return true;
 }


}


/**
contract Context {
    // Empty internal constructor, to prevent people from mistakenly deploying
    // an instance of this contract, which should be used via inheritance.
    constructor () internal { }
    // solhint-disable-previous-line no-empty-blocks

    function _msgSender() internal view returns (address payable) {
        return msg.sender;
    }

    function _msgData() internal view returns (bytes memory) {
        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
        return msg.data;
    }
}
contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor () internal {
        address msgSender = _msgSender();
        _owner = msgSender;
        emit OwnershipTransferred(address(0), msgSender);
    }

    function owner() public view returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        require(isOwner(), "Ownable: caller is not the owner");
        _;
    }

    function isOwner() public view returns (bool) {
        return _msgSender() == _owner;
    }

    function renounceOwnership() public onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    function transferOwnership(address newOwner) public onlyOwner {
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}
*/