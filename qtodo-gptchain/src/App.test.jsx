import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import App from './App'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('App', () => {
  it('loads tasks from localStorage', () => {
    const tasks = [
      {
        title: 'existing',
        note: '',
        created_at: Date.now(),
        expired_at: Date.now() + 1000,
        completed: false,
        status: 'active',
        user_id: 1,
        version: 1,
        otsMeta: {},
      },
    ]
    localStorage.setItem('tasks', JSON.stringify(tasks))
    render(<App />)
    expect(screen.getByText('existing')).toBeInTheDocument()
  })

  it('adds tasks rendered as haiku', async () => {
    // Provide a bogus API key so generateHaiku thinks it's rich.
    import.meta.env.VITE_OPENAI_API_KEY = 'test'
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: 'mystic haiku' } }],
        }),
    })
    render(<App />)
    const textInput = screen.getByPlaceholderText(/new task/i)
    const dateInput = screen.getByLabelText('expiry')
    fireEvent.change(textInput, { target: { value: 'buy milk' } })
    const future = new Date(Date.now() + 86400000).toISOString().slice(0, 16)
    fireEvent.change(dateInput, { target: { value: future } })
    fireEvent.click(screen.getByRole('button', { name: /add/i }))
    await waitFor(() =>
      expect(screen.getByText('mystic haiku')).toBeInTheDocument(),
    )
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem('tasks')).length).toBe(1),
    )
  })

  it('toggles task completion', () => {
    const tasks = [
      {
        title: 'finish report',
        note: '',
        created_at: Date.now(),
        expired_at: Date.now() + 1000,
        completed: false,
        status: 'active',
        user_id: 1,
        version: 1,
        otsMeta: {},
      },
    ]
    localStorage.setItem('tasks', JSON.stringify(tasks))
    render(<App />)
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    expect(screen.getByText('finish report')).toHaveClass('line-through')
  })

  it('deletes unexpired task and blocks expired', () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: () => Promise.resolve({ data: [0, 1] }),
    })
    const tasks = [
      {
        title: 'old',
        note: '',
        created_at: Date.now() - 2000,
        expired_at: Date.now() - 1000,
        completed: false,
        status: 'expired',
        user_id: 1,
        version: 1,
        otsMeta: { hash: 'deadbeef' },
      },
      {
        title: 'new',
        note: '',
        created_at: Date.now(),
        expired_at: Date.now() + 1000,
        completed: false,
        status: 'active',
        user_id: 1,
        version: 1,
        otsMeta: {},
      },
    ]
    localStorage.setItem('tasks', JSON.stringify(tasks))
    render(<App />)
    const [deleteExpired, deleteFresh] = screen.getAllByRole('button', {
      name: /delete/i,
    })
    expect(deleteExpired).toBeDisabled()
    fireEvent.click(deleteFresh)
    expect(screen.queryByText('new')).not.toBeInTheDocument()
  })

  it('self destruct spares expired tasks', async () => {
    const tasks = [
      {
        title: 'old',
        note: '',
        created_at: Date.now() - 2000,
        expired_at: Date.now() - 1000,
        completed: false,
        status: 'expired',
        user_id: 1,
        version: 1,
        otsMeta: { hash: 'deadbeef' },
      },
      {
        title: 'new',
        note: '',
        created_at: Date.now(),
        expired_at: Date.now() + 1000,
        completed: false,
        status: 'active',
        user_id: 1,
        version: 1,
        otsMeta: {},
      },
    ]
    localStorage.setItem('tasks', JSON.stringify(tasks))
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /self destruct/i }))
    await screen.findByText(/anticlimax achieved/i, {}, { timeout: 15000 })
    expect(screen.queryByText('new')).not.toBeInTheDocument()
    expect(screen.getByText('old')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('tasks')).length).toBe(1)
  }, 20000)
})
