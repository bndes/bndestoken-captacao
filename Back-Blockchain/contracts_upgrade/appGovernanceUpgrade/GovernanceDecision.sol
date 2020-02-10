pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../appCommonUpgrade/IdRegistry.sol";


contract GovernanceDecision is Ownable() {

	using SafeMath for uint256;

	IdRegistry public idRegistry;

	enum UpgraderStatus {
		Voting,
		Approved,
		Rejected,
		Cancelled
	}

	UpgraderStatus public status;

	bytes32 _hashChangeMotivation;

	/** Voting mechanism related */
	uint256 public percentage;
	mapping(uint => bool) public voting;
	mapping(uint => bool) public voterRegistered;
	uint256 public numOfVoters = 0;
	uint256 public numOfAgreements = 0;

	modifier onlyInVotingState {
		require(status == UpgraderStatus.Voting, "Decision not in the voting state!");
		_;
	}

//If idRegistryAddr changes, the old contract will be still able to answer id Queries (unless it is destroyed).
//If the answer of the old version of the contract is not ok, the decision contract should be cancelled.

	constructor (bytes32 hashChangeMotivation, uint[] memory votersId, 
		uint256 _percentage, address idRegistryAddr) public {

		_hashChangeMotivation = hashChangeMotivation;
		_addVoters(votersId);
		_setPercentage(_percentage);

		idRegistry = IdRegistry(idRegistryAddr);

		// Mark the contract as voting.
		status = UpgraderStatus.Voting;

	}

	//TODO: cancel change


	/**
	 * Vote.
	 *
	 * @param	_choose	if the voter agrees with the proposal.
	 *
	 * exception	PermissionException	msg.sender is not a voter.
	 * 
	 */
	function vote (bool _choose) external onlyInVotingState {
		uint voterId = idRegistry.getId(msg.sender);
		require(voterRegistered[voterId], "Do not have the permission!");
		if (voting[voterId] != _choose) {
			if (_choose) {
				numOfAgreements++;
			} else {
				numOfAgreements--;
			}
			voting[voterId] = _choose;
		}
	}



	function makeResult() public onlyInVotingState onlyOwner returns(bool) {

		if (numOfAgreements > numOfVoters.mul(percentage).div(100)) {
			status = UpgraderStatus.Approved;
			return true;
		}
		else {
			status = UpgraderStatus.Rejected;
			return false;
		}

	}


	/**
	 * Destruct itself.
	 *
	 * exception	PermissionException	msg.sender is not the owner.
	 */
/*	function done() external onlyOwner {
		selfdestruct(owner());
	}
*/


	function _addVoters (uint[] memory _votersId) internal {
		for (uint256 i = 0; i < _votersId.length; i++) {
			if (!voterRegistered[_votersId[i]]) {
				voterRegistered[_votersId[i]] = true;
				numOfVoters++;
			}
		}
	}


	function _setPercentage(uint256 _percentage) internal {
		percentage = _percentage;
		if (percentage > 100) {
			percentage = 100;
		}
	}

}