/**
 * The site's real Navbar and Footer, mounted on the static blog pages (server-rendered at build time by ssr.tsx,
 * hydrated in the browser by client.tsx). Same components as the SPA — the blog never has its own copy of the chrome.
 *
 * The blog pages are separate HTML documents, so router links must load a real page: the navigator below turns
 * every <Link> navigation into window.location.
 */
import { Router, createPath, type Navigator, type To } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

const toHref = (to: To) => (typeof to === 'string' ? to : createPath(to));
const pageLoadNavigator: Navigator = {
  createHref: toHref,
  push: (to: To) => window.location.assign(toHref(to)),
  replace: (to: To) => window.location.replace(toHref(to)),
  go: (n: number) => window.history.go(n),
};

export function BlogHeader({ path }: { path: string }) {
  return (
    <Router location={path} navigator={pageLoadNavigator}>
      <Navbar />
    </Router>
  );
}

export function BlogFooter({ path }: { path: string }) {
  return (
    <Router location={path} navigator={pageLoadNavigator}>
      <Footer />
    </Router>
  );
}
