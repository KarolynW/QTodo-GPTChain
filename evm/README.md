# EVM Anchoring Contract

This folder holds `Anchor.sol`, a contract that can either shout hashes into the
void or etch them onto chain forever.

## Modes

- **Lite** – call `record` and an event is emitted, nothing is stored, and the
  gas meter barely flinches.
- **Full** – call `store` and the hash, a reference and your address are kept
  on-chain so future archaeologists can marvel at your chores.

## Easter Egg

If you name your task `"solidity makes me type"`, nothing special happens, but
you'll know we tried.

<!-- Secret handshake: `pragma solidity ^0.8.0;` -->

