# QTodo Backend

*A FastAPI application that does the work of a text file but requires Python,
SQLite, OpenTimestamps, web3.py, and approximately 14 imported dependencies to do it.*

```
┌─────────────────────────────────────────────────────────────────────┐
│                     STARTUP SEQUENCE                                 │
│                                                                      │
│  1. Print ASCII banner to prove we have personality                  │
│  2. Create todo.db if it doesn't exist (it won't)                   │
│  3. Start WebSocket endpoint (echoes messages; has no other purpose) │
│  4. Begin serving endpoints to a frontend that stores data locally   │
│     in localStorage and only calls us for blockchain reasons         │
│  5. Log "beep boop" in approximately never circumstances             │
│  6. Exist                                                            │
└─────────────────────────────────────────────────────────────────────┘
```

## Quickstart

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

The server starts on port 8000 and announces itself with a large ASCII banner
that looks aggressive in a narrow terminal. This is intentional. The banner
is the only user experience decision in this codebase made with absolute
confidence.

On first run it creates `todo.db` in the current directory. This is SQLite.
SQLite is fine. SQLite has been fine since 2000. We have surrounded it with
FastAPI, asyncio, and OpenTimestamps just to make it less comfortable.

## Environment Variables

```bash
# EVM blockchain anchoring (all optional; users can override per-request anyway)
EVM_RPC_URL=https://sepolia.base.org
EVM_PRIVATE_KEY=0x...
EVM_CONTRACT_ADDRESS=0x...
EVM_CHAIN=base-sepolia
EVM_EXPLORER=https://sepolia.basescan.org
EVM_MODE=lite   # 'lite' (event) or 'full' (storage; costs more gas; achieves same regret)
```

None of these are required. Without them, blockchain-related endpoints return
graceful errors. The server will not sulk. It has seen worse.

## Endpoints

### Core Admin

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Returns `{"status": "alive"}` plus uptime and a philosophical note. Add to your uptime monitor. Celebrate that your todo API is responding. This is what you've built. |
| `GET` | `/metrics` | Prometheus-format metrics. `qtodo_existential_dread 9.7` is constant. It is not scraped by anything. It is there for *you*. |
| `WS` | `/ws` | WebSocket echo. Send it a message; it sends it back. The frontend connects here and displays a coloured dot. The dot means the server is running. The dot was worth it. |

### User Management

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/users/register` | Create an account. Takes `username` and `password`. Password is SHA-256 hashed before storage. SHA-256 is not a great password hash (bcrypt exists), but it is better than plaintext and this is a todo app, not a bank. |
| `POST` | `/users/login` | Returns `user_id` if credentials match. Returns 401 if they don't. Timing attacks are theoretically possible. So is a lot of things. |

### Task Management

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/todos/add` | Add a task. Takes `title`, `user_id`, `expired_at` (Unix ms), optionally `tag` and `note`. |
| `GET` | `/todos/{user_id}` | List all tasks for a user. Returns the full object including OTS metadata. |
| `PUT` | `/todos/{task_id}/done` | Mark a task complete. The server is not involved in the confetti. That happens client-side. |
| `DELETE` | `/todos/{task_id}` | Delete a task. The server doesn't record shame points — that's a frontend concern. The server has no feelings about your abandoned tasks. |

### OpenTimestamps

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/ots/create` | Submit a hex SHA-256 hash to the OpenTimestamps calendar network. Returns a base64-encoded `.ots` proof blob. The hash goes to `a.pool.opentimestamps.org` and `b.pool.opentimestamps.org`. These are real servers run by real people who have committed to operating an open timestamp calendar. We thank them. They don't know we exist. |
| `POST` | `/ots/upgrade` | Ask the calendars if Bitcoin has confirmed the timestamp yet. Takes the hash and the existing proof blob. Returns an upgraded blob if Bitcoin has caught up. Bitcoin sets its own schedule. |
| `POST` | `/ots/verify` | Verify a finalised proof. Returns `{"verified": true}` and the Bitcoin block timestamp if valid. This is a real cryptographic verification. The task it proves was probably "reply to Jennifer". |

### EVM Blockchain

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/evm/anchor` | Anchor a hash on an EVM chain. Accepts optional per-request credentials (`rpc_url`, `private_key`, `contract_address`, `chain`, `explorer`, `mode`) that override server env vars. This enables multi-tenant operation: different users can anchor to different chains with different wallets. This is either a sophisticated multi-tenancy design or an elaborate way to let people use their own gas money. |
| `POST` | `/evm/verify` | Verify that a hash was stored on-chain (full mode only). Queries `Anchor.sol`'s `getTask` method. Returns the anchorer address and timestamp. |

## Per-Request EVM Credentials

The `/evm/anchor` endpoint accepts per-request credential overrides. This means:

```bash
curl -X POST http://localhost:8000/evm/anchor \
  -H "Content-Type: application/json" \
  -d '{
    "hash": "0xdeadbeef...",
    "ref": "buy milk",
    "rpc_url": "https://my-rpc.example.com",
    "private_key": "0xmy-personal-key",
    "contract_address": "0xmy-contract",
    "chain": "my-chain",
    "mode": "lite"
  }'
```

The server builds a one-off web3 connection per request using the supplied
credentials, uses it once, and discards it. This is stateless in the purest
sense: the server has no idea who you are, what you anchored, or why.
It just signed a transaction with the key you gave it and moved on.

The philosophical implication — that you are sending your private key to a server
endpoint — is left as an exercise for your threat model.

## Docker

```bash
# From repo root
docker compose up backend
```

The backend Dockerfile is a two-liner: `python:3.12-slim`, install requirements,
run uvicorn. The SQLite database lives on an EFS volume in production (Terraform
handles this) or a named Docker volume locally. Your data persists across
container restarts. Your tasks do not get done across container restarts.
These are separate concerns.

## Architecture Decision Log

| Decision | Rationale |
|----------|-----------|
| FastAPI over Flask | Async. Type hints. OpenAPI docs auto-generated. We use maybe 10% of these features. |
| SQLite over PostgreSQL | This is a todo list. SQLite handles 50k writes/second. Our load is closer to 3/day. |
| SHA-256 passwords | Better than plaintext. Worse than bcrypt. Appropriate for this threat model. |
| CORSMiddleware `allow_origins=["*"]` | YOLO. The data is your grocery list. Secure accordingly. |
| asyncio + `run_in_executor` for OTS | OTS calls are synchronous. We didn't want to block the event loop. We are not savages. |
| WebSocket echo at `/ws` | The frontend has a connection status indicator. The indicator needed something to indicate. |
| `qtodo_existential_dread 9.7` | `10.0` would imply a ceiling. We are not there yet. |

## Tests

The backend does not have its own test suite. This is not an oversight; it is
a prioritisation. The frontend has 53 tests. The frontend tests mock the backend.
The backend has uptime. Between the two, we have coverage.

If you would like to test the backend, `uvicorn main:app --reload` and then use
the Swagger UI at `http://localhost:8000/docs`. This is testing in the most
artisanal sense: by hand, in real time, with consequences.

## Easter Eggs

- The health endpoint returns `"philosophical_note": "I think, therefore I persist."`.
  This is accurate. The server persists. That is its primary achievement.
- Startup logs include `"beep boop"` in debug mode. There is no debug mode.
  This comment has been in the codebase since the beginning. It has never been
  true. It will remain.
- `qtodo_regret_coefficient 0.94` in `/metrics` was calculated by dividing
  "tasks I meant to do" by "tasks I actually did" and rounding. This number
  may vary by individual.

<!-- The cake is a lie. The timestamps are real. The SQLite file is the only thing keeping your data. Back it up or don't. We made our choices. -->
