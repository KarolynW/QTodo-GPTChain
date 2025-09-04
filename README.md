# qtodo-gptchain

Because building a normal to-do app would have been too easy, this project leans hard
into unnecessary complexity.

## Feature Rundown

This is the todo list app absolutely no one needs, yet here we are.

- **Quantum-powered procrastination** – once per day tasks are reshuffled using
  genuine quantum random numbers, so the universe decides your priorities.
- **Haiku-based clarity** – each task is sent to the OpenAI API and returned as an
  ambiguously poetic haiku. Understanding the checklist is half the battle.
- **Task expiration** – give a task a deadline; once it passes, the task becomes
  undeletable, a haunting reminder of your unfinished ambitions.
- **OpenTimestamps proofs** – expired tasks can be hashed in-browser and timestamped
  without ever leaking their contents. Proofs are created, verified and upgraded via a
  tiny FastAPI server.
- **Pointless EVM anchoring** – for reasons best left unexplored, hashes can also be
  flung at a bargain-bin L2 chain where a microscopic smart contract dutifully emits
  an event. The app only hands over the SHA-256 hex and a brief reference, then shows
  you a block explorer link so you can admire the waste.
- **Blinking ASCII art** – because a todo app without terminal nostalgia is hardly
  worth opening.
- **LocalStorage persistence** – your list survives refreshes and browser restarts so
  you can keep not doing things indefinitely.
- **Modern stack** – built with React, Vite and TailwindCSS for absolutely no reason
  other than we could.

### Testing

The app now ships with Vitest and React Testing Library.
Because nothing says "rock-solid engineering" like watching tiny green checkmarks
tell you that hashing strings still works in 2025.

```bash
cd qtodo-gptchain
npm test
```

If those tests pass, feel free to frame the output and mail it to your future self
as proof you once had things under control.

### OpenTimestamps Server

```bash
cd ots-server
pip install -r requirements.txt
uvicorn main:app --reload
```

To indulge the EVM anchoring, set the following environment variables so the
server knows how to reach your chosen testnet:

```
EVM_RPC_URL=https://sepolia.base.org
EVM_PRIVATE_KEY=0x...
EVM_CONTRACT_ADDRESS=0x...
EVM_CHAIN=base-sepolia
EVM_EXPLORER=https://sepolia.basescan.org
```

The contract source lives in `evm/Anchor.sol` and does little more than shout an
event into the void.

## Development

```bash
cd qtodo-gptchain
npm install
npm run dev
```

Set a `VITE_OPENAI_API_KEY` environment variable with an OpenAI API key if you actually
want the AI to butcher your tasks into haiku. Without it, the app grudgingly keeps your
original text.
