from fastapi import FastAPI
from pydantic import BaseModel
import base64
from opentimestamps.client import Client

app = FastAPI()
client = Client()

class HashReq(BaseModel):
    hash: str

class VerifyReq(BaseModel):
    hash: str
    proof: str

class UpgradeReq(BaseModel):
    proof: str

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
