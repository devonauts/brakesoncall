/**
 * Browser side of the static blog pages: hydrates the site's Navbar (mobile menu, session-aware links) and Footer
 * over the HTML rendered at build time. The article itself is static HTML.
 */
import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BlogHeader, BlogFooter } from './Chrome';
import '../index.css';
import './blog.css';

let path = window.location.pathname;
try { path = JSON.parse(document.getElementById('blog-data')?.textContent || '{}').path || path; } catch { /* no data */ }

// The session lives in localStorage (zustand persist), so a signed-in visitor's Navbar differs from the build-time
// HTML: React then simply re-renders that island on the client. That is expected, not an error worth logging.
const quiet = { onRecoverableError: () => {} };
const header = document.getElementById('blog-header');
const footer = document.getElementById('blog-footer');
if (header) hydrateRoot(header, <StrictMode><BlogHeader path={path} /></StrictMode>, quiet);
if (footer) hydrateRoot(footer, <StrictMode><BlogFooter path={path} /></StrictMode>, quiet);
