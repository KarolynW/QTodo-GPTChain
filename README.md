# qtodo-gptchain

Because building a normal to-do app would have been too easy, this project leans hard
into unnecessary complexity. It's the definitive reminder that simple problems demand
an entourage of web frameworks, cryptography and existential dread.

## Feature Parade

This is the todo list app absolutely no one needs, yet here we are. If you thought a
checkbox and a database table were enough, brace yourself.

- **Quantum-powered procrastination** – once per day tasks are reshuffled using
  genuine quantum random numbers, so the universe decides your priorities. Who are we
  to argue with cosmic background radiation?
- **Haiku-based clarity** – each task is sent to the OpenAI API and returned as an
  ambiguously poetic haiku. Understanding the checklist is half the battle;
  deciphering the poetry is the other half.
- **Task expiration** – give a task a deadline; once it passes, the task becomes
  undeletable, a haunting reminder of your unfinished ambitions that sticks around
  like an embarrassing tweet.
- **Self-destruct mode** – press the big red button and the entire list immolates
  itself, perfect for those moments when your best plan is scorched earth productivity.
- **Failure stats and shame points** – track expired and deleted tasks,
  watch your procrastination streak grow, and climb from "Mildly Guilty"
  all the way to "Overlord of Sloth".
- **OpenTimestamps proofs** – expired tasks can be hashed in-browser and timestamped
  without ever leaking their contents. Proofs are created, verified and upgraded via a
  tiny FastAPI server that exists solely to confuse future archaeologists.
- **Pointless EVM anchoring** – for reasons best left unexplored, hashes can be anchored
  on a bargain-bin L2 chain via a microscopic smart contract. Run it in **lite** mode to
  emit a throwaway event, or flip to **full** mode to stash the hash and a reference
  string on-chain and bask in the permanence.
- **Blinking ASCII art** – because a todo app without terminal nostalgia is hardly
  worth opening. Bring your own CRT monitor for maximum effect.
- **LocalStorage persistence** – your list survives refreshes and browser restarts so
  you can keep not doing things indefinitely. Congratulations, you've invented memory.
- **Modern stack** – built with React, Vite and TailwindCSS for absolutely no reason
  other than we could. A microservice architecture would have felt too restrained.

## Totally Unnecessary Philosophy

Why should a glorified checklist have a philosophy? It shouldn't, which is precisely
why we've given it one. qtodo-gptchain embraces the absurdity of productivity culture:
if every other app can bolt on AI, blockchain and whatever buzzword is trending, we
can certainly wax lyrical about the ontology of deferred chores.

Productivity, we're told, is a journey. In this app, that journey involves quantum RNG,
haiku generators and a self-destruct button. It's a protest against modern software
that ships more features than usefulness. If you ever wondered what happens when you
throw the entire developer toolbox at a mundane problem, welcome to the case study.

We ridicule the trend by participating in it, piling on features purely because
no one asked. Is it over-engineered? Absolutely. Does it spark joy? Also absolutely.

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
EVM_MODE=lite
```

Two modes are available:

- `lite` (default) – the contract calls `record`, which emits an event and then
  forgets the hash to keep gas costs microscopic.
- `full` – the contract uses `store` to persist the hash, a short reference and
  the sender address on-chain. This costs more but allows later verification via
  `POST /evm/verify` or the `getTask` view.

Set `EVM_MODE=full` if you want the chain to remember your hashes; otherwise the
Lite mode leaves only an ephemeral event behind.

The contract source lives in `evm/Anchor.sol` and supports both modes, letting
you choose between fiscal responsibility and glorious waste.

## Tour of the Repository

- **qtodo-gptchain/** – the front end where tasks become poetry and checkboxes learn
  shame.
- **ots-server/** – a FastAPI helper that lovingly wraps OpenTimestamps and pretends
  to be a blockchain whisperer.
- **evm/** – contains a Solidity contract that exists solely so your chores can
  hit the chain and feel important for a few seconds.

If you stumbled all the way down here, the secret passphrase is
`"nothing says productivity like twelve microservices"`.

<!-- Easter egg: you have unlocked the hidden level. Sadly, it only contains more
     documentation. -->

## Development

```bash
cd qtodo-gptchain
npm install
npm run dev
```

Set a `VITE_OPENAI_API_KEY` environment variable with an OpenAI API key if you actually
want the AI to butcher your tasks into haiku. Without it, the app grudgingly keeps your
original text.
