pragma solidity ^0.5.0;

//import './SafeMath.sol';
import './BNDESRegistry.sol';

/**
TODO:
- criar o papel de confirmacao da doacao (diferente do desembolso)
- adicionar o metodo da suzana -> recebe cnpj e retorna address. Nogueira, preciso desse método aqui no smart contract: getContaBlockchainFromDoador(cnpj)
- peer review
 */

contract BNDESToken {
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
    uint8 private decimals;
    
    /* Higher level events */
    event DonationBooked(address, uint256);
    event DonationConfirmed(address, uint256);
    event Disbursement(address, uint256);
    event RedemptionRequested(address, uint256);
    event Redeemed(address, uint256);
    
    /* Lower level event (close to the ERC20) */
    event Transfer(address, address, uint256);    
    
    BNDESRegistry registry;
    
    constructor (BNDESRegistry _registry, uint8 _decimals) public {
        registry = BNDESRegistry(_registry);
        decimals = _decimals;
    }
    
    /* Donor books a donation */
    function bookDonation(uint256 amount) public whenNotPaused {
        address account = msg.sender;
        bookedTotalSupply = bookedTotalSupply.add(amount);
        bookedBalances[account] = bookedBalances[account].add(amount);
        emit DonationBooked(account, amount);
    }
    
    /* BNDES confirms the donor's donation */
    function confirmDonation(address account, uint256 amount) public whenNotPaused onlyBNDES_confirmDonation {
        bookedTotalSupply = bookedTotalSupply.sub(amount);
        confirmedTotalSupply = confirmedTotalSupply.add(amount);
        
        bookedBalances[account] = bookedBalances[account].sub(amount);
        confirmedBalances[registry.getResponsibleForDisbursement()] = confirmedBalances[registry.getResponsibleForDisbursement()].add(amount);
        
        emit DonationConfirmed(account, amount);
    }
    
    /* BNDES disbursement - transfer donations to a client */
    function makeDisbursement(address client, uint256 amount) public whenNotPaused onlyBNDES_allocateDonation {
        _transfer(registry.getResponsibleForDisbursement(), client, amount);
        emit Disbursement(client, amount);
    }
    
    /* Client request a redemption */
    function requestRedemption(uint256 amount) public whenNotPaused onlyClient {
        _transfer(msg.sender, registry.getResponsibleForSettlement(), amount);
        emit RedemptionRequested(msg.sender, amount);
    }
    
    /* BNDES redeems to the Client */
    function redeem (address to, uint256 amount) public whenNotPaused onlyBNDES_redeem returns (bool) {
        address account = registry.getResponsibleForSettlement();
        require(account != address(0), "burn from the zero address");
        confirmedBalances[account] = confirmedBalances[account].sub(amount, "burn amount exceeds balance");
        confirmedTotalSupply = confirmedTotalSupply.sub(amount);
        emit Redeemed(to, amount);
        return true;
    }
    
    /* BNDES transfers confirmedBalances from a sender to a receiver */
    function _transfer(address sender, address recipient, uint256 amount) internal onlyOwner {
        require(sender != address(0), "transfer from the zero address");
        require(recipient != address(0), "transfer to the zero address");

        confirmedBalances[sender] = confirmedBalances[sender].sub(amount, "transfer amount exceeds balance");
        confirmedBalances[recipient] = confirmedBalances[recipient].add(amount);
        emit Transfer(sender, recipient, amount);
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
        if (confirmedBalances[oldAddr] > 0) {
            _transfer(oldAddr, newAddr, confirmedBalances[oldAddr]);
        }
    }
    
    function getDecimals() public view returns (uint8) {
        return decimals;
    }    
    
    modifier whenNotPaused() {
        // FIXME: remove it when the import Pausable is available 
        _;
    }    
    modifier onlyBNDES_confirmDonation() {
        require(registry.isResponsibleForDisbursement(msg.sender));
        _;
    }
    modifier onlyBNDES_allocateDonation() {
        require(registry.isResponsibleForDisbursement(msg.sender));
        _;
    }
    modifier onlyBNDES_redeem() {
        require(registry.isResponsibleForSettlement(msg.sender));
        _;
    }
    modifier onlyClient() {
        require(registry.isClient(msg.sender));
        _;
    }
    modifier onlyOwner() {
        require(registry.isOwner(msg.sender));
        _;
    }    
}



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