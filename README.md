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

*53 passing tests. Zero tasks ever completed. We consider this a success.*

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

- **BYOK — Bring Your Own Key** — the app has a ⚙ Settings panel where users
  enter their own OpenAI API key and EVM credentials. These live in
  `localStorage`. They never reach our server. We don't have opinions about
  your API key. We barely have a server. The MCP server also accepts per-request
  EVM credentials, so your AI agents can spend your own gas money autonomously.

- **MCP Server** — a Model Context Protocol server exposes QTodo as 11 tools
  and 2 resources that AI agents can call natively. Connect Claude Desktop to
  `mcp-server/server.py` (stdio) or `http://localhost:8001/sse` (SSE/Docker)
  and your AI can add tasks, complete them, and anchor them on the blockchain
  without you doing any of the above. The AI will complete the tasks. You will
  claim credit. This is the productivity future.

- **MetaMask Contract Deployment** — users can deploy `Anchor.sol` to any EVM
  network directly from the ⚙ Settings panel via MetaMask. The ABI and bytecode
  are pre-compiled and bundled. No terminal. No `solc`. One button. The contract
  is now on the blockchain. It will outlive us all.

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
| MCP server | FastMCP (Python) | 11 tools, 2 resources, 0 tasks that complete themselves. |
| Containers | Docker + Compose | Three services. One volume. All the irony. |
| Cloud | Terraform + AWS ECS Fargate | Because S3 for a SQLite file felt too simple. |
| Tests | Vitest + React Testing Library | 53 tests. All green. Tasks: still undone. |

---

## Setup

*Three services. One task list. Zero regrets.*

### Option A: Docker (Recommended — Gets Everything Running in One Command)

```bash
docker compose up
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- MCP server: `http://localhost:8001/sse`

Everything is configured. Nothing requires environment setup. Tasks persist
in a named Docker volume. This is the correct way to run the app. All other
options exist for people who enjoy prerequisites.

For blockchain features, add your EVM credentials to `docker-compose.yml`
or pass them per-request via ⚙ Settings. The server's defaults can be empty.
Users can bring their own.

### Option B: Manual (If You Enjoy Terminals)

**Prerequisites:**
- Node.js 20+
- Python 3.11+
- An existential tolerance for configuration

**Frontend:**

```bash
cd qtodo-gptchain
npm install
npm run dev
```

Open `http://localhost:5173`. The matrix rain starts immediately.
The ASCII art begins rotating. You will watch it for a moment before
remembering why you opened the terminal.

**API keys:** enter your OpenAI key in ⚙ Settings (stored in `localStorage`;
the app never sends it to our server). No `.env.local` required.

**Backend:**

```bash
cd ots-server
pip install -r requirements.txt
uvicorn main:app --reload
```

Port 8000. Creates `todo.db`. SQLite. Fine. Actually fine. SQLite has been
fine since 2000. We've surrounded it with FastAPI, asyncio, web3.py, and
OpenTimestamps but the core is SQLite and the core is fine.

**EVM anchoring** — optional; users can set credentials per-request in ⚙ Settings,
or set server-wide defaults:

```bash
export EVM_RPC_URL=https://sepolia.base.org
export EVM_PRIVATE_KEY=0x...
export EVM_CONTRACT_ADDRESS=0x...
export EVM_CHAIN=base-sepolia
export EVM_EXPLORER=https://sepolia.basescan.org
export EVM_MODE=lite   # or 'full' if you want on-chain storage
```

**MCP server** (for AI agents):

```bash
cd mcp-server
pip install -r requirements.txt
python server.py                     # stdio mode, for Claude Desktop
python server.py --transport sse     # HTTP/SSE mode, for remote agents
```

See `mcp-server/README.md` for Claude Desktop config.

### Option C: AWS (For the Shady DevOps Friend)

```bash
cd terraform
terraform init
terraform apply \
  -var="backend_image=your-ecr-uri/qtodo-backend:latest" \
  -var="frontend_image=your-ecr-uri/qtodo-frontend:latest" \
  -var="mcp_server_image=your-ecr-uri/qtodo-mcp:latest"
```

Infrastructure created: VPC, ECS Fargate cluster (FARGATE_SPOT to save money),
ALB with path routing, EFS for SQLite persistence, Secrets Manager for the EVM
private key, CloudWatch log groups, IAM roles, NAT gateway. The todo list will
be on AWS. It will cost approximately $30/month. It stores tasks. The tasks
will not be done. But they will be highly available.

Output: `mcp_server_url` for Claude Desktop. Point it there. Let your agents in.

### Tests

```bash
cd qtodo-gptchain
npm test
```

Expected output: **53 tests, 4 test files, all green.** Canvas errors in stderr
are expected — the matrix rain doesn't render in jsdom and doesn't need to.
The rain is not under test. The rain answers to no one.

---

## API Reference

*A microservice that exists to give SHA-256 hashes somewhere to go.*

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/health` | Confirms the server is alive and philosophical |
| `GET` | `/metrics` | Prometheus-format metrics including existential dread |
| `POST` | `/users/register` | Create an account (`username`, `password`) |
| `POST` | `/users/login` | Authenticate; returns `user_id` or 401 |
| `POST` | `/todos/add` | Add a todo for a `user_id` |
| `GET` | `/todos/{user_id}` | List todos for a user |
| `PUT` | `/todos/{task_id}/done` | Mark a task complete |
| `DELETE` | `/todos/{task_id}` | Delete a task |
| `POST` | `/ots/create` | Submit a hash to OpenTimestamps calendars |
| `POST` | `/ots/upgrade` | Upgrade a pending OTS proof |
| `POST` | `/ots/verify` | Verify a finalised OTS proof |
| `POST` | `/evm/anchor` | Anchor a hash on an EVM chain (accepts per-request credentials) |
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
├── README.md                    ← you are here; this document
├── docker-compose.yml           ← three services, one command, zero config
├── qtodo-gptchain/              ← React frontend
│   ├── src/
│   │   ├── App.jsx              ← ~900 lines of unhinged features
│   │   ├── App.test.jsx         ← 30 integration tests (the honest ones)
│   │   ├── MatrixRain.jsx       ← canvas rain; obligatory; non-negotiable
│   │   ├── Failure.jsx          ← shame dashboard; CSV export; rank titles
│   │   ├── index.css            ← Tailwind v4; 3D keyframes; Comic Sans trap
│   │   ├── priority.test.js     ← 15 tests for the fake AI priority scorer
│   │   ├── failure.test.js      ← 4 tests for the shame tracker
│   │   ├── ots.test.js          ← 4 tests for the crypto utils
│   │   ├── components/
│   │   │   └── SettingsModal.jsx ← BYOK: OpenAI key, EVM creds, MetaMask deploy
│   │   └── utils/
│   │       ├── priority.js      ← aiPriorityScore(); TAGS; bracket labels
│   │       ├── failure.js       ← shame points; procrastination streaks
│   │       └── ots.js           ← SHA-256; task canonicalisation
│   ├── public/
│   │   ├── manifest.json        ← PWA manifest (snarky description)
│   │   ├── sw.js                ← service worker (network-first, obviously)
│   │   └── Anchor.json          ← compiled Anchor.sol for MetaMask deployment
│   ├── Dockerfile               ← node:22-alpine → nginx:alpine; two stages
│   ├── nginx.conf               ← SPA routing; /api/ proxy; /ws WebSocket
│   └── vite.config.js           ← @tailwindcss/vite; no other drama
├── ots-server/
│   ├── main.py                  ← FastAPI: users, todos, OTS, EVM, metrics, ws
│   ├── requirements.txt         ← fastapi, uvicorn, opentimestamps, web3, etc.
│   └── Dockerfile               ← python:3.12-slim; /data for SQLite
├── mcp-server/
│   ├── server.py                ← FastMCP: 11 tools, 2 resources, 0 opinions
│   ├── requirements.txt         ← mcp[cli], httpx
│   ├── Dockerfile               ← python:3.12-slim; SSE transport default
│   └── README.md                ← setup for Claude Desktop, Docker, AWS
├── evm/
│   ├── Anchor.sol               ← Solidity contract (lite + full modes)
│   ├── Anchor.json              ← compiled ABI + bytecode (solc 0.8.20)
│   └── README.md                ← documentation; sarcasm; gas cost estimates
└── terraform/
    ├── main.tf                  ← VPC, ECS, ALB, EFS, Secrets Manager, IAM
    ├── variables.tf             ← all variables with snarky descriptions
    └── outputs.tf               ← URLs, ARNs, and post-deploy instructions
```

---

## Easter Eggs

- The `priorityClass` function never returns `priority-certain` because
  certainty is not a feature we offer. This is in the tests. The tests pass.
  The certainty is still not offered.

- The metrics endpoint reports `qtodo_existential_dread 9.7`. This number was
  chosen because `10.0` would imply a maximum, and we are not done yet.
  `qtodo_regret_coefficient 0.94` was calculated empirically.

- Punishment Mode disables the matrix rain canvas. The Tailwind class that
  does this is `.punishment-mode canvas { display: none !important; }`.
  The `!important` is not stylistic. It is load-bearing.

- The quantum RNG fallback logs: *"Quantum RNG unavailable. Degrading
  gracefully to mere thermodynamic randomness."* This is the most accurate
  log message in the codebase.

- The WebSocket welcome message is: `"Welcome to QTodo-GPTChain WebSocket.
  This connection serves no purpose. We appreciate your presence."` The
  frontend connects, receives this message, and displays a green dot. The
  green dot is the entire value proposition of the WebSocket.

- The MCP server's `anchor_hash_on_chain` tool can be called with an AI's
  own credentials to anchor hashes on behalf of users. An AI agent can now
  pay gas fees on your todo list. This sentence is true in 2026.

- The health endpoint returns `"philosophical_note": "I think, therefore I persist."`.
  The MCP resource `qtodo://health` includes this in the agent's context.
  An agent will read this philosophical note and continue anchoring tasks
  on the blockchain without comment. The agent has tasks to do.

- `Anchor.json` is compiled Solidity bytecode bundled into the React app
  and served as a static file so the browser can deploy smart contracts.
  The first person who reads that sentence without blinking has found their
  people. You are in the right repo.

---

## Deployment Checklist

```
[x] React 19 frontend with matrix rain
[x] FastAPI backend with SQLite
[x] OpenTimestamps for Bitcoin proofs
[x] EVM anchoring with Solidity contract
[x] Quantum RNG from ANU
[x] AI priority scores (never 100)
[x] Vibe Check™ (gpt-5.4-nano)
[x] Voice input
[x] Drag and drop reordering
[x] Multi-tab sync via BroadcastChannel
[x] PWA manifest + service worker
[x] WebSocket that echoes
[x] Punishment Mode (Comic Sans)
[x] 3D animated ASCII art
[x] Matrix rain (canvas)
[x] Confetti (green + red)
[x] Shame statistics + CSV export
[x] Self-destruct button
[x] Browser notifications
[x] BYOK — Bring Your Own OpenAI Key
[x] BYOK — Bring Your Own EVM credentials
[x] MetaMask contract deployment from GUI
[x] MCP server (11 tools, 2 resources)
[x] Docker Compose (3 services)
[x] Terraform (AWS ECS Fargate + full infra)
[x] Prometheus metrics + health endpoint
[x] 53 passing tests
[ ] Tasks completed by user
```

---

*If you scrolled this far: the secret passphrase is
`"nothing says productivity like seventeen microservices and an AI agent to manage them"`.*

<!-- You have unlocked the hidden level. It is this comment. There is nothing else. The tasks remain undone. -->
