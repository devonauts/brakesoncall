// Frontmatter + Markdown for the static blog. No dependencies on purpose: the build runs inside `vite build`
// (a Vite plugin), on the Mac and on servers that only have `node`, and the posts come from one known writer
// (Urresta HQ's blog factory), so a small, strict CommonMark subset is enough:
//   headings, paragraphs, ul/ol (nested by indentation), blockquotes, fenced code, GFM tables, hr,
//   images (alone in a paragraph → <figure>), links, **bold**, *em*, `code`, ~~del~~, autolinks, hard breaks.
// Raw HTML in a post is ESCAPED, never rendered (the text comes from an LLM pipeline).

// ───────────── frontmatter ─────────────
// `key: value` lines. Values: JSON strings/arrays/numbers ("…", ["a","b"]), 'single quoted', or bare scalars.
export function parseFrontmatter(text) {
  const src = String(text ?? '').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const m = src.match(/^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/);
  if (!m) return { data: null, body: src };
  const data = {};
  for (const line of m[1].split('\n')) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (!kv) continue;
    data[kv[1]] = parseScalar(kv[2].trim());
  }
  return { data, body: src.slice(m[0].length) };
}
function parseScalar(v) {
  if (v === '') return '';
  if (v.startsWith('"') || v.startsWith('[') || v.startsWith('{')) {
    try { return JSON.parse(v); } catch { /* fall through */ }
    if (v.startsWith('[') && v.endsWith(']')) {
      return v.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    }
  }
  if (v.startsWith("'") && v.endsWith("'") && v.length >= 2) return v.slice(1, -1).replace(/''/g, "'");
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(v) && !/^\d{4}-/.test(v)) return Number(v);
  return v;
}
// Serialise with a fixed key order (unknown keys keep their order after the known ones).
export function stringifyFrontmatter(data, order = []) {
  const keys = [...order.filter((k) => k in data), ...Object.keys(data).filter((k) => !order.includes(k))];
  const val = (v) => (Array.isArray(v) ? JSON.stringify(v.map(String))
    : typeof v === 'number' || typeof v === 'boolean' ? String(v)
    : /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? String(v) : JSON.stringify(String(v ?? '')));
  return ['---', ...keys.map((k) => `${k}: ${val(data[k])}`), '---', ''].join('\n');
}

// ───────────── helpers ─────────────
export const escapeHtml = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const slugifyHeading = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80);
const SAFE_URL = /^(https?:\/\/|mailto:|tel:|\/|#|\.\.?\/)/i;
const safeUrl = (u) => (SAFE_URL.test(u) ? u : '#');

// ───────────── inline ─────────────
// `opts.link(href)` may rewrite a link (returns {href, external}); `opts.image(src, alt)` returns extra attributes.
function inline(text, opts, out) {
  const holds = [];
  const hold = (html) => `\u0000${holds.push(html) - 1}\u0000`;
  let s = String(text);
  // code spans first: nothing inside them is markup
  s = s.replace(/(`+)([\s\S]*?[^`])\1(?!`)/g, (m, ticks, code) => hold(`<code>${escapeHtml(code.trim())}</code>`));
  s = s.replace(/\\([\\`*_{}\[\]()#+\-.!~|>])/g, (m, c) => hold(escapeHtml(c)));
  // images, then links (link text may contain emphasis)
  s = s.replace(/!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"([^"]*)")?\s*\)/g, (m, alt, src, title) => {
    out.images.push(src);
    const extra = opts.image ? opts.image(src, alt) : '';
    return hold(`<img src="${escapeHtml(safeUrl(src))}" alt="${escapeHtml(alt)}"${title ? ` title="${escapeHtml(title)}"` : ''} loading="lazy" decoding="async"${extra || ''}>`);
  });
  s = s.replace(/\[([^\]]+)\]\(\s*<?([^)\s>]+)>?(?:\s+"([^"]*)")?\s*\)/g, (m, label, href, title) => {
    const r = opts.link ? opts.link(href) : { href, external: /^https?:/i.test(href) };
    out.links.push(r.href);
    const rel = r.external ? ' rel="noopener" target="_blank"' : '';
    return hold(`<a href="${escapeHtml(safeUrl(r.href))}"${title ? ` title="${escapeHtml(title)}"` : ''}${rel}>${emphasis(escapeHtml(label))}</a>`);
  });
  s = s.replace(/<(https?:\/\/[^\s>]+)>/g, (m, url) => { out.links.push(url); return hold(`<a href="${escapeHtml(url)}" rel="noopener" target="_blank">${escapeHtml(url)}</a>`); });
  s = emphasis(escapeHtml(s));
  s = s.replace(/(?: {2,}|\\)\n/g, '<br>\n');
  return s.replace(/\u0000(\d+)\u0000/g, (m, i) => holds[Number(i)]);
}
function emphasis(s) {
  return s
    .replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, '<strong>$2</strong>')
    .replace(/(^|[^*\w])\*(?=\S)([^*\n]*?\S)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/(^|[^\w])_(?=\S)([^_\n]*?\S)_(?!\w)/g, '$1<em>$2</em>')
    .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<del>$1</del>');
}

// ───────────── blocks ─────────────
const RE = {
  fence: /^ {0,3}(```|~~~)\s*([\w+-]*)\s*$/,
  heading: /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/,
  hr: /^ {0,3}([-*_])(\s*\1){2,}\s*$/,
  quote: /^ {0,3}>\s?/,
  item: /^( *)([-*+]|\d{1,9}[.)])\s+(.*)$/,
  tableSep: /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/,
};
const isBlockStart = (l) => RE.fence.test(l) || RE.heading.test(l) || RE.hr.test(l) || RE.quote.test(l) || RE.item.test(l);
const isTableAt = (lines, i) => lines[i].includes('|') && i + 1 < lines.length && lines[i + 1].includes('|') && RE.tableSep.test(lines[i + 1]);
const cells = (row) => row.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map((c) => c.trim());

function blocks(lines, opts, out, depth = 0) {
  const html = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    let m;
    if ((m = line.match(RE.fence))) {
      const body = [];
      i++;
      while (i < lines.length && !new RegExp('^ {0,3}' + m[1] + '\\s*$').test(lines[i])) body.push(lines[i++]);
      i++;
      html.push(`<pre><code${m[2] ? ` class="language-${escapeHtml(m[2])}"` : ''}>${escapeHtml(body.join('\n'))}</code></pre>`);
      continue;
    }
    if ((m = line.match(RE.heading))) {
      // The page template prints the title as the only H1: a body "# x" becomes an H2.
      const level = Math.max(2, m[1].length);
      const inner = inline(m[2], opts, out);
      const text = inner.replace(/<[^>]+>/g, '');
      let id = slugifyHeading(text) || 'section';
      while (out.ids.has(id)) id += '-x';
      out.ids.add(id);
      out.headings.push({ level, text, id });
      html.push(`<h${level} id="${id}">${inner}</h${level}>`);
      i++;
      continue;
    }
    if (RE.hr.test(line)) { html.push('<hr>'); i++; continue; }
    if (RE.quote.test(line)) {
      const body = [];
      while (i < lines.length && lines[i].trim() && (RE.quote.test(lines[i]) || !isBlockStart(lines[i]))) body.push(lines[i++].replace(RE.quote, ''));
      html.push(`<blockquote>${blocks(body, opts, out, depth + 1)}</blockquote>`);
      continue;
    }
    if ((m = line.match(RE.item))) {
      const ordered = /\d/.test(m[2]);
      const base = m[1].length;
      const items = [];
      let cur = null;
      while (i < lines.length) {
        const l = lines[i];
        const im = l.match(RE.item);
        if (im && im[1].length === base && /\d/.test(im[2]) === ordered) {
          cur = { lines: [im[3]], start: ordered ? parseInt(im[2], 10) : null };
          items.push(cur);
          i++;
          continue;
        }
        if (!l.trim()) {
          // a blank line ends the list unless the next line is indented content of the item
          const next = lines[i + 1];
          if (next !== undefined && next.trim() && /^\s/.test(next) && (next.match(/^ */)[0].length > base)) { cur.lines.push(''); i++; continue; }
          break;
        }
        const indent = l.match(/^ */)[0].length;
        if (indent > base) { cur.lines.push(l.slice(Math.min(indent, base + 4))); i++; continue; }
        if (!isBlockStart(l)) { cur.lines.push(l.trim()); i++; continue; }   // lazy continuation
        break;
      }
      const tag = ordered ? 'ol' : 'ul';
      const start = ordered && items[0].start !== 1 ? ` start="${items[0].start}"` : '';
      const lis = items.map((it) => {
        let inner = blocks(it.lines, opts, out, depth + 1);
        const single = inner.match(/^<p>([\s\S]*)<\/p>$/);
        if (single && !single[1].includes('</p>')) inner = single[1];
        else inner = inner.replace(/^<p>([\s\S]*?)<\/p>\n?(?=<(ul|ol)[ >])/, '$1');
        return `<li>${inner}</li>`;
      });
      html.push(`<${tag}${start}>${lis.join('')}</${tag}>`);
      continue;
    }
    if (isTableAt(lines, i)) {
      const head = cells(line);
      const align = cells(lines[i + 1]).map((c) => (/^:-+:$/.test(c) ? 'center' : /-:$/.test(c) ? 'right' : /^:/.test(c) ? 'left' : null));
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim() && lines[i].includes('|')) rows.push(cells(lines[i++]));
      const al = (j) => (align[j] ? ` style="text-align:${align[j]}"` : '');
      html.push(`<div class="blog-table"><table><thead><tr>${head.map((c, j) => `<th${al(j)}>${inline(c, opts, out)}</th>`).join('')}</tr></thead>` +
        `<tbody>${rows.map((r) => `<tr>${head.map((_, j) => `<td${al(j)}>${inline(r[j] ?? '', opts, out)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    // paragraph
    const para = [];
    while (i < lines.length && lines[i].trim() && !(para.length && isBlockStart(lines[i])) &&
           !isTableAt(lines, i)) {
      if (!para.length && isBlockStart(lines[i])) break;
      para.push(lines[i++]);
    }
    if (!para.length) { para.push(lines[i++]); }
    const text = para.join('\n').replace(/^\s+/gm, '');
    const lone = text.trim().match(/^!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"([^"]*)")?\s*\)$/);
    if (lone && depth === 0) {
      html.push(`<figure class="blog-figure">${inline(text.trim(), opts, out)}</figure>`);
    } else {
      html.push(`<p>${inline(text, opts, out)}</p>`);
    }
  }
  return html.join('\n');
}

// → { html, headings:[{level,text,id}], images:[src], links:[href], words }
export function renderMarkdown(md, opts = {}) {
  const out = { headings: [], images: [], links: [], ids: new Set() };
  const lines = String(md ?? '').replace(/\r\n?/g, '\n').replace(/\t/g, '    ').split('\n');
  const html = blocks(lines, opts, out);
  const words = (String(md).replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\]\([^)]*\)/g, ']').match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;
  return { html, headings: out.headings, images: out.images, links: out.links, words };
}

// Plain text of a Markdown snippet (for excerpts).
export const markdownToText = (md) => String(md ?? '')
  .replace(/```[\s\S]*?```/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/^#{1,6}\s+/gm, '').replace(/[*_`~>|]/g, '').replace(/^\s*([-+]|\d+[.)])\s+/gm, '').replace(/\s+/g, ' ').trim();
