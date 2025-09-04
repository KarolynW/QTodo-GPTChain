# qtodo-gptchain

Yes, the source for the world's most over-engineered to-do list lives here.
Because nothing says "stay organized" like React, Vite, Tailwind and a mild
identity crisis.

## Features

- Tasks are lovingly transmogrified into enigmatic haiku by the OpenAI API.
- Daily quantum random shuffling keeps you guessing which chore comes next.
- A blinking ASCII banner to prove we care more about aesthetics than usefulness.
- Failure stats with shame points and ranks — watch expired and deleted tasks
  pile up as you rise from "Mildly Guilty" to "Overlord of Sloth".
- Export those stats as CSV for anyone who enjoys spreadsheet-driven regret.
- LocalStorage persistence so your confusion survives every refresh.
- Assign expiry dates to tasks; once a task's time is up, it's immortal and
  can no longer be deleted.
- A self-destruct button initiates an earnest countdown before wiping all
  non-expired tasks.
- Expired tasks can be timestamped with OpenTimestamps. The app hashes the task locally
  and sends only the hash to a small FastAPI helper for proof creation, verification and
  upgrades.
- Should that fail to satisfy your craving for futility, an optional button can anchor
  the hash on a Base Sepolia contract. In the default **lite** mode the contract merely
  emits an event and forgets the hash; switch the server to `EVM_MODE=full` and it stores
  the hash and a reference on-chain for anyone to dig up later.

## Tests

Because we apparently don't trust ourselves, there's a test suite.

```bash
npm test
```

If the results aren't a pristine field of green, feel free to blame cosmic rays.

## Development

```bash
npm install
npm run dev
```

To use OpenTimestamps, run the server from the repository root:

```bash
cd ../ots-server
pip install -r requirements.txt
uvicorn main:app --reload
```

Set `VITE_OPENAI_API_KEY` in your environment if you actually want the AI to
rewrite your tasks. Otherwise, enjoy plain text like it's 1999.

## Hidden Features

- Press `Ctrl+Alt+Shift+Y` to enable "yodel mode".*
- Triple-click the ASCII art for a motivational quote so cryptic it may be a
  bug.

\*Not actually implemented, but believing is half the battle.

<!-- If you're digging for secrets, try adding a task named "42". Nothing happens,
     but you'll feel clever. -->
