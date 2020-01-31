pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";

import "./ChangeManagement.sol";
import "./GovernanceDecision.sol";
import "./UpgraderInfo.sol";
import "./Upgrader.sol";
import "./IdRegistry.sol";

contract Governance is Pausable, Ownable() {

    uint[] private governanceMembersId;

    IdRegistry private idRegistry;
    address private _resposibleForAssigningGovernanceMembers;
    ChangeManagement changeManagement;

    event NewGovernanceMemberAdded(uint memberId);
    event GovernanceMemberRemoved(uint memberId);

    constructor (uint[] memory initialGovernanceMembersId, 
        address resposibleForAssigningGovernanceMembers,
        address changeManagementAddr) public {
        governanceMembersId = initialGovernanceMembersId;
        changeManagement = ChangeManagement(changeManagementAddr);
        _resposibleForAssigningGovernanceMembers = resposibleForAssigningGovernanceMembers;
    }

    //It is necessary to call this function before any governance decision
    function setIdRegistryAddr(address idRegistryAddr) public onlyOwner {
        idRegistry = IdRegistry(idRegistryAddr);
    }

	function makeResult(uint changeNumber) public onlyOwner returns(bool) {

        address decisionContractAddr = changeManagement.getDecisionContractToMakeResult(changeNumber);
        
        GovernanceDecision governanceDecision = GovernanceDecision(decisionContractAddr);

        if (governanceDecision.makeResult()) {
            changeManagement.approveChange(changeNumber);
            return true;
        }
		else {
            changeManagement.reproveChange(changeNumber);
			return false;
		}

	}

    function includeNewGovernanceMember(uint newMember) public {
        require (msg.sender == _resposibleForAssigningGovernanceMembers, "Should be called by the address responsible for assigning governance members");
        governanceMembersId.push(newMember);
        emit NewGovernanceMemberAdded(newMember);
    }


    function removeGovernanceMember(uint memberId) public {
        require (msg.sender == _resposibleForAssigningGovernanceMembers, "Should be called by the address responsible for assigning governance members");
        (bool find, uint index) = findIndexGovernanceMember(memberId);
        require (find==true, "Member not found");
        governanceMembersId[index]=governanceMembersId[governanceMembersId.length-1];
        governanceMembersId.length--;
        emit GovernanceMemberRemoved(memberId);
    }

    function findIndexGovernanceMember(uint newMember) view internal returns (bool, uint) {
        uint i=0;
        bool find = false;
        for (;i<governanceMembersId.length; i++) {
            if (governanceMembersId[i]==newMember) {
                find = true;
                break;
            }
        }
        return (find,i);
    }

    function governanceMembers() view public returns (uint[] memory) {
        return governanceMembersId;
    }

    function idRegistryAddr() public view returns (address) {
        return address(idRegistry);
    }

   
 }