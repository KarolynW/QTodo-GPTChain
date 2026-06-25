import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react'
import App from './App'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// We mock canvas-confetti so the tests don't need an actual canvas context.
// The celebration is fake. Like most celebrations.
vi.mock('canvas-confetti', () => ({ default: vi.fn() }))

// BroadcastChannel: the browser has one; jsdom does not. We bridge the gap
// with the world's simplest stub. It does what it says and nothing else.
class FakeBroadcastChannel {
  constructor() { this.onmessage = null }
  postMessage() {}
  close() {}
}
if (!globalThis.BroadcastChannel) {
  globalThis.BroadcastChannel = FakeBroadcastChannel
}

// WebSocket: stubbed so the ws:// connection attempt doesn't throw in jsdom.
class FakeWebSocket {
  constructor() {
    this.onopen = null; this.onmessage = null; this.onerror = null; this.onclose = null
    setTimeout(() => this.onerror?.(), 0)
  }
  close() {}
}
if (!globalThis.WebSocket) globalThis.WebSocket = FakeWebSocket

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

afterEach(() => {
  cleanup()
})

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeTask = (overrides = {}) => ({
  title: 'test task',
  note: '',
  tag: '🔥',
  created_at: Date.now(),
  expired_at: Date.now() + 86_400_000,
  completed: false,
  status: 'active',
  user_id: 1,
  version: 1,
  otsMeta: {},
  ...overrides,
})

const seedTasks = (tasks) => localStorage.setItem('tasks', JSON.stringify(tasks))

const mockQuantumFetch = () =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: [0, 1, 2] }),
  })


// ── Existing core behaviour ───────────────────────────────────────────────────

describe('App — core behaviour', () => {
  it('loads tasks from localStorage', () => {
    seedTasks([makeTask({ title: 'existing task' })])
    render(<App />)
    expect(screen.getByText('existing task')).toBeInTheDocument()
  })

  it('shows empty-state message when there are no tasks', () => {
    render(<App />)
    expect(screen.getByText(/no tasks/i)).toBeInTheDocument()
  })

  it('adds a task when text and expiry are provided', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: 'task haiku' } }] }),
    })
    render(<App />)
    fireEvent.change(screen.getByPlaceholderText(/new task/i), { target: { value: 'buy coffee' } })
    fireEvent.change(screen.getByLabelText('expiry'), {
      target: { value: new Date(Date.now() + 86_400_000).toISOString().slice(0, 16) },
    })
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    await waitFor(() => expect(JSON.parse(localStorage.getItem('tasks')).length).toBe(1))
  })

  it('alerts when task text is missing', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})
    render(<App />)
    fireEvent.change(screen.getByLabelText('expiry'), {
      target: { value: new Date(Date.now() + 86_400_000).toISOString().slice(0, 16) },
    })
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    expect(alertMock).toHaveBeenCalledOnce()
    expect(alertMock.mock.calls[0][0]).toMatch(/deadline/i)
  })

  it('alerts when expiry date is missing', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})
    render(<App />)
    fireEvent.change(screen.getByPlaceholderText(/new task/i), { target: { value: 'something' } })
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    expect(alertMock).toHaveBeenCalledOnce()
  })

  it('adds task via Enter key', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    })
    render(<App />)
    const input = screen.getByPlaceholderText(/new task/i)
    fireEvent.change(input, { target: { value: 'keyboard task' } })
    fireEvent.change(screen.getByLabelText('expiry'), {
      target: { value: new Date(Date.now() + 86_400_000).toISOString().slice(0, 16) },
    })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(JSON.parse(localStorage.getItem('tasks')).length).toBe(1))
  })

  it('toggles task completion', () => {
    seedTasks([makeTask({ title: 'finish report' })])
    render(<App />)
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    expect(screen.getByText('finish report')).toHaveClass('line-through')
  })

  it('unchecking a completed task removes line-through', () => {
    seedTasks([makeTask({ title: 'done thing', completed: true })])
    render(<App />)
    expect(screen.getByText('done thing')).toHaveClass('line-through')
    fireEvent.click(screen.getByRole('checkbox'))
    expect(screen.getByText('done thing')).not.toHaveClass('line-through')
  })

  it('deletes an active task', () => {
    seedTasks([makeTask({ title: 'delete me' })])
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /del/i }))
    expect(screen.queryByText('delete me')).not.toBeInTheDocument()
  })

  it('cannot delete an expired task (button is disabled)', () => {
    seedTasks([makeTask({ status: 'expired', expired_at: Date.now() - 1000, otsMeta: { hash: 'abc' } })])
    render(<App />)
    expect(screen.getByRole('button', { name: /del/i })).toBeDisabled()
  })

  it('navigates to Failure view', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /failure/i }))
    // Failure view shows shame points heading
    expect(screen.getByText(/total expired/i)).toBeInTheDocument()
  })

  it('persists tasks to localStorage after add', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    })
    render(<App />)
    fireEvent.change(screen.getByPlaceholderText(/new task/i), { target: { value: 'persist me' } })
    fireEvent.change(screen.getByLabelText('expiry'), {
      target: { value: new Date(Date.now() + 86_400_000).toISOString().slice(0, 16) },
    })
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem('tasks'))
      expect(saved.length).toBe(1)
      expect(saved[0].title).toBe('persist me')
    })
  })

  it('records shame points when a task is deleted unfinished', () => {
    seedTasks([makeTask()])
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /del/i }))
    const saved = JSON.parse(localStorage.getItem('failureStats'))
    expect(saved.total_deleted_unfinished).toBe(1)
    expect(saved.shame_points).toBeGreaterThanOrEqual(2)
  })

  it('does NOT record shame when a completed task is deleted', () => {
    seedTasks([makeTask({ completed: true })])
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /del/i }))
    const saved = JSON.parse(localStorage.getItem('failureStats'))
    expect(saved.total_deleted_unfinished).toBe(0)
  })
})


// ── Self-destruct ─────────────────────────────────────────────────────────────

describe('App — self destruct', () => {
  it('spares expired tasks and erases active ones', async () => {
    mockQuantumFetch()
    seedTasks([
      makeTask({ title: 'old', status: 'expired', expired_at: Date.now() - 1000, otsMeta: { hash: 'deadbeef' } }),
      makeTask({ title: 'new', created_at: Date.now() + 1 }),
    ])
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /self destruct/i }))
    await screen.findByText(/anticlimax achieved/i, {}, { timeout: 15_000 })
    expect(screen.queryByText('new')).not.toBeInTheDocument()
    expect(screen.getByText('old')).toBeInTheDocument()
  }, 20_000)
})


// ── Quantum RNG fallback ──────────────────────────────────────────────────────

describe('App — quantum RNG fallback', () => {
  it('falls back to crypto.getRandomValues when fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ANU is down (relatable)'))
    const cryptoSpy = vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((buf) => {
      for (let i = 0; i < buf.length; i++) buf[i] = i * 17
      return buf
    })
    seedTasks([makeTask({ title: 'a' }), makeTask({ title: 'b', created_at: Date.now() + 1 })])
    render(<App />)
    await waitFor(() => expect(cryptoSpy).toHaveBeenCalled(), { timeout: 3000 })
  })
})


// ── Tags ─────────────────────────────────────────────────────────────────────

describe('App — task tags', () => {
  it('shows the tag emoji on a task', () => {
    seedTasks([makeTask({ title: 'tagged', tag: '💼' })])
    render(<App />)
    // '💼' appears in both the tag picker row AND on the task itself
    expect(screen.getAllByText('💼').length).toBeGreaterThanOrEqual(2)
  })

  it('renders tag picker buttons', () => {
    render(<App />)
    // There are 6 emoji tag buttons in the tag picker
    const tagButtons = ['🔥', '💼', '🏠', '🧠', '💀', '🌱']
    tagButtons.forEach((emoji) => {
      expect(screen.getAllByText(emoji).length).toBeGreaterThanOrEqual(1)
    })
  })
})


// ── Priority score display ────────────────────────────────────────────────────

describe('App — AI priority score', () => {
  it('displays a priority score bracket on active tasks', () => {
    seedTasks([makeTask({ title: 'very urgent thing', expired_at: Date.now() + 3600_000 })])
    render(<App />)
    // Score is shown as [N] where N is 1–99
    expect(screen.getByTitle(/AI Priority Score/)).toBeInTheDocument()
  })

  it('does not show priority score on completed tasks', () => {
    seedTasks([makeTask({ title: 'done already', completed: true })])
    render(<App />)
    expect(screen.queryByTitle(/AI Priority Score/)).not.toBeInTheDocument()
  })
})


// ── Vibe check button ─────────────────────────────────────────────────────────

describe('App — Vibe Check™', () => {
  it('renders the Vibe Check button', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /vibe check/i })).toBeInTheDocument()
  })

  it('shows a vibe response when no API key is set', async () => {
    // Need at least one active task so we get past the empty-list short-circuit
    // and hit the actual "no API key" branch. Empty list → different message.
    seedTasks([makeTask({ title: 'buy oat milk' })])
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /vibe check/i }))
    // Message now says "OpenAI key" + directs to ⚙ Settings instead of quoting the env var name
    await waitFor(() => expect(screen.getByText(/OpenAI key|Settings|unobservable/i)).toBeInTheDocument(), { timeout: 3000 })
  })

  it('shows empty-task vibe when task list is empty', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /vibe check/i }))
    await waitFor(() =>
      expect(screen.getByText(/empty|denial|accomplishment/i)).toBeInTheDocument(),
      { timeout: 3000 },
    )
  })
})


// ── Punishment Mode ───────────────────────────────────────────────────────────

describe('App — Punishment Mode', () => {
  it('toggles the punishment-mode class on document.body', () => {
    render(<App />)
    expect(document.body.classList.contains('punishment-mode')).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: /punish/i }))
    expect(document.body.classList.contains('punishment-mode')).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /dark/i }))
    expect(document.body.classList.contains('punishment-mode')).toBe(false)
  })
})


// ── Drag to reorder ───────────────────────────────────────────────────────────

describe('App — drag to reorder', () => {
  it('reorders tasks after drag and drop', async () => {
    seedTasks([
      makeTask({ title: 'first',  created_at: 1000 }),
      makeTask({ title: 'second', created_at: 2000 }),
    ])
    render(<App />)

    const items = screen.getAllByRole('listitem')
    fireEvent.dragStart(items[0])
    fireEvent.dragOver(items[1])
    fireEvent.drop(items[1])

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem('tasks'))
      // After dragging first → second, the order should be reversed
      expect(saved[0].title).toBe('second')
      expect(saved[1].title).toBe('first')
    })
  })
})


// ── Settings modal ────────────────────────────────────────────────────────────

describe('App — Settings modal', () => {
  it('renders a Settings button in the nav', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
  })

  it('opens the settings modal when the Settings button is clicked', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    // Modal heading is specific enough to assert on
    expect(screen.getByText('⚙ Settings / Credentials')).toBeInTheDocument()
    expect(screen.getByText(/Bring Your Own Key/i)).toBeInTheDocument()
  })

  it('closes the settings modal when the close button is clicked', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    expect(screen.getByText(/Bring Your Own Key/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByText(/Bring Your Own Key/i)).not.toBeInTheDocument()
  })

  it('saves an OpenAI key to localStorage', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    const keyInput = screen.getByPlaceholderText(/sk-/i)
    fireEvent.change(keyInput, { target: { value: 'sk-test-key-123' } })
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))
    expect(localStorage.getItem('qtodo_openai_key')).toBe('sk-test-key-123')
  })

  it('saves EVM contract address to localStorage', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    // Private key is type="password", contract address is type="text" — use that to tell them apart.
    // Both have placeholder "0x..." which is why we can't use getByPlaceholderText alone.
    const allHexInputs = screen.getAllByPlaceholderText('0x...')
    const contractInput = allHexInputs.find(el => el.type === 'text')
    fireEvent.change(contractInput, { target: { value: '0xdeadbeef' } })
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))
    expect(localStorage.getItem('qtodo_evm_contract')).toBe('0xdeadbeef')
  })
})
