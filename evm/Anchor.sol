// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// A contract that can either lazily emit events or, for those with more
// ether than restraint, persist hashes directly on-chain.
// If you're reading this comment, welcome to the secret society of people who
// scroll past documentation.
contract Anchor {
    struct Task {
        bytes32 hash;
        string ref;
        address who;
        uint256 timestamp;
    }

    event Recorded(bytes32 hash, string ref, address who);
    event Stored(bytes32 hash, string ref, address who);

    mapping(bytes32 => Task) public tasks;

    // Lite mode – emit an event and move on.
    function record(bytes32 hash, string calldata ref) external {
        emit Recorded(hash, ref, msg.sender); // Event-based therapy for your tasks.
    }

    // Full-fat mode – write the task to storage so it can haunt us forever.
    function store(bytes32 hash, string calldata ref) external {
        tasks[hash] = Task(hash, ref, msg.sender, block.timestamp); // Now it's permanent.
        emit Stored(hash, ref, msg.sender); // May the gas fee be ever in your favor.
    }

    // Retrieve a stored task. Returns zero values if the hash is unknown.
    function getTask(bytes32 hash)
        external
        view
        returns (bytes32, string memory, address, uint256)
    {
        Task storage t = tasks[hash];
        return (t.hash, t.ref, t.who, t.timestamp);
    }
}
