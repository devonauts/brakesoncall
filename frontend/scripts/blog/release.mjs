#!/usr/bin/env node
// Staged publishing (the drip). IDEMPOTENT and date-driven:
//
//   content/blog-pending/<slug>.md       → content/blog/<slug>.md          (date set to the real release day)
//   content/blog-pending/img/<file>      → public/blog/img/<file>
//
// for every slug of scripts/blog/release-plan.json whose date is today or earlier (site time zone). A post whose
// images are missing, or that fails the post check, stays pending and is reported. The build (generate.mjs)
// validates everything again; publicar.sh reverts the move if the build fails.
//
// USAGE
//   node scripts/blog/release.mjs --status            published / pending / next dates
//   node scripts/blog/release.mjs                     release everything due today
//   node scripts/blog/release.mjs --dry-run           same, touching nothing
//   node scripts/blog/release.mjs --until 2026-10-20  release everything due up to that day
//   node scripts/blog/release.mjs --json              machine-readable result (used by publicar.sh)
import fs from 'node:fs';
import path from 'node:path';
import { LIVE, PENDING, PENDING_IMG, PUBLIC_IMG, loadPlan, readPost, readAll, checkPost, knownRoutes, todayIn, DATE_RE, absUrl, postPath } from './lib.mjs';

const where = (slug) => (fs.existsSync(path.join(LIVE, slug + '.md')) ? 'live' : fs.existsSync(path.join(PENDING, slug + '.md')) ? 'pending' : 'missing');

export function release({ until = todayIn(), dry = false } = {}) {
  const plan = loadPlan();
  const out = { released: [], held: [], until };
  const due = Object.entries(plan.dates).filter(([, d]) => DATE_RE.test(d) && d <= until).sort((a, b) => a[1].localeCompare(b[1]) || a[0].localeCompare(b[0]));
  if (!due.length) return out;
  const routes = knownRoutes([...readAll(LIVE), ...readAll(PENDING)]);
  for (const [slug, date] of due) {
    const st = where(slug);
    if (st !== 'pending') { if (st === 'missing') out.held.push({ slug, why: 'neither live nor pending' }); continue; }
    const imgs = (plan.posts[slug] && plan.posts[slug].images) || [];
    const missing = imgs.filter((n) => !fs.existsSync(path.join(PENDING_IMG, n)) && !fs.existsSync(path.join(PUBLIC_IMG, n)));
    if (missing.length) { out.held.push({ slug, why: `missing images ${missing.join(', ')}` }); continue; }
    const post = readPost(path.join(PENDING, slug + '.md'));
    const chk = checkPost(post, { routes, imageDirs: [PENDING_IMG, PUBLIC_IMG] });
    if (chk.errors.length) { out.held.push({ slug, why: chk.errors.join(' · ') }); continue; }
    if (!dry) {
      fs.mkdirSync(PUBLIC_IMG, { recursive: true });
      fs.mkdirSync(LIVE, { recursive: true });
      for (const n of imgs) {
        const src = path.join(PENDING_IMG, n);
        // shared by another language edition that is still pending? copy instead of move
        const sharedLater = Object.entries(plan.posts).some(([s, v]) => s !== slug && where(s) === 'pending' && (v.images || []).includes(n) && !due.some(([d]) => d === s));
        if (fs.existsSync(src)) sharedLater ? fs.copyFileSync(src, path.join(PUBLIC_IMG, n)) : fs.renameSync(src, path.join(PUBLIC_IMG, n));
      }
      const md = fs.readFileSync(post.file, 'utf8').replace(/^date:.*$/m, `date: ${date}`);
      fs.writeFileSync(path.join(LIVE, slug + '.md'), md);
      fs.rmSync(post.file);
    }
    out.released.push({ slug, date, lang: post.lang, item: (plan.posts[slug] || {}).item ?? null, url: absUrl(postPath(slug, post.lang)) });
  }
  return out;
}

export function status(until = todayIn()) {
  const plan = loadPlan();
  const pending = {};
  let live = 0, waiting = 0, missing = 0;
  for (const [slug, date] of Object.entries(plan.dates)) {
    const st = where(slug);
    if (st === 'live') live++;
    else if (st === 'pending') { waiting++; pending[date] = (pending[date] || 0) + 1; }
    else missing++;
  }
  const lines = [`Published: ${live}   ·   Pending: ${waiting}${missing ? `   ·   MISSING: ${missing}` : ''}`];
  const next = Object.keys(pending).sort().slice(0, 10);
  if (next.length) { lines.push('Next dates:'); for (const d of next) lines.push(`  ${d}  ${String(pending[d]).padStart(3)}${d <= until ? '  (due)' : ''}`); }
  else lines.push('Nothing pending.');
  return lines.join('\n');
}

function main() {
  const a = process.argv.slice(2);
  const i = a.indexOf('--until');
  const until = i >= 0 ? a[i + 1] : todayIn();
  if (!DATE_RE.test(until)) { console.error('--until YYYY-MM-DD'); process.exit(2); }
  if (a.includes('--status')) { console.log(status(until)); return; }
  const r = release({ until, dry: a.includes('--dry-run') });
  if (a.includes('--json')) { console.log(JSON.stringify(r)); return; }
  for (const x of r.released) console.log(`  + ${x.date}  ${x.slug}`);
  for (const x of r.held) console.log(`  ! ${x.slug}: ${x.why} (stays pending)`);
  console.log(r.released.length ? `\nReleased: ${r.released.length}${a.includes('--dry-run') ? ' (dry run)' : ''}` : 'Nothing due.');
  console.log(status(until));
}

if (import.meta.url === `file://${process.argv[1]}`) main();
