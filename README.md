# qtodo-gptchain

This project started as a minimal Vite + React setup styled with Tailwind CSS.
It now includes a simple to-do list where you can add tasks and mark them as completed.
An ASCII art title with a blinking terminal-style cursor is displayed above the list.

When a task is added it is sent to the OpenAI API and rewritten as an ambiguous haiku
before being stored.

## Development

```bash
cd qtodo-gptchain
npm install
npm run dev
```

Set a `VITE_OPENAI_API_KEY` environment variable with an OpenAI API key to enable
haiku generation.
