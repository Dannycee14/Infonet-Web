import * as esbuild from 'esbuild';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

mkdirSync('assets', { recursive: true });
mkdirSync('dist', { recursive: true });

// 1. Tailwind: compiled and purged at build time, not by a 400KB compiler in the browser.
//
// Run the CLI's own entry file with this Node binary. The obvious version of this line is
// execFileSync('npx', [...]) — and it dies on Windows with `spawnSync npx ENOENT`, because
// the installed executable there is `npx.cmd` and execFileSync does no PATHEXT lookup.
// Resolving the module and handing it to process.execPath needs no PATH, no shell, and no
// per-platform branch.
let tailwindCli;
try {
  tailwindCli = require.resolve('tailwindcss/lib/cli.js');
} catch {
  // Two different failures land here, and they need different fixes — so say which.
  let installed = null;
  try {
    installed = require('tailwindcss/package.json').version;
  } catch { /* not installed at all */ }

  if (installed && !installed.startsWith('3.')) {
    console.error(
      `✖ tailwindcss ${installed} is installed, but this project is built against v3.\n` +
      '  v4 moved the CLI into a separate package and replaced tailwind.config.js with\n' +
      '  CSS-first config, so the build cannot use it as-is.\n' +
      '  Fix:  npm install -D tailwindcss@3.4.17'
    );
  } else {
    console.error('✖ tailwindcss is not installed. Run `npm install` first.');
  }
  process.exit(1);
}

execFileSync(process.execPath, [
  tailwindCli,
  '-c', 'tailwind.config.js',
  '-i', 'src/tailwind.css',
  '-o', 'src/.tailwind.out.css',
  '--minify',
], { stdio: 'inherit' });

// 2. One stylesheet, one request. Order matters:
//    tailwind (incl. preflight) -> font-awesome subset -> hand-written overrides.
const parts = [
  readFileSync('src/.tailwind.out.css', 'utf8'),
  readFileSync('assets/fa-subset.css', 'utf8'),
  readFileSync('styles.css', 'utf8'),
];
writeFileSync('assets/site.css', parts.join('\n'));
console.log(`✅ assets/site.css — ${(parts.join('\n').length / 1024).toFixed(1)}KB`);

// 3. Vercel telemetry bundles.
for (const name of ['speed-insights', 'analytics']) {
  await esbuild.build({
    entryPoints: [`${name}.js`],
    bundle: true,
    minify: true,
    format: 'iife',
    outfile: `dist/${name}.bundle.js`,
    platform: 'browser',
    target: ['es2018'],
  });
  console.log(`✅ dist/${name}.bundle.js`);
}
