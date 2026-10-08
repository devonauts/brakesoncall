// Static blog generator. Runs at the end of `vite build` (see vite-plugin.mjs) and writes REAL HTML files — crawlable
// without JavaScript — next to the SPA:
//
//   <prefix>/blog/index.html, <prefix>/blog/page/N/index.html   index with pagination (empty state when 0 posts)
//   <prefix>/blog/<slug>/index.html                              one page per post (title, description, canonical,
//                                                                Open Graph, Twitter, BlogPosting + Breadcrumb JSON-LD)
//   <prefix>/blog/404.html                                       served with a real 404 for unknown blog URLs
//   <prefix>/blog/rss.xml                                        feed (only when the language has posts)
//   sitemap.xml (the site's own entries + every blog URL), robots.txt (only if the site has none)
//
// The page bodies come from the site's React components (src/blog/ssr.jsx → render(page)), so the header, footer,
// fonts and colours are the site's own. Anything wrong (missing frontmatter, image or internal route; duplicate
// slug/title; a generated link that points nowhere) FAILS the build: a broken blog never reaches the server.
import fs from 'node:fs';
import path from 'node:path';
import {
  SITE, LIVE, PUBLIC_IMG, LANGS, readAll, checkPost, knownRoutes, renderMarkdown, localPath, postPath, indexPath, blogBase,
  absUrl, excerptOf, readingMinutes, loadPlan, familiesOf, imageSizeOf, todayIn,
} from './lib.mjs';
import { escapeHtml as esc } from './md.mjs';

const jsonLd = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
const xmlEsc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rfc822 = (d) => new Date(d + 'T12:00:00Z').toUTCString();

function head({ title, description, canonical, robots = 'index,follow,max-image-preview:large', type = 'website', image, imageAlt, imageSize,
  lang, alternates = {}, prev, next, rss, article, ld = [] }) {
  const og = SITE.langs[lang].ogLocale || (lang === 'es' ? 'es_ES' : 'en_US');
  const imgAbs = image ? absUrl(image) : SITE.defaultImage ? absUrl(SITE.defaultImage) : null;
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    `<link rel="canonical" href="${esc(absUrl(canonical))}">`,
    `<meta name="robots" content="${robots}">`,
    ...Object.entries(alternates).map(([l, p]) => `<link rel="alternate" hreflang="${l}" href="${esc(absUrl(p))}">`),
    ...(Object.keys(alternates).length > 1 && alternates[SITE.defaultLang] ? [`<link rel="alternate" hreflang="x-default" href="${esc(absUrl(alternates[SITE.defaultLang]))}">`] : []),
    prev ? `<link rel="prev" href="${esc(absUrl(prev))}">` : '',
    next ? `<link rel="next" href="${esc(absUrl(next))}">` : '',
    rss ? `<link rel="alternate" type="application/rss+xml" title="${esc(SITE.ui[lang].rssTitle)}" href="${esc(absUrl(rss))}">` : '',
    `<meta property="og:site_name" content="${esc(SITE.name)}">`,
    `<meta property="og:locale" content="${og}">`,
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:url" content="${esc(absUrl(canonical))}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    imgAbs ? `<meta property="og:image" content="${esc(imgAbs)}">` : '',
    imgAbs && imageSize ? `<meta property="og:image:width" content="${imageSize.width}">\n<meta property="og:image:height" content="${imageSize.height}">` : '',
    imgAbs && imageAlt ? `<meta property="og:image:alt" content="${esc(imageAlt)}">` : '',
    ...(article ? [`<meta property="article:published_time" content="${article.published}">`, article.modified ? `<meta property="article:modified_time" content="${article.modified}">` : '',
      ...article.tags.map((t) => `<meta property="article:tag" content="${esc(t)}">`)] : []),
    `<meta name="twitter:card" content="${imgAbs ? 'summary_large_image' : 'summary'}">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(description)}">`,
    imgAbs ? `<meta name="twitter:image" content="${esc(imgAbs)}">` : '',
    ...ld.map(jsonLd),
  ];
  return tags.filter(Boolean).join('\n    ');
}

function fill(template, { lang, headHtml, bodyHtml, data }) {
  let html = template.replace(/<html[^>]*>/i, `<html lang="${lang}">`);
  if (!html.includes('<!--blog-head-->') || !html.includes('<!--blog-body-->')) throw new Error('blog template lost its <!--blog-head--> / <!--blog-body--> markers');
  html = html.replace('<!--blog-head-->', headHtml);
  const dataTag = `<script id="blog-data" type="application/json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
  return html.replace('<!--blog-body-->', `${bodyHtml}\n    ${dataTag}`);
}

function write(outDir, urlPath, html) {
  const f = urlPath.endsWith('/') ? path.join(outDir, urlPath, 'index.html') : path.join(outDir, urlPath);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html);
  return f;
}

const breadcrumb = (lang, items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: absUrl(p) })) });

// ───────────── main ─────────────
export async function generate({ outDir, templateFile, render, log = (m) => console.log(m) }) {
  const template = fs.readFileSync(templateFile, 'utf8');
  fs.rmSync(templateFile, { force: true });
  const live = readAll(LIVE);

  // 1. validate the content (fails the build)
  const routes = knownRoutes(live), titles = new Map(), slugs = new Set(), errors = [], warnings = [];
  const today = todayIn();
  for (const p of live) {
    const r = checkPost(p, { routes, imageDirs: [PUBLIC_IMG], titles, slugs });
    errors.push(...r.errors.map((e) => `${path.basename(p.file)}: ${e}`));
    warnings.push(...r.warnings.map((w) => `${path.basename(p.file)}: ${w}`));
    if (p.date > today) warnings.push(`${path.basename(p.file)}: dated ${p.date}, in the future (it is published anyway)`);
  }
  for (const w of warnings) log(`  ▲ blog: ${w}`);
  if (errors.length) throw new Error(`blog: ${errors.length} problem(s) in content/blog/:\n  - ${errors.join('\n  - ')}`);

  // 2. render every post body once
  const plan = loadPlan();
  const families = familiesOf(plan, live);
  const imgAttrs = (src) => {
    if (!src.startsWith('/blog/img/')) return '';
    const s = imageSizeOf(path.join(PUBLIC_IMG, decodeURIComponent(src.slice('/blog/img/'.length))));
    return s ? ` width="${s.width}" height="${s.height}"` : '';
  };
  const posts = live.map((p) => {
    const md = renderMarkdown(p.body, {
      link: (href) => { const lp = localPath(href); return lp !== null ? { href: lp, external: false } : { href, external: /^https?:/i.test(href) }; },
      image: (src) => imgAttrs(src),
    });
    const url = postPath(p.slug, p.lang);
    const cover = p.image ? imageSizeOf(path.join(PUBLIC_IMG, decodeURIComponent(p.image.slice('/blog/img/'.length)))) : null;
    return { slug: p.slug, lang: p.lang, title: p.title, description: p.description, date: p.date, updated: p.updated, author: p.author,
      image: p.image, imageAlt: p.imageAlt, imageWidth: cover && cover.width, imageHeight: cover && cover.height, tags: p.tags,
      url, excerpt: excerptOf(p), readingMinutes: readingMinutes(md.words), html: md.html, headings: md.headings };
  });
  const summary = ({ html, headings, ...s }) => s;
  const written = [];

  // 3. pages per language
  for (const lang of LANGS) {
    const ui = SITE.ui[lang];
    const mine = posts.filter((p) => p.lang === lang).sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
    const per = SITE.perPage || 9;
    const pages = Math.max(1, Math.ceil(mine.length / per));
    const langAlternates = Object.fromEntries(LANGS.filter((l) => l === lang || posts.some((p) => p.lang === l)).map((l) => [l, blogBase(l)]));
    for (let n = 1; n <= pages; n++) {
      const p = indexPath(lang, n);
      const list = mine.slice((n - 1) * per, n * per).map(summary);
      const page = { kind: 'index', lang, path: p, page: n, pages, posts: list, total: mine.length,
        prev: n > 1 ? indexPath(lang, n - 1) : null, next: n < pages ? indexPath(lang, n + 1) : null,
        alternates: n === 1 ? langAlternates : { [lang]: p }, rss: mine.length ? `${blogBase(lang)}rss.xml` : null };
      const title = n > 1 ? `${ui.indexTitle} · ${ui.pageLabel} ${n}` : ui.indexTitle;
      const headHtml = head({ title, description: ui.indexDescription, canonical: p, lang, alternates: page.alternates, prev: page.prev, next: page.next, rss: page.rss,
        robots: mine.length ? 'index,follow' : 'noindex,follow',
        ld: [{ '@context': 'https://schema.org', '@type': 'Blog', name: ui.indexTitle, description: ui.indexDescription, url: absUrl(p), inLanguage: lang,
          publisher: { '@type': 'Organization', name: SITE.name, url: SITE.site },
          blogPost: list.map((x) => ({ '@type': 'BlogPosting', headline: x.title, url: absUrl(x.url), datePublished: x.date })) },
          breadcrumb(lang, [[SITE.name, SITE.langs[lang].home || '/'], [ui.blogName, blogBase(lang)]])] });
      written.push(write(outDir, p, fill(template, { lang, headHtml, bodyHtml: render(page), data: { kind: 'index', lang, path: p, alternates: page.alternates } })));
    }
    for (const post of mine) {
      const related = mine.filter((x) => x.slug !== post.slug).map((x) => ({ x, score: x.tags.filter((t) => post.tags.includes(t)).length }))
        .sort((a, b) => b.score - a.score || b.x.date.localeCompare(a.x.date)).slice(0, 3).map((r) => summary(r.x));
      const alternates = families.get(post.url) || { [lang]: post.url };
      const page = { kind: 'post', lang, path: post.url, post, related, alternates, rss: `${blogBase(lang)}rss.xml` };
      const published = `${post.date}T09:00:00${SITE.tzOffset || '-06:00'}`;
      const modified = post.updated ? `${post.updated}T09:00:00${SITE.tzOffset || '-06:00'}` : null;
      const headHtml = head({ title: `${post.title} | ${SITE.name}`, description: post.description, canonical: post.url, type: 'article', lang, alternates, rss: page.rss,
        image: post.image, imageAlt: post.imageAlt, imageSize: post.imageWidth ? { width: post.imageWidth, height: post.imageHeight } : null,
        article: { published, modified, tags: post.tags },
        ld: [{ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.description, inLanguage: lang,
          image: post.image ? [absUrl(post.image)] : undefined, datePublished: published, dateModified: modified || published,
          author: { '@type': SITE.authorType || 'Organization', name: post.author || SITE.name },
          publisher: { '@type': 'Organization', name: SITE.name, url: SITE.site, ...(SITE.logo ? { logo: { '@type': 'ImageObject', url: absUrl(SITE.logo) } } : {}) },
          mainEntityOfPage: { '@type': 'WebPage', '@id': absUrl(post.url) }, keywords: post.tags.join(', ') || undefined, wordCount: undefined },
          breadcrumb(lang, [[SITE.name, SITE.langs[lang].home || '/'], [ui.blogName, blogBase(lang)], [post.title, post.url]])] });
      written.push(write(outDir, post.url, fill(template, { lang, headHtml, bodyHtml: render(page), data: { kind: 'post', lang, path: post.url, alternates } })));
    }
    // 404 (Flask/nginx serve it with status 404 for unknown /blog/ URLs)
    const nf = { kind: 'notfound', lang, path: `${blogBase(lang)}404.html`, alternates: { [lang]: blogBase(lang) }, recent: mine.slice(0, 3).map(summary) };
    written.push(write(outDir, nf.path, fill(template, { lang, bodyHtml: render(nf), data: { kind: 'notfound', lang, path: nf.path, alternates: nf.alternates },
      headHtml: `<title>${esc(ui.notFoundTitle)} | ${esc(SITE.name)}</title>\n    <meta name="robots" content="noindex,follow">` })));
    // RSS
    const rssFile = path.join(outDir, blogBase(lang), 'rss.xml');
    if (mine.length) {
      fs.writeFileSync(rssFile, `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n` +
        `<title>${xmlEsc(ui.rssTitle)}</title>\n<link>${xmlEsc(absUrl(blogBase(lang)))}</link>\n<description>${xmlEsc(ui.indexDescription)}</description>\n<language>${lang}</language>\n` +
        `<atom:link href="${xmlEsc(absUrl(blogBase(lang) + 'rss.xml'))}" rel="self" type="application/rss+xml"/>\n` +
        mine.slice(0, 30).map((p) => `<item><title>${xmlEsc(p.title)}</title><link>${xmlEsc(absUrl(p.url))}</link><guid>${xmlEsc(absUrl(p.url))}</guid>` +
          `<pubDate>${rfc822(p.date)}</pubDate><description>${xmlEsc(p.description)}</description></item>`).join('\n') + '\n</channel>\n</rss>\n');
    } else fs.rmSync(rssFile, { force: true });
  }

  // 4. sitemap.xml: keep the site's own entries (public/sitemap.xml) or SITE.sitemap, then add the blog
  const smFile = path.join(outDir, 'sitemap.xml');
  let base = [];
  if (fs.existsSync(smFile)) {
    const xml = fs.readFileSync(smFile, 'utf8');
    base = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1].trim()).filter((u) => !/<loc>[^<]*\/blog\//.test(u));
  } else {
    base = (SITE.sitemap || ['/']).map((p) => `<loc>${xmlEsc(absUrl(p))}</loc>`);
  }
  const blogEntries = [];
  for (const lang of LANGS) {
    const mine = posts.filter((p) => p.lang === lang);
    if (!mine.length) continue;
    const pages = Math.ceil(mine.length / (SITE.perPage || 9));
    const newest = mine.map((p) => p.updated || p.date).sort().pop();
    for (let n = 1; n <= pages; n++) blogEntries.push(`<loc>${xmlEsc(absUrl(indexPath(lang, n)))}</loc>${n === 1 ? `\n    <lastmod>${newest}</lastmod>` : ''}`);
    for (const p of mine) blogEntries.push(`<loc>${xmlEsc(absUrl(p.url))}</loc>\n    <lastmod>${p.updated || p.date}</lastmod>`);
  }
  fs.writeFileSync(smFile, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    [...base, ...blogEntries].map((u) => `  <url>\n    ${u.replace(/\n\s*/g, '\n    ')}\n  </url>`).join('\n') + '\n</urlset>\n');
  const robots = path.join(outDir, 'robots.txt');
  if (!fs.existsSync(robots)) fs.writeFileSync(robots, `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${absUrl('/sitemap.xml')}\n`);
  else if (!/^sitemap:/im.test(fs.readFileSync(robots, 'utf8'))) fs.appendFileSync(robots, `\nSitemap: ${absUrl('/sitemap.xml')}\n`);

  // 5. every local href/src of the generated pages must resolve (a file in outDir, a blog page, or a SPA route)
  const spa = new Set(SITE.routes || ['/']);
  const resolves = (u) => {
    const p = decodeURIComponent(u.split('#')[0].split('?')[0]);
    if (!p || spa.has(p) || spa.has(p.replace(/\/$/, '')) || spa.has(p + '/')) return true;
    const f = path.join(outDir, p);
    return (fs.existsSync(f) && fs.statSync(f).isFile()) || fs.existsSync(path.join(f, 'index.html'));
  };
  const broken = [];
  for (const f of written) {
    const html = fs.readFileSync(f, 'utf8');
    for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
      const u = m[1].replace(/&amp;/g, '&');
      if (!u.startsWith('/') || u.startsWith('//')) continue;
      if (!resolves(u)) broken.push(`${path.relative(outDir, f)} → ${u}`);
    }
  }
  if (broken.length) throw new Error(`blog: ${broken.length} broken link(s) in the generated pages:\n  - ${[...new Set(broken)].join('\n  - ')}`);
  const counts = LANGS.map((l) => `${l}: ${posts.filter((p) => p.lang === l).length}`).join(', ');
  log(`  ✓ blog: ${written.length} pages (${counts} posts), sitemap.xml with ${base.length + blogEntries.length} URLs`);
  return { pages: written.length, posts: posts.length, sitemap: base.length + blogEntries.length };
}
