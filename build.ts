import { $ } from 'bun'
import { rmSync } from 'fs'

rmSync('dist', { recursive: true, force: true })

const libResult = await Bun.build({
  entrypoints: ['src/index.ts'],
  outdir: 'dist',
  target: 'node',
  format: 'cjs',
})

if (!libResult.success) {
  console.error('Library build failed:', libResult.logs)
  process.exit(1)
}

const cliResult = await Bun.build({
  entrypoints: ['src/cli/index.ts'],
  outdir: 'dist/cli',
  target: 'node',
  format: 'cjs',
  banner: '#!/usr/bin/env node',
})

if (!cliResult.success) {
  console.error('CLI build failed:', cliResult.logs)
  process.exit(1)
}

await $`chmod +x dist/cli/index.js`

await $`tsc --declaration --declarationMap --emitDeclarationOnly --outDir dist`

console.log('Build complete.')
