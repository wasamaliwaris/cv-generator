import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Clock3 } from 'lucide-react';
import { ARTICLES_A } from './articles-1';
import { ARTICLES_B } from './articles-2';
import { ARTICLES_C } from './articles-3';
import { ARTICLES_D } from './articles-4';
import { ARTICLES_E } from './articles-5';
import { Reveal } from './reveal';
import { BackLink, JsonLd, PageHeading, usePageMeta } from './ui';
import { SITE_URL } from './site';

export interface ArticleSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  tip?: string;
}

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  minutes: number;
  updated: string;
  intro: string[];
  sections: ArticleSection[];
  closing: string[];
}

export const ARTICLES: Article[] = [...ARTICLES_A, ...ARTICLES_B, ...ARTICLES_C, ...ARTICLES_D, ...ARTICLES_E];
export const ARTICLE_CATEGORIES = ['All', ...Array.from(new Set(ARTICLES.map((article) => article.category)))];

export function getArticle(slug: string | undefined): Article | undefined {
  return ARTICLES.find((article) => article.slug === slug);
}

export function relatedArticles(article: Article, count = 3): Article[] {
  const others = ARTICLES.filter((item) => item.slug !== article.slug);
  const sameCategory = others.filter((item) => item.category === article.category);
  const rest = others.filter((item) => item.category !== article.category);
  return [...sameCategory, ...rest].slice(0, count);
}

function ArticleMeta({ article, light = false }: { article: Article; light?: boolean }) {
  return <div className={`article-meta ${light ? 'article-meta-light' : ''}`}><span>By PathCV Editorial Team</span><span><BookOpen size={13} /> {article.category}</span><span><Clock3 size={13} /> {article.minutes} min read</span><span>Updated {article.updated}</span></div>;
}

function ArticleArt({ slug }: { slug: string }) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  const hue2 = (hue + 45) % 360;
  const gid = `ag-${slug}`;
  const motif = hash % 3;
  const w1 = 60 + (hash % 20);
  const w2 = 40 + ((hash >> 3) % 24);
  return <svg className="article-art" viewBox="0 0 400 200" aria-hidden="true" focusable="false">
    <defs><linearGradient id={gid} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={`hsl(${hue} 45% 90%)`} /><stop offset="1" stopColor={`hsl(${hue2} 48% 80%)`} /></linearGradient></defs>
    <rect width="400" height="200" fill={`url(#${gid})`} />
    <circle cx={330 - (hash % 70)} cy={46 + (hash % 36)} r="64" fill={`hsl(${hue} 55% 72%)`} fillOpacity="0.5" />
    <circle cx={52 + (hash % 44)} cy={158 - (hash % 26)} r="40" fill={`hsl(${hue2} 55% 68%)`} fillOpacity="0.45" />
    {motif === 0 && <g><rect x="152" y="36" width="96" height="128" rx="9" fill="#ffffff" opacity="0.94" /><rect x="164" y="54" width={w1} height="10" rx="5" fill={`hsl(${hue} 45% 42%)`} /><rect x="164" y="72" width={w2} height="7" rx="3.5" fill={`hsl(${hue} 25% 62%)`} /><rect x="164" y="86" width="72" height="7" rx="3.5" fill={`hsl(${hue} 22% 74%)`} /><rect x="164" y="100" width="60" height="7" rx="3.5" fill={`hsl(${hue} 22% 74%)`} /><rect x="164" y="114" width="66" height="7" rx="3.5" fill={`hsl(${hue} 22% 74%)`} /><circle cx="222" cy="146" r="11" fill={`hsl(${hue2} 50% 45%)`} /><path d="M217 146l3.5 3.5L228 142" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>}
    {motif === 1 && <g><rect x="132" y="52" width="136" height="96" rx="9" fill="#ffffff" opacity="0.94" /><rect x="144" y="70" width="112" height="9" rx="4.5" fill={`hsl(${hue} 22% 76%)`} /><rect x="144" y="87" width="88" height="9" rx="4.5" fill={`hsl(${hue} 22% 76%)`} /><rect x="144" y="104" width="100" height="9" rx="4.5" fill={`hsl(${hue} 22% 76%)`} /><rect x="144" y="121" width="64" height="9" rx="4.5" fill={`hsl(${hue} 45% 45%)`} /><circle cx="282" cy="132" r="30" fill="#ffffff" opacity="0.9" /><circle cx="282" cy="132" r="30" fill="none" stroke={`hsl(${hue2} 50% 42%)`} strokeWidth="7" /><line x1="304" y1="154" x2="322" y2="172" stroke={`hsl(${hue2} 50% 42%)`} strokeWidth="9" strokeLinecap="round" /></g>}
    {motif === 2 && <g><rect x="142" y="40" width="116" height="120" rx="9" fill="#ffffff" opacity="0.94" /><rect x="154" y="58" width="92" height="9" rx="4.5" fill={`hsl(${hue} 45% 42%)`} />{[0, 1, 2].map((row) => <g key={row}><circle cx="164" cy={88 + row * 22} r="8" fill={row < 2 ? `hsl(${hue2} 50% 45%)` : '#e3e9e4'} />{row < 2 && <path d={`M160.5 ${88 + row * 22}l2.5 2.5L167.5 ${86 + row * 22}`} stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />}<rect x="178" y={84 + row * 22} width={62 - row * 8} height="8" rx="4" fill={`hsl(${hue} 22% 76%)`} /></g>)}</g>}
  </svg>;
}

function ResourceCard({ article }: { article: Article }) {
  return <Link className="resource-card" to={`/resources/${article.slug}`}><span className="resource-art"><ArticleArt slug={article.slug} /></span><span className="resource-category">{article.category}</span><h2>{article.title}</h2><p>{article.excerpt}</p><span className="resource-card-foot"><span className="resource-minutes">{article.minutes} min read</span><span className="template-arrow"><ArrowRight size={16} /></span></span></Link>;
}

export function ResourcesPage() {
  usePageMeta({ title: 'Guides & articles \u2014 PathCV', description: 'Sixteen free, in-depth guides on ATS tailoring, CV writing, cover letters, and job search. Practical, honest, no signup.', path: '/resources' });
  const [filter, setFilter] = useState('All');
  const [featured, ...rest] = ARTICLES;
  const visible = rest.filter((article) => filter === 'All' || article.category === filter);
  return <main className="page-width standard-page resources-page">
    <PageHeading eyebrow="GUIDES & ARTICLES" title="Learn the craft behind the CV." description="In-depth, original guides on writing, tailoring, and sending a CV you can defend — written by the PathCV team, free to read, no signup." />
    <Reveal><article className="featured-article"><div><ArticleMeta article={featured} light /><h2>{featured.title}</h2><p>{featured.excerpt}</p><div className="featured-article-actions"><Link to={`/resources/${featured.slug}`} className="button button-primary">Read the guide <ArrowRight size={16} /></Link></div></div><div className="featured-article-mark" aria-hidden="true">Aa</div></article></Reveal>
    <div className="template-filters" role="group" aria-label="Filter articles">{ARTICLE_CATEGORIES.map((item) => <button type="button" key={item} className={filter === item ? 'active' : ''} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}</div>
    <div className="resource-grid">{visible.map((article, i) => <Reveal key={article.slug} delay={(i % 3) * 90}><ResourceCard article={article} /></Reveal>)}</div>
    {visible.length === 0 && <p className="resource-empty">No articles in this category yet — check back soon.</p>}
    <section className="article-cta"><div><h2>Put the advice to work.</h2><p>Build a tailored CV with ten templates, a plain-text check, and free PDF export.</p></div><div className="article-cta-actions"><Link to="/builder" className="button button-primary button-large">Create my CV free <ArrowRight size={18} /></Link><Link to="/templates" className="button button-outline button-large">Browse templates</Link></div></section>
  </main>;
}

export function ArticlePage() {
  const { slug } = useParams();
  const article = getArticle(slug);
  usePageMeta(article ? { title: `${article.title} \u2014 PathCV Guides`, description: article.excerpt, path: `/resources/${article.slug}` } : { title: 'Guide not found \u2014 PathCV', path: '/resources' });
  useEffect(() => { window.scrollTo(0, 0); }, [slug]);
  const related = useMemo(() => (article ? relatedArticles(article) : []), [article]);
  const articleJsonLd = article ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    author: { '@type': 'Organization', name: 'PathCV', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'PathCV', logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon-512.png` } },
    datePublished: '2026-10-01',
    dateModified: '2026-10-21',
    mainEntityOfPage: `${SITE_URL}/resources/${article.slug}`,
    image: `${SITE_URL}/og-image.png`,
  } : null;
  if (!article) {
    return <main className="page-width standard-page article-page"><BackLink to="/resources">All guides & articles</BackLink><PageHeading eyebrow="NOT FOUND" title="That guide is not here." description="It may have moved. Browse the full collection instead." actions={<Link to="/resources" className="button button-primary">Browse guides</Link>} /></main>;
  }
  return <main className="page-width standard-page article-page">
    {articleJsonLd && <JsonLd data={articleJsonLd} />}
    <BackLink to="/resources">All guides & articles</BackLink>
    <header className="article-header"><ArticleMeta article={article} /><h1>{article.title}</h1><p className="article-lede">{article.excerpt}</p></header>
    <div className="article-hero-art"><ArticleArt slug={article.slug} /></div>
    <nav className="article-toc" aria-label="In this guide"><strong>On this page</strong><ol>{article.sections.map((section, index) => <li key={section.heading}><a href={`#sec-${index + 1}`}>{section.heading}</a></li>)}</ol></nav>
    <div className="article-body">
      {article.intro.map((paragraph, index) => <p key={`intro-${index}`}>{paragraph}</p>)}
      {article.sections.map((section, index) => <section key={section.heading} id={`sec-${index + 1}`}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph, p) => <p key={p}>{paragraph}</p>)}{section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}{section.tip && <aside className="article-tip"><strong>Tip.</strong> {section.tip}</aside>}</section>)}
      {article.closing.map((paragraph, index) => <p key={`closing-${index}`}><em>{paragraph}</em></p>)}
    </div>
    <section className="article-cta"><div><h2>Put this guide to work.</h2><p>Build a tailored CV with ten templates, a plain-text check, and free PDF export.</p></div><div className="article-cta-actions"><Link to="/builder" className="button button-primary button-large">Create my CV free <ArrowRight size={18} /></Link><Link to="/templates" className="button button-outline button-large">Browse templates</Link></div></section>
    <section className="related-section"><div className="section-heading-row"><h2>Keep reading.</h2><Link to="/resources" className="arrow-link">All guides <ArrowRight size={16} /></Link></div><div className="resource-grid">{related.map((item) => <ResourceCard key={item.slug} article={item} />)}</div></section>
    <p className="article-back"><Link to="/resources"><ArrowLeft size={15} /> Back to all guides & articles</Link></p>
  </main>;
}
