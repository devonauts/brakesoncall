#!/usr/bin/env node
// Tests of the blog kit (no dependencies): node scripts/blog/test.mjs
// Runs the importer, the release and the inventory against a throw-away copy of the kit in a temp folder, so the
// real content/ and release-plan.json are never touched. HQ_SAMPLE_DIR=<dir> also imports packages written by HQ's
// blogsites.test.mjs (STATIC_SAMPLE_DIR) — the cross-check of the package contract.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'blogkit-'));
const kit = path.join(tmp, 'scripts/blog');
fs.mkdirSync(kit, { recursive: true });
for (const f of ['md.mjs', 'lib.mjs', 'importar.mjs', 'release.mjs', 'exportar-inventario.mjs', 'site.config.mjs']) fs.copyFileSync(path.join(HERE, f), path.join(kit, f));
for (const d of ['content/blog', 'content/blog-pending/img', 'public/blog/img']) fs.mkdirSync(path.join(tmp, d), { recursive: true });

const md = await import(path.join(kit, 'md.mjs'));
const L = await import(path.join(kit, 'lib.mjs'));
const I = await import(path.join(kit, 'importar.mjs'));
const R = await import(path.join(kit, 'release.mjs'));
const E = await import(path.join(kit, 'exportar-inventario.mjs'));
const SITE = L.SITE, LANG = SITE.defaultLang, OTHER = Object.keys(SITE.langs).find((l) => l !== LANG);

let passed = 0, failed = 0;
const test = async (name, fn) => { try { await fn(); passed++; console.log('ok  ', name); } catch (e) { failed++; console.error('FAIL', name, '\n', e); } };

// 1×1 PNG
const PNG = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010802000000907753de0000000c4944415408d763f8cfc000000301010018dd8db40000000049454e44ae426082', 'hex');
const words = (n) => Array.from({ length: n }, (_, i) => `palabra${i % 50}`).join(' ');
const home = SITE.site;
const REAL = (SITE.routes || ['/']).find((r) => r !== '/') || '/';                  // a route that exists on this site
function pkg(over = {}) {
  const slug = over.slug || 'primer-articulo';
  const lang = over.lang || LANG;
  const fm = { title: over.title || 'Primer artículo de prueba', description: 'Una descripción suficientemente larga para pasar el control de longitud del importador sin avisos de ningún tipo.',
    date: '2026-10-13', author: SITE.defaultAuthor, lang, slug, image: `/blog/img/${over.img || slug}.jpg`, tags: ['uno'] };
  return { item_id: over.item_id ?? 101, slug, lang, release_date: over.release_date || '2026-10-13', title: fm.title, keyword: 'prueba', family: over.family ?? over.item_id ?? 101,
    markdown: md.stringifyFrontmatter(fm, L.ORDER) + `\n${words(300)}\n\n## Sección\n\n![alt](/blog/img/${over.img || slug}-1.jpg)\n\n[contacto](${home}${REAL}) y [inventado](${home}/no-existe-esto).\n`,
    images: [{ src: 'cover.png', dest: `${over.img || slug}.jpg`, role: 'cover' }, { src: 'inline.png', dest: `${over.img || slug}-1.jpg`, role: 'inline' }] };
}
const drop = path.join(tmp, 'drop');
fs.mkdirSync(drop);
fs.writeFileSync(path.join(drop, 'cover.png'), PNG);
fs.writeFileSync(path.join(drop, 'inline.png'), PNG);

await test('markdown: blocks, inline, escaping, H1 demoted, tables, nested lists', () => {
  const r = md.renderMarkdown('# T\n\nHola **x** <b>y</b> [a](/contact)\n\n- a\n  - b\n\n| x | y |\n|---|---|\n| 1 | 2 |\n\n![i](/blog/img/a.jpg)\n');
  assert.match(r.html, /<h2 id="t">T<\/h2>/);
  assert.match(r.html, /&lt;b&gt;y&lt;\/b&gt;/);
  assert.match(r.html, /<ul><li>a<ul><li>b<\/li><\/ul><\/li><\/ul>/);
  assert.match(r.html, /<table>/);
  assert.match(r.html, /<figure class="blog-figure"><img src="\/blog\/img\/a.jpg"/);
  assert.deepEqual(r.links, ['/contact']);
  assert.equal(md.renderMarkdown('[x](javascript:alert(1))').html.includes('javascript:'), false);
});
await test('frontmatter: round trip keeps types', () => {
  const s = md.stringifyFrontmatter({ title: 'A: "b"', date: '2026-10-13', tags: ['x', 'y'] }, ['title', 'date', 'tags']);
  assert.deepEqual(md.parseFrontmatter(s + 'body').data, { title: 'A: "b"', date: '2026-10-13', tags: ['x', 'y'] });
});
await test('package check: missing fields, H1 and short body are rejected', () => {
  const bad = pkg(); bad.markdown = bad.markdown.replace(/^tags:.*\n/m, '').replace(words(300), '# H1\n\ncorto');
  const { errors } = I.checkPackage(bad, { titles: new Map() });
  assert.ok(errors.some((e) => /missing tags/.test(e)));
  assert.ok(errors.some((e) => /H1/.test(e)));
  assert.ok(errors.some((e) => /words/.test(e)));
  assert.ok(I.checkPackage({ ...pkg(), lang: 'xx' }, {}).errors.some((e) => /language/.test(e)));
});
await test('import: pending post + images + plan; invented link → blog index; real link kept', async () => {
  const ctx = I.context({ base: drop });
  const r = await I.importPackage(pkg(), ctx);
  assert.equal(r.ok, true, JSON.stringify(r));
  L.savePlan(ctx.plan);
  const f = path.join(tmp, 'content/blog-pending/primer-articulo.md');
  const text = fs.readFileSync(f, 'utf8');
  assert.match(text, /^date: 2026-10-13$/m);
  assert.ok(text.includes(`[contacto](${REAL})`));
  assert.match(text, new RegExp(`\\[inventado\\]\\(${L.blogBase(LANG).replace(/\//g, '\\/')}\\)`));
  assert.ok(r.avisos.some((a) => /no-existe-esto/.test(a)));
  assert.ok(fs.existsSync(path.join(tmp, 'content/blog-pending/img/primer-articulo.jpg')));
  assert.equal(L.loadPlan().dates['primer-articulo'], '2026-10-13');
  assert.equal(r.url, `${home}${L.postPath('primer-articulo', LANG)}`);
});
await test('import: re-delivery only moves the date; taken slug gets -2; duplicate title rejected', async () => {
  const ctx = I.context({ base: drop });
  const again = await I.importPackage(pkg({ release_date: '2026-10-15' }), ctx);
  assert.equal(again.cambios, true); assert.equal(ctx.plan.dates['primer-articulo'], '2026-10-15');
  const other = await I.importPackage(pkg({ item_id: 102, title: 'Otro título distinto' }), ctx);
  assert.equal(other.slug, 'primer-articulo-2');
  const dup = await I.importPackage(pkg({ item_id: 103, slug: 'tercero' }), ctx);
  assert.equal(dup.ok, false); assert.match(dup.errores.join(), /duplicate title/);
  L.savePlan(ctx.plan);
  assert.match(fs.readFileSync(path.join(tmp, 'content/blog-pending/primer-articulo.md'), 'utf8'), /^date: 2026-10-15$/m);
});
if (OTHER) {
  await test('import: a language edition shares the original images', async () => {
    const ctx = I.context({ base: drop });
    const r = await I.importPackage(pkg({ item_id: 104, slug: 'first-article', lang: OTHER, title: 'First test article', img: 'primer-articulo', family: 101 }), ctx);
    assert.equal(r.ok, true, JSON.stringify(r));
    assert.deepEqual(ctx.plan.posts['first-article'].images, ['primer-articulo.jpg', 'primer-articulo-1.jpg']);
    L.savePlan(ctx.plan);
  });
}
await test('release: nothing before the date; due posts move with their images; date fixed', () => {
  const early = R.release({ until: '2026-10-14' });                                     // primer-articulo was moved to 10-15
  assert.ok(early.released.some((x) => x.slug === 'primer-articulo-2'));
  assert.ok(!early.released.some((x) => x.slug === 'primer-articulo'));
  assert.ok(fs.existsSync(path.join(tmp, 'content/blog-pending/img/primer-articulo.jpg')));   // still needed → copied, not moved
  const r = R.release({ until: '2026-10-20' });
  assert.ok(r.released.some((x) => x.slug === 'primer-articulo'));
  assert.ok(fs.existsSync(path.join(tmp, 'content/blog/primer-articulo.md')));
  assert.ok(fs.existsSync(path.join(tmp, 'public/blog/img/primer-articulo.jpg')));
  assert.ok(!fs.existsSync(path.join(tmp, 'content/blog-pending/primer-articulo.md')));
  assert.equal(R.release({ until: '2026-10-20' }).released.length, 0);                  // idempotent
  assert.match(R.status('2026-10-20'), /Published: \d/);
});
await test('inventory: published + pending, with HQ item ids, categories and pages', () => {
  fs.copyFileSync(path.join(tmp, 'content/blog/primer-articulo.md'), path.join(tmp, 'content/blog-pending/pendiente-x.md'));
  const inv = E.inventory();
  const pub = inv.posts.find((p) => p.slug === 'primer-articulo');
  assert.equal(pub.status, 'published'); assert.equal(pub.item, 101);
  assert.ok(inv.posts.some((p) => p.status === 'pending'));
  assert.ok(inv.categorias[LANG].length > 0); assert.ok(inv.paginas[LANG].includes('/'));
  assert.equal(inv.company, SITE.company);
});
if (process.env.HQ_SAMPLE_DIR) {
  await test('cross-check: packages produced by HQ blogsites.mjs import cleanly', async () => {
    const ctx = I.context({ base: process.env.HQ_SAMPLE_DIR });
    const files = fs.readdirSync(process.env.HQ_SAMPLE_DIR).filter((f) => f.endsWith('.json') && f.startsWith(SITE.company + '-'));
    assert.ok(files.length > 0, 'no sample for ' + SITE.company);
    for (const f of files) {
      const r = await I.importPackage(JSON.parse(fs.readFileSync(path.join(process.env.HQ_SAMPLE_DIR, f), 'utf8')), ctx);
      assert.equal(r.ok, true, `${f}: ${JSON.stringify(r)}`);
    }
    L.savePlan(ctx.plan);
    const rel = R.release({ until: '2099-12-31' });
    assert.deepEqual(rel.held, []);
    assert.ok(rel.released.length >= files.length);
  });
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${passed} passed${failed ? `, ${failed} FAILED` : ''}`);
process.exitCode = failed ? 1 : 0;
