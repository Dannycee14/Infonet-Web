// Build step: data/stock.json → /<section>/<slug>.html, the stock block in products.html,
// and the stock block in sitemap.xml. Same renderer the admin uses when it saves
// (api/_lib/render.mjs), so a local build and an admin save produce the same files.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, existsSync } from 'node:fs';
import { chromeFrom, productPage, pagePath, patchProducts, patchSitemap } from '../api/_lib/render.mjs';

export function buildStock() {
    const stock = JSON.parse(readFileSync('data/stock.json', 'utf8'));
    const chrome = chromeFrom(readFileSync('index.html', 'utf8'));
    const keep = new Set();
    for (const p of stock.products) {
        mkdirSync(p.section, { recursive: true });
        const file = `${pagePath(p).slice(1)}.html`;
        writeFileSync(file, productPage(p, chrome));
        keep.add(file);
    }
    // a product deleted from stock.json loses its page
    for (const dir of ['laptops']) {
        if (!existsSync(dir)) continue;
        for (const f of readdirSync(dir)) if (f.endsWith('.html') && !keep.has(`${dir}/${f}`)) unlinkSync(`${dir}/${f}`);
    }
    writeFileSync('products.html', patchProducts(readFileSync('products.html', 'utf8'), stock));
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
    writeFileSync('sitemap.xml', patchSitemap(readFileSync('sitemap.xml', 'utf8'), stock, today));
    return stock.products.length;
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(`✅ stock — ${buildStock()} product page(s)`);
