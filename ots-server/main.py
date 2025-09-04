from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import base64
import os
from web3 import Web3
from opentimestamps.client import Client

app = FastAPI()
client = Client()

# EVM client setup. All variables are optional so the server still works
# without a chain connection.
RPC_URL = os.getenv('EVM_RPC_URL')
PRIV_KEY = os.getenv('EVM_PRIVATE_KEY')
CONTRACT_ADDR = os.getenv('EVM_CONTRACT_ADDRESS')
CHAIN_NAME = os.getenv('EVM_CHAIN', 'unknown')
EXPLORER = os.getenv('EVM_EXPLORER', '')

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
        'inputs': [
            {'internalType': 'bytes32', 'name': 'hash', 'type': 'bytes32'},
            {'internalType': 'string', 'name': 'ref', 'type': 'string'},
        ],
        'name': 'record',
        'outputs': [],
        'stateMutability': 'nonpayable',
        'type': 'function',
    },
]
contract = web3.eth.contract(address=CONTRACT_ADDR, abi=ABI) if web3 and CONTRACT_ADDR else None

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
    proof = client.create(bytes.fromhex(req.hash))
    return {'proof': base64.b64encode(proof).decode()}

@app.post('/ots/verify')
def verify(req: VerifyReq):
    proof = base64.b64decode(req.proof)
    ok = client.verify(bytes.fromhex(req.hash), proof)
    return {'verified': ok}

@app.post('/ots/upgrade')
def upgrade(req: UpgradeReq):
    proof = base64.b64decode(req.proof)
    upgraded = client.upgrade(proof)
    return {'proof': base64.b64encode(upgraded).decode()}


@app.post('/evm/anchor')
def anchor(req: AnchorReq):
    if not contract or not account:
        raise HTTPException(status_code=500, detail='EVM not configured')
    # Send the hash to chain in the most miserly manner possible.
    nonce = web3.eth.get_transaction_count(account.address)
    txn = contract.functions.record(Web3.to_bytes(hexstr=req.hash), req.ref).build_transaction(
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
    return {
        'tx': tx_hash.hex(),
        'contract': CONTRACT_ADDR,
        'chain': CHAIN_NAME,
        'explorer': explorer,
    }


@app.post('/evm/verify')
def verify_anchor(req: AnchorVerifyReq):
    if not contract:
        raise HTTPException(status_code=500, detail='EVM not configured')
    # Look back through the chain to find the matching event.
    logs = contract.events.Recorded.create_filter(
        fromBlock=0, argument_filters={'hash': Web3.to_bytes(hexstr=req.hash)}
    ).get_all_entries()
    if logs:
        tx_hash = logs[-1]['transactionHash'].hex()
        return {'found': True, 'tx': tx_hash}
    return {'found': False}
