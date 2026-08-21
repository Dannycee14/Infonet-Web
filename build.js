import * as esbuild from 'esbuild';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('assets', { recursive: true });
mkdirSync('dist', { recursive: true });

// 1. Tailwind: compiled and purged at build time, not by a 400KB compiler in the browser.
execFileSync('npx', [
  'tailwindcss',
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
