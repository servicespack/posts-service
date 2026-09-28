import { defaultExclude, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    pool: 'forks',
    forks: {
      singleFork: true,
    },
    isolate: false,
    fileParallelism: false,
    exclude: [...defaultExclude, '**/.stryker-tmp/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*'],
      exclude: ['src/index.ts'],
    },
  },
})
