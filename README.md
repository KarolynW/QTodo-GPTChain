# qtodo-gptchain

Because building a normal to-do app would have been too easy, this project leans hard
into unnecessary complexity.

## Features you'll brag about (to no one)

- **Quantum-powered procrastination**: tasks reshuffle once a day using *actual* quantum
  randomness. Your chores literally move at the whims of physics.
- **Haiku-based clarity**: every task you add is politely mangled into an ambiguous
  haiku by the OpenAI API. Because nothing says "productivity" like decoding your own
  poetry.
- **Blinking ASCII art**: a retro banner with a fake terminal cursor just to prove we
  spent time on the wrong things.
- **LocalStorage persistence**: your poetic chores survive page refreshes, lucky you.
- **React + Vite + Tailwind**: all the modern web tooling you never needed to manage a
  handful of checkboxes.

## Development

```bash
cd qtodo-gptchain
npm install
npm run dev
```

Set a `VITE_OPENAI_API_KEY` environment variable with an OpenAI API key if you actually
want the AI to butcher your tasks into haiku. Without it, the app grudgingly keeps your
original text.
