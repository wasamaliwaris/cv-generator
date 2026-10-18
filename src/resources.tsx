import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Clock3 } from 'lucide-react';
import { ARTICLES_A } from './articles-1';
import { ARTICLES_B } from './articles-2';
import { ARTICLES_C } from './articles-3';
import { ARTICLES_D } from './articles-4';
import { Reveal } from './reveal';
import { BackLink, PageHeading, usePageTitle } from './ui';

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

export const ARTICLES: Article[] = [...ARTICLES_A, ...ARTICLES_B, ...ARTICLES_C, ...ARTICLES_D];
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
  return <div className={`article-meta ${light ? 'article-meta-light' : ''}`}><span><BookOpen size={13} /> {article.category}</span><span><Clock3 size={13} /> {article.minutes} min read</span><span>Updated {article.updated}</span></div>;
}

function ResourceCard({ article }: { article: Article }) {
  return <Link className="resource-card" to={`/resources/${article.slug}`}><span className="resource-category">{article.category}</span><h2>{article.title}</h2><p>{article.excerpt}</p><span className="resource-card-foot"><span className="resource-minutes">{article.minutes} min read</span><span className="template-arrow"><ArrowRight size={16} /></span></span></Link>;
}

export function ResourcesPage() {
  usePageTitle('Guides & articles — PathCV');
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
  usePageTitle(article ? `${article.title} — PathCV Guides` : 'Guide not found — PathCV');
  useEffect(() => { window.scrollTo(0, 0); }, [slug]);
  const related = useMemo(() => (article ? relatedArticles(article) : []), [article]);
  if (!article) {
    return <main className="page-width standard-page article-page"><BackLink to="/resources">All guides & articles</BackLink><PageHeading eyebrow="NOT FOUND" title="That guide is not here." description="It may have moved. Browse the full collection instead." actions={<Link to="/resources" className="button button-primary">Browse guides</Link>} /></main>;
  }
  return <main className="page-width standard-page article-page">
    <BackLink to="/resources">All guides & articles</BackLink>
    <header className="article-header"><ArticleMeta article={article} /><h1>{article.title}</h1><p className="article-lede">{article.excerpt}</p></header>
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
