/**
 * Build-time renderer of the static blog (bundled for Node by scripts/blog/vite-plugin.mjs and called by
 * scripts/blog/generate.mjs). Returns the <body> markup of one page:
 *   #blog-header / #blog-footer  → the site's Navbar/Footer, hydrated in the browser by client.tsx
 *   <main>                       → the page itself, plain HTML (no JavaScript needed to read it)
 */
import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import { BlogHeader, BlogFooter } from './Chrome';
import { BlogIndex, BlogPost, BlogNotFound } from './pages';
import type { BlogPage } from './types';

function Body({ page }: { page: BlogPage }) {
  if (page.kind === 'index') return <BlogIndex page={page} />;
  if (page.kind === 'post') return <BlogPost page={page} />;
  return <BlogNotFound page={page} />;
}

export function render(page: BlogPage): string {
  const header = renderToString(<BlogHeader path={page.path} />);
  const main = renderToStaticMarkup(<Body page={page} />);
  const footer = renderToString(<BlogFooter path={page.path} />);
  return `<div class="min-h-screen flex flex-col">
    <div id="blog-header" class="sticky top-0 z-40">${header}</div>
    <main id="main" class="flex-1 bg-white">${main}</main>
    <div id="blog-footer">${footer}</div>
    </div>`;
}
