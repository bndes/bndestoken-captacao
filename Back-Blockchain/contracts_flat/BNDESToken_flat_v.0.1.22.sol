pragma solidity ^0.5.0;

/*
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with GSN meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
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


//import './SafeMath.sol';


//import "openzeppelin-solidity/contracts/ownership/Ownable.sol";



/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor () internal {
        address msgSender = _msgSender();
        _owner = msgSender;
        emit OwnershipTransferred(address(0), msgSender);
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(isOwner(), "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Returns true if the caller is the current owner.
     */
    function isOwner() public view returns (bool) {
        return _msgSender() == _owner;
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public onlyOwner {
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     */
    function _transferOwnership(address newOwner) internal {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}









/**
 * @title Roles
 * @dev Library for managing addresses assigned to a Role.
 */
library Roles {
    struct Role {
        mapping (address => bool) bearer;
    }

    /**
     * @dev Give an account access to this role.
     */
    function add(Role storage role, address account) internal {
        require(!has(role, account), "Roles: account already has role");
        role.bearer[account] = true;
    }

    /**
     * @dev Remove an account's access to this role.
     */
    function remove(Role storage role, address account) internal {
        require(has(role, account), "Roles: account does not have role");
        role.bearer[account] = false;
    }

    /**
     * @dev Check if an account has this role.
     * @return bool
     */
    function has(Role storage role, address account) internal view returns (bool) {
        require(account != address(0), "Roles: account is the zero address");
        return role.bearer[account];
    }
}


contract PauserRole is Context {
    using Roles for Roles.Role;

    event PauserAdded(address indexed account);
    event PauserRemoved(address indexed account);

    Roles.Role private _pausers;

    constructor () internal {
        _addPauser(_msgSender());
    }

    modifier onlyPauser() {
        require(isPauser(_msgSender()), "PauserRole: caller does not have the Pauser role");
        _;
    }

    function isPauser(address account) public view returns (bool) {
        return _pausers.has(account);
    }

    function addPauser(address account) public onlyPauser {
        _addPauser(account);
    }

    function renouncePauser() public {
        _removePauser(_msgSender());
    }

    function _addPauser(address account) internal {
        _pausers.add(account);
        emit PauserAdded(account);
    }

    function _removePauser(address account) internal {
        _pausers.remove(account);
        emit PauserRemoved(account);
    }
}


/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
contract Pausable is Context, PauserRole {
    /**
     * @dev Emitted when the pause is triggered by a pauser (`account`).
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by a pauser (`account`).
     */
    event Unpaused(address account);

    bool private _paused;

    /**
     * @dev Initializes the contract in unpaused state. Assigns the Pauser role
     * to the deployer.
     */
    constructor () internal {
        _paused = false;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view returns (bool) {
        return _paused;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     */
    modifier whenNotPaused() {
        require(!_paused, "Pausable: paused");
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     */
    modifier whenPaused() {
        require(_paused, "Pausable: not paused");
        _;
    }

    /**
     * @dev Called by a pauser to pause, triggers stopped state.
     */
    function pause() public onlyPauser whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Called by a pauser to unpause, returns to normal state.
     */
    function unpause() public onlyPauser whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}


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
    address public redemptionAddress;
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
        redemptionAddress = msg.sender;
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

        legalEntitiesChangeAccount[addr] = false;

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

        legalEntitiesChangeAccount[oldAddr] = false;

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
    * The donor reedems the BNDESToken by transfering the tokens to a specific address, 
    * called Redemption address. 
    * By default, the redemption address is the address of the owner. 
    * The owner can change the redemption address using this function. 
    * @param rs new Redemption address
    */
    function setRedemptionAddress(address rs) onlyOwner public {
        redemptionAddress = rs;
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
    function isRedemptionAddress(address addr) view public returns (bool) {
        return (addr == redemptionAddress);
    }

    function isReservedAccount(address addr) view public returns (bool) {

        if (owner()==addr
                           || isResponsibleForSettlement(addr)
                           || isResponsibleForRegistryValidation(addr)
                           || isResponsibleForDisbursement(addr)
                           || isResponsibleForDonationConfirmation(addr)
                           || isRedemptionAddress(addr)  ) {
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
    function getRedemptionAddress() view public returns (address) {
        return redemptionAddress;
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



/**
 * @dev Wrappers over Solidity's arithmetic operations with added overflow
 * checks.
 *
 * Arithmetic operations in Solidity wrap on overflow. This can easily result
 * in bugs, because programmers usually assume that an overflow raises an
 * error, which is the standard behavior in high level programming languages.
 * `SafeMath` restores this intuition by reverting the transaction when an
 * operation overflows.
 *
 * Using this library instead of the unchecked operations eliminates an entire
 * class of bugs, so it's recommended to use it always.
 */
library SafeMath {
    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, "SafeMath: subtraction overflow");
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     * - Subtraction cannot overflow.
     *
     * _Available since v2.4.0._
     */
    function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;

        return c;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     * - Multiplication cannot overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return div(a, b, "SafeMath: division by zero");
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts with custom message on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     *
     * _Available since v2.4.0._
     */
    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0
        require(b > 0, errorMessage);
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return mod(a, b, "SafeMath: modulo by zero");
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts with custom message when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     *
     * _Available since v2.4.0._
     */
    function mod(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b != 0, errorMessage);
        return a % b;
    }
}


contract BNDESToken is Pausable {
    using SafeMath for uint256;
    
    /* This table stores the intentions of donations */
    mapping (address => uint256) public bookedBalances;
    /* This table stores the real BNDESTokens for BNDES and its Clients */
    mapping (address => uint256) public confirmedBalances;
    /* The current amount composed by intentions of donations */
    uint256 public bookedTotalSupply;
    /* The current amount of BNDESTokens minted  */
    uint256 public confirmedTotalSupply;
    /* Number of decimals stored in balance's mappings */
    uint8 public decimals;
    /* BNDES Fee percentage */
    uint256 public bndesFee;
    
    /* Higher level events */
    event DonationBooked      (uint64 cnpj, uint256 amount);
    event DonationConfirmed   (uint64 cnpj, uint256 amount, uint256 tokenMinted, string docHash);
    event Disbursement        (uint64 cnpj, uint256 amount, uint64 idFinancialSupportAgreement);
    event RedemptionRequested (uint64 cnpj, uint256 amount, uint64 idFinancialSupportAgreement);
    event RedemptionSettlement(string redemptionTransactionHash, string  receiptHash);
    
    event TransferBookedBalance(address from, address to, uint256 amount);    
    event TransferConfirmedBalance(address from, address to, uint256 amount);    
    event ManualIntervention(string description);
    
    BNDESRegistry registry;
    
    constructor (BNDESRegistry _registry, uint8 _decimals, uint256 _bndesFee) public {
        registry = BNDESRegistry(_registry);
        decimals = _decimals;
        bndesFee = _bndesFee;
    }
    
    /* Donor books a donation */
    function bookDonation(uint256 amount) public whenNotPaused onlyValidatedDonor {
        address account = msg.sender;
        bookedTotalSupply = bookedTotalSupply.add(amount);
        bookedBalances[account] = bookedBalances[account].add(amount);
        uint64 cnpj = registry.getCNPJ(account);
        emit DonationBooked(cnpj, amount);
    }
    
    /* BNDES confirms the donor's donation */
    function confirmDonation(address account, uint256 amount, string memory docHash) public whenNotPaused onlyResponsibleForDonationConfirmation {       
        uint256 tokenMinted = amount.sub(amount.mul(bndesFee).div(100));

        bookedTotalSupply    = bookedTotalSupply.sub( amount );
        confirmedTotalSupply = confirmedTotalSupply.add( tokenMinted );

        bookedBalances[account] = bookedBalances[account].sub( amount );
        confirmedBalances[registry.getResponsibleForDisbursement()] = 
                confirmedBalances[registry.getResponsibleForDisbursement()].add( tokenMinted );
        uint64 cnpj = registry.getCNPJ(account);
        emit DonationConfirmed(cnpj, amount, tokenMinted, docHash);
    }
    
    /* BNDES disbursement - transfer donations to a client */
    function makeDisbursement(address client, uint256 amount) public whenNotPaused onlyResponsibleForDisbursement {
        transferConfirmed(registry.getResponsibleForDisbursement(), client, amount);
        uint64 cnpj = registry.getCNPJ(client);
        uint64 idLegalFinancialAgreement = registry.getIdLegalFinancialAgreement(client);
        emit Disbursement(cnpj, amount, idLegalFinancialAgreement);
    }

   /**
    * When redeeming, the supplier indicated to the Resposible for Settlement that he wants to receive 
    * the FIAT money.
    * @param amount - how much BNDESToken the supplier wants to redeem
    */
    function redeem (uint256 amount) public whenNotPaused returns (bool) {
        address account = msg.sender;
        require(account != address(0), "burn from the zero address");
        confirmedBalances[account] = confirmedBalances[account].sub(amount, "burn amount exceeds balance");
        confirmedTotalSupply = confirmedTotalSupply.sub(amount);             
        uint64 idLegalFinancialAgreement = registry.getIdLegalFinancialAgreement(account);
        uint64 cnpj = registry.getCNPJ(account);
        emit RedemptionRequested(cnpj, amount, idLegalFinancialAgreement);        
        return true;
    }

   /**
    * Using this function, the Responsible for Settlement indicates that he has made the FIAT money transfer.
    * @param redemptionTransactionHash hash of the redeem transaction in which the FIAT money settlement occurred.
    * @param receiptHash hash that proof the FIAT money transfer
    */
    function notifyRedemptionSettlement(string memory redemptionTransactionHash, string memory receiptHash) 
        public whenNotPaused {
        require (registry.isResponsibleForSettlement(msg.sender), "A liquidação só não pode ser realizada pelo endereço que submeteu a transação"); 
        require (registry.isValidHash(receiptHash), "O hash do recibo é inválido");
        emit RedemptionSettlement(redemptionTransactionHash, receiptHash);
    }    

    /* BNDES transfers bookedBalances from a sender to a receiver */
    function transferBooked(address sender, address recipient, uint256 amount) internal {
        require(sender    != address(0), "booked transfer from the zero address");
        require(recipient != address(0), "booked transfer to the zero address");

        bookedBalances[sender]    = bookedBalances[sender].sub(amount, "booked transfer amount exceeds balance");
        bookedBalances[recipient] = bookedBalances[recipient].add(amount);
        emit TransferBookedBalance(sender, recipient, amount);
    }

    /* BNDES transfers confirmedBalances from a sender to a receiver */
    function transferConfirmed(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "confirmed transfer from the zero address");
        require(recipient != address(0), "confirmed transfer to the zero address");

        confirmedBalances[sender]    = confirmedBalances[sender].sub(amount, "confirmed transfer amount exceeds balance");
        confirmedBalances[recipient] = confirmedBalances[recipient].add(amount);
        emit TransferConfirmedBalance(sender, recipient, amount);
    }

    //These methods may be necessary to solve incidents.
    function mintBooked(address account, uint256 amount, string memory description) public onlyOwner {
        require(account != address(0), "ERC20: burn from the zero address");
        bookedBalances[account] = bookedBalances[account].add(amount);
        bookedTotalSupply = bookedTotalSupply.add(amount);
        emit ManualIntervention(description);        
    }        
    //These methods may be necessary to solve incidents.
    function burnBooked(address account, uint256 amount, string memory description) public onlyOwner {
        require(account != address(0), "ERC20: burn from the zero address");
        bookedBalances[account] = bookedBalances[account].sub(amount, "ERC20: burn amount exceeds balance");
        bookedTotalSupply = bookedTotalSupply.sub(amount);
        emit ManualIntervention(description);        
    }
    //These methods may be necessary to solve incidents.
    function mintConfirmed(address account, uint256 amount, string memory description) public onlyOwner {
        require(account != address(0), "ERC20: burn from the zero address");
        confirmedBalances[account] = confirmedBalances[account].add(amount);
        confirmedTotalSupply = confirmedTotalSupply.add(amount);
        emit ManualIntervention(description);        
    }
    //These methods may be necessary to solve incidents.
    function burnConfirmed(address account, uint256 amount, string memory description) public onlyOwner {
        require(account != address(0), "ERC20: burn from the zero address");
        confirmedBalances[account] = confirmedBalances[account].sub(amount, "ERC20: burn amount exceeds balance");
        confirmedTotalSupply = confirmedTotalSupply.sub(amount);
        emit ManualIntervention(description);        
    }   

    function registryLegalEntity(uint64 cnpj, uint64 idFinancialSupportAgreement, string memory idProofHash) 
        public whenNotPaused { 
        registry.registryLegalEntity(cnpj,  idFinancialSupportAgreement, msg.sender, idProofHash);
    }

   /**
    * Changes the original link between CNPJ and Ethereum account. 
    * The new link still needs to be validated by BNDES.
    * IMPORTANT: The BNDESTOKENs are transfered from the original to the new Ethereum address 
    * @param cnpj Brazilian identifier to legal entities
    * @param idFinancialSupportAgreement contract number of financial contract with BNDES. It assumes 0 if it is a supplier.
    * @param idProofHash The legal entities have to send BNDES a PDF where it assumes as responsible for an Ethereum account. 
    *                   This PDF is signed with eCNPJ and send to BNDES. 
    */
    function changeAccountLegalEntity(uint64 cnpj, uint64 idFinancialSupportAgreement, string memory idProofHash) 
        public whenNotPaused {
        
        address oldAddr = registry.getBlockchainAccount(cnpj, idFinancialSupportAgreement);
        address newAddr = msg.sender;
        
        registry.changeAccountLegalEntity(cnpj, idFinancialSupportAgreement, msg.sender, idProofHash);

        // Se há saldo no enderecoAntigo, precisa transferir
        if (bookedBalances[oldAddr] > 0) {
            transferBooked(oldAddr, newAddr, bookedBalances[oldAddr]);
        }
        if (confirmedBalances[oldAddr] > 0) {
            transferConfirmed(oldAddr, newAddr, confirmedBalances[oldAddr]);
        }        
    }

    function confirmedBalanceOf(address client) public view returns (uint256) {
        return confirmedBalances[client];
    }    

    function bookedBalanceOf(address donor) public view returns (uint256) {
        return bookedBalances[donor];
    }        

    function getBookedTotalSupply() public view returns (uint256) {
        return bookedTotalSupply;
    }        

    function getConfirmedTotalSupply() public view returns (uint256) {
        return confirmedTotalSupply;
    } 
    
    function getDecimals() public view returns (uint8) {
        return decimals;
    }    
    
    /*
    modifier whenNotPaused() {
        // FIXME: remove it when the import Pausable is available 
        _;
    } */

    modifier onlyResponsibleForDonationConfirmation() {
        require(registry.isResponsibleForDonationConfirmation(msg.sender));        
        _;
    }
    modifier onlyResponsibleForDisbursement() {
        require(registry.isResponsibleForDisbursement(msg.sender));
        _;
    }
    modifier onlyResponsibleForSettlement() {
        require(registry.isResponsibleForSettlement(msg.sender));
        _;
    }
    modifier onlyValidatedClient() {
        require(registry.isValidatedClient(msg.sender));
        _;
    }
    modifier onlyValidatedDonor() {
        require(registry.isValidatedDonor(msg.sender));
        _;
    }
    modifier onlyOwner() {
        require(registry.isOwner());
        _;
    }    
}

/** 

library SafeMath {

    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, "SafeMath: subtraction overflow");
    }

    function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;

        return c;
    }

    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return div(a, b, "SafeMath: division by zero");
    }

    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0
        require(b > 0, errorMessage);
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return mod(a, b, "SafeMath: modulo by zero");
    }
    
    function mod(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b != 0, errorMessage);
        return a % b;
    }
}

/**/