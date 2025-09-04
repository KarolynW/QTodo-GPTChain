# OpenTimestamps Helper

`ots-server` is a tiny FastAPI service that turns SHA-256 hashes into cryptic
proofs and occasionally hurls them at an EVM chain.

## Quickstart

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

Set the `EVM_*` environment variables if you want on-chain antics; otherwise it
quietly pretends blockchains never happened.

## Endpoints

- `POST /ots/create` – return a base64-encoded OpenTimestamps proof for a hex hash.
- `POST /ots/verify` – check a hash against a proof.
- `POST /ots/upgrade` – ask the network to upgrade a proof.
- `POST /evm/anchor` – record or store the hash on-chain when EVM settings are configured.
- `POST /evm/verify` – confirm whether a hash was anchored.

## Easter Egg

If the server logs "beep boop" on startup, you've accidentally triggered
debug mode. Spoiler: there is no debug mode.

<!-- The cake is a lie, but the timestamps are real. -->

