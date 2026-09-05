import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Expose SERVER_-prefixed env vars (e.g. SERVER_BASE_URL) to client code,
  // alongside Vite's default VITE_ prefix.
  envPrefix: ["VITE_", "SERVER_"],
  test: {
    // Components need a DOM; Vitest's default environment is bare Node.
    environment: "jsdom",
    // Registers the jest-dom matchers and unmounts components between tests.
    setupFiles: "./src/test/setup.js",
  },
})
