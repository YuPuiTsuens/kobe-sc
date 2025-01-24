// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';

contract Airdrop is Ownable {
    using MessageHashUtils for bytes32;
    using ECDSA for bytes32;

    IERC20 public token;

    // Record claimed profiles
    mapping(string => bool) public claimedProfiles;
    mapping(address => bool) public claimed;

    // Amount of tokens each address can claim
    uint256 public airdropAmount;

    address public signerAddress;

    event AirdropClaimed(address indexed user, uint256 amount, string profile, uint256 subCount);

    constructor(address _token, uint256 _airdropAmount, address _signerAddress) Ownable(msg.sender) {
        token = IERC20(_token);
        airdropAmount = _airdropAmount;
        signerAddress = _signerAddress;
    }

    // Update signer address
    function setSignerAddress(address _signerAddress) external onlyOwner {
        signerAddress = _signerAddress;
    }

    // Check if address has claimed
    function hasClaimed(address user) external view returns (bool) {
        return claimed[user];
    }

    // Claim airdrop with signature and Twitter data
    function claimWithSignature(uint256 amount, string calldata profile, uint256 subCount, bytes calldata signature) external {
        require(!claimed[msg.sender], 'Already claimed');
        require(!claimedProfiles[profile], 'Profile already claimed');
        require(token.balanceOf(address(this)) >= amount, 'Insufficient balance');
        require(amount == subCount, 'Amount must match sub count');

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, amount, profile, subCount));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address recoveredSigner = ethSignedMessageHash.recover(signature);
        require(recoveredSigner == signerAddress, 'Invalid signature');

        claimed[msg.sender] = true;
        claimedProfiles[profile] = true;
        require(token.transfer(msg.sender, amount), 'Transfer failed');

        emit AirdropClaimed(msg.sender, amount, profile, subCount);
    }

    // Update amount of tokens each address can claim
    function setAirdropAmount(uint256 _amount) external onlyOwner {
        airdropAmount = _amount;
    }

    // Allow owner to withdraw remaining tokens
    function withdrawTokens(uint256 amount) external onlyOwner {
        require(token.transfer(owner(), amount), 'Transfer failed');
    }
}
