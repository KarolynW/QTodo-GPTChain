"""
QTodo-GPTChain MCP Server

An MCP (Model Context Protocol) server that exposes QTodo-GPTChain's
todo-management, OpenTimestamps, and blockchain capabilities as agent tools.

Because the obvious thing to do with an over-engineered todo list is to
give AI agents direct access to it so they can also not complete tasks.

Usage:
  python server.py                          # stdio transport (Claude Desktop)
  python server.py --transport sse          # SSE transport (HTTP clients)

Configure with env vars:
  QTODO_BACKEND_URL   URL of the FastAPI backend (default: http://localhost:8000)
"""

import os
import asyncio
from typing import Optional
from mcp.server.fastmcp import FastMCP
import httpx

BACKEND_URL = os.getenv("QTODO_BACKEND_URL", "http://localhost:8000")

mcp = FastMCP(
    "qtodo-gptchain",
    description=(
        "Tools for managing an absurdly over-engineered todo list. "
        "Includes task management, AI vibe assessment, Bitcoin timestamping, "
        "and optional blockchain anchoring. Because your tasks deserve "
        "a distributed consensus mechanism."
    ),
)


def _backend(path: str) -> str:
    return f"{BACKEND_URL}{path}"


# ── User management ───────────────────────────────────────────────────────────

@mcp.tool()
async def register_user(username: str, password: str) -> dict:
    """
    Register a new user account on the QTodo backend.

    Passwords are hashed with SHA-256 — which we acknowledge is not great
    but is significantly better than the plaintext approach we briefly considered.

    Returns: {"id": <user_id>} on success.
    """
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            _backend("/users/register"),
            json={"username": username, "password": password},
            timeout=10,
        )
    if resp.status_code == 400:
        return {"error": "username already taken — creativity is required"}
    resp.raise_for_status()
    return resp.json()


@mcp.tool()
async def login_user(username: str, password: str) -> dict:
    """
    Log in to an existing user account.

    Returns {"user_id": <id>, "username": <str>} on success,
    or {"error": <message>} if credentials are wrong.
    The backend stores no session — pass user_id to subsequent calls.
    """
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            _backend("/users/login"),
            json={"username": username, "password": password},
            timeout=10,
        )
    if resp.status_code == 401:
        return {"error": "wrong credentials — the machine rejects you"}
    resp.raise_for_status()
    return resp.json()


# ── Task management ───────────────────────────────────────────────────────────

@mcp.tool()
async def list_tasks(user_id: int) -> dict:
    """
    List all tasks for a user from the server-side SQLite database.

    Note: the frontend also maintains a localStorage task list that is
    independent of this. You are reading the server's copy.
    The two may diverge. This is fine. This is called "eventual consistency."
    We tell ourselves this.

    Returns: {"todos": [{"id", "text", "done", "created"}, ...]}
    """
    async with httpx.AsyncClient() as client:
        resp = await client.get(_backend(f"/todos/{user_id}"), timeout=10)
    resp.raise_for_status()
    return resp.json()


@mcp.tool()
async def add_task(user_id: int, text: str) -> dict:
    """
    Add a new task for a user on the server-side database.

    This does NOT trigger haiku generation or quantum priority scoring.
    The frontend handles those. This is the bare-metal endpoint.
    The task arrives as text. It stays as text. There is no poetry here.

    Returns: {"id": <task_id>}
    """
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            _backend("/todos/add"),
            json={"user_id": user_id, "text": text},
            timeout=10,
        )
    resp.raise_for_status()
    return resp.json()


@mcp.tool()
async def complete_task(task_id: int) -> dict:
    """
    Mark a server-side task as completed.

    Unlike the frontend, this does not trigger confetti. The backend has
    decided that dopamine delivery is outside its remit.

    Returns: {"ok": true, "task_id": <id>}
    """
    async with httpx.AsyncClient() as client:
        resp = await client.put(_backend(f"/todos/{task_id}/done"), timeout=10)
    resp.raise_for_status()
    return resp.json()


@mcp.tool()
async def delete_task(task_id: int) -> dict:
    """
    Delete a task by ID. No shame points are recorded server-side.
    Shame is a frontend concept. The database does not judge.

    Returns: {"ok": true, "task_id": <id>}
    """
    async with httpx.AsyncClient() as client:
        resp = await client.delete(_backend(f"/todos/{task_id}"), timeout=10)
    resp.raise_for_status()
    return resp.json()


# ── OpenTimestamps ────────────────────────────────────────────────────────────

@mcp.tool()
async def create_timestamp_proof(hash_hex: str) -> dict:
    """
    Submit a SHA-256 hash to the OpenTimestamps calendar network for
    Bitcoin timestamping.

    The hash is submitted to multiple calendar servers, each of which
    aggregates it into a Merkle tree and will eventually include a root
    in a Bitcoin transaction. This takes ~hours for a pending proof to
    upgrade to a Bitcoin-confirmed proof.

    Returns: {"proof": "<base64-encoded OTS proof>"}
    The proof should be stored and later passed to upgrade_timestamp_proof
    to check if Bitcoin has confirmed it.
    """
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            _backend("/ots/create"),
            json={"hash": hash_hex},
            timeout=30,
        )
    resp.raise_for_status()
    return resp.json()


@mcp.tool()
async def upgrade_timestamp_proof(proof_b64: str) -> dict:
    """
    Attempt to upgrade a pending OTS proof by contacting the calendar servers.

    If Bitcoin has confirmed the timestamp, the proof will be upgraded to
    include a BitcoinBlockHeaderAttestation. This makes the timestamp
    independently verifiable against the Bitcoin blockchain.

    Returns: {"proof": "<updated base64-encoded OTS proof>"}
    The updated proof may or may not be confirmed; use verify_timestamp_proof
    to check.
    """
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            _backend("/ots/upgrade"),
            json={"proof": proof_b64},
            timeout=30,
        )
    resp.raise_for_status()
    return resp.json()


@mcp.tool()
async def verify_timestamp_proof(hash_hex: str, proof_b64: str) -> dict:
    """
    Verify whether a timestamp proof has been confirmed by Bitcoin.

    Returns: {"verified": true/false}
    True means a Bitcoin miner has unknowingly immortalised a hash that
    probably represents someone's grocery list.
    """
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            _backend("/ots/verify"),
            json={"hash": hash_hex, "proof": proof_b64},
            timeout=30,
        )
    resp.raise_for_status()
    return resp.json()


# ── EVM / Blockchain ──────────────────────────────────────────────────────────

@mcp.tool()
async def anchor_hash_on_chain(
    hash_hex: str,
    ref: str,
    rpc_url: Optional[str] = None,
    private_key: Optional[str] = None,
    contract_address: Optional[str] = None,
    chain: Optional[str] = None,
    explorer: Optional[str] = None,
    mode: Optional[str] = None,
) -> dict:
    """
    Anchor a SHA-256 hash on an EVM-compatible blockchain.

    The hash is written to (or emitted by) the Anchor.sol smart contract.
    Two modes:
    - 'lite' (default): emits a Recorded event and forgets. Cheap.
    - 'full': stores hash + ref + address on-chain permanently. Less cheap.

    You can either rely on server-configured EVM credentials (env vars)
    or provide your own credentials per-call (useful for multi-tenant setups
    where each user has their own wallet).

    rpc_url: RPC endpoint for the target chain (e.g. https://sepolia.base.org)
    private_key: 0x-prefixed private key of the signing wallet
    contract_address: deployed Anchor.sol contract address
    chain: human-readable chain name for logging
    explorer: block explorer URL prefix for generating tx links
    mode: 'lite' or 'full'

    Returns: {"tx": "<tx_hash>", "contract": "<addr>", "chain": "<chain>", "explorer": "<url>"}
    """
    payload = {"hash": hash_hex, "ref": ref}
    if rpc_url:
        payload["rpc_url"] = rpc_url
    if private_key:
        payload["private_key"] = private_key
    if contract_address:
        payload["contract_address"] = contract_address
    if chain:
        payload["chain"] = chain
    if explorer:
        payload["explorer"] = explorer
    if mode:
        payload["mode"] = mode

    async with httpx.AsyncClient() as client:
        resp = await client.post(_backend("/evm/anchor"), json=payload, timeout=60)
    if resp.status_code == 500:
        return {"error": resp.json().get("detail", "EVM anchor failed")}
    resp.raise_for_status()
    return resp.json()


# ── Server status ─────────────────────────────────────────────────────────────

@mcp.tool()
async def get_server_health() -> dict:
    """
    Check the health of the QTodo backend server.

    Returns a JSON object including uptime, database status, blockchain
    configuration, and a philosophical note. The philosophical note is
    not optional; it is load-bearing.
    """
    async with httpx.AsyncClient() as client:
        resp = await client.get(_backend("/health"), timeout=10)
    resp.raise_for_status()
    return resp.json()


@mcp.tool()
async def get_metrics() -> str:
    """
    Fetch Prometheus-format metrics from the QTodo backend.

    Includes task counts, uptime, existential_dread (always 9.7),
    and regret_coefficient (constant at 0.94). These metrics are not
    scraped by anything. They exist because we have nothing to hide
    and everything to quantify.

    Returns raw Prometheus text format.
    """
    async with httpx.AsyncClient() as client:
        resp = await client.get(_backend("/metrics"), timeout=10)
    resp.raise_for_status()
    return resp.text


# ── Resources ─────────────────────────────────────────────────────────────────

@mcp.resource("qtodo://tasks/{user_id}")
async def tasks_resource(user_id: str) -> str:
    """
    Expose a user's task list as an MCP resource.

    Agents can read this resource to get a plain-text summary of tasks
    without invoking the list_tasks tool. Useful for context injection
    in prompts that need task awareness without a tool round-trip.
    """
    async with httpx.AsyncClient() as client:
        resp = await client.get(_backend(f"/todos/{user_id}"), timeout=10)
    if not resp.is_success:
        return f"Could not fetch tasks for user {user_id}: {resp.status_code}"
    todos = resp.json().get("todos", [])
    if not todos:
        return f"User {user_id} has no tasks. Either done or in denial."
    lines = [f"Tasks for user {user_id}:"]
    for t in todos:
        status = "✓" if t["done"] else "○"
        lines.append(f"  [{status}] #{t['id']}: {t['text']}  (created {t['created']})")
    return "\n".join(lines)


@mcp.resource("qtodo://health")
async def health_resource() -> str:
    """Backend health as a plain-text resource."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(_backend("/health"), timeout=10)
    if not resp.is_success:
        return "Backend is down. Or sulking. It's hard to tell."
    h = resp.json()
    return (
        f"QTodo Backend Status\n"
        f"  status:     {h.get('status')}\n"
        f"  uptime:     {h.get('uptime_seconds')}s\n"
        f"  database:   {h.get('database')}\n"
        f"  blockchain: {h.get('blockchain')}\n"
        f"  philosophy: {h.get('philosophy')}\n"
    )


if __name__ == "__main__":
    import sys
    transport = "sse" if "--transport" in sys.argv and sys.argv[sys.argv.index("--transport") + 1] == "sse" else "stdio"
    mcp.run(transport=transport)
