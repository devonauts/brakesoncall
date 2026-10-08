// Types for vite.config.ts (the plugin itself is plain ESM shared by every site of the blog kit).
import type { Plugin, PluginOption } from 'vite';
export default function staticBlog(options?: { ssrEntry?: string; template?: string; ssrPlugins?: () => PluginOption[] }): Plugin;
