import { useState, useEffect } from 'react'
import { canonicalizeTask, sha256Hex } from './utils/ots'
import Failure from './Failure'
import {
  createDefaultStats,
  recordEvent,
  processDateRollover,
  historyToCsv,
} from './utils/failure'

// Because using a normal pseudo-RNG just isn't pretentious enough.
const fetchQuantumRandom = async (length) => {
  // Make a totally reasonable network request to a quantum number generator
  // because using Math.random() would obviously destroy the fabric of reality.
  const res = await fetch(
    `https://qrng.anu.edu.au/API/jsonI.php?length=${length}&type=uint8`,
  )
  // Parse the response, pretending we're not terrified of what the universe chose.
  const data = await res.json()
  // Return the array of numbers that will determine our fate for the day.
  return data.data
}

// Beg the AI for a haiku; if we can't afford the API key, just echo back the task.
const generateHaiku = async (task) => {
  // Grab the OpenAI key from the environment, or give up immediately if we live in poverty.
  const key = import.meta.env.VITE_OPENAI_API_KEY
  if (!key) return task
  try {
    // Politely ask a hyper-advanced language model to turn our grocery list into poetry.
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Turn tasks into ambiguous haiku.' },
          { role: 'user', content: `Task: ${task}` },
        ],
      }),
    })
    // Read whatever cryptic message the model deigned to return.
    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content
    // If the model produced nothing, fall back to the boring original text.
    return content?.trim() || task
  } catch (err) {
    // When the request fails, we document it with a console.error to keep log parsers busy.
    console.error('OpenAI request failed', err)
    return task
  }
}

function App() {
  const [taskText, setTaskText] = useState('')
  const [tasks, setTasks] = useState([])
  const [expiryDate, setExpiryDate] = useState('')
  const [selfDestructing, setSelfDestructing] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const [finalMessage, setFinalMessage] = useState('')
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('failureStats')
    return saved ? JSON.parse(saved) : createDefaultStats()
  })
  const [view, setView] = useState('tasks')

  useEffect(() => {
    const saved = localStorage.getItem('tasks')
    if (saved) {
      setTasks(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    setStats((prev) => processDateRollover(prev))
    const id = setInterval(() => {
      setStats((prev) => processDateRollover(prev))
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    localStorage.setItem('failureStats', JSON.stringify(stats))
  }, [stats])

  useEffect(() => {
    const lastShuffle = Number(localStorage.getItem('lastShuffle'))
    const now = Date.now()
    if (
      tasks.length > 1 &&
      (Number.isNaN(lastShuffle) || now - lastShuffle > 86_400_000)
    ) {
      fetchQuantumRandom(tasks.length)
        .then((numbers) => {
          const shuffled = numbers
            .map((n, i) => ({ n, task: tasks[i] }))
            .sort((a, b) => a.n - b.n)
            .map(({ task }) => task)
          setTasks(shuffled)
          localStorage.setItem('lastShuffle', String(now))
        })
        .catch((err) => console.error('Quantum fetch failed', err))
    }
  }, [tasks])

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

  const createProof = async (index) => {
    const task = tasks[index]
    if (!task.otsMeta?.hash) return
    const res = await fetch('http://localhost:8000/ots/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash: task.otsMeta.hash }),
    })
    const data = await res.json()
    setTasks((prev) => {
      const copy = [...prev]
      copy[index] = {
        ...copy[index],
        otsMeta: { ...copy[index].otsMeta, proof: data.proof, status: 'created' },
      }
      return copy
    })
  }

  const verifyProof = async (index) => {
    const task = tasks[index]
    if (!task.otsMeta?.proof) return
    const res = await fetch('http://localhost:8000/ots/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash: task.otsMeta.hash, proof: task.otsMeta.proof }),
    })
    const data = await res.json()
    setTasks((prev) => {
      const copy = [...prev]
      copy[index] = {
        ...copy[index],
        otsMeta: {
          ...copy[index].otsMeta,
          status: data.verified ? 'verified' : 'invalid',
        },
      }
      return copy
    })
  }

  const upgradeProof = async (index) => {
    const task = tasks[index]
    if (!task.otsMeta?.proof) return
    const res = await fetch('http://localhost:8000/ots/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proof: task.otsMeta.proof }),
    })
    const data = await res.json()
    setTasks((prev) => {
      const copy = [...prev]
      copy[index] = {
        ...copy[index],
        otsMeta: { ...copy[index].otsMeta, proof: data.proof, status: 'upgraded' },
      }
      return copy
    })
  }

  // Politely ask the chain to remember our hash.
  const anchorOnChain = async (index) => {
    const task = tasks[index]
    if (!task.otsMeta?.hash || !task.otsMeta?.ref) return
    const res = await fetch('http://localhost:8000/evm/anchor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash: task.otsMeta.hash, ref: task.otsMeta.ref }),
    })
    const data = await res.json()
    setTasks((prev) => {
      const copy = [...prev]
      copy[index] = {
        ...copy[index],
        otsMeta: {
          ...copy[index].otsMeta,
          chain: data.chain,
          contract: data.contract,
          tx: data.tx,
          explorer: data.explorer,
          lastVerification: 'pending',
        },
      }
      return copy
    })
    const vRes = await fetch('http://localhost:8000/evm/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash: task.otsMeta.hash }),
    })
    const vData = await vRes.json()
    setTasks((prev) => {
      const copy = [...prev]
      copy[index] = {
        ...copy[index],
        otsMeta: {
          ...copy[index].otsMeta,
          lastVerification: vData.found ? 'recorded' : 'missing',
        },
      }
      return copy
    })
  }

  const selfDestruct = async () => {
    setSelfDestructing(true)
    setFinalMessage('')
    for (let i = 7; i >= 0; i--) {
      setCountdown(i)
      // one second per tick to build suspense
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 1000))
    }
    const ids = tasks
      .filter((t) => t.status !== 'expired')
      .map((t) => t.created_at)
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
  }

  const addTask = async () => {
    const text = taskText.trim()
    const expires = Date.parse(expiryDate)
    if (text && expiryDate) {
      const haiku = await generateHaiku(text)
      setTasks([
        ...tasks,
        {
          title: haiku,
          note: '',
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
  }

  const toggleTask = (index) => {
    const task = tasks[index]
    const nowCompleted = !task.completed
    setTasks(
      tasks.map((t, i) => (i === index ? { ...t, completed: nowCompleted } : t)),
    )
    if (nowCompleted) {
      setStats((prev) => recordEvent(prev, 'completed'))
    }
  }

  const deleteTask = (index) => {
    const task = tasks[index]
    if (task.expired_at && Date.now() > task.expired_at) {
      return
    }
    if (!task.completed && task.status !== 'expired') {
      setStats((prev) => recordEvent(prev, 'deleted'))
    }
    setTasks(tasks.filter((_, i) => i !== index))
  }

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

  const resetStats = () => {
    setStats(processDateRollover(createDefaultStats()))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      addTask()
    }
  }

  return (
    <div className="text-center">
      <div className="flex justify-end space-x-2 p-2">
        <button onClick={() => setView('tasks')} className="border px-2 py-1">
          Tasks
        </button>
        <button onClick={() => setView('failure')} className="border px-2 py-1">
          Failure
        </button>
        <span className="border px-2 py-1">Shame {stats.shame_points}</span>
      </div>
      {view === 'failure' ? (
        <Failure stats={stats} resetStats={resetStats} exportCsv={exportCsv} />
      ) : (
        <>
          <pre className="whitespace-pre leading-none">
            {String.raw` ____  _____ ____   ___   ___   ___  ____  _____
|  _ \| ____|  _ \ / _ \ / _ \ / _ \|  _ \| ____|
| | | |  _| | |_) | | | | | | | | | | | | |  _|
| |_| | |___|  __/| |_| | |_| | |_| | |_| | |___
|____/|_____|_|    \___/ \___/ \___/|____/|_____|`}
          </pre>
          <div className="blink h-6 mb-6"></div>

          <div className="space-x-2 mb-4">
            <input
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-black border border-green-500 px-2 py-1"
              placeholder="New task"
            />
            <input
              type="datetime-local"
              aria-label="expiry"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="bg-black border border-green-500 px-2 py-1"
            />
            <button
              onClick={addTask}
              className="border border-green-500 px-2 py-1"
            >
              Add
            </button>
            <button
              onClick={selfDestruct}
              className="border border-red-500 px-2 py-1"
            >
              Self Destruct
            </button>
          </div>

          <ul className="space-y-2">
            {tasks.map((task, index) => {
              const isExpired = task.status === 'expired'
              return (
                <li key={index} className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(index)}
                    className="mr-2"
                  />
                  <span className={task.completed ? 'line-through' : ''}>{task.title}</span>
                  <button
                    onClick={() => deleteTask(index)}
                    className="border border-red-500 px-1 ml-2"
                    disabled={isExpired}
                  >
                    Delete
                  </button>
                  {isExpired && (
                    <div className="flex space-x-1 ml-2 text-xs">
                      <span className="border px-1">
                        {task.otsMeta?.hash?.slice(0, 8) || ''}
                      </span>
                      <button
                        onClick={() => createProof(index)}
                        className="border px-1"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => verifyProof(index)}
                        className="border px-1"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => upgradeProof(index)}
                        className="border px-1"
                      >
                        Upgrade
                      </button>
                      <button
                        onClick={() => anchorOnChain(index)}
                        className="border px-1"
                      >
                        Anchor
                      </button>
                      {task.otsMeta?.explorer && (
                        <a
                          href={task.otsMeta.explorer}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          tx
                        </a>
                      )}
                      {task.otsMeta?.lastVerification && (
                        <span>{task.otsMeta.lastVerification}</span>
                      )}
                      {task.otsMeta?.status && <span>{task.otsMeta.status}</span>}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}
      {selfDestructing && view === 'tasks' && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-90 z-50 text-green-500">
          <pre className="mb-4">{String.raw`  ___  _   _ ___ ___ _   _  __  __ _
 / __|/ \ | | _ \_ _| | | |/ / / _| | |
| (_ | () | |  _/| || |_| |\ \|  _| |_| |
 \___|\__/|_|_| |___|\___/|_|\_\_|  \___/
             arming...`}</pre>
          {countdown !== null && <div className="text-4xl mb-4">{countdown}</div>}
          {finalMessage && <div>{finalMessage}</div>}
        </div>
      )}
    </div>
  )
}

export default App;
