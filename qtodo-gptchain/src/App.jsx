import { useState, useEffect } from 'react'
import { canonicalizeTask, sha256Hex } from './utils/ots'

const fetchQuantumRandom = async (length) => {
  const res = await fetch(
    `https://qrng.anu.edu.au/API/jsonI.php?length=${length}&type=uint8`,
  )
  const data = await res.json()
  return data.data
}

const generateHaiku = async (task) => {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Turn tasks into ambiguous haiku.' },
          { role: 'user', content: `Task: ${task}` },
        ],
      }),
    })
    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content
    return content?.trim() || task
  } catch (err) {
    console.error('OpenAI request failed', err)
    return task
  }
}

function App() {
  const [taskText, setTaskText] = useState('')
  const [tasks, setTasks] = useState([])
  const [expiryDate, setExpiryDate] = useState('')

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
            copy[i] = {
              ...copy[i],
              status: 'expired',
              otsMeta: { ...copy[i].otsMeta, hash, ref: hash.slice(0, 8) },
            }
            return copy
          })
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
    setTasks(
      tasks.map((t, i) =>
        i === index ? { ...t, completed: !t.completed } : t,
      ),
    )
  }

  const deleteTask = (index) => {
    const task = tasks[index]
    if (task.expired_at && Date.now() > task.expired_at) {
      return
    }
    setTasks(tasks.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      addTask()
    }
  }

  return (
    <div className="text-center">
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
    </div>
  )
}

export default App;
