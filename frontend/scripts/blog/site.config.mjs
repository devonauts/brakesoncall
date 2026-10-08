// Brakes on Call — values of the static blog that are specific to this site. The rest of scripts/blog/ is the shared kit.
export default {
  company: 'boc',                              // Urresta HQ company key (blogs.json → companies.boc)
  name: 'Brakes on Call',
  site: 'https://brakesoncall.com',
  tz: 'America/Chicago',                       // release dates are days in Austin's zone (HQ slots for "boc")
  tzOffset: '-06:00',
  defaultLang: 'en',
  langs: {
    en: { prefix: '', ogLocale: 'en_US', home: '/' },
  },
  perPage: 9,
  defaultAuthor: 'Brakes on Call',
  logo: '/brakesoncall.png',
  defaultImage: '/og-image.jpg',
  // SPA routes a post may link to (checked at build time) — keep in sync with src/App.tsx (public routes).
  routes: ['/', '/services', '/book', '/about', '/contact', '/privacy', '/terms', '/login', '/register'],
  // The site's own public/sitemap.xml is kept as is by the generator (blog URLs are appended); this list is only the
  // fallback and the "pages" HQ may link to.
  sitemap: ['/', '/services', '/book', '/about', '/contact', '/privacy', '/terms'],
  categories: {
    en: ['brake maintenance', 'warning signs', 'brake pads', 'rotors', 'safety', 'mobile service', 'costs'],
  },
  ui: {
    en: {
      blogName: 'Blog',
      indexTitle: 'Brake Care Blog | Brakes on Call — Mobile Brake Service in Austin',
      indexDescription: 'Brake care tips from the Brakes on Call mobile technicians: warning signs, brake pads and rotors, costs and how to keep your car stopping safely in Austin, TX.',
      rssTitle: 'Brakes on Call Blog',
      pageLabel: 'page',
      notFoundTitle: 'Article not found',
    },
  },
};
