import { useState, useEffect, useRef, useCallback } from 'react'
import confetti from 'canvas-confetti'
import { canonicalizeTask, sha256Hex } from './utils/ots'
import { aiPriorityScore, priorityClass, TAGS } from './utils/priority'
import Failure from './Failure'
import MatrixRain from './MatrixRain'
import SettingsModal, { getOpenAIKey, getEvmCreds } from './components/SettingsModal'
import {
  createDefaultStats,
  recordEvent,
  processDateRollover,
  historyToCsv,
} from './utils/failure'

// Because using a normal pseudo-RNG just isn't pretentious enough.
const fetchQuantumRandom = async (length) => {
  try {
    // Make a totally reasonable network request to a quantum number generator
    // because using Math.random() would obviously destroy the fabric of reality.
    const res = await fetch(
      `https://qrng.anu.edu.au/API/jsonI.php?length=${length}&type=uint8`,
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return data.data
  } catch (err) {
    // The quantum number generator is offline, rate-limited, or has simply given up.
    // We fall back to crypto.getRandomValues(), which is seeded by OS entropy —
    // technically still quantum, if you squint and believe in physics.
    // Schrödinger's shuffle: was it quantum? We'll never know. The cat is fine.
    console.warn('Quantum RNG unavailable. Degrading gracefully to mere thermodynamic randomness.', err)
    const buf = new Uint8Array(length)
    crypto.getRandomValues(buf)
    return Array.from(buf)
  }
}

// Beg the AI for a haiku; if we can't afford the API key, just echo back the task.
const generateHaiku = async (task) => {
  const key = getOpenAIKey()
  if (!key) return task
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        // gpt-5.4-nano: OpenAI's cheapest model as of 2026 — $0.20/M input tokens.
        // Because "gpt-4o-mini was too expensive for generating haiku about groceries" is
        // a sentence that means something in the year of our lord 2026.
        model: 'gpt-5.4-nano',
        messages: [
          { role: 'system', content: 'Turn tasks into ambiguous haiku. Three lines. Cryptic but vaguely related.' },
          { role: 'user', content: `Task: ${task}` },
        ],
      }),
    })
    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content
    return content?.trim() || task
  } catch (err) {
    console.error('OpenAI haiku request failed. Task will remain tragically literal.', err)
    return task
  }
}

// Ask the AI to roast your task list. This is productivity culture's final form.
const fetchVibe = async (tasks) => {
  // Check for empty tasks first — this is a free observation that doesn't need a GPU farm.
  const active = tasks.filter(t => t.status !== 'expired' && !t.completed)
  if (active.length === 0) {
    return 'Your task list is empty. This is either a great accomplishment or a great denial. The AI cannot tell the difference. Neither can you.'
  }
  const key = getOpenAIKey()
  if (!key) {
    return 'Cannot assess vibe without an OpenAI key. Set one in ⚙ Settings. Your vibe is: unobservable. Much like Schrödinger\'s productivity, you are simultaneously crushing it and completely failing until someone looks.'
  }
  const list = active.map(t => `• ${t.title}${t.tag ? ` [${t.tag}]` : ''}`).join('\n')
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        // Same model — gpt-5.4-nano — because the vibe assessment deserves the same budget
        // as the haiku generation: approximately nothing.
        model: 'gpt-5.4-nano',
        messages: [
          {
            role: 'system',
            content:
              'You are a brutally sarcastic productivity coach who cannot believe what you\'re reading. ' +
              'Assess the user\'s task list vibe in exactly one devastating, funny sentence. ' +
              'Be mean but accurate. Do not hold back. Reference specific tasks if possible.',
          },
          { role: 'user', content: `My current todo list:\n${list}` },
        ],
        max_tokens: 120,
      }),
    })
    const data = await res.json()
    return data?.choices?.[0]?.message?.content?.trim() || 'The AI read your tasks and chose silence.'
  } catch (err) {
    console.error('Vibe check failed', err)
    return 'Vibe check request failed. Even the AI gave up on you. That\'s actually impressive.'
  }
}

function App() {
  // Declare an irresponsible number of state variables, each more dramatic than the last.
  const [taskText, setTaskText] = useState('')
  const [tasks, setTasks] = useState([])
  const [expiryDate, setExpiryDate] = useState('')
  const [selectedTag, setSelectedTag] = useState('🔥')
  const [selfDestructing, setSelfDestructing] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const [finalMessage, setFinalMessage] = useState('')
  const [vibe, setVibe] = useState(null)
  const [vibeLoading, setVibeLoading] = useState(false)
  const [punishmentMode, setPunishmentMode] = useState(false)
  const [listening, setListening] = useState(false)
  const [dragIndex, setDragIndex] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [wsStatus, setWsStatus] = useState('disconnected')
  const [showSettings, setShowSettings] = useState(false)

  // Track the statistics of failure so we can quantify our despair.
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('failureStats')
    return saved ? JSON.parse(saved) : createDefaultStats()
  })
  const [view, setView] = useState('tasks')

  // BroadcastChannel: because having your todo list open in two tabs
  // simultaneously is a problem that absolutely needed a distributed solution.
  const channelRef = useRef(null)
  const isExternalUpdate = useRef(false)
  // dragIndexRef keeps the dragged index in a ref so the drop handler always
  // reads the current value even if state hasn't flushed yet. React state and
  // synchronous DOM events have a complicated relationship we prefer not to discuss.
  const dragIndexRef = useRef(null)

  // ── Persistence ──────────────────────────────────────────────────────────

  useEffect(() => {
    const saved = localStorage.getItem('tasks')
    if (saved) setTasks(JSON.parse(saved))
  }, [])

  useEffect(() => {
    if (!isExternalUpdate.current) {
      localStorage.setItem('tasks', JSON.stringify(tasks))
      channelRef.current?.postMessage({ type: 'tasks-update', tasks })
    }
    isExternalUpdate.current = false
  }, [tasks])

  useEffect(() => {
    localStorage.setItem('failureStats', JSON.stringify(stats))
  }, [stats])

  // ── Multi-tab sync ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!('BroadcastChannel' in window)) return
    channelRef.current = new BroadcastChannel('qtodo-tasks-v1')
    channelRef.current.onmessage = (e) => {
      if (e.data?.type === 'tasks-update') {
        // Another tab updated tasks. We accept the update without question,
        // because distributed consensus is hard and we have a deadline.
        isExternalUpdate.current = true
        setTasks(e.data.tasks)
      }
    }
    return () => channelRef.current?.close()
  }, [])

  // ── Date rollover (shame accumulates daily) ──────────────────────────────

  useEffect(() => {
    setStats((prev) => processDateRollover(prev))
    const id = setInterval(() => setStats((prev) => processDateRollover(prev)), 60_000)
    return () => clearInterval(id)
  }, [])

  // ── Quantum shuffle (once per day; the universe decides your priorities) ──

  useEffect(() => {
    const lastShuffle = Number(localStorage.getItem('lastShuffle'))
    const now = Date.now()
    if (tasks.length > 1 && (Number.isNaN(lastShuffle) || now - lastShuffle > 86_400_000)) {
      fetchQuantumRandom(tasks.length)
        .then((numbers) => {
          // Defensive slice: if the RNG returns more numbers than we have tasks
          // (which a naive mock absolutely will) we don't want undefined elements
          // gatecrashing the array and crashing the renderer. Trench warfare against tests.
          const shuffled = numbers
            .slice(0, tasks.length)
            .map((n, i) => ({ n, task: tasks[i] }))
            .sort((a, b) => a.n - b.n)
            .map(({ task }) => task)
          setTasks(shuffled)
          localStorage.setItem('lastShuffle', String(now))
        })
        .catch((err) => console.error('Quantum fetch failed', err))
    }
  }, [tasks])

  // ── Task expiry detection ─────────────────────────────────────────────────

  useEffect(() => {
    const now = Date.now()
    tasks.forEach((t, i) => {
      if (t.status !== 'expired' && t.expired_at && now > t.expired_at) {
        const canonical = canonicalizeTask(t)
        sha256Hex(canonical).then((hash) => {
          setTasks((prev) => {
            const copy = [...prev]
            if (!copy[i]) return copy
            copy[i] = {
              ...copy[i],
              status: 'expired',
              otsMeta: { ...copy[i].otsMeta, hash, ref: hash.slice(0, 8) },
            }
            return copy
          })
          setStats((prev) => recordEvent(prev, 'expired'))
        })
      }
    })
  }, [tasks])

  // ── Browser notifications for expiring tasks ─────────────────────────────

  useEffect(() => {
    if (!notificationsEnabled) return
    const WARN_WINDOW_MS = 30 * 60 * 1000 // 30 minutes
    tasks.forEach((task) => {
      if (task.status === 'expired' || task.completed || !task.expired_at) return
      const timeLeft = task.expired_at - Date.now()
      if (timeLeft > 0 && timeLeft < WARN_WINDOW_MS) {
        // Fire a notification and immediately feel guilty about how fancy that is for a todo app.
        new Notification('⏰ Task Expiring Soon', {
          body: `"${task.title.slice(0, 60)}" expires in ${Math.round(timeLeft / 60_000)} minutes.`,
          icon: '/vite.svg',
          tag: `task-expiry-${task.created_at}`,
        })
      }
    })
  }, [tasks, notificationsEnabled])

  // ── Punishment mode: toggle Comic Sans hell ──────────────────────────────

  useEffect(() => {
    document.body.classList.toggle('punishment-mode', punishmentMode)
    return () => document.body.classList.remove('punishment-mode')
  }, [punishmentMode])

  // ── WebSocket — connects to the backend's ws endpoint.
  //    The endpoint does nothing. The connection is ceremonial.
  //    It exists so the architecture diagram has an arrow going somewhere dramatic.

  useEffect(() => {
    let ws
    try {
      ws = new WebSocket('ws://localhost:8000/ws')
      ws.onopen = () => setWsStatus('connected (to nothing)')
      ws.onmessage = (e) => {
        console.info('[ws] server says:', e.data, '(logged and ignored)')
      }
      ws.onerror = () => setWsStatus('disconnected')
      ws.onclose = () => setWsStatus('disconnected')
    } catch {
      setWsStatus('disconnected')
    }
    return () => ws?.close()
  }, [])

  // ── PWA service worker registration ──────────────────────────────────────

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => console.info('Service worker registered. This is now technically an app.'))
        .catch((err) => console.warn('Service worker failed. We remain merely a website.', err))
    }
  }, [])

  // ── OTS operations ────────────────────────────────────────────────────────

  const createProof = async (index) => {
    const task = tasks[index]
    if (!task.otsMeta?.hash) return
    try {
      const res = await fetch('http://localhost:8000/ots/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash: task.otsMeta.hash }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setTasks((prev) => {
        const copy = [...prev]
        copy[index] = { ...copy[index], otsMeta: { ...copy[index].otsMeta, proof: data.proof, status: 'created' } }
        return copy
      })
    } catch (err) {
      console.error('createProof failed', err)
    }
  }

  const verifyProof = async (index) => {
    const task = tasks[index]
    if (!task.otsMeta?.proof) return
    try {
      const res = await fetch('http://localhost:8000/ots/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash: task.otsMeta.hash, proof: task.otsMeta.proof }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setTasks((prev) => {
        const copy = [...prev]
        copy[index] = {
          ...copy[index],
          otsMeta: { ...copy[index].otsMeta, status: data.verified ? 'verified' : 'invalid' },
        }
        return copy
      })
    } catch (err) {
      console.error('verifyProof failed', err)
    }
  }

  const upgradeProof = async (index) => {
    const task = tasks[index]
    if (!task.otsMeta?.proof) return
    try {
      const res = await fetch('http://localhost:8000/ots/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proof: task.otsMeta.proof }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setTasks((prev) => {
        const copy = [...prev]
        copy[index] = { ...copy[index], otsMeta: { ...copy[index].otsMeta, proof: data.proof, status: 'upgraded' } }
        return copy
      })
    } catch (err) {
      console.error('upgradeProof failed', err)
    }
  }

  const anchorOnChain = async (index) => {
    const task = tasks[index]
    if (!task.otsMeta?.hash || !task.otsMeta?.ref) return
    try {
      // Merge per-user EVM credentials from localStorage (if set) with the request.
      // The backend falls back to its own env vars for any cred not provided here,
      // so a user with no configured creds can still use server defaults if available.
      const evmCreds = getEvmCreds()
      const credPayload = {}
      if (evmCreds.rpc_url) credPayload.rpc_url = evmCreds.rpc_url
      if (evmCreds.private_key) credPayload.private_key = evmCreds.private_key
      if (evmCreds.contract_address) credPayload.contract_address = evmCreds.contract_address
      if (evmCreds.chain) credPayload.chain = evmCreds.chain
      if (evmCreds.explorer) credPayload.explorer = evmCreds.explorer
      if (evmCreds.mode) credPayload.mode = evmCreds.mode

      const res = await fetch('http://localhost:8000/evm/anchor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash: task.otsMeta.hash, ref: task.otsMeta.ref, ...credPayload }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setTasks((prev) => {
        const copy = [...prev]
        copy[index] = {
          ...copy[index],
          otsMeta: { ...copy[index].otsMeta, chain: data.chain, contract: data.contract, tx: data.tx, explorer: data.explorer, lastVerification: 'pending' },
        }
        return copy
      })
      const vRes = await fetch('http://localhost:8000/evm/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash: task.otsMeta.hash }),
      })
      if (!vRes.ok) throw new Error(`HTTP ${vRes.status}`)
      const vData = await vRes.json()
      setTasks((prev) => {
        const copy = [...prev]
        copy[index] = {
          ...copy[index],
          otsMeta: { ...copy[index].otsMeta, lastVerification: vData.found ? 'recorded' : 'missing' },
        }
        return copy
      })
    } catch (err) {
      console.error('anchorOnChain failed', err)
    }
  }

  // ── Self-destruct: dramatic, slow, anticlimactic ──────────────────────────

  const selfDestruct = async () => {
    setSelfDestructing(true)
    setFinalMessage('')
    for (let i = 7; i >= 0; i--) {
      setCountdown(i)
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 1000))
    }
    const ids = tasks.filter((t) => t.status !== 'expired').map((t) => t.created_at)
    for (const id of ids) {
      let more = true
      while (more) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 200))
        setTasks((prev) => {
          const updated = []
          more = false
          for (const t of prev) {
            if (t.created_at === id) {
              const newTitle = t.title.slice(0, -1)
              const newNote = t.note.slice(0, -1)
              if (newTitle.length > 0 || newNote.length > 0) {
                updated.push({ ...t, title: newTitle, note: newNote })
                more = true
              }
            } else {
              updated.push(t)
            }
          }
          return updated
        })
      }
    }
    setCountdown(null)
    setFinalMessage('anticlimax achieved. Nothing exploded.')
    // Mild confetti to mourn the deleted tasks. Irony intended.
    confetti({ particleCount: 30, spread: 90, origin: { y: 0.5 }, colors: ['#ff0000', '#880000', '#440000'] })
  }

  // ── Task CRUD ─────────────────────────────────────────────────────────────

  const addTask = async () => {
    const text = taskText.trim()
    const expires = Date.parse(expiryDate)
    if (!text || !expiryDate) {
      // Silently failing was a design decision from the previous author.
      // We've replaced it with an alert, which is arguably worse but at least audible.
      alert('Please enter a task and a deadline.\n\nYes, you need a deadline. That is the law.')
      return
    }
    const haiku = await generateHaiku(text)
    setTasks([
      ...tasks,
      {
        title: haiku,
        note: '',
        tag: selectedTag,
        created_at: Date.now(),
        expired_at: expires,
        completed: false,
        status: 'active',
        user_id: 1,
        version: 1,
        otsMeta: {},
      },
    ])
    setTaskText('')
    setExpiryDate('')
  }

  const toggleTask = (index) => {
    const task = tasks[index]
    const nowCompleted = !task.completed
    setTasks(tasks.map((t, i) => (i === index ? { ...t, completed: nowCompleted } : t)))
    if (nowCompleted) {
      setStats((prev) => recordEvent(prev, 'completed'))
      // Confetti for completing a task, because the dopamine has to come from somewhere.
      // The irony of celebrating completing a haiku about groceries with 200 coloured pixels
      // is entirely intentional. Welcome to gamified productivity.
      confetti({
        particleCount: 120,
        spread: 75,
        origin: { y: 0.65 },
        colors: ['#00ff41', '#00ff88', '#44ffaa', '#00aa33', '#66ffcc'],
      })
    }
  }

  const deleteTask = (index) => {
    const task = tasks[index]
    if (task.expired_at && Date.now() > task.expired_at) return
    if (!task.completed && task.status !== 'expired') {
      setStats((prev) => recordEvent(prev, 'deleted'))
    }
    setTasks(tasks.filter((_, i) => i !== index))
  }

  // ── Drag to reorder ───────────────────────────────────────────────────────

  const onDragStart = useCallback((index) => {
    dragIndexRef.current = index
    setDragIndex(index)
  }, [])
  const onDragOver = useCallback((e, index) => { e.preventDefault(); setDragOver(index) }, [])
  const onDrop = useCallback((index) => {
    const di = dragIndexRef.current
    if (di === null || di === index) {
      dragIndexRef.current = null; setDragIndex(null); setDragOver(null); return
    }
    setTasks((prev) => {
      const reordered = [...prev]
      const [dragged] = reordered.splice(di, 1)
      reordered.splice(index, 0, dragged)
      return reordered
    })
    dragIndexRef.current = null
    setDragIndex(null)
    setDragOver(null)
  }, [])
  const onDragEnd = useCallback(() => { dragIndexRef.current = null; setDragIndex(null); setDragOver(null) }, [])

  // ── Voice input ───────────────────────────────────────────────────────────

  const startVoiceInput = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      alert(
        'Your browser doesn\'t support voice input.\n\n' +
        'In 2024 this is genuinely embarrassing for everyone involved.\n' +
        'Please use Chrome, or just type like it\'s 2010.',
      )
      return
    }
    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (e) => setTaskText(e.results[0][0].transcript)
    recognition.onerror = () => alert('Voice recognition failed. The machine did not understand you. This is probably fine.')
    recognition.onend = () => setListening(false)
    recognition.start()
    setListening(true)
  }

  // ── Vibe check ────────────────────────────────────────────────────────────

  const vibeCheck = async () => {
    setVibeLoading(true)
    setVibe(null)
    const result = await fetchVibe(tasks)
    setVibe(result)
    setVibeLoading(false)
  }

  // ── Notifications permission ──────────────────────────────────────────────

  const enableNotifications = async () => {
    if (!('Notification' in window)) {
      alert('Notifications not supported. The browser is protecting you from yourself.')
      return
    }
    const permission = await Notification.requestPermission()
    setNotificationsEnabled(permission === 'granted')
    if (permission !== 'granted') {
      alert('Notification permission denied. You\'ve rejected accountability on multiple levels now.')
    }
  }

  // ── Export & reset ────────────────────────────────────────────────────────

  const exportCsv = () => {
    const csv = historyToCsv(stats.history)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'failure_stats.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetStats = () => setStats(processDateRollover(createDefaultStats()))

  const handleKeyDown = (e) => { if (e.key === 'Enter') addTask() }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="text-center min-h-screen pb-12">

      {/* ── Settings modal ── */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* ── Top nav ── */}
      <div className="flex justify-end items-center space-x-2 p-2 flex-wrap gap-1">
        <button onClick={() => setView('tasks')} className="border px-2 py-1 text-xs">Tasks</button>
        <button onClick={() => setView('failure')} className="border px-2 py-1 text-xs">Failure</button>
        <span className="border px-2 py-1 text-xs">Shame {stats.shame_points}</span>
        <button
          onClick={vibeCheck}
          disabled={vibeLoading}
          title="Ask AI to roast your task list"
          className="border border-purple-400 px-2 py-1 text-xs text-purple-400"
        >
          {vibeLoading ? 'vibing…' : '✨ Vibe Check™'}
        </button>
        <button
          onClick={enableNotifications}
          title="Enable browser notifications for expiring tasks"
          className={`border px-2 py-1 text-xs ${notificationsEnabled ? 'border-green-400' : 'border-yellow-600 text-yellow-500'}`}
        >
          {notificationsEnabled ? '🔔 On' : '🔕 Notify'}
        </button>
        <button
          onClick={() => setPunishmentMode((p) => !p)}
          title="Toggle Punishment Mode (Light Theme + Comic Sans)"
          className="border border-red-400 px-2 py-1 text-xs text-red-400"
        >
          {punishmentMode ? '🌙 Dark' : '☀ Punish'}
        </button>
        <button
          onClick={() => setShowSettings(true)}
          title="Configure API keys and blockchain credentials"
          className="border border-green-900 text-green-700 px-2 py-1 text-xs"
        >
          ⚙ Settings
        </button>
        <span
          title={`WebSocket status: ${wsStatus}`}
          className={`border px-2 py-1 text-xs ${wsStatus.startsWith('connected') ? 'border-green-500 text-green-500' : 'border-gray-700 text-gray-600'}`}
        >
          ws: {wsStatus.startsWith('connected') ? '●' : '○'}
        </span>
      </div>

      {/* ── Vibe oracle ── */}
      {vibe && (
        <div className="vibe-box text-sm text-purple-300 mx-auto">
          🔮 {vibe}
        </div>
      )}

      {view === 'failure' ? (
        <Failure stats={stats} resetStats={resetStats} exportCsv={exportCsv} />
      ) : (
        <>
          {/* ── 3D ASCII header ── */}
          <div className="scanlines mb-1 overflow-hidden" style={{ maxHeight: '150px' }}>
            <MatrixRain width={700} height={90} className="mx-auto block" />
            <div className="ascii-3d-wrapper -mt-20 relative z-10">
              <pre className="ascii-3d">
                {String.raw` ____  _____ ____   ___   ___   ___  ____  _____
|  _ \| ____|  _ \ / _ \ / _ \ / _ \|  _ \| ____|
| | | |  _| | |_) | | | | | | | | | | | | |  _|
| |_| | |___|  __/| |_| | |_| | |_| | |_| | |___|
|____/|_____|_|    \___/ \___/ \___/|____/|_____|`}
              </pre>
            </div>
          </div>
          <div className="blink h-6 mb-4" />

          {/* ── Tag picker ── */}
          <div className="flex justify-center gap-1 mb-3 flex-wrap">
            {TAGS.map(({ emoji, label }) => (
              <button
                key={emoji}
                onClick={() => setSelectedTag(emoji)}
                title={label}
                className={`border px-2 py-0.5 text-sm ${selectedTag === emoji ? 'border-green-400 bg-green-900' : 'border-gray-700'}`}
              >
                {emoji}
              </button>
            ))}
            <span className="text-xs text-gray-600 self-center ml-1">tag</span>
          </div>

          {/* ── Task input ── */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <input
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-black border border-green-500 px-2 py-1 text-sm"
              placeholder="New task"
              style={{ minWidth: '200px' }}
            />
            <input
              type="datetime-local"
              aria-label="expiry"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="bg-black border border-green-500 px-2 py-1 text-sm"
            />
            <button
              onClick={addTask}
              className="border border-green-500 px-2 py-1 text-sm"
            >
              Add
            </button>
            <button
              onClick={startVoiceInput}
              title="Dictate your task. The machine will try to understand you."
              className={`border px-2 py-1 text-sm ${listening ? 'mic-listening' : 'border-green-700 text-green-700'}`}
              aria-label="voice input"
            >
              🎙 {listening ? 'listening…' : 'Voice'}
            </button>
            <button
              onClick={selfDestruct}
              className="border border-red-500 px-2 py-1 text-sm text-red-400"
            >
              ☢ Self Destruct
            </button>
          </div>

          {/* ── Task list ── */}
          <ul className="space-y-1 max-w-2xl mx-auto px-2">
            {tasks.length === 0 && (
              <li className="text-gray-600 text-sm italic py-4">
                No tasks. Either you're done or you've given up. Only you know which.
              </li>
            )}
            {tasks.map((task, index) => {
              const isExpired = task.status === 'expired'
              const score = aiPriorityScore(task)
              const scoreClass = priorityClass(score)
              return (
                <li
                  key={task.created_at}
                  draggable={!isExpired}
                  onDragStart={() => onDragStart(index)}
                  onDragOver={(e) => onDragOver(e, index)}
                  onDrop={() => onDrop(index)}
                  onDragEnd={onDragEnd}
                  className={[
                    'flex items-center justify-center gap-1 flex-wrap text-sm py-1 cursor-grab',
                    dragIndex === index ? 'task-drag-active' : '',
                    dragOver === index && dragIndex !== index ? 'task-drop-target' : '',
                  ].join(' ')}
                >
                  {/* Drag handle */}
                  <span className="text-gray-700 select-none cursor-grab" title="Drag to reorder">⠿</span>

                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(index)}
                  />

                  {/* Tag */}
                  {task.tag && <span title={task.tag}>{task.tag}</span>}

                  {/* Title */}
                  <span className={task.completed ? 'line-through text-gray-600' : ''}>{task.title}</span>

                  {/* AI Priority Score™ — fake but colour-coded, so it feels real */}
                  {!isExpired && !task.completed && (
                    <span
                      className={`text-xs ${scoreClass} ml-1`}
                      title={`AI Priority Score™: ${score}/99 (computed using quantum-informed heuristics)`}
                    >
                      [{score}]
                    </span>
                  )}

                  <button
                    onClick={() => deleteTask(index)}
                    className="border border-red-800 px-1 text-red-700 text-xs"
                    disabled={isExpired}
                  >
                    del
                  </button>

                  {/* Expired task: OTS controls */}
                  {isExpired && (
                    <div className="flex flex-wrap gap-1 ml-1 text-xs">
                      <span className="border px-1 text-gray-500">{task.otsMeta?.hash?.slice(0, 8) || ''}</span>
                      <button onClick={() => createProof(index)} className="border px-1">ots:create</button>
                      <button onClick={() => verifyProof(index)} className="border px-1">ots:verify</button>
                      <button onClick={() => upgradeProof(index)} className="border px-1">ots:upgrade</button>
                      <button onClick={() => anchorOnChain(index)} className="border px-1">⛓ anchor</button>
                      {task.otsMeta?.explorer && (
                        <a href={task.otsMeta.explorer} target="_blank" rel="noopener noreferrer" className="underline">
                          tx↗
                        </a>
                      )}
                      {task.otsMeta?.lastVerification && <span className="text-yellow-600">{task.otsMeta.lastVerification}</span>}
                      {task.otsMeta?.status && <span className="text-green-600">{task.otsMeta.status}</span>}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>

          {/* ── Architecture footnote ── */}
          <p className="text-gray-800 text-xs mt-8 italic">
            ws:{wsStatus} · tasks persisted in localStorage · synced via BroadcastChannel · shuffled by {' '}
            <span title="or crypto.getRandomValues() if ANU is having a day">quantum RNG</span> · scored by{' '}
            <span title="sin(created_at / 1000003) × urgency × complexity">AI™</span>
          </p>
        </>
      )}

      {/* ── Self-destruct overlay ── */}
      {selfDestructing && view === 'tasks' && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-95 z-50 text-green-500">
          <pre className="mb-4 text-xs">
            {String.raw`  ___  _   _ ___ ___ _   _  __  __ _
 / __|/ \ | | _ \_ _| | | |/ / / _| | |
| (_ | () | |  _/| || |_| |\ \|  _| |_| |
 \___|\__/|_|_| |___|\___/|_|\_\_|  \___/
             arming...`}
          </pre>
          {countdown !== null && <div className="text-6xl font-bold mb-4">{countdown}</div>}
          {finalMessage && <div className="text-sm">{finalMessage}</div>}
        </div>
      )}
    </div>
  )
}

export default App
