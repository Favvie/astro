//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Usdc
 * @dev A replica of a USDC token with 6 decimals, built using OpenZeppelin's ERC20 contract.
 *      The deployer of the contract becomes the owner and can mint new tokens.
 */
contract Usdc is ERC20, Ownable {
    /**
     * @dev Initializes the contract by setting the name and symbol for the token,
     *      and minting an initial supply to the deployer.
     */
    constructor() ERC20("USDC", "USDC") Ownable(msg.sender) {
        // Mint the initial supply to the contract deployer
        _mint(msg.sender, 100000e6);
    }

    /**
     * @dev Overrides the default 18 decimals of ERC20 to 6, matching the USDC standard.
     */
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    /**
     * @dev Mints `amount` tokens to `to`.
     *
     * Requirements:
     *
     * - the caller must be the owner of the contract.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(msg.sender == owner(), "you are not owner");
        _mint(to, amount * 50000e6);
    }
}