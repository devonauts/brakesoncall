#!/usr/bin/env node
// Imports the blog posts Mike approved in Urresta HQ (Content Studio) as PENDING posts:
//
//   content/blog-pending/<slug>.md        the post (never built: the generator only reads content/blog/)
//   content/blog-pending/img/<file>.jpg   its images (release.mjs moves them to public/blog/img/ on the day)
//   scripts/blog/release-plan.json        slug → release date (the HQ drip slot) + item/family/lang
//
// Nothing here publishes anything: release.mjs moves a post on its date and publicar.sh builds (the build validates
// everything), deploys and reports back to HQ.
//
// USAGE
//   node scripts/blog/importar.mjs                 # pull the HQ outbox (token in ~/.config/hq-blog-<company>.env)
//   node scripts/blog/importar.mjs --from <dir>    # import packages (*.json + images) dropped in a folder
//   node scripts/blog/importar.mjs --dry-run       # check everything, write nothing
//   node scripts/blog/importar.mjs --ack           # tell HQ the result of the last import
//
// A package (one per post, built by HQ's blogsites.mjs "static-md" pipeline):
//   { item_id, slug, lang, release_date: "YYYY-MM-DD", title, keyword, family,
//     markdown: "---\ntitle: …\ndescription: …\ndate: …\nauthor: …\nlang: …\nslug: …\nimage: /blog/img/x.jpg\ntags: [...]\n---\n…",
//     images: [{ src: "<file or HQ path>", dest: "x.jpg", role: "cover" | "inline" }] }
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  SITE, DIR, LIVE, PENDING, PENDING_IMG, PUBLIC_IMG, LANGS, REQUIRED, ORDER, SLUG_RE, DATE_RE, RESERVED_SLUGS, LIMITS,
  parseFrontmatter, stringifyFrontmatter, renderMarkdown, listMd, readPost, knownRoutes, routeExists, localPath, readAll,
  loadPlan, savePlan, hqConfig, hq, convertImage, postPath, absUrl, blogBase,
} from './lib.mjs';

const LAST = path.join(DIR, '.last-import.json');

// ───────────── checks (pure; exported for the tests) ─────────────
export function checkPackage(p, ctx) {
  const errors = [], warnings = [];
  if (!p || typeof p !== 'object') return { errors: ['unreadable package'], warnings };
  if (!SLUG_RE.test(String(p.slug || '')) || String(p.slug).length > 90 || RESERVED_SLUGS.has(p.slug)) errors.push(`invalid slug: ${p.slug}`);
  if (!LANGS.includes(p.lang)) errors.push(`language not served by this site: ${p.lang} (site: ${LANGS.join(', ')})`);
  if (!DATE_RE.test(String(p.release_date || ''))) errors.push(`invalid release date: ${p.release_date}`);
  const { data, body } = parseFrontmatter(String(p.markdown || ''));
  if (!data) { errors.push('no frontmatter'); return { errors, warnings }; }
  for (const k of REQUIRED) if (data[k] === undefined || data[k] === '' || (k === 'tags' && !Array.isArray(data[k]))) errors.push(`frontmatter: missing ${k}`);
  if (data.lang && data.lang !== p.lang) errors.push('frontmatter lang differs from the package');
  const title = String(data.title || '');
  if ([...title].length > LIMITS.title) warnings.push(`title has ${[...title].length} characters (max ${LIMITS.title})`);
  const dl = [...String(data.description || '')].length;
  if (dl && (dl < LIMITS.descMin || dl > LIMITS.descMax)) warnings.push(`description has ${dl} characters`);
  if (/^#\s/m.test(body)) errors.push('the body has an H1 (the page prints the title)');
  const words = renderMarkdown(body).words;
  if (words < LIMITS.words) errors.push(`body has only ${words} words`);
  if (!Array.isArray(p.images) || !p.images.some((i) => i && i.role === 'cover')) errors.push('no cover image');
  if (title && ctx && ctx.titles) {
    const other = ctx.titles.get(p.lang + '\t' + title.toLowerCase());
    if (other && other !== p.slug) errors.push(`duplicate title in ${p.lang}: "${title}" (${other})`);
  }
  return { errors, warnings };
}

// Internal links: https://<site>/<path> or /<path> → the path when the route exists, else the blog index of that
// language (an invented URL would be a broken link and fail the build).
export function fixLinks(body, lang, routes) {
  const warnings = [];
  const home = blogBase(lang);
  const out = body.replace(/(!?)\[([^\]]*)\]\(([^)\s]+)\)/g, (m, img, text, url) => {
    if (img) return m;
    const p = localPath(url);
    if (p === null || p.startsWith('#')) return m;
    if (p.startsWith('/blog/img/')) return m;
    if (routeExists(p, routes)) return `[${text}](${p})`;
    warnings.push(`link ${url} does not exist on the site → ${home}`);
    return `[${text}](${home})`;
  });
  return { body: out, warnings };
}

export function freeSlug(slug, taken) {
  if (!taken(slug)) return slug;
  for (let i = 2; i < 100; i++) if (!taken(`${slug}-${i}`)) return `${slug}-${i}`;
  throw new Error('no free slug');
}

async function readImage(src, base, cfg) {
  if (base) return fs.readFileSync(path.resolve(base, src));
  const url = /^https?:/.test(src) ? src : `${cfg.url}/${String(src).replace(/^\/+/, '')}`;
  const r = await fetch(url, { headers: cfg.token ? { 'x-hq-blog-token': cfg.token } : {}, signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error(`image ${src}: HTTP ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

// ───────────── one package ─────────────
export async function importPackage(p, ctx) {
  const res = { item_id: p && p.item_id, slug: p && p.slug, ok: false, avisos: [], errores: [] };
  const plan = ctx.plan;
  // Re-delivery of a post already imported: only the date may change while it is still pending.
  const prev = Object.entries(plan.posts).find(([, v]) => v && v.item != null && String(v.item) === String(p.item_id));
  if (prev) {
    const [slug, v] = prev;
    Object.assign(res, { slug, fecha: plan.dates[slug], url: absUrl(postPath(slug, v.lang)) });
    if (fs.existsSync(path.join(LIVE, slug + '.md'))) { res.ok = true; res.estado = 'published'; res.avisos.push('already published'); return res; }
    if (DATE_RE.test(String(p.release_date || '')) && p.release_date !== plan.dates[slug]) {
      plan.dates[slug] = p.release_date; res.fecha = p.release_date; res.cambios = true;
      const f = path.join(PENDING, slug + '.md');
      if (!ctx.dry && fs.existsSync(f)) fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/^date:.*$/m, `date: ${p.release_date}`));
      res.avisos.push(`date changed to ${p.release_date}`);
    }
    res.ok = true; res.estado = 'pending'; return res;
  }
  const { errors, warnings } = checkPackage(p, ctx);
  res.avisos.push(...warnings);
  if (errors.length) { res.errores = errors; return res; }

  const slug = freeSlug(p.slug, (s) => ctx.taken.has(s));
  if (slug !== p.slug) res.avisos.push(`slug ${p.slug} taken → ${slug}`);
  const { data, body } = parseFrontmatter(String(p.markdown));
  data.slug = slug;
  data.date = p.release_date;
  data.lang = p.lang;
  if (!data.author) data.author = SITE.defaultAuthor;
  const fixed = fixLinks(body, p.lang, ctx.routes);
  res.avisos.push(...fixed.warnings);
  let text = fixed.body;

  const images = [];
  for (const im of p.images || []) {
    const dest = String(im.dest || '');
    if (!/^[a-z0-9-]+\.(jpg|jpeg|png|webp)$/.test(dest)) { res.errores.push(`invalid image name: ${im.dest}`); return res; }
    // language editions share the original's images: already there → reuse
    const existing = [PENDING_IMG, PUBLIC_IMG].map((d) => path.join(d, dest)).find((f) => fs.existsSync(f));
    if (existing) { images.push({ name: dest, reused: true }); continue; }
    let buf;
    try { buf = await readImage(im.src, ctx.base, ctx.cfg); }
    catch (e) {
      if (im.role === 'cover') { res.errores.push(`cover: ${e.message}`); return res; }
      text = text.replace(new RegExp(`\\n?!\\[[^\\]]*\\]\\(/blog/img/${dest.replace(/[.]/g, '\\.')}\\)\\n?`), '\n');
      res.avisos.push(`image ${dest} not available: removed from the text`);
      continue;
    }
    const c = await convertImage(buf, im.role, os.tmpdir());
    if (c.warning) res.avisos.push(c.warning);
    const final = dest.replace(/\.(jpg|jpeg|png|webp)$/, c.ext);
    if (final !== dest) {
      text = text.split(`/blog/img/${dest}`).join(`/blog/img/${final}`);
      if (data.image === `/blog/img/${dest}`) data.image = `/blog/img/${final}`;
    }
    images.push({ name: final, buf: c.buf });
  }
  const md = stringifyFrontmatter(data, ORDER) + '\n' + text.replace(/^\n+/, '').replace(/\n*$/, '\n');
  if (!ctx.dry) {
    fs.mkdirSync(PENDING_IMG, { recursive: true });
    for (const im of images) if (im.buf) fs.writeFileSync(path.join(PENDING_IMG, im.name), im.buf);
    fs.writeFileSync(path.join(PENDING, slug + '.md'), md);
  }
  plan.dates[slug] = p.release_date;
  plan.posts[slug] = { lang: p.lang, item: p.item_id ?? null, keyword: p.keyword || null, family: p.family ?? p.item_id ?? null,
    images: images.map((i) => i.name), imported: new Date().toISOString().slice(0, 10) };
  ctx.taken.add(slug);
  ctx.titles.set(p.lang + '\t' + String(data.title).toLowerCase(), slug);
  Object.assign(res, { ok: true, slug, fecha: p.release_date, estado: 'pending', url: absUrl(postPath(slug, p.lang)), nuevo: true });
  return res;
}

export function context({ dry = false, base = null, cfg = null } = {}) {
  const taken = new Set([...listMd(LIVE), ...listMd(PENDING)].map((f) => f.replace(/\.md$/, '')));
  const titles = new Map();
  for (const [dir, f] of [...listMd(LIVE).map((f) => [LIVE, f]), ...listMd(PENDING).map((f) => [PENDING, f])]) {
    const p = readPost(path.join(dir, f));
    if (p.title) titles.set(p.lang + '\t' + p.title.toLowerCase(), p.slug);
  }
  // links may point to live posts AND to posts that are still pending (they go live first or the same day)
  const routes = knownRoutes([...readAll(LIVE), ...readAll(PENDING)]);
  return { dry, base, cfg, plan: loadPlan(), taken, titles, routes };
}

// ───────────── main ─────────────
async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry-run');
  const cfg = hqConfig();
  if (args.includes('--ack')) {
    if (!fs.existsSync(LAST)) { console.log('Nothing to acknowledge.'); return; }
    const r = JSON.parse(fs.readFileSync(LAST, 'utf8'));
    if (!(r.results || []).length) { console.log('Nothing to acknowledge.'); return; }
    const out = await hq(cfg, 'POST', 'ack', r);
    console.log(`HQ acknowledged: ${out.updated ?? 0} updated`);
    return;
  }
  const iFrom = args.indexOf('--from');
  let packages = [], base = null;
  if (iFrom >= 0) {
    base = path.resolve(args[iFrom + 1]);
    packages = fs.readdirSync(base).filter((f) => f.endsWith('.json')).sort().map((f) => JSON.parse(fs.readFileSync(path.join(base, f), 'utf8')));
  } else {
    packages = (await hq(cfg, 'GET', 'outbox')).packages || [];
  }
  if (!packages.length) { console.log('Nothing new in the HQ outbox.'); if (!dry) fs.writeFileSync(LAST, JSON.stringify({ results: [] })); return; }
  fs.mkdirSync(PENDING, { recursive: true });
  const ctx = context({ dry, base, cfg });
  const results = [];
  for (const p of packages) {
    let r;
    try { r = await importPackage(p, ctx); } catch (e) { r = { item_id: p && p.item_id, slug: p && p.slug, ok: false, errores: [e.message], avisos: [] }; }
    results.push(r);
    console.log(`${r.ok ? (r.nuevo ? '  + ' : '  = ') : '  ✖ '}${r.fecha || p.release_date || '????-??-??'}  ${r.slug}` +
      `${r.errores.length ? '  · ' + r.errores.join(' · ') : ''}${r.avisos.length ? '  ▲ ' + r.avisos.join(' · ') : ''}`);
  }
  const changed = results.filter((r) => r.ok && (r.nuevo || r.cambios)).length;
  if (!dry) {
    if (changed) savePlan(ctx.plan);
    fs.writeFileSync(LAST, JSON.stringify({ at: new Date().toISOString(), results }, null, 1));
  }
  console.log(`\nImported or updated: ${changed} · rejected: ${results.filter((r) => !r.ok).length}${dry ? ' (dry run: nothing written)' : ''}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error('importar:', e.message); process.exit(1); });
}
