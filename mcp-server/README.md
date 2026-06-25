# QTodo MCP Server

Exposes QTodo-GPTChain as MCP (Model Context Protocol) tools so AI agents
can manage your todo list without you lifting a finger. This is either the
most efficient productivity system ever devised or the final proof that
engineers will automate anything rather than just doing the thing.

## Tools available

| Tool | Description |
|------|-------------|
| `register_user` | Create a user account |
| `login_user` | Authenticate and get a user_id |
| `list_tasks` | Get all tasks for a user |
| `add_task` | Add a new task |
| `complete_task` | Mark a task done (no confetti in MCP mode, sorry) |
| `delete_task` | Delete a task (no shame points recorded) |
| `create_timestamp_proof` | Submit hash to OpenTimestamps calendars |
| `upgrade_timestamp_proof` | Ask if Bitcoin has confirmed yet |
| `verify_timestamp_proof` | Verify a finalised proof |
| `anchor_hash_on_chain` | Anchor hash on EVM chain (BYOK supported) |
| `get_server_health` | Check if the backend is alive |
| `get_metrics` | Get Prometheus metrics |

## Resources

- `qtodo://tasks/{user_id}` — plain-text task list for a user
- `qtodo://health` — backend health summary

## Setup

### Option A: Local stdio (Claude Desktop)

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

The backend must be running (`cd ots-server && uvicorn main:app --reload`).

### Option B: Docker (SSE transport)

```bash
docker compose up
# MCP server is now on http://localhost:8001
```

Configure in Claude Desktop:
```json
{
  "mcpServers": {
    "qtodo": {
      "url": "http://localhost:8001/sse"
    }
  }
}
```

### Option C: AWS (via terraform/)

After `terraform apply`, the output `mcp_server_url` gives you the SSE endpoint.
Configure Claude Desktop with that URL.

## Dependencies

```bash
pip install -r requirements.txt
```

Requires Python 3.11+ and a running QTodo backend.
