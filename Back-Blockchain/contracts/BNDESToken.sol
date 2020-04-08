pragma solidity ^0.5.0;

//import './SafeMath.sol';
import './BNDESRegistry.sol';
import '@openzeppelin/contracts/lifecycle/Pausable.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';

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
    event ManualIntervention(address account, uint256 amount, string description, uint8 eventType);
    
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
        require (registry.isValidHash(docHash), "O hash do recibo é inválido");
        uint256 tokenMinted = amount.sub(amount.mul(bndesFee).div(100));

        bookedTotalSupply    = bookedTotalSupply.sub( amount );
        confirmedTotalSupply = confirmedTotalSupply.add( tokenMinted );

        bookedBalances[account] = bookedBalances[account].sub( amount );
        confirmedBalances[registry.getDisbursementAddress()] = 
                confirmedBalances[registry.getDisbursementAddress()].add( tokenMinted );
        uint64 cnpj = registry.getCNPJ(account);
        emit DonationConfirmed(cnpj, amount, tokenMinted, docHash);
    }
    
    /* BNDES disbursement - transfer donations to a client */
    function makeDisbursement(address client, uint256 amount) public whenNotPaused onlyResponsibleForDisbursement {
        transferConfirmed(registry.getDisbursementAddress(), client, amount);
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
        emit ManualIntervention(account, amount, description,1);        
    }        
    //These methods may be necessary to solve incidents.
    function burnBooked(address account, uint256 amount, string memory description) public onlyOwner {
        require(account != address(0), "ERC20: burn from the zero address");
        bookedBalances[account] = bookedBalances[account].sub(amount, "ERC20: burn amount exceeds balance");
        bookedTotalSupply = bookedTotalSupply.sub(amount);
        emit ManualIntervention(account, amount, description,2);        
    }
    //These methods may be necessary to solve incidents.
    function mintConfirmed(address account, uint256 amount, string memory description) public onlyOwner {
        require(account != address(0), "ERC20: burn from the zero address");
        confirmedBalances[account] = confirmedBalances[account].add(amount);
        confirmedTotalSupply = confirmedTotalSupply.add(amount);
        emit ManualIntervention(account, amount, description,3);        
    }
    //These methods may be necessary to solve incidents.
    function burnConfirmed(address account, uint256 amount, string memory description) public onlyOwner {
        require(account != address(0), "ERC20: burn from the zero address");
        confirmedBalances[account] = confirmedBalances[account].sub(amount, "ERC20: burn amount exceeds balance");
        confirmedTotalSupply = confirmedTotalSupply.sub(amount);
        emit ManualIntervention(account, amount, description,4);        
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

    function getDisbursementAddressBalance () public view returns (uint256) {
        return confirmedBalanceOf(registry.getDisbursementAddress());
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
        require(registry.owner()==msg.sender);
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