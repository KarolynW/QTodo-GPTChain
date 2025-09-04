from fastapi import FastAPI, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
import base64
import os
import logging
import sqlite3
from web3 import Web3
from opentimestamps.client import Client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
client = Client()

ASCII_ART = r"""
   ____  __________  ____   ____
  / __ \|___  / __ \|  _ \ / __ \
 | |  | | / / |  | | |_) | |  | |
 | |  | |/ /| |  | |  _ <| |  | |
 | |__| / /__| |__| | |_) | |__| |
  \____/_____|\____/|____/ \____/

 QTodo Retro Server - 1990s Edition
"""

print(ASCII_ART)

db = sqlite3.connect('todo.db', check_same_thread=False)
db.execute(
    'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)'
)
db.execute(
    'CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, text TEXT, done INTEGER DEFAULT 0, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id))'
)
db.commit()

# This server exists mainly so hashes can feel important before fading into
# obscurity. Think of it as a timestamping spa.

# EVM client setup. All variables are optional so the server still works
# without a chain connection.
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
            {
                'indexed': False,
                'internalType': 'bytes32',
                'name': 'hash',
                'type': 'bytes32',
            },
            {
                'indexed': False,
                'internalType': 'string',
                'name': 'ref',
                'type': 'string',
            },
            {
                'indexed': False,
                'internalType': 'address',
                'name': 'who',
                'type': 'address',
            },
        ],
        'name': 'Recorded',
        'type': 'event',
    },
    {
        'anonymous': False,
        'inputs': [
            {
                'indexed': False,
                'internalType': 'bytes32',
                'name': 'hash',
                'type': 'bytes32',
            },
            {
                'indexed': False,
                'internalType': 'string',
                'name': 'ref',
                'type': 'string',
            },
            {
                'indexed': False,
                'internalType': 'address',
                'name': 'who',
                'type': 'address',
            },
        ],
        'name': 'Stored',
        'type': 'event',
    },
    {
        'inputs': [
            {
                'internalType': 'bytes32',
                'name': 'hash',
                'type': 'bytes32',
            },
            {
                'internalType': 'string',
                'name': 'ref',
                'type': 'string',
            },
        ],
        'name': 'record',
        'outputs': [],
        'stateMutability': 'nonpayable',
        'type': 'function',
    },
    {
        'inputs': [
            {
                'internalType': 'bytes32',
                'name': 'hash',
                'type': 'bytes32',
            },
            {
                'internalType': 'string',
                'name': 'ref',
                'type': 'string',
            },
        ],
        'name': 'store',
        'outputs': [],
        'stateMutability': 'nonpayable',
        'type': 'function',
    },
    {
        'inputs': [
            {
                'internalType': 'bytes32',
                'name': 'hash',
                'type': 'bytes32',
            }
        ],
        'name': 'getTask',
        'outputs': [
            {
                'internalType': 'bytes32',
                'name': 'hash',
                'type': 'bytes32',
            },
            {
                'internalType': 'string',
                'name': 'ref',
                'type': 'string',
            },
            {
                'internalType': 'address',
                'name': 'who',
                'type': 'address',
            },
            {
                'internalType': 'uint256',
                'name': 'timestamp',
                'type': 'uint256',
            },
        ],
        'stateMutability': 'view',
        'type': 'function',
    },
]
contract = web3.eth.contract(address=CONTRACT_ADDR, abi=ABI) if web3 and CONTRACT_ADDR else None

if contract:
    logger.info(
        'EVM configured for chain %s, contract %s, mode %s',
        CHAIN_NAME,
        CONTRACT_ADDR,
        EVM_MODE,
    )
else:
    logger.warning('EVM not configured; blockchain features disabled')

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

@app.post('/ots/create')
def create(req: HashReq):
    logger.info('OTS create for %s', req.hash)
    try:
        proof = client.create(bytes.fromhex(req.hash))
        return {'proof': base64.b64encode(proof).decode()}
    except Exception:
        logger.exception('OTS create failed')
        raise HTTPException(status_code=500, detail='OTS create failed')

@app.post('/ots/verify')
def verify(req: VerifyReq):
    logger.info('OTS verify for %s', req.hash)
    try:
        proof = base64.b64decode(req.proof)
        ok = client.verify(bytes.fromhex(req.hash), proof)
        return {'verified': ok}
    except Exception:
        logger.exception('OTS verify failed')
        raise HTTPException(status_code=500, detail='OTS verify failed')

@app.post('/ots/upgrade')
def upgrade(req: UpgradeReq):
    logger.info('OTS upgrade request')
    try:
        proof = base64.b64decode(req.proof)
        upgraded = client.upgrade(proof)
        return {'proof': base64.b64encode(upgraded).decode()}
    except Exception:
        logger.exception('OTS upgrade failed')
        raise HTTPException(status_code=500, detail='OTS upgrade failed')


@app.post('/evm/anchor')
def anchor(req: AnchorReq):
    logger.info('EVM anchor for %s', req.hash)
    if not contract or not account:
        logger.error('EVM not configured')
        raise HTTPException(status_code=500, detail='EVM not configured')
    try:
        nonce = web3.eth.get_transaction_count(account.address)
        func = (
            contract.functions.store
            if EVM_MODE != 'lite'
            else contract.functions.record
        )
        txn = func(Web3.to_bytes(hexstr=req.hash), req.ref).build_transaction(
            {
                'from': account.address,
                'nonce': nonce,
                'gas': 100000,
                'gasPrice': web3.eth.gas_price,
            }
        )
        signed = account.sign_transaction(txn)
        tx_hash = web3.eth.send_raw_transaction(signed.rawTransaction)
        web3.eth.wait_for_transaction_receipt(tx_hash)
        explorer = f"{EXPLORER}/tx/{tx_hash.hex()}" if EXPLORER else ''
        logger.info('Anchored %s in tx %s', req.hash, tx_hash.hex())
        return {
            'tx': tx_hash.hex(),
            'contract': CONTRACT_ADDR,
            'chain': CHAIN_NAME,
            'explorer': explorer,
        }
    except Exception:
        logger.exception('EVM anchor failed')
        raise HTTPException(status_code=500, detail='EVM anchor failed')


@app.post('/evm/verify')
def verify_anchor(req: AnchorVerifyReq):
    logger.info('EVM verify for %s', req.hash)
    if not contract:
        logger.error('EVM not configured')
        raise HTTPException(status_code=500, detail='EVM not configured')
    try:
        event = (
            contract.events.Stored if EVM_MODE != 'lite' else contract.events.Recorded
        )
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


class UserReq(BaseModel):
    username: str
    password: str


class TodoReq(BaseModel):
    user_id: int
    text: str


@app.get('/')
def root():
    return PlainTextResponse(ASCII_ART)


@app.post('/users/register')
def register(user: UserReq):
    cur = db.cursor()
    try:
        cur.execute('INSERT INTO users (username, password) VALUES (?, ?)', (user.username, user.password))
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
