# EVM Anchoring Contract

*Because if Bitcoin's energy consumption isn't enough, you can also burn L2 gas
on your grocery list.*

```
┌─────────────────────────────────────────────────────────────────┐
│                   THE PHILOSOPHICAL LIFECYCLE                    │
│                                                                  │
│  1. You create a task: "Buy milk"                                │
│  2. You forget to buy milk                                       │
│  3. The task expires                                             │
│  4. You hash the task SHA-256 client-side                        │
│  5. You anchor the hash on a blockchain                          │
│  6. Civilisation has permanent cryptographic proof               │
│     that you forgot to buy milk                                  │
│  7. There is no step 8                                           │
└─────────────────────────────────────────────────────────────────┘
```

## What Lives Here

- `Anchor.sol` — the contract. 64 lines of Solidity that does one thing.
- `Anchor.json` — compiled ABI + bytecode so the browser can deploy it via
  MetaMask without you touching a terminal. This is either extremely convenient
  or deeply concerning. Both, probably.

## The Contract

`Anchor.sol` exposes two modes of recording a hash to the blockchain, in
ascending order of commitment:

### Lite Mode (`record`)

Emits a `HashRecorded` event and does nothing else. The event lives in the
transaction log, which means it exists permanently on chain but costs roughly
the same gas as a deep breath. Future archaeologists will find your event.
They will not know what to do with it. Neither will you.

```solidity
function record(bytes32 hash, string calldata ref) external;
```

Good for: proving you did the thing without actually storing the thing.
Gas cost: blessedly low.
Data retention: theoretically forever.
Usefulness: theoretically measurable.

### Full Mode (`store`)

Actually stores the hash, a reference string, your wallet address, and the
block timestamp in a mapping. This costs more gas because it writes to
contract storage, which is the most expensive form of storage that humanity
has invented since illuminated manuscripts.

```solidity
function store(bytes32 hash, string calldata ref) external;
```

```solidity
function getTask(bytes32 hash) external view returns (
    bytes32 storedHash,
    string memory ref,
    address anchorer,
    uint256 timestamp
);
```

Good for: when you want retrieval. When you want to call `getTask` three years
from now and learn that the hash `0xdeadbeef...` represents your note to
"respond to Dave's email". Dave has moved on. The blockchain has not.
Dave is fine.

## Deployment

### Option A: MetaMask (Recommended for People Who Enjoy GUI)

1. Open the ⚙ Settings panel in the QTodo frontend
2. Connect MetaMask (it must be on the right network, or it will connect to the
   wrong network and you will feel confused)
3. Click "Deploy via MetaMask"
4. Approve the transaction
5. Copy the resulting contract address
6. Paste it into the Contract Address field
7. Click Save
8. You have deployed a smart contract to production using a todo app's settings
   panel. This is your life now.

### Option B: Manual (For People Who Enjoy Terminals)

```bash
cd evm
pip install py-solc-x
python -c "
import solcx
solcx.install_solc('0.8.20')
compiled = solcx.compile_files(['Anchor.sol'], output_values=['abi','bin'], solc_version='0.8.20')
import json; print(json.dumps(list(compiled.values())[0], indent=2))
"
```

Then deploy the bytecode using your preferred method. The `Anchor.json` in
`../qtodo-gptchain/public/` is the pre-compiled version so the frontend can
do this automatically. If you modify `Anchor.sol`, re-run the compile and
copy the output there. Or don't. The existing contract is deployed somewhere.
It's fine. Everything is fine.

## Environment Variables (Backend)

```bash
EVM_RPC_URL=https://sepolia.base.org     # where to send transactions
EVM_PRIVATE_KEY=0x...                    # server's default signing key
EVM_CONTRACT_ADDRESS=0x...              # where Anchor.sol lives
EVM_CHAIN=base-sepolia                   # for logging and explorer links
EVM_EXPLORER=https://sepolia.basescan.org # for the "view on explorer" link
EVM_MODE=lite                            # 'lite' or 'full'; see above
```

These are the server's defaults. Users can override all of them per-request
by supplying their own credentials in ⚙ Settings. This means a single backend
instance can serve multiple users each anchoring to their own contracts with
their own wallets. The fact that users are handing their private keys to a web
app settings panel is a design decision that we are choosing not to dwell on.

## Security Considerations

The contract has no access control. Anyone with the contract address can call
`record` or `store`. This is intentional in the same way leaving your front door
open is intentional: it signals trust in the neighbourhood.

The SHA-256 hashing is done client-side before any hash reaches the backend.
The server never sees task content. Only the hash. The backend has plausible
deniability about what you were supposed to buy at the grocery store.

Private keys in environment variables are a known bad practice. The Terraform
deployment uses AWS Secrets Manager instead. The local Docker setup uses
environment variables. The development setup leaves it as an exercise for
the reader. Exercises are healthy.

## Gas Costs

As of June 2026 on Base Sepolia (testnet):
- `record()` with a short ref string: ~30,000–45,000 gas
- `store()` with a short ref string: ~60,000–80,000 gas

On mainnet this would cost real money. On testnet it costs nothing. This is
why we are on testnet. We respect your wallet the same way we respect your
time: hypothetically and in principle.

## Easter Eggs

- The contract compiler pragma is `^0.8.20`, not `^0.8.0`. This is because
  `0.8.20` supports custom errors and is generally less embarrassing.
- If you name your task `"solidity makes me type"`, nothing special happens.
  It will be hashed, anchored, and forgotten exactly like every other task.
  The code was kind enough to mention this. The contract was not.
- `EVM_MODE=full` is called "full" because "permanent" felt presumptuous
  and "forever" would jinx it.

<!-- gas fees: real. todo list: optional. blockchain: permanent. irony: measurable. -->
