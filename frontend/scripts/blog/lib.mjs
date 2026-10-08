// Shared pieces of the static blog: paths, post reading/validation, the release plan, the Urresta HQ client and
// image helpers. Site-specific values come from ./site.config.mjs; everything else is the same on every site that
// uses this blog kit (Devonauts, Flypio, Brakes on Call).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseFrontmatter, stringifyFrontmatter, renderMarkdown, markdownToText } from './md.mjs';
import SITE from './site.config.mjs';

export { SITE };
export const DIR = path.dirname(new URL(import.meta.url).pathname);
export const ROOT = path.resolve(DIR, '../..');                         // the frontend/ folder
export const LIVE = path.join(ROOT, 'content/blog');                     // published posts (*.md)
export const PENDING = path.join(ROOT, 'content/blog-pending');           // waiting for their date (never built)
export const PENDING_IMG = path.join(PENDING, 'img');                    // their images (moved to public/ on release day)
export const PUBLIC_IMG = path.join(ROOT, 'public/blog/img');             // live images → /blog/img/*
export const PLAN = path.join(DIR, 'release-plan.json');

export const REQUIRED = ['title', 'description', 'date', 'author', 'lang', 'slug', 'image', 'tags'];
export const ORDER = [...REQUIRED, 'image_alt', 'updated', 'keyword'];
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const RESERVED_SLUGS = new Set(['page', 'img', 'rss', 'rss-xml', '404', 'tag', 'tags', 'index', 'feed']);
export const LIMITS = { title: 70, descMin: 70, descMax: 170, words: 250 };

export const LANGS = Object.keys(SITE.langs);
export const prefixOf = (lang) => (SITE.langs[lang] ? SITE.langs[lang].prefix : '');
export const blogBase = (lang) => `${prefixOf(lang)}/blog/`;
export const postPath = (slug, lang) => `${blogBase(lang)}${slug}/`;
export const indexPath = (lang, page = 1) => (page > 1 ? `${blogBase(lang)}page/${page}/` : blogBase(lang));
export const absUrl = (p) => SITE.site.replace(/\/+$/, '') + p;
export const todayIn = (tz = SITE.tz || 'America/Chicago', d = new Date()) => d.toLocaleDateString('en-CA', { timeZone: tz });

// ───────────── posts ─────────────
export const listMd = (dir) => { try { return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort(); } catch { return []; } };

export function readPost(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const { data, body } = parseFrontmatter(raw);
  const d = data || {};
  return {
    file, raw, body, data: d, hasFrontmatter: !!data,
    slug: String(d.slug || path.basename(file, '.md')),
    lang: String(d.lang || SITE.defaultLang),
    title: String(d.title || ''),
    description: String(d.description || ''),
    date: d.date ? String(d.date).slice(0, 10) : '',
    updated: d.updated ? String(d.updated).slice(0, 10) : null,
    author: String(d.author || ''),
    image: d.image ? String(d.image) : '',
    imageAlt: String(d.image_alt || d.title || ''),
    tags: Array.isArray(d.tags) ? d.tags.map(String) : typeof d.tags === 'string' && d.tags ? [d.tags] : [],
    keyword: d.keyword ? String(d.keyword) : null,
  };
}
export const readAll = (dir) => listMd(dir).map((f) => readPost(path.join(dir, f)));
export const excerptOf = (post, n = 180) => {
  const t = post.description || markdownToText(post.body);
  return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, '') + '…' : t;
};
export const readingMinutes = (words) => Math.max(1, Math.round(words / 220));

// Routes a post may link to: the site's own pages (site.config.mjs) + every live blog route.
export function knownRoutes(livePosts = readAll(LIVE)) {
  const r = new Set(SITE.routes || ['/']);
  for (const l of LANGS) r.add(blogBase(l));
  for (const p of livePosts) r.add(postPath(p.slug, p.lang));
  return r;
}
const norm = (p) => { const x = p.split('#')[0].split('?')[0]; return x === '/' ? '/' : x.replace(/\/+$/, '') + '/'; };
export function routeExists(href, routes) {
  const n = norm(href);
  for (const r of routes) if (norm(r) === n) return true;
  return false;
}
// Turns an absolute link to this site into a path; external links stay as they are.
export function localPath(href) {
  const host = SITE.site.replace(/^https?:\/\//, '').replace(/\/+$/, '').replace(/^www\./, '');
  const re = new RegExp(`^https?://(www\\.)?${host.replace(/\./g, '\\.')}(?=/|$)`, 'i');
  if (re.test(href)) return href.replace(re, '') || '/';
  return href.startsWith('/') && !href.startsWith('//') ? href : null;
}

// Strict check of one post. `imageDirs`: where its images may be (live: public/blog/img; pending: + pending/img).
export function checkPost(post, { routes, imageDirs = [PUBLIC_IMG], titles = null, slugs = null } = {}) {
  const errors = [], warnings = [];
  if (!post.hasFrontmatter) return { errors: ['no frontmatter'], warnings };
  for (const k of REQUIRED) {
    const v = post.data[k];
    if (v === undefined || v === null || v === '' || (k === 'tags' && !Array.isArray(v))) errors.push(`frontmatter: missing ${k}`);
  }
  const fileSlug = path.basename(post.file, '.md');
  if (post.slug !== fileSlug) errors.push(`slug "${post.slug}" does not match the file name "${fileSlug}"`);
  if (!SLUG_RE.test(post.slug) || post.slug.length > 90) errors.push(`invalid slug: ${post.slug}`);
  if (RESERVED_SLUGS.has(post.slug)) errors.push(`reserved slug: ${post.slug}`);
  if (!LANGS.includes(post.lang)) errors.push(`language not served by this site: ${post.lang}`);
  if (post.date && !DATE_RE.test(post.date)) errors.push(`invalid date: ${post.date}`);
  if (/^#\s/m.test(post.body.replace(/```[\s\S]*?```/g, ''))) errors.push('the body has an H1 (the page prints the title)');
  if ([...post.title].length > LIMITS.title) warnings.push(`title has ${[...post.title].length} characters (max ${LIMITS.title})`);
  const dl = [...post.description].length;
  if (post.description && (dl < LIMITS.descMin || dl > LIMITS.descMax)) warnings.push(`description has ${dl} characters (${LIMITS.descMin}–${LIMITS.descMax} recommended)`);
  const r = renderMarkdown(post.body);
  if (r.words < LIMITS.words) errors.push(`body has only ${r.words} words`);
  const imgOk = (src) => {
    if (!src.startsWith('/blog/img/')) return false;
    const f = decodeURIComponent(src.slice('/blog/img/'.length));
    return !f.includes('/') && imageDirs.some((d) => fs.existsSync(path.join(d, f)));
  };
  if (post.image && !imgOk(post.image)) errors.push(`cover image not found: ${post.image} (images live in public/blog/img/)`);
  for (const src of r.images) if (!/^https?:/.test(src) && !imgOk(src)) errors.push(`image not found: ${src}`);
  for (const src of r.images) if (/^https?:/.test(src)) errors.push(`remote image (download it into public/blog/img/): ${src}`);
  if (routes) {
    for (const href of r.links) {
      const p = localPath(href);
      if (p === null || p.startsWith('#') || /^(mailto|tel):/.test(href)) continue;
      if (p.startsWith('/blog/img/') ? !imgOk(p) : !routeExists(p, routes)) errors.push(`broken internal link: ${href}`);
    }
  }
  if (titles) {
    const k = post.lang + '\t' + post.title.toLowerCase();
    if (titles.has(k) && titles.get(k) !== post.slug) errors.push(`duplicate title in ${post.lang}: "${post.title}" (${titles.get(k)})`);
    else titles.set(k, post.slug);
  }
  if (slugs) {
    if (slugs.has(post.slug)) errors.push(`duplicate slug: ${post.slug}`);
    slugs.add(post.slug);
  }
  return { errors, warnings };
}

export { parseFrontmatter, stringifyFrontmatter, renderMarkdown, markdownToText };

// ───────────── release plan ─────────────
// { dates: { slug: "YYYY-MM-DD" }, posts: { slug: { lang, item, keyword, family, images: [], imported } } }
export function loadPlan() {
  try { const p = JSON.parse(fs.readFileSync(PLAN, 'utf8')); return { ...p, dates: p.dates || {}, posts: p.posts || {} }; }
  catch { return { dates: {}, posts: {} }; }
}
export const savePlan = (plan) => fs.writeFileSync(PLAN, JSON.stringify({ dates: plan.dates, posts: plan.posts }, null, 2) + '\n');

// hreflang families from the plan (an original + its language editions): slug → { lang: path }
export function familiesOf(plan, livePosts) {
  const live = new Map(livePosts.map((p) => [p.slug, p]));
  const groups = new Map();
  for (const [slug, v] of Object.entries(plan.posts || {})) {
    if (!v || v.family == null || !live.has(slug)) continue;
    const k = String(v.family);
    if (!groups.has(k)) groups.set(k, {});
    groups.get(k)[live.get(slug).lang] = postPath(slug, live.get(slug).lang);
  }
  const out = new Map();
  for (const g of groups.values()) if (Object.keys(g).length > 1) for (const p of Object.values(g)) out.set(p, g);
  return out;
}

// ───────────── Urresta HQ ─────────────
// ~/.config/hq-blog-<company>.env (HQ_BLOG_TOKEN=…, HQ_BLOG_URL=…) + process.env. The token is never printed.
export function hqConfig() {
  const out = {};
  const f = process.env.HQ_BLOG_ENV || path.join(process.env.HOME || '', `.config/hq-blog-${SITE.company}.env`);
  try {
    for (const l of fs.readFileSync(f, 'utf8').split('\n')) {
      const m = l.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
      if (m) out[m[1]] = m[2];
    }
  } catch { /* optional */ }
  const v = (k, d) => process.env[k] || out[k] || d;
  return { url: String(v('HQ_BLOG_URL', 'http://192.168.86.48/api')).replace(/\/+$/, ''), token: v('HQ_BLOG_TOKEN', ''), company: SITE.company };
}
export async function hq(cfg, method, route, body) {
  if (!cfg.token) throw new Error(`HQ_BLOG_TOKEN missing (~/.config/hq-blog-${cfg.company}.env)`);
  const r = await fetch(`${cfg.url}/blogs/pipeline/${cfg.company}/${route}`, {
    method, signal: AbortSignal.timeout(60000),
    headers: { 'x-hq-blog-token': cfg.token, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`HQ ${method} ${route}: ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

// ───────────── images ─────────────
// Width/height of a PNG or JPEG (for width/height attributes and og:image size). null when unknown.
export function imageSize(buf) {
  try {
    if (buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG') return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      let o = 2;
      while (o < buf.length) {
        if (buf[o] !== 0xff) return null;
        const marker = buf[o + 1], len = buf.readUInt16BE(o + 2);
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { height: buf.readUInt16BE(o + 5), width: buf.readUInt16BE(o + 7) };
        o += 2 + len;
      }
    }
    if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP' && buf.toString('ascii', 12, 16) === 'VP8X') {
      return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
    }
  } catch { /* fall through */ }
  return null;
}
export const imageSizeOf = (file) => { try { return imageSize(fs.readFileSync(file)); } catch { return null; } };

// cover → 1200×630 JPG; inline → ≤1200 px wide JPG. sharp when installed, else macOS `sips`, else the original bytes.
export async function convertImage(buf, role, tmpDir) {
  try {
    const sharp = (await import('sharp')).default;
    const img = sharp(buf).rotate();
    const out = role === 'cover' ? img.resize(1200, 630, { fit: 'cover', position: 'attention' }) : img.resize({ width: 1200, withoutEnlargement: true });
    return { buf: await out.jpeg({ quality: 80, mozjpeg: true }).toBuffer(), ext: '.jpg' };
  } catch { /* no sharp */ }
  try {
    const src = path.join(tmpDir, `in-${process.pid}-${Date.now()}.img`), dst = src.replace(/\.img$/, '.jpg');
    fs.writeFileSync(src, buf);
    const size = imageSize(buf) || { width: 1200, height: 800 };
    const args = ['-s', 'format', 'jpeg', '-s', 'formatOptions', '80'];
    if (role === 'cover') {
      // scale so that 1200×630 fits inside, then centre-crop
      const scale = Math.max(1200 / size.width, 630 / size.height);
      args.push('-z', String(Math.round(size.height * scale)), String(Math.round(size.width * scale)), '-c', '630', '1200');
    } else if (size.width > 1200) args.push('--resampleWidth', '1200');
    execFileSync('sips', [...args, src, '--out', dst], { stdio: 'ignore' });
    const out = fs.readFileSync(dst);
    fs.rmSync(src, { force: true }); fs.rmSync(dst, { force: true });
    return { buf: out, ext: '.jpg' };
  } catch { /* no sips */ }
  const png = buf[0] === 0x89;
  return { buf, ext: png ? '.png' : '.jpg', warning: 'image not optimised (no sharp, no sips)' };
}
