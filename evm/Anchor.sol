// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// A contract that favours events over storage, in true minimalist fashion.
contract Anchor {
    event Recorded(bytes32 hash, string ref, address who);

    function record(bytes32 hash, string calldata ref) external {
        emit Recorded(hash, ref, msg.sender);
    }
}
