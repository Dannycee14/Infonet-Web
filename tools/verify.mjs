// Local smoke check. Requires: npm i -D playwright  — run `npm run dev` in another shell, then `node tools/verify.mjs`.
import { chromium } from 'playwright';
const base = 'http://127.0.0.1:4173';
const pages = [['index.html','home'],['services.html','services'],['products.html','products']];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const [file, name] of pages) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const four04 = [], errs = [], sizes = new Map(); const extFail = new Set();
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0,200)));
  page.on('requestfailed', r => { if (!r.url().startsWith(base)) extFail.add(new URL(r.url()).hostname); });
  page.on('response', async r => {
    const u = r.url();
    if (!u.startsWith(base)) return;
    if (r.status() === 404) { four04.push(u.replace(base,'')); return; }
    let n = 0; try { n = (await r.body()).length; } catch {}
    sizes.set(u.replace(base,''), n);
  });
  await page.goto(`${base}/${file}`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `/tmp/shot-${name}.png`, fullPage: true });
  const total = [...sizes.values()].reduce((a,b)=>a+b,0);
  console.log(`\n### ${name} — ${sizes.size} local requests, ${(total/1024).toFixed(0)}KB`);
  console.log('  404s:', four04.length ? four04.join(', ') : 'none');
  console.log('  page errors:', errs.length ? errs.join(' | ') : 'none');
  console.log('  blocked external hosts (sandbox):', [...extFail].join(', ') || 'none');
  console.log('  top assets:', [...sizes.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6)
      .map(([k,v])=>`${k} ${(v/1024).toFixed(0)}K`).join(', '));
  await ctx.close();
}
await browser.close();
