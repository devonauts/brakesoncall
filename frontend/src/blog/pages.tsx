/**
 * Blog page bodies (index, post, 404), rendered to static HTML at build time by ssr.tsx.
 * Same building blocks as the public pages: dark hero band, white sections, brand-500 accents, Button, Badge.
 */
import { ArrowRight, ArrowLeft, CalendarCheck, Clock, Newspaper } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import type { IndexPage, PostPage, NotFoundPage, PostSummary } from './types';

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));

// Button look as a real link (the SPA wraps <Button> in <Link>; a static page uses one <a>, no nested button).
// Same classes as components/ui/Button.tsx.
const BTN = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 cursor-pointer';
const BTN_VARIANT = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-sm',
  secondary: 'bg-dark text-white hover:bg-dark-light active:bg-gray-800 shadow-sm',
  outline: 'border-2 border-brand-500 text-brand-500 hover:bg-brand-50 active:bg-brand-100',
  ghost: 'text-gray-700 hover:bg-gray-100 active:bg-gray-200',
};
const BTN_SIZE = { sm: 'px-3 py-1.5 text-sm', md: 'px-5 py-2.5 text-sm', lg: 'px-8 py-3.5 text-base' };
// Tag pill: the Badge shape (components/ui/Badge.tsx) in brand colours.
const TAG_BASE = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold';
const TAG = `${TAG_BASE} bg-brand-50 text-brand-700`;
function LinkButton({ href, children, variant = 'primary', size = 'md', className = '' }:
  { href: string; children: React.ReactNode; variant?: keyof typeof BTN_VARIANT; size?: keyof typeof BTN_SIZE; className?: string }) {
  return <a href={href} className={`${BTN} ${BTN_VARIANT[variant]} ${BTN_SIZE[size]} ${className}`}>{children}</a>;
}

function Meta({ post, withAuthor = false, dark = false }: { post: PostSummary; withAuthor?: boolean; dark?: boolean }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
      {withAuthor && post.author && <span className={dark ? 'text-white font-semibold' : 'font-semibold text-gray-700'}>By {post.author}</span>}
      <span className="inline-flex items-center gap-1.5"><CalendarCheck className="w-4 h-4 text-brand-500" /><time dateTime={post.date}>{formatDate(post.date)}</time></span>
      <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4 text-brand-500" />{post.readingMinutes} min read</span>
    </div>
  );
}

function Cover({ post, eager = false, className = '' }: { post: PostSummary; eager?: boolean; className?: string }) {
  if (!post.image) return <div className={`bg-gradient-to-br from-dark to-dark-light ${className}`} aria-hidden="true" />;
  return (
    <img src={post.image} alt={post.imageAlt || post.title} width={post.imageWidth || undefined} height={post.imageHeight || undefined}
      loading={eager ? 'eager' : 'lazy'} decoding="async" className={`object-cover ${className}`} />
  );
}

function PostCard({ post, featured = false }: { post: PostSummary; featured?: boolean }) {
  return (
    <article className={`group bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col transition-all duration-200 hover:shadow-xl hover:shadow-gray-200/60 hover:-translate-y-0.5 ${featured ? 'lg:grid lg:grid-cols-2' : ''}`}>
      <a href={post.url} className="block overflow-hidden bg-gray-100" tabIndex={-1} aria-hidden="true">
        <Cover post={post} eager={featured} className={`w-full aspect-[1200/630] transition-transform duration-500 group-hover:scale-[1.03] ${featured ? 'lg:h-full' : ''}`} />
      </a>
      <div className={`flex flex-col gap-3 flex-1 ${featured ? 'p-6 sm:p-10 justify-center' : 'p-6'}`}>
        <Meta post={post} />
        <h2 className={`font-extrabold text-gray-900 leading-snug tracking-tight ${featured ? 'text-2xl sm:text-3xl' : 'text-lg'}`}>
          <a href={post.url} className="hover:text-brand-600 transition-colors">{post.title}</a>
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{post.excerpt}</p>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">{post.tags.slice(0, 3).map((t) => <span key={t} className={TAG}>{t}</span>)}</div>
        )}
        <a href={post.url} className="mt-auto pt-2 inline-flex items-center gap-1.5 text-brand-500 font-semibold text-sm hover:underline">
          Read article <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </article>
  );
}

function BookCta() {
  return (
    <section className="py-20 bg-brand-500">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Brakes Feeling Off?</h2>
        <p className="text-white/80 text-lg mb-8 max-w-lg mx-auto">
          Book your mobile brake service in under 2 minutes. We'll come to your home or office.
        </p>
        <LinkButton href="/book" variant="secondary" size="lg">
          Book Your Service Now
          <ArrowRight className="w-5 h-5" />
        </LinkButton>
      </div>
    </section>
  );
}

function Hero({ title, lead, children }: { title: string; lead: string; children?: React.ReactNode }) {
  return (
    <section className="bg-dark py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full mb-6">
          <span className="w-2 h-2 bg-brand-500 rounded-full" />
          <span className="text-white/90 text-sm font-semibold">Brake Care Blog</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight">{title}</h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">{lead}</p>
        {children}
      </div>
    </section>
  );
}

export function BlogIndex({ page }: { page: IndexPage }) {
  const [first, ...rest] = page.posts;
  const featured = page.page === 1 && first;
  return (
    <>
      <Hero title="Brake Care Tips From Our Technicians"
        lead="Warning signs, brake pads and rotors, costs and safety — straight from the mobile technicians who fix brakes in Austin driveways every day.">
        {page.total > 0 && page.pages > 1 && <p className="mt-6 text-sm text-gray-500">Page {page.page} of {page.pages}</p>}
      </Hero>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {page.posts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200">
              <EmptyState
                icon={<Newspaper className="w-8 h-8 text-brand-500" />}
                title="No articles yet"
                description="Our technicians are writing the first brake care guides. In the meantime, we can take a look at your brakes."
                action={<LinkButton href="/book">Book a Brake Service <ArrowRight className="w-4 h-4" /></LinkButton>}
              />
            </div>
          ) : (
            <>
              {featured && <div className="mb-8"><PostCard post={first} featured /></div>}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(featured ? rest : page.posts).map((p) => <PostCard key={p.slug} post={p} />)}
              </div>
            </>
          )}

          {page.pages > 1 && (
            <nav className="mt-12 pt-6 border-t border-gray-200 grid grid-cols-3 items-center gap-4" aria-label="Pagination">
              <div>{page.prev && <LinkButton href={page.prev} variant="outline" size="sm"><ArrowLeft className="w-4 h-4" /> Newer</LinkButton>}</div>
              <span className="text-sm text-gray-500 text-center">Page {page.page} of {page.pages}</span>
              <div className="text-right">{page.next && <LinkButton href={page.next} variant="outline" size="sm">Older <ArrowRight className="w-4 h-4" /></LinkButton>}</div>
            </nav>
          )}
        </div>
      </section>
      <BookCta />
    </>
  );
}

export function BlogPost({ page }: { page: PostPage }) {
  const { post, related } = page;
  const toc = post.headings.filter((h) => h.level === 2);
  return (
    <>
      <article>
        <header className="bg-dark pt-14 pb-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <a href="/blog/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to the blog
            </a>
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">{post.tags.map((t) => <span key={t} className={`${TAG_BASE} bg-brand-500/15 text-brand-300`}>{t}</span>)}</div>
            )}
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-[1.1] tracking-tight">{post.title}</h1>
            {post.description && <p className="mt-5 text-lg text-gray-400 leading-relaxed">{post.description}</p>}
            <div className="mt-6"><Meta post={post} withAuthor dark /></div>
          </div>
        </header>
        {post.image && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14">
            <Cover post={post} eager className="w-full aspect-[1200/630] rounded-2xl border border-gray-200 shadow-xl shadow-gray-300/40" />
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 xl:grid xl:grid-cols-[1fr_minmax(0,48rem)_1fr] xl:gap-10">
          <div className="boc-prose xl:col-start-2" dangerouslySetInnerHTML={{ __html: post.html }} />
          {toc.length >= 3 && (
            <aside className="hidden xl:block xl:col-start-3 sticky top-28 self-start max-w-60 border-l border-gray-200 pl-6" aria-label="In this article">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">In this article</p>
              <ol className="mt-4 space-y-3 text-sm">
                {toc.map((h) => <li key={h.id}><a href={`#${h.id}`} className="text-gray-600 hover:text-brand-600">{h.text}</a></li>)}
              </ol>
            </aside>
          )}
        </div>
      </article>
      <BookCta />
      {related.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-10">Keep Reading</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{related.map((p) => <PostCard key={p.slug} post={p} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}

export function BlogNotFound({ page }: { page: NotFoundPage }) {
  return (
    <>
      <Hero title="Article Not Found" lead="The article you are looking for does not exist or has moved.">
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <LinkButton href="/blog/" size="lg">Back to the blog <ArrowRight className="w-5 h-5" /></LinkButton>
          <LinkButton href="/book" variant="ghost" size="lg" className="text-white border border-white/20 hover:bg-white/10">Book a Service</LinkButton>
        </div>
      </Hero>
      {page.recent.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-10">Recent Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{page.recent.map((p) => <PostCard key={p.slug} post={p} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
