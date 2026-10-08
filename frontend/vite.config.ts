import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import staticBlog from './scripts/blog/vite-plugin.mjs'

// https://vite.dev/config/
export default defineConfig({
  // staticBlog: content/blog/*.md → static HTML pages under /blog/ (see scripts/blog/generate.mjs)
  plugins: [react(), tailwindcss(), staticBlog({ ssrEntry: 'src/blog/ssr.tsx', ssrPlugins: () => [react()] })],
})
