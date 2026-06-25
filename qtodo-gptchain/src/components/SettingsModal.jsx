import { useState, useEffect } from 'react'
import { BrowserProvider, ContractFactory } from 'ethers'
import AnchorArtifact from '../../public/Anchor.json'

// Keys used in localStorage — kept here so they don't get misspelled elsewhere.
export const STORAGE_KEYS = {
  OPENAI_KEY: 'qtodo_openai_key',
  EVM_RPC_URL: 'qtodo_evm_rpc_url',
  EVM_PRIVATE_KEY: 'qtodo_evm_private_key',
  EVM_CONTRACT: 'qtodo_evm_contract',
  EVM_CHAIN: 'qtodo_evm_chain',
  EVM_EXPLORER: 'qtodo_evm_explorer',
  EVM_MODE: 'qtodo_evm_mode',
}

export function getOpenAIKey() {
  return localStorage.getItem(STORAGE_KEYS.OPENAI_KEY) || import.meta.env.VITE_OPENAI_API_KEY || ''
}

export function getEvmCreds() {
  return {
    rpc_url: localStorage.getItem(STORAGE_KEYS.EVM_RPC_URL) || '',
    private_key: localStorage.getItem(STORAGE_KEYS.EVM_PRIVATE_KEY) || '',
    contract_address: localStorage.getItem(STORAGE_KEYS.EVM_CONTRACT) || '',
    chain: localStorage.getItem(STORAGE_KEYS.EVM_CHAIN) || '',
    explorer: localStorage.getItem(STORAGE_KEYS.EVM_EXPLORER) || '',
    mode: localStorage.getItem(STORAGE_KEYS.EVM_MODE) || 'lite',
  }
}

function Field({ label, type = 'text', value, onChange, placeholder, hint }) {
  return (
    <div className="mb-3">
      <label className="block text-xs text-green-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-black border border-green-800 px-2 py-1 text-sm focus:border-green-500 outline-none"
        autoComplete="off"
        spellCheck="false"
      />
      {hint && <p className="text-xs text-gray-600 mt-0.5">{hint}</p>}
    </div>
  )
}

export default function SettingsModal({ onClose }) {
  const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem(STORAGE_KEYS.OPENAI_KEY) || '')
  const [rpcUrl, setRpcUrl] = useState(() => localStorage.getItem(STORAGE_KEYS.EVM_RPC_URL) || '')
  const [privateKey, setPrivateKey] = useState(() => localStorage.getItem(STORAGE_KEYS.EVM_PRIVATE_KEY) || '')
  const [contractAddr, setContractAddr] = useState(() => localStorage.getItem(STORAGE_KEYS.EVM_CONTRACT) || '')
  const [chain, setChain] = useState(() => localStorage.getItem(STORAGE_KEYS.EVM_CHAIN) || 'base-sepolia')
  const [explorer, setExplorer] = useState(() => localStorage.getItem(STORAGE_KEYS.EVM_EXPLORER) || 'https://sepolia.basescan.org')
  const [mode, setMode] = useState(() => localStorage.getItem(STORAGE_KEYS.EVM_MODE) || 'lite')

  const [deployStatus, setDeployStatus] = useState('')
  const [saved, setSaved] = useState(false)

  const save = () => {
    if (openaiKey) localStorage.setItem(STORAGE_KEYS.OPENAI_KEY, openaiKey)
    else localStorage.removeItem(STORAGE_KEYS.OPENAI_KEY)

    if (rpcUrl) localStorage.setItem(STORAGE_KEYS.EVM_RPC_URL, rpcUrl)
    else localStorage.removeItem(STORAGE_KEYS.EVM_RPC_URL)

    if (privateKey) localStorage.setItem(STORAGE_KEYS.EVM_PRIVATE_KEY, privateKey)
    else localStorage.removeItem(STORAGE_KEYS.EVM_PRIVATE_KEY)

    if (contractAddr) localStorage.setItem(STORAGE_KEYS.EVM_CONTRACT, contractAddr)
    else localStorage.removeItem(STORAGE_KEYS.EVM_CONTRACT)

    localStorage.setItem(STORAGE_KEYS.EVM_CHAIN, chain)
    localStorage.setItem(STORAGE_KEYS.EVM_EXPLORER, explorer)
    localStorage.setItem(STORAGE_KEYS.EVM_MODE, mode)

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Deploy Anchor.sol via MetaMask. Requires the user to have MetaMask installed.
  // This is ambitious. We respect the ambition.
  const deployContract = async () => {
    if (!window.ethereum) {
      setDeployStatus('MetaMask not found. Install it, connect a wallet, try again.')
      return
    }
    setDeployStatus('Requesting wallet access…')
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const network = await provider.getNetwork()
      setDeployStatus(`Connected to chain ${network.chainId}. Deploying Anchor.sol…`)

      const factory = new ContractFactory(AnchorArtifact.abi, AnchorArtifact.bytecode, signer)
      const contract = await factory.deploy()
      setDeployStatus(`Deploying… tx: ${contract.deploymentTransaction()?.hash?.slice(0, 10)}…`)
      await contract.waitForDeployment()
      const addr = await contract.getAddress()
      setContractAddr(addr)
      setDeployStatus(`✓ Deployed at ${addr}`)
    } catch (err) {
      setDeployStatus(`Deploy failed: ${err.message?.slice(0, 120)}`)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-black border border-green-600 p-4 max-w-lg w-full mx-4 overflow-y-auto"
        style={{ maxHeight: '90vh' }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-green-400 text-sm font-bold">⚙ Settings / Credentials</h2>
          <button onClick={onClose} className="text-gray-600 text-xs border border-gray-700 px-2 py-0.5">✕ close</button>
        </div>

        {/* ── OpenAI ──────────────────────────────────────────────────────── */}
        <section className="mb-5">
          <h3 className="text-xs text-green-700 border-b border-green-900 pb-1 mb-3">
            OpenAI — Bring Your Own Key
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            Used for haiku generation and Vibe Check™. Stored in localStorage.
            Never sent to our server. We're not paying for it; that's on you now.
          </p>
          <Field
            label="API Key"
            type="password"
            value={openaiKey}
            onChange={setOpenaiKey}
            placeholder="sk-..."
            hint="sk-proj-... from platform.openai.com/api-keys"
          />
        </section>

        {/* ── EVM ─────────────────────────────────────────────────────────── */}
        <section className="mb-5">
          <h3 className="text-xs text-green-700 border-b border-green-900 pb-1 mb-3">
            EVM / Blockchain — Your Chain, Your Problem
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            Credentials for anchoring task hashes on-chain. Sent to the backend
            per-request, not stored there. The private key stays in your browser.
            This is either a security feature or a security problem depending on
            how much you trust your browser.
          </p>
          <Field
            label="RPC URL"
            value={rpcUrl}
            onChange={setRpcUrl}
            placeholder="https://sepolia.base.org"
            hint="Any EVM-compatible RPC endpoint"
          />
          <Field
            label="Private Key"
            type="password"
            value={privateKey}
            onChange={setPrivateKey}
            placeholder="0x..."
            hint="Signing wallet private key — never sent to our server"
          />
          <Field
            label="Contract Address"
            value={contractAddr}
            onChange={setContractAddr}
            placeholder="0x..."
            hint="Deployed Anchor.sol address (deploy below if you don't have one)"
          />
          <Field
            label="Chain Name"
            value={chain}
            onChange={setChain}
            placeholder="base-sepolia"
          />
          <Field
            label="Block Explorer URL"
            value={explorer}
            onChange={setExplorer}
            placeholder="https://sepolia.basescan.org"
            hint="Used for generating tx links (optional)"
          />

          <div className="mb-3">
            <label className="block text-xs text-green-600 mb-1">Anchor Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="bg-black border border-green-800 px-2 py-1 text-sm text-green-400"
            >
              <option value="lite">lite — emit event, forget (cheap)</option>
              <option value="full">full — store on-chain forever (less cheap)</option>
            </select>
          </div>
        </section>

        {/* ── Contract deployment ──────────────────────────────────────────── */}
        <section className="mb-5">
          <h3 className="text-xs text-green-700 border-b border-green-900 pb-1 mb-3">
            Deploy Anchor Contract via MetaMask
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            Don't have a contract address? Deploy Anchor.sol directly from your
            browser using MetaMask. You pay the gas. We provide the ABI.
            Fair deal.
          </p>
          <button
            onClick={deployContract}
            className="border border-yellow-600 text-yellow-500 px-3 py-1 text-xs"
          >
            🦊 Deploy via MetaMask
          </button>
          {deployStatus && (
            <p className="text-xs mt-2 text-yellow-400 break-all">{deployStatus}</p>
          )}
        </section>

        {/* ── Save ────────────────────────────────────────────────────────── */}
        <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-green-900">
          <button onClick={onClose} className="border border-gray-700 text-gray-600 px-3 py-1 text-xs">
            Cancel
          </button>
          <button
            onClick={save}
            className="border border-green-500 text-green-400 px-3 py-1 text-xs"
          >
            {saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
