import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Tailwind CSS v4 uses a Vite plugin instead of PostCSS.
// This eliminates tailwind.config.js, postcss.config.js, and autoprefixer —
// three configuration files that previously existed solely to configure each other.
// Lightning CSS is now the compiler. Builds are allegedly 100× faster.
// The todo list remains equally useless.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
})
