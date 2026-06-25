from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
import base64
import hashlib
import io
import json
import os
import time
import logging
import sqlite3

# The opentimestamps library exists because apparently just checking your watch
# wasn't authoritative enough. We need Bitcoin—a globally-distributed
# consensus mechanism burning the energy of a small country—to tell us
# what time it is. Architecture review passed unanimously.
from opentimestamps.core.timestamp import DetachedTimestampFile, Timestamp
from opentimestamps.core.op import OpSHA256
from opentimestamps.core.notary import PendingAttestation, BitcoinBlockHeaderAttestation
from opentimestamps.core.serialize import StreamSerializationContext, StreamDeserializationContext
from opentimestamps.calendar import RemoteCalendar, DEFAULT_AGGREGATORS

from web3 import Web3

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

START_TIME = time.time()

app = FastAPI(
    title="QTodo Retro Server",
    description="A microservice that exists solely to make a todo list feel important.",
    version="0.0.0-eternal-beta",
)

# CORS: because browsers are paranoid and the internet is not.
# allow_origins=['*'] is the YOLO of security configurations, but we're already
# anchoring grocery lists on a blockchain, so let's not pretend we're cautious.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ASCII_ART = r"""
   ____  _______ ____  __________
  / __ \/_  __/ |/ _ \/ _  / __ \
 | |  | | / /  | | | | | | | |  | |
 | |  | |/ /| | |_| | |_| | |__| |
 | |__| |/ /__| |\___/ \____/\____/
  \____//_____/_|

 QTodo Retro Server - 1990s Edition
 Timestamping your procrastination since the genesis block.
"""

print(ASCII_ART)

db = sqlite3.connect('todo.db', check_same_thread=False)
db.execute(
    'CREATE TABLE IF NOT EXISTS users '
    '(id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)'
)
db.execute(
    'CREATE TABLE IF NOT EXISTS todos '
    '(id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, text TEXT, '
    'done INTEGER DEFAULT 0, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, '
    'FOREIGN KEY(user_id) REFERENCES users(id))'
)
db.commit()

# This server exists mainly so hashes can feel important before fading into
# obscurity. Think of it as a timestamping spa for anxious cryptographic digests.

# EVM client setup. All variables are optional so the server limps along
# without a chain connection, like a blockchain enthusiast at a cash-only café.
RPC_URL = os.getenv('EVM_RPC_URL')
PRIV_KEY = os.getenv('EVM_PRIVATE_KEY')
CONTRACT_ADDR = os.getenv('EVM_CONTRACT_ADDRESS')
CHAIN_NAME = os.getenv('EVM_CHAIN', 'unknown')
EXPLORER = os.getenv('EVM_EXPLORER', '')
EVM_MODE = os.getenv('EVM_MODE', 'lite')

web3 = Web3(Web3.HTTPProvider(RPC_URL)) if RPC_URL else None
account = web3.eth.account.from_key(PRIV_KEY) if web3 and PRIV_KEY else None
ABI = [
    {
        'anonymous': False,
        'inputs': [
            {'indexed': False, 'internalType': 'bytes32', 'name': 'hash', 'type': 'bytes32'},
            {'indexed': False, 'internalType': 'string', 'name': 'ref', 'type': 'string'},
            {'indexed': False, 'internalType': 'address', 'name': 'who', 'type': 'address'},
        ],
        'name': 'Recorded',
        'type': 'event',
    },
    {
        'anonymous': False,
        'inputs': [
            {'indexed': False, 'internalType': 'bytes32', 'name': 'hash', 'type': 'bytes32'},
            {'indexed': False, 'internalType': 'string', 'name': 'ref', 'type': 'string'},
            {'indexed': False, 'internalType': 'address', 'name': 'who', 'type': 'address'},
        ],
        'name': 'Stored',
        'type': 'event',
    },
    {
        'inputs': [
            {'internalType': 'bytes32', 'name': 'hash', 'type': 'bytes32'},
            {'internalType': 'string', 'name': 'ref', 'type': 'string'},
        ],
        'name': 'record',
        'outputs': [],
        'stateMutability': 'nonpayable',
        'type': 'function',
    },
    {
        'inputs': [
            {'internalType': 'bytes32', 'name': 'hash', 'type': 'bytes32'},
            {'internalType': 'string', 'name': 'ref', 'type': 'string'},
        ],
        'name': 'store',
        'outputs': [],
        'stateMutability': 'nonpayable',
        'type': 'function',
    },
    {
        'inputs': [{'internalType': 'bytes32', 'name': 'hash', 'type': 'bytes32'}],
        'name': 'getTask',
        'outputs': [
            {'internalType': 'bytes32', 'name': 'hash', 'type': 'bytes32'},
            {'internalType': 'string', 'name': 'ref', 'type': 'string'},
            {'internalType': 'address', 'name': 'who', 'type': 'address'},
            {'internalType': 'uint256', 'name': 'timestamp', 'type': 'uint256'},
        ],
        'stateMutability': 'view',
        'type': 'function',
    },
]
contract = web3.eth.contract(address=CONTRACT_ADDR, abi=ABI) if web3 and CONTRACT_ADDR else None

if contract:
    logger.info('EVM configured for chain %s, contract %s, mode %s', CHAIN_NAME, CONTRACT_ADDR, EVM_MODE)
else:
    logger.warning('EVM not configured; blockchain features disabled (your tasks remain unanchored, unwitnessed, and fundamentally ephemeral)')


# ── OpenTimestamps helpers ──────────────────────────────────────────────────
# The previous version of this file imported `from opentimestamps.client import Client`,
# a class that does not exist anywhere in the opentimestamps package.
# It compiled fine because nobody ran it. Behold: the peer-review process in action.

def _ots_create(hash_bytes: bytes) -> bytes:
    """Submit hash to calendar servers and receive a pending timestamp.

    We contact multiple calendar servers for redundancy, because a single
    point of failure is unacceptable for a todo list that nobody will ever read.
    Each server wraps our hash in a Merkle tree and promises to one day
    convince a Bitcoin miner to care.
    """
    collected = []
    for url in DEFAULT_AGGREGATORS[:2]:
        try:
            cal = RemoteCalendar(url)
            ts = cal.submit(hash_bytes, timeout=8)
            collected.append(ts)
            logger.info('Calendar %s accepted our hash without judgment', url)
        except Exception as exc:
            logger.warning('Calendar %s rejected us (%s). Story of our lives.', url, exc)

    if not collected:
        raise RuntimeError(
            "Every single calendar server refused our hash. "
            "They've probably read the README and have standards."
        )

    # Merge all timestamps together for maximum cryptographic theatre.
    main_ts = collected[0]
    for extra_ts in collected[1:]:
        main_ts.merge(extra_ts)

    stamp = DetachedTimestampFile(OpSHA256(), main_ts)
    buf = io.BytesIO()
    stamp.serialize(StreamSerializationContext(buf))
    return buf.getvalue()


def _ots_upgrade(proof_bytes: bytes) -> bytes:
    """Contact calendars to see if Bitcoin has noticed our existence yet.

    Bitcoin does not read todo lists. Bitcoin does not care. Bitcoin is
    busy being mined in a warehouse in Iceland by ASICs that could heat a
    small city. Nevertheless, we ask.
    """
    dctx = StreamDeserializationContext(io.BytesIO(proof_bytes))
    stamp = DetachedTimestampFile.deserialize(dctx)

    for msg, attestation in list(stamp.timestamp.all_attestations()):
        if isinstance(attestation, PendingAttestation):
            try:
                cal = RemoteCalendar(attestation.uri)
                upgraded_ts = cal.get_timestamp(msg, timeout=8)
                stamp.timestamp.merge(upgraded_ts)
                logger.info('Calendar %s upgraded our timestamp. Bitcoin is aware.', attestation.uri)
            except Exception as exc:
                logger.warning('Calendar %s still pending (%s). Bitcoin remains indifferent.', attestation.uri, exc)

    buf = io.BytesIO()
    stamp.serialize(StreamSerializationContext(buf))
    return buf.getvalue()


def _ots_verify(proof_bytes: bytes) -> bool:
    """Check whether any attestation in the timestamp has been confirmed by Bitcoin.

    Returns True if a miner, somewhere, has unknowingly immortalised a task
    that probably said 'buy oat milk' or 'reply to Dave's email'.
    """
    dctx = StreamDeserializationContext(io.BytesIO(proof_bytes))
    stamp = DetachedTimestampFile.deserialize(dctx)
    return any(
        isinstance(att, BitcoinBlockHeaderAttestation)
        for _, att in stamp.timestamp.all_attestations()
    )


# ── Request models ──────────────────────────────────────────────────────────

class HashReq(BaseModel):
    hash: str

class VerifyReq(BaseModel):
    hash: str
    proof: str

class UpgradeReq(BaseModel):
    proof: str

class AnchorReq(BaseModel):
    hash: str
    ref: str

class AnchorVerifyReq(BaseModel):
    hash: str

class UserReq(BaseModel):
    username: str
    password: str

class TodoReq(BaseModel):
    user_id: int
    text: str


# ── Routes ──────────────────────────────────────────────────────────────────

@app.get('/')
def root():
    return PlainTextResponse(ASCII_ART)


@app.post('/ots/create')
def create(req: HashReq):
    logger.info('OTS create for %s', req.hash)
    try:
        proof_bytes = _ots_create(bytes.fromhex(req.hash))
        return {'proof': base64.b64encode(proof_bytes).decode()}
    except Exception:
        logger.exception('OTS create failed')
        raise HTTPException(status_code=500, detail='OTS create failed; the calendars have spoken')


@app.post('/ots/verify')
def verify(req: VerifyReq):
    logger.info('OTS verify for %s', req.hash)
    try:
        proof_bytes = base64.b64decode(req.proof)
        ok = _ots_verify(proof_bytes)
        return {'verified': ok}
    except Exception:
        logger.exception('OTS verify failed')
        raise HTTPException(status_code=500, detail='OTS verify failed; Bitcoin shrugged')


@app.post('/ots/upgrade')
def upgrade(req: UpgradeReq):
    logger.info('OTS upgrade request')
    try:
        proof_bytes = base64.b64decode(req.proof)
        upgraded = _ots_upgrade(proof_bytes)
        return {'proof': base64.b64encode(upgraded).decode()}
    except Exception:
        logger.exception('OTS upgrade failed')
        raise HTTPException(status_code=500, detail='OTS upgrade failed; try again in an eon')


@app.post('/evm/anchor')
def anchor(req: AnchorReq):
    logger.info('EVM anchor for %s', req.hash)
    if not contract or not account:
        logger.error('EVM not configured; hash %s will not achieve blockchain immortality today', req.hash)
        raise HTTPException(status_code=500, detail='EVM not configured')
    try:
        nonce = web3.eth.get_transaction_count(account.address)
        func = contract.functions.store if EVM_MODE != 'lite' else contract.functions.record
        txn = func(Web3.to_bytes(hexstr=req.hash), req.ref).build_transaction(
            {
                'from': account.address,
                'nonce': nonce,
                'gas': 100000,
                'gasPrice': web3.eth.gas_price,
            }
        )
        signed = account.sign_transaction(txn)
        # web3.py 7.x renamed rawTransaction → raw_transaction (snake_case).
        # The previous code used rawTransaction and therefore never worked.
        # In fairness, neither did anything else.
        tx_hash = web3.eth.send_raw_transaction(signed.raw_transaction)
        web3.eth.wait_for_transaction_receipt(tx_hash)
        explorer = f"{EXPLORER}/tx/{tx_hash.hex()}" if EXPLORER else ''
        logger.info('Anchored %s in tx %s — a miner has witnessed your procrastination', req.hash, tx_hash.hex())
        return {
            'tx': tx_hash.hex(),
            'contract': CONTRACT_ADDR,
            'chain': CHAIN_NAME,
            'explorer': explorer,
        }
    except Exception:
        logger.exception('EVM anchor failed')
        raise HTTPException(status_code=500, detail='EVM anchor failed; the chain remains pure')


@app.post('/evm/verify')
def verify_anchor(req: AnchorVerifyReq):
    logger.info('EVM verify for %s', req.hash)
    if not contract:
        raise HTTPException(status_code=500, detail='EVM not configured')
    try:
        event = contract.events.Stored if EVM_MODE != 'lite' else contract.events.Recorded
        logs = event.create_filter(
            fromBlock=0, argument_filters={'hash': Web3.to_bytes(hexstr=req.hash)}
        ).get_all_entries()
        if logs:
            tx_hash = logs[-1]['transactionHash'].hex()
            return {'found': True, 'tx': tx_hash}
        return {'found': False}
    except Exception:
        logger.exception('EVM verify failed')
        raise HTTPException(status_code=500, detail='EVM verify failed')


@app.post('/users/register')
def register(user: UserReq):
    # We hash passwords with SHA-256. This is infinitely better than plaintext
    # and approximately infinitely worse than bcrypt/argon2. Progress is a spectrum.
    # If you're reading this in a security audit: hi, sorry, this is satire.
    hashed = hashlib.sha256(user.password.encode()).hexdigest()
    cur = db.cursor()
    try:
        cur.execute('INSERT INTO users (username, password) VALUES (?, ?)', (user.username, hashed))
        db.commit()
        return {'id': cur.lastrowid}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail='username taken')


@app.post('/todos/add')
def add_todo(todo: TodoReq):
    cur = db.cursor()
    cur.execute('INSERT INTO todos (user_id, text) VALUES (?, ?)', (todo.user_id, todo.text))
    db.commit()
    return {'id': cur.lastrowid}


@app.get('/todos/{user_id}')
def list_todos(user_id: int):
    cur = db.cursor()
    cur.execute('SELECT id, text, done, created FROM todos WHERE user_id = ?', (user_id,))
    rows = cur.fetchall()
    todos = [
        {'id': r[0], 'text': r[1], 'done': bool(r[2]), 'created': r[3]}
        for r in rows
    ]
    return {'todos': todos}


@app.get('/health')
def health():
    """Health check endpoint for load balancers that will never exist.

    Kubernetes probes, Consul service discovery, and ECS task health checks
    will never touch this endpoint. We provide it anyway, because hope is free.
    """
    cur = db.cursor()
    try:
        cur.execute('SELECT 1')
        db_status = 'alive'
    except Exception:
        db_status = 'alarming'

    return {
        'status': 'alive (barely)',
        'uptime_seconds': round(time.time() - START_TIME, 1),
        'database': f'sqlite — {db_status} — enterprise-grade if you squint',
        'blockchain': 'optional (EVM_RPC_URL not set)' if not RPC_URL else f'wired to {CHAIN_NAME}',
        'quantum_rng': 'delegated to frontend (not our problem)',
        'haiku_quality': 'variable (depends on OpenAI mood)',
        'password_security': 'sha256 (we know, we know)',
        'cors': 'allow_origins=["*"] (YOLO mode)',
        'philosophy': 'if it boots, ship it',
    }


@app.get('/metrics')
def metrics():
    """Prometheus-format metrics for dashboards nobody will build.

    Copy this output into a Grafana panel and watch your team nod seriously
    at a graph of how many people haven't finished their grocery lists.
    The existential_dread metric is always 9.7. We measured.
    """
    cur = db.cursor()
    cur.execute('SELECT COUNT(*) FROM todos')
    todo_count = cur.fetchone()[0]
    cur.execute('SELECT COUNT(*) FROM todos WHERE done = 1')
    done_count = cur.fetchone()[0]
    cur.execute('SELECT COUNT(*) FROM users')
    user_count = cur.fetchone()[0]

    uptime = round(time.time() - START_TIME, 1)

    return PlainTextResponse(
        f"""# HELP qtodo_todos_total Total todo items languishing in the database
# TYPE qtodo_todos_total gauge
qtodo_todos_total {todo_count}
# HELP qtodo_todos_done_total Tasks heroically completed (server-side; localStorage not counted)
# TYPE qtodo_todos_done_total gauge
qtodo_todos_done_total {done_count}
# HELP qtodo_users_total Users who trusted us with their passwords (hashed with SHA-256, sorry)
# TYPE qtodo_users_total gauge
qtodo_users_total {user_count}
# HELP qtodo_uptime_seconds Seconds the server has been running without exploding
# TYPE qtodo_uptime_seconds counter
qtodo_uptime_seconds {uptime}
# HELP qtodo_blockchain_anchors_total Tasks anchored on-chain (immutable, permanent, pointless)
# TYPE qtodo_blockchain_anchors_total counter
qtodo_blockchain_anchors_total 0
# HELP qtodo_existential_dread Current level of existential dread (constant)
# TYPE qtodo_existential_dread gauge
qtodo_existential_dread 9.7
# HELP qtodo_features_added_for_features_sake Features added purely to have something to present
# TYPE qtodo_features_added_for_features_sake gauge
qtodo_features_added_for_features_sake 14
# HELP qtodo_lines_of_code_per_checkbox Lines of code required to render a checkbox
# TYPE qtodo_lines_of_code_per_checkbox gauge
qtodo_lines_of_code_per_checkbox 847
""",
        media_type='text/plain; version=0.0.4; charset=utf-8',
    )


@app.websocket('/ws')
async def websocket_endpoint(ws: WebSocket):
    """WebSocket endpoint.

    This WebSocket connection exists primarily so the architecture diagram
    has an arrow going somewhere dramatic. It echoes messages back and
    occasionally reminds clients that nothing meaningful is happening.

    Production note: zero clients have ever connected to this endpoint.
    We feel this is a reasonable outcome.
    """
    await ws.accept()
    logger.info('WebSocket client connected. Hello, lonely client.')
    await ws.send_text(json.dumps({
        'type': 'welcome',
        'message': 'Connected to the QTodo event stream.',
        'warning': 'This WebSocket does nothing useful. It exists for the architecture diagram.',
        'existential_status': 'pending',
        'tip': 'Try POST /health for something marginally more informative.',
    }))
    try:
        while True:
            data = await ws.receive_text()
            logger.info('WebSocket received: %s (acknowledged, not acted upon)', data[:100])
            await ws.send_text(json.dumps({
                'type': 'echo',
                'data': data,
                'status': 'noted and ignored',
                'recommendation': 'Consider a REST API. They return immediately.',
            }))
    except WebSocketDisconnect:
        logger.info('WebSocket client disconnected. The void remains.')
