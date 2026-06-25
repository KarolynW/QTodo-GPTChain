# qtodo-gptchain

*The frontend. The face of the operation. The thing the user sees before they
close the tab.*

Built with React 19, Vite 7, and Tailwind CSS v4 because we started with
the assumption that whatever framework was newest was also most correct, and
we stand by that assumption in the same way you stand by a decision made
at 2am: with diminishing certainty and no real alternative.

The app is a todo list. It does what todo lists do. It also does approximately
twenty other things that todo lists do not do and have never been asked to do.
We regret nothing.

---

## Features (Complete Inventory)

### The Core Feature (The Reason This Exists)

You can add tasks. You can complete them. You can delete them. Tasks have a
title, a tag, a deadline, and a note. This is the todo list. This took about
fifteen minutes to implement. The remaining features took considerably longer.

### Features Added Because We Had Momentum

**Quantum Daily Shuffle** — every morning the task order is randomised using
genuine quantum random numbers from the Australian National University's
vacuum fluctuation experiment. Falls back to `crypto.getRandomValues()` when
ANU is having a day, which they are allowed to have. The shuffle solves the
problem of not knowing which task to avoid first. Now you can avoid them in a
different order every day. Progress.

**AI Priority Scores™** — each task gets a score `[1–99]` displayed in
brackets. The score is computed from deadline urgency, title length, and
`sin(created_at / 1_000_003)`. The sine term provides cosmic variation so
tasks created at different times get different base scores. The score is
never 100 because certainty is not a feature we offer. The score means
nothing and you will start making decisions based on it within 48 hours.

**Vibe Check™** — one button. `gpt-5.4-nano` reads your entire task list and
delivers a one-sentence roast of your current productivity situation. Costs
$0.20 per million tokens. Your task list is worth approximately $0.000003.
Requires an OpenAI API key set in ⚙ Settings (your key; we don't have one;
we're not paying for this).

**OpenTimestamps proof** — expired tasks can be cryptographically timestamped
on the Bitcoin blockchain via the OpenTimestamps calendar network. The task
is hashed SHA-256 client-side (the server never sees the content) and the
hash is submitted to real OTS calendar servers. A miner will eventually
include proof in a block. The Bitcoin blockchain will then contain, forever,
a commitment to the hash of your unfinished task. This is either a digital
legacy or a warning to future civilisations.

**EVM Anchoring** — for when one blockchain isn't enough. After OTS, hashes
can also be anchored on a Base Sepolia L2 chain via a custom `Anchor.sol`
contract. Lite mode emits an event. Full mode stores the hash forever. Your
task is now on two blockchains. Neither of them will finish it for you.

**Deploy your own contract** — in ⚙ Settings, connect MetaMask and click
"Deploy via MetaMask". The app will deploy `Anchor.sol` to whatever network
you're on, return the contract address, and fill it in automatically. You
have just deployed a smart contract from a todo app. Tell your friends.

**Self-Destruct** — a large red ☢ Self Destruct button initiates a countdown,
then erases all non-expired tasks, fires red confetti at the viewport, and
displays the message "Anticlimax achieved." Expired tasks are immune — they
have earned their permanence. The button exists because sometimes starting
fresh is healthier than processing your backlog.

**Failure Dashboard** — every deleted-unfinished task accrues shame points.
Every expired task increments your procrastination streak. Navigate to
📊 Failure to see your current rank. Ranks escalate from "Mildly Guilty"
through "Procrastination Artist" to "Overlord of Sloth". Export as CSV.
Import into Excel. Schedule time to review it. Don't show up for that
meeting either.

**Drag and Drop** — tasks can be reordered by dragging. Built with the HTML5
Drag and Drop API and a `useRef` to avoid stale closure bugs that would
otherwise silently swap the wrong tasks. The ref exists because drag events
and React state updates are on different schedules and the universe doesn't
care about either of them.

**Voice Input** — click 🎙 Voice and speak your task. The button pulses red
while listening, like a very small urgent heart. Works in Chrome. Safari
pretends the feature doesn't exist.

**Browser Notifications** — click 🔔 Notify for permission, then receive
a desktop notification 30 minutes before a task expires. The notification
arrives whether or not you are paying attention. This is by design. The task
was not paying attention to its deadline either.

**Multi-Tab Sync** — `BroadcastChannel` synchronises task state across all
open tabs in real time. Open six. Close five. Watch the remaining one inherit
everyone's decisions. This is called consensus. Democracy, but for browser tabs.

**Tag System** — six emoji tags: 🔥 Urgent, 💼 Work, 🏠 Home, 🧠 Think,
💀 Already dead, 🌱 Low stakes. One per task. They help with organisation
in the same way filing systems help with organisation: conceptually sound,
rarely consulted.

**Punishment Mode** — activated by the ☀ Punish button. Applies Comic Sans
to everything. Removes the matrix rain. Removes the 3D ASCII art rotation.
Turns the background white. Leaves you with your choices. Deactivated by
the 🌙 Dark button, which restores dignity. The CSS class responsible is
`.punishment-mode canvas { display: none !important; }`. The `!important`
is not ironic. It is load-bearing.

**3D Animated ASCII Art** — the header renders a 3D ASCII logotype via pure
CSS: `rotateY`, `rotateX`, multiple `text-shadow` layers as depth planes,
6 keyframe animation phases. It is visually impressive for approximately
4 seconds, after which you stop noticing it. This is the correct amount
of time to spend on a todo app header.

**Matrix Rain** — a `<canvas>` element behind everything runs falling Katakana
and Latin characters. Repaints every 50ms. Does not affect performance
because the canvas is behind everything and GPU-composited. Disappears in
Punishment Mode. Proves that decorative violence is possible with `setInterval`.

**Confetti** — green confetti on task completion. Red confetti on self-destruct.
`canvas-confetti`. This is the only package in the project that does exactly
what it says and nothing else. We respect this.

**WebSocket status** — the nav shows `ws: ●` (green) or `ws: ○` (grey) based
on the backend WebSocket connection. The WebSocket echoes messages and serves
no other purpose. The indicator was built first. The purpose was never found.

**PWA** — the app has a `manifest.json` and a service worker. You can install
it on your home screen. It will appear next to your other apps. It will feel
like a real app. You will forget it's a todo list powered by twelve services.
This is the goal.

**Prometheus metrics** — `GET http://localhost:8000/metrics` returns data
including `qtodo_existential_dread 9.7`. Not scraped. Just there. For you.

---

## BYOK — Bring Your Own Key

This app costs nothing to operate because it costs *you* something to use.

In ⚙ Settings:

- **OpenAI API key** — paste your `sk-...` key. The Vibe Check™ and haiku
  generation use it. Stored in `localStorage`. Never sent to our server.
  We don't have a server with opinions about your API key.

- **EVM credentials** — RPC URL, private key, contract address, chain, explorer,
  mode. For per-request blockchain anchoring with your own wallet. The backend
  accepts these per-request and builds a one-off connection. We won't pay for
  your gas. This is clarified in the settings panel. We feel good about this.

- **MetaMask deployment** — connect MetaMask and deploy `Anchor.sol` in two
  clicks. The ABI and bytecode are bundled at `public/Anchor.json`. No terminal
  required. No solc required. Just MetaMask and an L2 you're willing to sacrifice
  some testnet tokens to.

---

## Development

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. The matrix rain will start immediately.
The ASCII art will rotate. You will spend sixty seconds watching both before
remembering you came to implement a feature.

For full functionality, run the backend too:

```bash
cd ../ots-server
pip install -r requirements.txt
uvicorn main:app --reload
```

OpenAI features (Vibe Check™, haiku) work without the backend but require a
key in ⚙ Settings. Blockchain features (OTS, EVM) require the backend.
The backend requires Python. Python requires installation. Installation
requires patience. Patience requires a personality trait we have chosen not
to assume about you.

---

## Docker (Recommended for People Who Prefer Containers to Problems)

```bash
# From repo root
docker compose up
```

Frontend: `http://localhost:3000`
Backend: `http://localhost:8000`
MCP server: `http://localhost:8001` (for your AI agents, obviously)

The frontend container is a two-stage build: Node 22 compiles the React app,
nginx serves the static output and proxies `/api/` and `/ws` to the backend.
This is the correct way to containerise a React app. We know this because we've
containerised several incorrect ways first.

---

## Tests

```bash
npm test
```

Expected: **53 tests, 4 test files, all green.**

The tests cover:
- Core task operations (add, complete, delete, expire)
- AI priority scores (never 100; the shame points math; the tag labels)
- OTS utilities (SHA-256, canonicalisation, round-trip)
- Failure statistics (shame accumulation; rank escalation)
- App integration (quantum RNG fallback; self-destruct; vibe check; punishment mode;
  drag-and-drop; settings modal; BYOK key persistence; EVM contract address storage)

Canvas errors appear in stderr during test runs. The matrix rain does not render
in jsdom. This is fine. The rain is not being tested. The rain is beyond testing.
The rain simply is.

If any tests fail: `npm test -- --reporter=verbose` for detail.
If all tests fail: check that jsdom is happy and the mocks are in place.
If you don't care: that is also a valid position and we respect it.

---

## Repository Layout

```
qtodo-gptchain/
├── src/
│   ├── App.jsx                  ← ~900 lines; the entire disaster in one file
│   ├── App.test.jsx             ← 30 integration tests keeping it nominally honest
│   ├── MatrixRain.jsx           ← canvas rain; has no props; controls its own fate
│   ├── Failure.jsx              ← shame dashboard; CSV export; rank titles
│   ├── index.css                ← Tailwind v4; 3D keyframes; Punishment Mode trap
│   ├── components/
│   │   └── SettingsModal.jsx    ← BYOK: API keys, EVM creds, MetaMask deployment
│   └── utils/
│       ├── priority.js          ← aiPriorityScore(); TAGS; score bracket labels
│       ├── failure.js           ← shamePoints(); procrastinationTitle(); getStats()
│       └── ots.js               ← SHA-256; task canonicalisation; round-trip verify
├── public/
│   ├── manifest.json            ← PWA manifest; name: "QTodo-GPTChain"; description: snarky
│   ├── sw.js                    ← service worker; network-first; because we trust the network
│   └── Anchor.json              ← compiled Anchor.sol; ABI + bytecode; for MetaMask deployment
├── priority.test.js             ← 15 tests for the fake AI score
├── failure.test.js              ← 4 tests for the shame tracker
├── ots.test.js                  ← 4 tests for the crypto utils
├── vite.config.js               ← @tailwindcss/vite plugin; no other surprises
├── index.html                   ← single entry point; all chaos begins here
├── package.json                 ← dependencies: react, vite, tailwind, confetti, ethers, vitest
└── nginx.conf                   ← SPA routing; /api/ proxy; /ws WebSocket upgrade
```

---

## Hidden Features (Actually Hidden This Time)

- The AI priority score for a task titled exactly "buy milk" is deterministic.
  Run `aiPriorityScore({ title: 'buy milk', expired_at: <tomorrow> })` in the
  console. The number returned is the correct priority for buying milk.
  We stand by this.

- The WebSocket sends you a welcome message: *"Welcome to QTodo-GPTChain
  WebSocket. This connection serves no purpose. We appreciate your presence."*
  It will never send you another message unless you send one first. It is not
  shy. It has simply run out of things to say.

- Punishment Mode stores its state in `document.body.classList`, not in React
  state. This means toggling it in one tab doesn't broadcast to other tabs.
  Multi-tab punishment is opt-in per tab. We considered this carefully.
  We left it this way on purpose.

- `Ctrl+Alt+Shift+Y` does not activate yodel mode. That was in an earlier README
  and it was a lie. We have removed it. Honesty is a feature.

<!-- 53 tests pass. 0 tasks completed. We consider the ratio acceptable. -->
