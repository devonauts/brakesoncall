// Shape of the page objects scripts/blog/generate.mjs passes to render() (see that file).
export interface PostSummary {
  slug: string;
  lang: string;
  title: string;
  description: string;
  date: string;
  updated: string | null;
  author: string;
  image: string;
  imageAlt: string;
  imageWidth: number | null;
  imageHeight: number | null;
  tags: string[];
  url: string;
  excerpt: string;
  readingMinutes: number;
}
export interface Post extends PostSummary {
  html: string;
  headings: { level: number; text: string; id: string }[];
}
export interface IndexPage {
  kind: 'index'; lang: string; path: string; page: number; pages: number; posts: PostSummary[]; total: number;
  prev: string | null; next: string | null; alternates: Record<string, string>; rss: string | null;
}
export interface PostPage {
  kind: 'post'; lang: string; path: string; post: Post; related: PostSummary[]; alternates: Record<string, string>; rss: string;
}
export interface NotFoundPage {
  kind: 'notfound'; lang: string; path: string; alternates: Record<string, string>; recent: PostSummary[];
}
export type BlogPage = IndexPage | PostPage | NotFoundPage;
