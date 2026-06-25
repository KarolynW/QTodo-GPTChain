# QTodo MCP Server

*Exposes your todo list to AI agents so they can manage your procrastination
more efficiently than you ever could. This is either the future of productivity
or the definitive proof that engineers will automate anything rather than
simply doing the thing.*

The MCP (Model Context Protocol) server wraps the QTodo backend as a set of
tools and resources that AI agents can call natively. Connect it to Claude
Desktop, an agent SDK, or any MCP-compatible host and your AI can add tasks,
mark them complete, anchor them on the blockchain, and check if the backend
is philosophically at peace — all without you lifting a finger.

Your tasks will be managed. They will still not be done.

---

## What An Agent Can Do

*Eleven tools. Two resources. Zero tasks that will complete themselves.*

### Tools

| Tool | What it does | What it actually means |
|------|-------------|----------------------|
| `register_user` | Create a user account | The agent needs an identity before it can avoid your chores |
| `login_user` | Authenticate, receive `user_id` | Returns a number. The number is you. Or the agent. It's blurring. |
| `list_tasks` | Get all tasks for a user | The agent can now see everything you haven't done |
| `add_task` | Add a new task | The agent can create more things for you to not do |
| `complete_task` | Mark a task done | The one tool an agent would use that a human won't |
| `delete_task` | Delete a task | No shame points recorded in MCP mode, sadly |
| `create_timestamp_proof` | Submit hash to OTS calendars | Blockchain permanence for agent-managed tasks |
| `upgrade_timestamp_proof` | Check if Bitcoin has confirmed yet | Bitcoin still sets its own schedule |
| `verify_timestamp_proof` | Verify a finalised proof | It was timestamped. It is true. |
| `anchor_hash_on_chain` | Anchor hash on EVM chain | Your agent can anchor hashes to blockchains. Think about that. |
| `get_server_health` | Check if the backend is alive | Returns the philosophical note. The agent will not understand it. |
| `get_metrics` | Get Prometheus metrics | `qtodo_existential_dread 9.7` — the agent will report this without context |

### Resources

| URI | What it contains |
|-----|-----------------|
| `qtodo://tasks/{user_id}` | Plain-text task list for a user — formatted for agent consumption |
| `qtodo://health` | Backend health summary — for agents who check in |

---

## Setup

*Three paths. All of them lead to an AI managing your grocery list.*

### Option A: Local stdio — Claude Desktop

The agent and the MCP server communicate via stdin/stdout. No ports. No HTTP.
Just pipes, like it's 1979, except the pipe carries JSON-RPC and the other end
is a language model.

Add to `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "qtodo": {
      "command": "python",
      "args": ["/path/to/QTodo-GPTChain/mcp-server/server.py"],
      "env": {
        "QTODO_BACKEND_URL": "http://localhost:8000"
      }
    }
  }
}
```

The backend must be running separately:

```bash
cd ots-server
pip install -r requirements.txt
uvicorn main:app --reload
```

Claude Desktop will start the MCP server as a subprocess. The MCP server will
talk to the backend over HTTP. The backend will talk to SQLite. SQLite will
talk to a file. The file will contain your tasks. The chain is complete.

### Option B: Docker (SSE transport)

For when you want everything containerised and the agent connects over HTTP
instead of talking to a subprocess. This is the modern way.

```bash
# From the repo root
docker compose up
```

The MCP server runs on `http://localhost:8001`. Configure Claude Desktop:

```json
{
  "mcpServers": {
    "qtodo": {
      "url": "http://localhost:8001/sse"
    }
  }
}
```

The Docker setup runs three services: backend (8000), frontend (3000), and
MCP server (8001). They share a named volume for SQLite. You add a task on
the frontend. Your AI sees it immediately via the MCP resource. Your AI
marks it complete. You experience the first completed task in recorded QTodo
history. Red confetti does not fire because confetti is a frontend feature
and the AI has no browser.

### Option C: AWS (via Terraform)

For production deployments, because yes, this is production-grade infrastructure
for a todo list that an AI manages on your behalf.

After `cd terraform && terraform apply`:

```
mcp_server_url = "http://<your-alb>.amazonaws.com/mcp/sse"
```

Configure Claude Desktop with that URL. Your AI will now be making network
requests to AWS to manage your tasks. Each network call costs fractions of
cents. Your tasks will still not be done.

See `../terraform/` for the full infrastructure definition: ECS Fargate,
ALB with path routing, EFS for SQLite persistence, Secrets Manager for the
EVM private key. It's all there. We are sorry and proud simultaneously.

---

## Dependencies

```bash
pip install -r requirements.txt
```

```
mcp[cli]>=1.0.0    # FastMCP; the actual MCP framework
httpx>=0.27.0      # async HTTP to the backend; because requests is blocking
```

Python 3.11+ required. Async throughout. The backend must be reachable at
`QTODO_BACKEND_URL` (default: `http://localhost:8000`).

---

## How It Works

The MCP server is a thin translation layer. Every tool is approximately:

```python
@mcp.tool()
async def list_tasks(user_id: int) -> str:
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{BACKEND_URL}/todos/{user_id}")
        return json.dumps(r.json())
```

There is no business logic here. No caching. No state. The MCP server is
a stateless HTTP-to-MCP bridge and it is comfortable with that description.

The resources use the same pattern: fetch from the backend, format for agents.
`qtodo://tasks/{user_id}` returns a human-readable plain-text list. Agents
find plain text easier to reason about than raw JSON. This is true. We accommodate it.

---

## EVM Credentials in MCP Mode

The `anchor_hash_on_chain` tool accepts optional per-request EVM credentials:

```python
anchor_hash_on_chain(
    hash="0xdeadbeef...",
    ref="task:42",
    rpc_url="https://sepolia.base.org",    # optional; overrides server default
    private_key="0x...",                   # optional; overrides server default
    contract_address="0x...",             # optional; overrides server default
    mode="lite"                            # optional; 'lite' or 'full'
)
```

This means an agent can anchor hashes using the user's own credentials,
or let the server's defaults apply. The server's defaults are whatever the
ops team set in the environment variables, which in practice means "the key
that gets used when no one specified anything else."

In a multi-user deployment, each user's agent should pass their own credentials.
This is a BYOK pattern implemented at the agent-tool level. We have made it
very easy for AI to spend your gas money.

---

## Running the MCP Server Manually

```bash
# stdio mode (for Claude Desktop / agent SDK)
python server.py

# SSE mode (for HTTP connections)
python server.py --transport sse
# Listens on port 8001 by default
```

Environment variables:
```bash
QTODO_BACKEND_URL=http://localhost:8000   # where the FastAPI backend lives
```

---

## A Note on Agent Autonomy

The `complete_task` tool is the most powerful tool in this server. A human
user with a todo app marks tasks done manually, one at a time, with the
friction of having to actually do the thing before clicking the button
(ostensibly). An agent using `complete_task` has no such friction. An agent
can complete all tasks in a single loop. An agent has no feelings about
your shame points. An agent will never know that the confetti didn't fire.

We have thought about this. We ship the tool anyway. These are your tasks
and your agents and your choices. We're just the MCP server.

---

<!-- the agent can see everything. the agent will complete nothing on your behalf unless you ask it to. the agent asks nothing in return. this is better than most productivity systems. -->
