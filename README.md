# qtodo-gptchain

Because building a normal to-do app would have been too easy, this project leans hard
into unnecessary complexity.

## Feature Rundown

This is the todo list app absolutely no one needs, yet here we are.

- **Quantum-powered procrastination** – once per day tasks are reshuffled using
  genuine quantum random numbers, so the universe decides your priorities.
- **Haiku-based clarity** – each task is sent to the OpenAI API and returned as an
  ambiguously poetic haiku. Understanding the checklist is half the battle.
- **Task expiration** – give a task a deadline; once it passes, the task becomes
  undeletable, a haunting reminder of your unfinished ambitions.
- **OpenTimestamps proofs** – expired tasks can be hashed in-browser and timestamped
  without ever leaking their contents. Proofs are created, verified and upgraded via a
  tiny FastAPI server.
- **Blinking ASCII art** – because a todo app without terminal nostalgia is hardly
  worth opening.
- **LocalStorage persistence** – your list survives refreshes and browser restarts so
  you can keep not doing things indefinitely.
- **Modern stack** – built with React, Vite and TailwindCSS for absolutely no reason
  other than we could.

### Testing

The app now ships with Vitest and React Testing Library.

```bash
cd qtodo-gptchain
npm test
```

### OpenTimestamps Server

```bash
cd ots-server
pip install -r requirements.txt
uvicorn main:app --reload
```

## Development

```bash
cd qtodo-gptchain
npm install
npm run dev
```

Set a `VITE_OPENAI_API_KEY` environment variable with an OpenAI API key if you actually
want the AI to butcher your tasks into haiku. Without it, the app grudgingly keeps your
original text.
