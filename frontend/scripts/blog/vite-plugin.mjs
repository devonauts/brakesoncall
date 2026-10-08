// Vite plugin: makes the static blog part of every `vite build` (so `npm run build`, `npx vite build` and any
// existing deploy that builds the frontend all ship it).
//   1. adds blog.html as a second page of the client build → Vite injects the hashed CSS/JS of the blog islands;
//   2. after the bundle is written, builds src/blog/ssr.(jsx|tsx) for Node (.blog-ssr/, git-ignored) and runs
//      scripts/blog/generate.mjs with its render(); generate removes blog.html from the output again.
// BLOG_SKIP=1 skips the generator (emergency builds only: the blog pages would be missing).
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export default function staticBlog({ ssrEntry = 'src/blog/ssr.jsx', template = 'blog.html', ssrPlugins = () => [] } = {}) {
  let cfg;
  const inner = () => process.env.__BLOG_SSR_BUILD === '1';
  return {
    name: 'static-blog',
    apply: 'build',
    config(user) {
      if (inner() || (user.build && user.build.ssr)) return undefined;
      const root = path.resolve(user.root || process.cwd());
      const prev = (user.build && user.build.rollupOptions && user.build.rollupOptions.input) || { main: path.join(root, 'index.html') };
      const input = typeof prev === 'string' ? { main: prev } : Array.isArray(prev) ? Object.fromEntries(prev.map((p, i) => [`p${i}`, p])) : { ...prev };
      input.blog = path.join(root, template);
      return { build: { rollupOptions: { input } } };
    },
    configResolved(c) { cfg = c; },
    async closeBundle() {
      if (inner() || cfg.build.ssr || process.env.BLOG_SKIP === '1') return;
      const outDir = path.resolve(cfg.root, cfg.build.outDir);
      const ssrOut = path.join(cfg.root, '.blog-ssr');
      const { build } = await import('vite');
      process.env.__BLOG_SSR_BUILD = '1';
      try {
        await build({
          root: cfg.root, configFile: false, mode: cfg.mode, logLevel: 'warn', publicDir: false,
          plugins: ssrPlugins(), resolve: cfg.resolve && cfg.resolve.alias ? { alias: cfg.resolve.alias } : undefined,
          build: { ssr: path.join(cfg.root, ssrEntry), outDir: ssrOut, emptyOutDir: true, copyPublicDir: false, minify: false,
            rollupOptions: { output: { format: 'esm', entryFileNames: 'ssr.mjs' } } },
        });
      } finally { delete process.env.__BLOG_SSR_BUILD; }
      const mod = await import(pathToFileURL(path.join(ssrOut, 'ssr.mjs')).href + `?t=${Date.now()}`);
      const { generate } = await import('./generate.mjs');
      await generate({ outDir, templateFile: path.join(outDir, template), render: mod.render });
    },
  };
}
