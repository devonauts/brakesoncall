#!/usr/bin/env node
// Inventory of EVERY post of this blog — published (content/blog/) and pending (content/blog-pending/, with its date
// from release-plan.json), every language — so Urresta HQ never proposes a topic the site already has or has queued.
//
// USAGE
//   node scripts/blog/exportar-inventario.mjs                        # → scripts/blog/inventario.json (git-ignored) + summary
//   node scripts/blog/exportar-inventario.mjs --out <file>
//   node scripts/blog/exportar-inventario.mjs --send                 # also POST it to HQ (token in ~/.config/hq-blog-<co>.env)
//   node scripts/blog/exportar-inventario.mjs --send --fail "<msg>"  # report a failed release to HQ
//
// Output (HQ stores it as Projects/empresas/<Empresa>/blog/inventario.json; same shape as the CGuard exporter):
//   { version: 1, company, site, generated_at, counts, posts: [{ slug, lang, title, status: "published"|"pending",
//     date, keyword, tags, url, item? }], categorias: { lang: [tags] }, paginas: { lang: [paths] }, prefijos, fallo? }
import fs from 'node:fs';
import path from 'node:path';
import { SITE, DIR, LIVE, PENDING, LANGS, readAll, loadPlan, postPath, absUrl, prefixOf, hqConfig, hq } from './lib.mjs';

export function inventory() {
  const plan = loadPlan();
  const posts = [];
  for (const [dir, status] of [[LIVE, 'published'], [PENDING, 'pending']]) {
    for (const p of readAll(dir)) {
      const extra = plan.posts[p.slug] || {};
      posts.push({ slug: p.slug, lang: p.lang, title: p.title, status, date: status === 'pending' ? (plan.dates[p.slug] || p.date || null) : p.date,
        keyword: extra.keyword || p.keyword || null, tags: p.tags, url: absUrl(postPath(p.slug, p.lang)), ...(extra.item != null ? { item: extra.item } : {}) });
    }
  }
  posts.sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.slug.localeCompare(b.slug));
  const categorias = {};
  for (const l of LANGS) categorias[l] = [...new Set([...((SITE.categories || {})[l] || []), ...posts.filter((p) => p.lang === l).flatMap((p) => p.tags)])];
  const paginas = {};
  for (const l of LANGS) paginas[l] = [...(SITE.sitemap || SITE.routes || ['/'])];
  const counts = {};
  for (const p of posts) counts[`${p.lang}:${p.status}`] = (counts[`${p.lang}:${p.status}`] || 0) + 1;
  return { version: 1, company: SITE.company, site: SITE.site, generated_at: new Date().toISOString(), counts, posts, categorias, paginas,
    prefijos: Object.fromEntries(LANGS.map((l) => [l, prefixOf(l)])) };
}

async function main() {
  const a = process.argv.slice(2);
  const i = a.indexOf('--out'), j = a.indexOf('--fail');
  const out = i >= 0 ? path.resolve(a[i + 1]) : path.join(DIR, 'inventario.json');
  const inv = inventory();
  if (j >= 0) inv.fallo = { at: inv.generated_at, mensaje: String(a[j + 1] || 'failure without details').slice(0, 500) };
  fs.writeFileSync(out, JSON.stringify(inv, null, 1));
  const pub = inv.posts.filter((p) => p.status === 'published').length;
  console.log(`Inventory: ${inv.posts.length} posts (${pub} published, ${inv.posts.length - pub} pending) → ${out}`);
  if (a.includes('--send')) {
    const r = await hq(hqConfig(), 'POST', 'inventory', inv);
    console.log(`HQ: inventory received · ${r.published ?? 0} marked as published`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error('exportar-inventario:', e.message); process.exit(1); });
}
