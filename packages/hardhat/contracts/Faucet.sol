// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Faucet
 * @dev A contract for distributing tokens to users at regular intervals.
 */
contract Faucet {
    using SafeERC20 for IERC20;

    IERC20 public usdcToken;

    uint256 public usdcClaimAmount = 30 * 10 ** 6;

    uint256 public constant CLAIM_INTERVAL = 24 hours;

    address owner;

    mapping(address => uint256) public lastClaimTime;

    /* Events */
    event TokensClaimed(address indexed user);

    /* Custom Errors */
    error ZeroAddress();
    error ClaimTooSoon(uint256 timeRemaining);
    error InsufficientFaucetBalance(uint256 faucetBalance, uint256 requestedAmount);

    /**
     * @dev Initializes the contract, setting the token to be distributed.
     * @param _usdcTokenAddress The address of the ERC20 token to be distributed.
     */
    constructor(address _usdcTokenAddress) {
        if (_usdcTokenAddress == address(0)) revert ZeroAddress();
        usdcToken = IERC20(_usdcTokenAddress);
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    /**
     * @dev Allows users to claim tokens. Users can only claim once every CLAIM_INTERVAL.
     * @notice This function will revert if:
     *  - The sender is the zero address
     *  - The claim interval has not passed since the last claim
     *  - The faucet doesn't have enough balance to fulfill the claim
     */
    function drip(address _to) external {
        if (msg.sender == address(0)) revert ZeroAddress();

        uint256 nextClaimTime = lastClaimTime[_to] + CLAIM_INTERVAL;
        if (block.timestamp < nextClaimTime) {
            revert ClaimTooSoon(nextClaimTime - block.timestamp);
        }

        usdcToken.safeTransfer(_to, usdcClaimAmount);

        lastClaimTime[_to] = block.timestamp;
        emit TokensClaimed(_to);
    }

    /**
     * @dev Returns the timestamp when a user can next claim tokens.
     * @param _user The address of the user to check.
     * @return The timestamp when the user can next claim tokens.
     */
    function getNextClaimTime(address _user) external view returns (uint256) {
        return lastClaimTime[_user] + CLAIM_INTERVAL;
    }

    /**
     * @dev Allows the contract owner to withdraw all remaining tokens from the contract.
     * @param _to The address to send the remaining tokens to.
     * @param _token The address of the token to withdraw.
     * @notice This function will revert if:
     *  - The `to` address is the zero address
     *  - The token transfer fails
     */
    function withdrawRemainingTokens(address _to, address _token) external onlyOwner {
        if (_to == address(0)) revert ZeroAddress();
        if (_token == address(0)) revert ZeroAddress();

        uint256 balance = usdcToken.balanceOf(address(this));
        if (balance > 0) {
            usdcToken.safeTransfer(_to, balance);
        }
    }
}
