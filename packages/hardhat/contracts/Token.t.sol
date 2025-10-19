// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {TokenFacet} from "./Token.sol";

/**
 * @title TokenFacetTest
 * @dev Comprehensive test suite for TokenFacet contract
 * Tests ERC20, ERC20Votes, ERC20Permit, ERC20Burnable, and Ownable functionality
 */
contract TokenFacetTest is Test {
    TokenFacet public token;

    address public launchpad = address(1);
    address public user1 = address(2);
    address public user2 = address(3);
    address public user3 = address(4);

    string public constant TOKEN_NAME = "Campaign Token";
    string public constant TOKEN_SYMBOL = "CAMP";
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**18;

    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);
    event DelegateVotesChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance);

    function setUp() public {
        vm.startPrank(launchpad);
        token = new TokenFacet(TOKEN_NAME, TOKEN_SYMBOL, launchpad);
        vm.stopPrank();
    }

    // ============================================
    // DEPLOYMENT TESTS
    // ============================================

    function test_Deployment_Success() public view {
        assertEq(token.name(), TOKEN_NAME, "Token name mismatch");
        assertEq(token.symbol(), TOKEN_SYMBOL, "Token symbol mismatch");
        assertEq(token.decimals(), 18, "Decimals should be 18");
        assertEq(token.totalSupply(), 0, "Initial supply should be zero");
        assertEq(token.owner(), launchpad, "Owner should be launchpad");
    }

    function test_Deployment_OwnerIsLaunchpad() public view {
        assertEq(token.owner(), launchpad, "Launchpad should be owner");
    }

    // ============================================
    // MINTING TESTS
    // ============================================

    function test_Mint_Success() public {
        vm.startPrank(launchpad);

        uint256 amount = 1000 * 10**18;

        vm.expectEmit(true, true, false, true);
        emit Transfer(address(0), user1, amount);

        token.mint(user1, amount);

        assertEq(token.balanceOf(user1), amount, "User balance should match minted amount");
        assertEq(token.totalSupply(), amount, "Total supply should match minted amount");

        vm.stopPrank();
    }

    function test_Mint_MultipleRecipients() public {
        vm.startPrank(launchpad);

        uint256 amount1 = 1000 * 10**18;
        uint256 amount2 = 2000 * 10**18;
        uint256 amount3 = 3000 * 10**18;

        token.mint(user1, amount1);
        token.mint(user2, amount2);
        token.mint(user3, amount3);

        assertEq(token.balanceOf(user1), amount1, "User1 balance mismatch");
        assertEq(token.balanceOf(user2), amount2, "User2 balance mismatch");
        assertEq(token.balanceOf(user3), amount3, "User3 balance mismatch");
        assertEq(token.totalSupply(), amount1 + amount2 + amount3, "Total supply mismatch");

        vm.stopPrank();
    }

    function test_Mint_MultipleTimes() public {
        vm.startPrank(launchpad);

        uint256 amount1 = 1000 * 10**18;
        uint256 amount2 = 500 * 10**18;

        token.mint(user1, amount1);
        token.mint(user1, amount2);

        assertEq(token.balanceOf(user1), amount1 + amount2, "Balance should be sum of mints");
        assertEq(token.totalSupply(), amount1 + amount2, "Total supply should be sum of mints");

        vm.stopPrank();
    }

    function test_Mint_OnlyOwner() public {
        vm.startPrank(user1);

        vm.expectRevert();
        token.mint(user1, 1000 * 10**18);

        vm.stopPrank();
    }

    function test_Mint_ZeroAddress() public {
        vm.startPrank(launchpad);

        vm.expectRevert();
        token.mint(address(0), 1000 * 10**18);

        vm.stopPrank();
    }

    // ============================================
    // TRANSFER TESTS
    // ============================================

    function test_Transfer_Success() public {
        vm.prank(launchpad);
        token.mint(user1, 1000 * 10**18);

        vm.startPrank(user1);

        uint256 transferAmount = 300 * 10**18;

        vm.expectEmit(true, true, false, true);
        emit Transfer(user1, user2, transferAmount);

        bool success = token.transfer(user2, transferAmount);

        assertTrue(success, "Transfer should succeed");
        assertEq(token.balanceOf(user1), 700 * 10**18, "Sender balance incorrect");
        assertEq(token.balanceOf(user2), 300 * 10**18, "Receiver balance incorrect");

        vm.stopPrank();
    }

    function test_Transfer_InsufficientBalance() public {
        vm.prank(launchpad);
        token.mint(user1, 1000 * 10**18);

        vm.startPrank(user1);

        vm.expectRevert();
        token.transfer(user2, 2000 * 10**18);

        vm.stopPrank();
    }

    function test_Transfer_ToZeroAddress() public {
        vm.prank(launchpad);
        token.mint(user1, 1000 * 10**18);

        vm.startPrank(user1);

        vm.expectRevert();
        token.transfer(address(0), 100 * 10**18);

        vm.stopPrank();
    }

    function test_TransferFrom_Success() public {
        vm.prank(launchpad);
        token.mint(user1, 1000 * 10**18);

        // Approve user2 to spend user1's tokens
        vm.prank(user1);
        token.approve(user2, 500 * 10**18);

        // user2 transfers from user1 to user3
        vm.startPrank(user2);

        uint256 transferAmount = 300 * 10**18;

        vm.expectEmit(true, true, false, true);
        emit Transfer(user1, user3, transferAmount);

        bool success = token.transferFrom(user1, user3, transferAmount);

        assertTrue(success, "TransferFrom should succeed");
        assertEq(token.balanceOf(user1), 700 * 10**18, "User1 balance incorrect");
        assertEq(token.balanceOf(user3), 300 * 10**18, "User3 balance incorrect");
        assertEq(token.allowance(user1, user2), 200 * 10**18, "Allowance not decremented");

        vm.stopPrank();
    }

    function test_TransferFrom_InsufficientAllowance() public {
        vm.prank(launchpad);
        token.mint(user1, 1000 * 10**18);

        vm.prank(user1);
        token.approve(user2, 100 * 10**18);

        vm.startPrank(user2);

        vm.expectRevert();
        token.transferFrom(user1, user3, 200 * 10**18);

        vm.stopPrank();
    }

    // ============================================
    // APPROVAL TESTS
    // ============================================

    function test_Approve_Success() public {
        vm.prank(launchpad);
        token.mint(user1, 1000 * 10**18);

        vm.startPrank(user1);

        uint256 approvalAmount = 500 * 10**18;

        vm.expectEmit(true, true, false, true);
        emit Approval(user1, user2, approvalAmount);

        bool success = token.approve(user2, approvalAmount);

        assertTrue(success, "Approval should succeed");
        assertEq(token.allowance(user1, user2), approvalAmount, "Allowance mismatch");

        vm.stopPrank();
    }

    function test_Approve_IncreaseAllowance() public {
        vm.prank(launchpad);
        token.mint(user1, 1000 * 10**18);

        vm.startPrank(user1);

        token.approve(user2, 100 * 10**18);
        token.approve(user2, 200 * 10**18);

        assertEq(token.allowance(user1, user2), 200 * 10**18, "Allowance should be updated");

        vm.stopPrank();
    }

    // ============================================
    // BURNING TESTS
    // ============================================

    function test_Burn_Success() public {
        vm.prank(launchpad);
        token.mint(user1, 1000 * 10**18);

        vm.startPrank(user1);

        uint256 burnAmount = 300 * 10**18;

        vm.expectEmit(true, true, false, true);
        emit Transfer(user1, address(0), burnAmount);

        token.burn(burnAmount);

        assertEq(token.balanceOf(user1), 700 * 10**18, "Balance after burn incorrect");
        assertEq(token.totalSupply(), 700 * 10**18, "Total supply after burn incorrect");

        vm.stopPrank();
    }

    function test_Burn_InsufficientBalance() public {
        vm.prank(launchpad);
        token.mint(user1, 1000 * 10**18);

        vm.startPrank(user1);

        vm.expectRevert();
        token.burn(2000 * 10**18);

        vm.stopPrank();
    }

    function test_BurnFrom_OnlyOwner() public {
        vm.prank(launchpad);
        token.mint(user1, 1000 * 10**18);

        // Only owner (launchpad) can call burnFrom
        vm.startPrank(launchpad);

        uint256 burnAmount = 300 * 10**18;

        vm.expectEmit(true, true, false, true);
        emit Transfer(user1, address(0), burnAmount);

        token.burnFrom(user1, burnAmount);

        assertEq(token.balanceOf(user1), 700 * 10**18, "Balance after burnFrom incorrect");
        assertEq(token.totalSupply(), 700 * 10**18, "Total supply after burnFrom incorrect");

        vm.stopPrank();
    }

    function test_BurnFrom_NotOwner() public {
        vm.prank(launchpad);
        token.mint(user1, 1000 * 10**18);

        vm.startPrank(user2);

        vm.expectRevert();
        token.burnFrom(user1, 300 * 10**18);

        vm.stopPrank();
    }

    // ============================================
    // ERC20VOTES - DELEGATION TESTS
    // ============================================

    function test_Delegation_SelfDelegate() public {
        vm.prank(launchpad);
        token.mint(user1, 1000 * 10**18);

        vm.startPrank(user1);

        assertEq(token.getVotes(user1), 0, "Should have no voting power before delegation");

        vm.expectEmit(true, true, true, false);
        emit DelegateChanged(user1, address(0), user1);

        token.delegate(user1);

        vm.roll(block.number + 1);

        assertEq(token.getVotes(user1), 1000 * 10**18, "Voting power should equal balance after self-delegation");
        assertEq(token.delegates(user1), user1, "Delegate should be self");

        vm.stopPrank();
    }

    function test_Delegation_DelegateToOther() public {
        vm.prank(launchpad);
        token.mint(user1, 1000 * 10**18);

        vm.startPrank(user1);

        vm.expectEmit(true, true, true, false);
        emit DelegateChanged(user1, address(0), user2);

        token.delegate(user2);

        vm.roll(block.number + 1);

        assertEq(token.getVotes(user1), 0, "User1 should have no voting power");
        assertEq(token.getVotes(user2), 1000 * 10**18, "User2 should have voting power");
        assertEq(token.delegates(user1), user2, "Delegate should be user2");

        vm.stopPrank();
    }

    function test_Delegation_ChangeDelegation() public {
        vm.prank(launchpad);
        token.mint(user1, 1000 * 10**18);

        vm.startPrank(user1);

        // First delegate to user2
        token.delegate(user2);
        vm.roll(block.number + 1);

        assertEq(token.getVotes(user2), 1000 * 10**18, "User2 should have voting power");

        // Change delegation to user3
        vm.expectEmit(true, true, true, false);
        emit DelegateChanged(user1, user2, user3);

        token.delegate(user3);
        vm.roll(block.number + 1);

        assertEq(token.getVotes(user2), 0, "User2 should lose voting power");
        assertEq(token.getVotes(user3), 1000 * 10**18, "User3 should gain voting power");

        vm.stopPrank();
    }

    function test_Delegation_MultipleDelegators() public {
        vm.startPrank(launchpad);
        token.mint(user1, 1000 * 10**18);
        token.mint(user2, 500 * 10**18);
        vm.stopPrank();

        // Both delegate to user3
        vm.prank(user1);
        token.delegate(user3);

        vm.prank(user2);
        token.delegate(user3);

        vm.roll(block.number + 1);

        assertEq(token.getVotes(user3), 1500 * 10**18, "User3 should have combined voting power");
    }

    function test_Delegation_TransferUpdatesDelegateVotes() public {
        vm.prank(launchpad);
        token.mint(user1, 1000 * 10**18);

        // user1 delegates to self
        vm.prank(user1);
        token.delegate(user1);
        vm.roll(block.number + 1);

        assertEq(token.getVotes(user1), 1000 * 10**18, "Initial voting power");

        // Transfer some tokens to user2
        vm.prank(user1);
        token.transfer(user2, 300 * 10**18);
        vm.roll(block.number + 1);

        // user1's voting power should decrease
        assertEq(token.getVotes(user1), 700 * 10**18, "Voting power should decrease after transfer");
        assertEq(token.getVotes(user2), 0, "User2 has no voting power (not delegated)");
    }

    function test_DelegateBySig_Success() public {
        vm.prank(launchpad);
        token.mint(user1, 1000 * 10**18);

        uint256 privateKey = 0xA11CE;
        address signer = vm.addr(privateKey);

        vm.prank(launchpad);
        token.mint(signer, 1000 * 10**18);

        uint256 nonce = token.nonces(signer);
        uint256 expiry = block.timestamp + 1 days;

        bytes32 domainSeparator = token.DOMAIN_SEPARATOR();
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Delegation(address delegatee,uint256 nonce,uint256 expiry)"),
                user2,
                nonce,
                expiry
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);

        token.delegateBySig(user2, nonce, expiry, v, r, s);

        vm.roll(block.number + 1);

        assertEq(token.delegates(signer), user2, "Delegation via signature should work");
        assertEq(token.getVotes(user2), 1000 * 10**18, "User2 should have voting power from signature delegation");
    }

    // ============================================
    // ERC20VOTES - VOTING POWER TESTS
    // ============================================

    function test_GetVotes_WithoutDelegation() public {
        vm.prank(launchpad);
        token.mint(user1, 1000 * 10**18);

        assertEq(token.getVotes(user1), 0, "Should have no voting power without delegation");
    }

    function test_GetPastVotes_Success() public {
        vm.prank(launchpad);
        token.mint(user1, 1000 * 10**18);

        vm.prank(user1);
        token.delegate(user1);

        vm.roll(block.number + 1);
        vm.warp(block.timestamp + 1);

        uint256 snapshotTime = block.timestamp - 1;

        vm.roll(block.number + 10);
        vm.warp(block.timestamp + 100);

        uint256 pastVotes = token.getPastVotes(user1, snapshotTime);
        assertEq(pastVotes, 1000 * 10**18, "Past votes should match balance at snapshot");
    }

    function test_GetPastTotalSupply_Success() public {
        vm.prank(launchpad);
        token.mint(user1, 1000 * 10**18);

        vm.roll(block.number + 1);
        vm.warp(block.timestamp + 1);

        uint256 snapshotTime = block.timestamp - 1;

        // Mint more tokens
        vm.prank(launchpad);
        token.mint(user2, 500 * 10**18);

        vm.roll(block.number + 10);
        vm.warp(block.timestamp + 100);

        uint256 pastSupply = token.getPastTotalSupply(snapshotTime);
        assertEq(pastSupply, 1000 * 10**18, "Past supply should not include later mints");
    }

    // ============================================
    // ERC20PERMIT - GASLESS APPROVAL TESTS
    // ============================================

    function test_Permit_Success() public {
        vm.prank(launchpad);
        token.mint(user1, 1000 * 10**18);

        uint256 privateKey = 0xA11CE;
        address owner = vm.addr(privateKey);

        vm.prank(launchpad);
        token.mint(owner, 1000 * 10**18);

        uint256 value = 500 * 10**18;
        uint256 nonce = token.nonces(owner);
        uint256 deadline = block.timestamp + 1 days;

        bytes32 domainSeparator = token.DOMAIN_SEPARATOR();
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                owner,
                user2,
                value,
                nonce,
                deadline
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);

        token.permit(owner, user2, value, deadline, v, r, s);

        assertEq(token.allowance(owner, user2), value, "Allowance should be set via permit");
        assertEq(token.nonces(owner), nonce + 1, "Nonce should be incremented");
    }

    function test_Permit_ExpiredDeadline() public {
        uint256 privateKey = 0xA11CE;
        address owner = vm.addr(privateKey);

        vm.prank(launchpad);
        token.mint(owner, 1000 * 10**18);

        uint256 value = 500 * 10**18;
        uint256 nonce = token.nonces(owner);
        uint256 deadline = block.timestamp - 1; // Expired

        bytes32 domainSeparator = token.DOMAIN_SEPARATOR();
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                owner,
                user2,
                value,
                nonce,
                deadline
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);

        vm.expectRevert();
        token.permit(owner, user2, value, deadline, v, r, s);
    }

    function test_Permit_InvalidSignature() public {
        uint256 privateKey = 0xA11CE;
        address owner = vm.addr(privateKey);

        vm.prank(launchpad);
        token.mint(owner, 1000 * 10**18);

        uint256 value = 500 * 10**18;
        uint256 nonce = token.nonces(owner);
        uint256 deadline = block.timestamp + 1 days;

        // Sign with wrong private key
        uint256 wrongPrivateKey = 0xBAD;

        bytes32 domainSeparator = token.DOMAIN_SEPARATOR();
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                owner,
                user2,
                value,
                nonce,
                deadline
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongPrivateKey, digest);

        vm.expectRevert();
        token.permit(owner, user2, value, deadline, v, r, s);
    }

    // ============================================
    // OWNERSHIP TESTS
    // ============================================

    function test_Ownership_InitialOwner() public view {
        assertEq(token.owner(), launchpad, "Initial owner should be launchpad");
    }

    function test_Ownership_TransferOwnership() public {
        vm.startPrank(launchpad);

        address newOwner = address(0x999);
        token.transferOwnership(newOwner);

        assertEq(token.owner(), newOwner, "Owner should be transferred");

        vm.stopPrank();
    }

    function test_Ownership_OnlyOwnerCanTransfer() public {
        vm.startPrank(user1);

        vm.expectRevert();
        token.transferOwnership(user2);

        vm.stopPrank();
    }

    function test_Ownership_RenounceOwnership() public {
        vm.startPrank(launchpad);

        token.renounceOwnership();

        assertEq(token.owner(), address(0), "Owner should be zero address after renounce");

        vm.stopPrank();
    }

    // ============================================
    // INTEGRATION TESTS
    // ============================================

    function test_Integration_MintTransferBurn() public {
        // 1. Mint tokens
        vm.prank(launchpad);
        token.mint(user1, 1000 * 10**18);

        assertEq(token.balanceOf(user1), 1000 * 10**18, "Balance after mint");
        assertEq(token.totalSupply(), 1000 * 10**18, "Supply after mint");

        // 2. Transfer tokens
        vm.prank(user1);
        token.transfer(user2, 300 * 10**18);

        assertEq(token.balanceOf(user1), 700 * 10**18, "User1 balance after transfer");
        assertEq(token.balanceOf(user2), 300 * 10**18, "User2 balance after transfer");

        // 3. Burn tokens
        vm.prank(user2);
        token.burn(100 * 10**18);

        assertEq(token.balanceOf(user2), 200 * 10**18, "User2 balance after burn");
        assertEq(token.totalSupply(), 900 * 10**18, "Supply after burn");
    }

    function test_Integration_DelegationWithTransfers() public {
        // 1. Mint and delegate
        vm.prank(launchpad);
        token.mint(user1, 1000 * 10**18);

        vm.prank(user1);
        token.delegate(user1);

        vm.roll(block.number + 1);

        assertEq(token.getVotes(user1), 1000 * 10**18, "Initial voting power");

        // 2. Transfer (voting power should update)
        vm.prank(user1);
        token.transfer(user2, 400 * 10**18);

        vm.roll(block.number + 1);

        assertEq(token.getVotes(user1), 600 * 10**18, "Voting power after transfer");

        // 3. User2 delegates to user3
        vm.prank(user2);
        token.delegate(user3);

        vm.roll(block.number + 1);

        assertEq(token.getVotes(user3), 400 * 10**18, "User3 voting power from delegation");
    }

    function test_Integration_PermitAndTransferFrom() public {
        uint256 privateKey = 0xA11CE;
        address owner = vm.addr(privateKey);

        vm.prank(launchpad);
        token.mint(owner, 1000 * 10**18);

        uint256 value = 500 * 10**18;
        uint256 nonce = token.nonces(owner);
        uint256 deadline = block.timestamp + 1 days;

        // Sign permit
        bytes32 domainSeparator = token.DOMAIN_SEPARATOR();
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                owner,
                user2,
                value,
                nonce,
                deadline
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);

        // Execute permit
        token.permit(owner, user2, value, deadline, v, r, s);

        // Use approved amount
        vm.prank(user2);
        token.transferFrom(owner, user3, value);

        assertEq(token.balanceOf(owner), 500 * 10**18, "Owner balance after transferFrom");
        assertEq(token.balanceOf(user3), 500 * 10**18, "User3 balance after transferFrom");
        assertEq(token.allowance(owner, user2), 0, "Allowance should be fully used");
    }
}
