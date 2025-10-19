//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TokenFacet
 * @dev ERC20 token with minting capabilities for the launchpad and voting power for DAO governance
 *
 * Features:
 * - ERC20Votes: Enables snapshot-based voting to prevent double voting and vote manipulation
 * - ERC20Permit: Allows gasless approvals via signatures (EIP-2612)
 * - ERC20Burnable: Tokens can be burned
 * - Voting power must be delegated before it can be used (self-delegation common)
 */
contract TokenFacet is ERC20, ERC20Burnable, ERC20Votes, ERC20Permit, Ownable {

    constructor(
        string memory _name,
        string memory _symbol,
        address _launchpadAddress
    )
        ERC20(_name, _symbol)
        ERC20Permit(_name)
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

    // The following functions are overrides required by Solidity for multiple inheritance

    /**
     * @dev Hook that is called after any transfer of tokens
     * This updates voting power checkpoints
     */
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    /**
     * @dev Returns the current nonce for an address (for permit functionality)
     */
    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}