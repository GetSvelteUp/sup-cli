const execa = require('execa')
const esbuild = require('esbuild')
const glob = require('glob')

function shouldWatch() {
  return process.env.DEV === 'true'
}

const ESBUILD_DEFAULT = {
  platform: 'node',
  target: 'es2015',
  sourcemap: 'external',
  format: 'cjs',
  outdir: 'build/assets',
  tsconfig: 'tsconfig.assets.json',
  watch: shouldWatch(),
}

async function build() {
  await Promise.all([
    esbuild.build({
      ...ESBUILD_DEFAULT,
      entryPoints: glob.sync('./assets/**/*.{j,t}s', {
        ignore: './assets/__tests__/**/*',
      }),
    }),
  ])

  if (process.env.DEV !== 'true') {
    await run('tsc --build tsconfig.assets.json')
  }
}

function run(command, preferLocal = true) {
  return execa.command(command, { preferLocal, shell: true, stdio: 'inherit' })
}

build().catch((e) => {
  console.error(e)
  process.exit(1)
})