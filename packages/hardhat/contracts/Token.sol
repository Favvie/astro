//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TokenFacet
 * @dev Simple ERC20 token with minting and burning capabilities for the launchpad
 *
 * Features:
 * - ERC20Burnable: Tokens can be burned
 * - Minting: Only the launchpad (owner) can mint new tokens
 * - Lightweight implementation for reduced contract size
 */
contract TokenFacet is ERC20, ERC20Burnable, Ownable {

    constructor(
        string memory _name,
        string memory _symbol,
        address _launchpadAddress
    )
        ERC20(_name, _symbol)
        Ownable(_launchpadAddress)
    {
        // The launchpad contract becomes the owner and can mint tokens
    }

    /**
     * @dev Mint tokens - only callable by the launchpad (owner)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens from a specific address - only callable by the launchpad (owner)
     */
    function burnFrom(address from, uint256 amount) public override onlyOwner {
        _burn(from, amount);
    }
}
