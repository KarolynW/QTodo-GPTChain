import { useState, useEffect } from 'react'

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

  const addTask = async () => {
    const text = taskText.trim()
    if (text) {
      const haiku = await generateHaiku(text)
      setTasks([...tasks, { text: haiku, completed: false }])
      setTaskText('')
    }
  }

  const toggleTask = (index) => {
    setTasks(
      tasks.map((t, i) =>
        i === index ? { ...t, completed: !t.completed } : t,
      ),
    )
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
        <button
          onClick={addTask}
          className="border border-green-500 px-2 py-1"
        >
          Add
        </button>
      </div>

      <ul className="space-y-2">
        {tasks.map((task, index) => (
          <li key={index} className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(index)}
              className="mr-2"
            />
            <span className={task.completed ? 'line-through' : ''}>{task.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App;
