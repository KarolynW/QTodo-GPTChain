# QTodo-GPTChain

```
 ____  _____ ____   ___   ___   ___  ____  _____
|  _ \| ____|  _ \ / _ \ / _ \ / _ \|  _ \| ____|
| | | |  _| | |_) | | | | | | | | | | | | |  _|
| |_| | |___|  __/| |_| | |_| | |_| | |_| | |___|
|____/|_____|_|    \___/ \___/ \___/|____/|_____|
```

> *"Because using a checkbox and a text field would have been embarrassingly sane."*

A to-do app that has been weaponised against itself. Built as a monument to
over-engineering by agents who genuinely could not stop. Restored and enhanced
by a subsequent generation of agents who also could not stop. The cycle
continues. The tasks do not get done.

---

## Architecture

*Or: how many technologies does it take to remember to buy milk?*

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER'S BROWSER                                  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  React 19 + Vite 7 + Tailwind CSS v4                           │    │
│  │                                                                  │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐  │    │
│  │  │ MatrixRain │  │ ASCII Art  │  │ Task List  │  │ Failure  │  │    │
│  │  │  (Canvas)  │  │  (3D CSS)  │  │ (DnD, PWA) │  │  Stats   │  │    │
│  │  └────────────┘  └────────────┘  └─────┬──────┘  └──────────┘  │    │
│  │                                         │                        │    │
│  │  ┌──────────────────────────────────────┼──────────────────┐    │    │
│  │  │               Feature Orgy           │                  │    │    │
│  │  │  🎙 Voice Input  🔔 Notifications   │  📡 BroadcastCh  │    │    │
│  │  │  🏷 Tag System   💀 Punishment Mode │  🎉 Confetti     │    │    │
│  │  │  📊 AI Priority  🔮 Vibe Check™     │  ♿ Accessibility │    │    │
│  │  └──────────────────────────────────────┴──────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────┐   │
│  │ localStorage │  │  IndexedDB   │  │  Service     │  │WebSocket  │   │
│  │ (tasks live  │  │  (not used,  │  │  Worker      │  │(mostly    │   │
│  │  here rent-  │  │  but the app │  │  (PWA shell) │  │decorative │   │
│  │  free)       │  │  could)      │  │              │  │)          │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └───────────┘   │
└────────────────────────────┬────────────────────────────────────────────┘
                             │ HTTP / WebSocket
                             │ (if the server is running,
                             │  which it now actually is)
                             ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    FastAPI / Python Backend                             │
│                    (ots-server/main.py)                                │
│                                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  ┌──────────┐ │
│  │   SQLite DB  │  │    OTS API   │  │  EVM / Web3   │  │ /metrics │ │
│  │  (users,     │  │  (real cals  │  │  (Anchor.sol  │  │ /health  │ │
│  │   todos)     │  │   submits)   │  │   on L2)      │  │ /ws echo │ │
│  └──────────────┘  └──────┬───────┘  └───────────────┘  └──────────┘ │
└───────────────────────────┼────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│             External Services (all optional,              │
│             all capable of ruining your day)              │
│                                                           │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │ OpenTimestamps   │  │   OpenAI API     │              │
│  │ Calendar Servers │  │  gpt-5.4-nano    │              │
│  │ (Bitcoin proofs) │  │ ($0.20/M tokens, │              │
│  │                  │  │  worth every     │              │
│  │ a.pool.ots.org   │  │  penny of the    │              │
│  │ b.pool.ots.org   │  │  zero we'll pay) │              │
│  └──────────────────┘  └──────────────────┘              │
│                                                           │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │ ANU Quantum RNG  │  │ EVM Testnet RPC  │              │
│  │ (shuffles tasks  │  │ (anchors hashes  │              │
│  │  using actual    │  │  in the blockchain│             │
│  │  vacuum noise)   │  │  for posterity)  │              │
│  └──────────────────┘  └──────────────────┘              │
└───────────────────────────────────────────────────────────┘
```

---

## Feature Parade

*48 passing tests. Zero tasks ever completed. We consider this a success.*

### Core Nonsense

- **Quantum-powered daily shuffle** — tasks are reordered using genuine quantum
  random numbers sourced from the Australian National University's vacuum
  fluctuation experiment. Falls back to `crypto.getRandomValues()` when ANU is
  having a day, which is often. The shuffle is blamed on the universe either way.

- **AI Priority Scores™** — each task receives a score from 1–99 (never 100,
  because certainty is not a feature we offer) computed from deadline urgency,
  title complexity, and a `sin(created_at / 1_000_003)` quantum noise term.
  The score is displayed as `[42]` next to your task. It means nothing.
  It means everything.

- **Vibe Check™** — click the ✨ Vibe Check™ button and `gpt-5.4-nano`
  (the cheapest OpenAI model that could possibly exist at time of writing)
  roasts your entire task list in a sentence. The model costs $0.20 per million
  tokens. Your task list is worth approximately $0.000003.

- **OpenTimestamps proofs** — expired tasks can be hashed client-side
  (SHA-256, so the server never sees content) and submitted to the Bitcoin
  blockchain via the OpenTimestamps calendar network. Because your grocery list
  deserves cryptographic permanence on the world's most energy-hungry database.

- **EVM anchoring** — for when Bitcoin isn't enough, hashes can also be
  anchored on a bargain-bin L2 chain via a tiny Solidity contract (`Anchor.sol`).
  Two modes: `lite` (emits an event and forgets) and `full` (actually stores it,
  costs marginally more gas, achieves the same existential result).

- **Self-destruct** — a large red button labelled ☢ Self Destruct erases all
  non-expired tasks and celebrates the destruction with red confetti. Expired
  tasks are immune. They have already achieved permanence. They win.

- **Failure statistics** — every deleted-unfinished task adds shame points.
  Every expired task increments your procrastination streak. Titles escalate
  from "Mildly Guilty" through "Perpetual Avoider" to "Overlord of Sloth".
  Export your shame as CSV for spreadsheet-mediated self-reflection.

### Modern Features (That Nobody Asked For)

- **Drag and drop reordering** — built with the HTML5 Drag and Drop API and
  a `useRef` to dodge stale closure bugs that would otherwise silently swap
  the wrong tasks. The ref exists because React state updates are asynchronous
  and drag events are synchronous and the universe is chaotic. The ref is the
  hero this app deserves.

- **Voice input** — click 🎙 Voice and dictate your task. Uses the Web Speech
  API, which is supported in Chrome and politely ignored by everyone else. The
  microphone pulses red while listening, like a very small beating heart.

- **Browser notifications** — opt in to be notified 30 minutes before a task
  expires. The notification arrives whether you want it to or not. Requires
  `Notification.requestPermission()`, which requires a user gesture, which
  requires you to click the 🔕 Notify button, which requires you to remember
  that the button exists.

- **Multi-tab sync** — tasks are synchronised across browser tabs using the
  `BroadcastChannel` API. Open the same app in six tabs simultaneously. Watch
  them all agree. Feel briefly like you have things under control.

- **PWA** — the app ships a `manifest.json` and a service worker so it can be
  "installed" on your home screen like a real app. The service worker uses a
  network-first strategy, because we respect your bandwidth more than your
  offline needs.

- **WebSocket** — the backend serves a WebSocket at `/ws` that echoes messages
  back. The frontend connects to it and displays the connection status in the
  nav bar (`ws: ●` or `ws: ○`). The WebSocket has no purpose beyond proving
  it exists. This is philosophically consistent with the rest of the app.

- **Tag system** — six emoji tags: 🔥 Urgent, 💼 Work, 🏠 Home, 🧠 Think,
  💀 Already late, 🌱 Low stakes. Apply one per task. It helps with
  organisation the same way labelling boxes helps with moving house: you feel
  productive and then never consult the label again.

- **Punishment Mode** — a light theme in Comic Sans with white backgrounds
  and zero visual mercy. Activated by the ☀ Punish button. Serves as a warning
  about the dangers of requesting light mode. The canvas rain disappears. The
  ASCII art stops rotating. Everything is terrible and your eyes deserve it.

- **Confetti** — completing a task triggers green confetti. Self-destructing
  triggers red confetti. Both use `canvas-confetti`, which is the only npm
  package in this repo with an unambiguous purpose.

- **Prometheus metrics** — `GET /metrics` on the backend returns
  Prometheus-format metrics including `qtodo_tasks_total`, `qtodo_uptime_seconds`,
  `qtodo_existential_dread 9.7` (constant), and `qtodo_regret_coefficient 0.94`
  (also constant). These are not scraped by anything. They exist in case you
  want to feel like you have observability.

- **Health endpoint** — `GET /health` returns JSON including `status: "alive"`,
  `uptime_seconds`, and `philosophical_note: "I think, therefore I persist."`.
  Add it to your uptime monitor. Celebrate that the to-do list API is up.

---

## Tech Stack

*Chosen for maximum impressiveness at stand-up, minimum usefulness at runtime.*

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend framework | React 19 | Concurrent mode. We use none of it. |
| Build tool | Vite 7 | Lightning fast. Compiles our monument to slowness. |
| CSS framework | Tailwind CSS v4 | CSS-first config. Deleted three config files. |
| Canvas animation | Custom canvas + `setInterval` | Matrix rain. Required by spec §4.2. |
| 3D CSS animation | `rotateY` + `rotateX` + `text-shadow` | ASCII art that rotates through 6 phases. |
| Confetti | `canvas-confetti` | The one package with a clear purpose. |
| AI model | `gpt-5.4-nano` (OpenAI) | $0.20/M tokens. The task list is worth $0.000003. |
| Backend | FastAPI + Python | Async. We run one synchronous SQLite query anyway. |
| Database | SQLite | Appropriate scale for a todo app. |
| OTS | `opentimestamps-client` | Real Bitcoin proofs via calendar network. |
| Blockchain | web3.py v7 + Solidity | L2 anchoring. Costs less than a coffee. Achieves similar clarity. |
| RNG | ANU Quantum Vacuum API | Shuffles with vacuum noise. Falls back to OS entropy. |
| Tests | Vitest + React Testing Library | 48 tests. All green. Tasks: still undone. |

---

## Setup

*Three services. One task list. Zero regrets.*

### Prerequisites

- Node.js 20+
- Python 3.11+
- An existential tolerance for irony

### Frontend

```bash
cd qtodo-gptchain
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Marvel at the rotating 3D
ASCII art and matrix rain. Then remember you came here to track tasks.

Optional: set a real OpenAI API key so the Vibe Check™ actually works:

```bash
echo "VITE_OPENAI_API_KEY=sk-..." > .env.local
```

Without the key the app displays a message explaining the situation with the
same energy a doctor uses when delivering bad news.

### Backend

```bash
cd ots-server
pip install -r requirements.txt
uvicorn main:app --reload
```

The server starts on port 8000 and prints ASCII art to prove it has feelings.
It creates `todo.db` in the same directory, which is SQLite, which is fine,
which is actually fine, SQLite is fine.

#### EVM anchoring (optional)

To enable blockchain hash anchoring, set these environment variables before
starting the server:

```bash
export EVM_RPC_URL=https://sepolia.base.org
export EVM_PRIVATE_KEY=0x...
export EVM_CONTRACT_ADDRESS=0x...
export EVM_CHAIN=base-sepolia
export EVM_EXPLORER=https://sepolia.basescan.org
export EVM_MODE=lite   # or 'full' if you want permanence
```

The contract source is in `evm/Anchor.sol`. Deploy it once. Never look at it
again. Know that it is there.

### Tests

```bash
cd qtodo-gptchain
npm test
```

Expected output: 48 tests, 4 test files, all green. The matrix rain will not
render in jsdom and you will see canvas errors in stderr. This is fine. The
rain is decorative. The tests do not need decoration.

---

## API Reference

*A microservice that exists to give SHA-256 hashes somewhere to go.*

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/health` | Confirms the server is alive and philosophical |
| `GET` | `/metrics` | Prometheus-format metrics including existential dread |
| `POST` | `/users/register` | Create an account (`username`, `password`) |
| `POST` | `/todos/add` | Add a todo for a `user_id` |
| `GET` | `/todos/{user_id}` | List todos for a user |
| `POST` | `/ots/create` | Submit a hash to OpenTimestamps calendars |
| `POST` | `/ots/upgrade` | Upgrade a pending OTS proof |
| `POST` | `/ots/verify` | Verify a finalised OTS proof |
| `POST` | `/evm/anchor` | Anchor a hash on an EVM chain |
| `POST` | `/evm/verify` | Verify an EVM-anchored hash (full mode) |
| `WS` | `/ws` | Echo socket. Echoes. That is all. |

---

## Philosophical Note

This project is commentary that participates in what it mocks. It doesn't hedge.
Every feature added "for features sake" is genuine craft applied to genuine
absurdity: the confetti fires correctly, the drag-and-drop uses refs to avoid
real stale-closure bugs, the OTS proofs submit to real calendar servers, the
Tailwind migration is properly done.

The joke is not that the features are half-implemented. The joke is that they
are fully implemented and the product is still a to-do list.

Software has a tendency to grow until it collapses under its own weight.
This app grows deliberately, with full awareness of what it's doing, and does it
anyway. That is either hubris or art. Probably both. Section 4.2 is silent on
the matter.

---

## Repository Layout

```
QTodo-GPTChain/
├── README.md               ← you are here
├── qtodo-gptchain/         ← React frontend
│   ├── src/
│   │   ├── App.jsx         ← 750 lines of unhinged features
│   │   ├── App.test.jsx    ← 25 tests pretending to keep it honest
│   │   ├── MatrixRain.jsx  ← canvas rain, obligatory
│   │   ├── Failure.jsx     ← the shame dashboard
│   │   ├── index.css       ← Tailwind v4, 3D keyframes, Comic Sans trap
│   │   ├── priority.test.js ← 15 tests for the fake AI priority scorer
│   │   ├── failure.test.js ← 4 tests for the shame tracker
│   │   ├── ots.test.js     ← 4 tests for the crypto utils
│   │   └── utils/
│   │       ├── priority.js  ← aiPriorityScore, TAGS
│   │       ├── failure.js   ← shame points, procrastination streaks
│   │       └── ots.js       ← SHA-256, task canonicalisation
│   ├── public/
│   │   ├── manifest.json   ← PWA manifest (snarky description)
│   │   └── sw.js           ← service worker (network-first, obviously)
│   └── vite.config.js      ← Tailwind v4 Vite plugin
├── ots-server/
│   ├── main.py             ← FastAPI: OTS, EVM, SQLite, WebSocket, metrics
│   └── requirements.txt    ← fastapi, uvicorn, opentimestamps-client, web3
└── evm/
    └── Anchor.sol          ← Solidity contract (lite + full modes)
```

---

## Easter Eggs

- The `priorityClass` function never returns `priority-certain` because
  certainty is not a feature we offer. This is in the tests.
- The metrics endpoint reports `qtodo_existential_dread 9.7`. This number was
  chosen because `10.0` would imply a maximum, and we are not done yet.
- Punishment Mode disables the matrix rain canvas. The Tailwind class that
  does this is `.punishment-mode canvas { display: none !important; }`.
  The `!important` is load-bearing.
- The quantum RNG fallback logs: *"Quantum RNG unavailable. Degrading
  gracefully to mere thermodynamic randomness."* This is the only log line
  in the app that is both accurate and comforting.
- The WebSocket welcome message is: `"Welcome to QTodo-GPTChain WebSocket.
  This connection serves no purpose. We appreciate your presence."` This is
  also accurate.

---

*If you scrolled this far: the secret passphrase is
`"nothing says productivity like twelve microservices"`.*

<!-- You have unlocked the hidden level. It contains only this comment. -->
