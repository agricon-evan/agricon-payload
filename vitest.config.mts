import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const srcDir = fileURLToPath(new URL('./src', import.meta.url))

export default defineConfig({
  // Aliases are declared explicitly rather than via `vite-tsconfig-paths`.
  // That plugin resolved nothing here, and the failure surfaced late as
  // "Cannot find package '@/payload.config'" — Vite was treating the bare `@/`
  // specifier as a node_modules package. Spelling the two mappings out removes
  // the whole class of problem and keeps the specs runnable from any cwd.
  resolve: {
    alias: [
      { find: /^@\/payload\.config$/, replacement: `${srcDir}/payload.config.ts` },
      { find: /^@\//, replacement: `${srcDir}/` },
    ],
  },
  plugins: [react()],
  test: {
    // The integration specs boot a real Payload instance against SQLite. That is
    // server-side work: jsdom has no `node:` builtins and no filesystem, which is
    // why `test:int` previously died during environment setup.
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/int/**/*.int.spec.ts'],
    // Payload's SQLite adapter opens the dev database; keep specs in a single
    // process so workers cannot race on schema/connection state.
    // (Vitest 4 moved `poolOptions` to top-level options.)
    pool: 'forks',
    maxWorkers: 1,
    minWorkers: 1,
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
})
