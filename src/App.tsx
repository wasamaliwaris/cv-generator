import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider } from './app-context';
import { ThemeProvider } from './theme';
import { ErrorBoundary } from './error-boundary';
import { Footer, SiteHeader, SkipLink } from './ui';

const LandingPage = lazy(() => import('./landing').then((m) => ({ default: m.LandingPage })));
const BuilderPage = lazy(() => import('./builder').then((m) => ({ default: m.BuilderPage })));
const ExpressPage = lazy(() => import('./express').then((m) => ({ default: m.ExpressPage })));
const CoverLetterPage = lazy(() => import('./cover-letter').then((m) => ({ default: m.CoverLetterPage })));
const AboutPage = lazy(() => import('./pages').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages').then((m) => ({ default: m.ContactPage })));
const HelpPage = lazy(() => import('./pages').then((m) => ({ default: m.HelpPage })));
const MyCVsPage = lazy(() => import('./pages').then((m) => ({ default: m.MyCVsPage })));
const PrivacyPage = lazy(() => import('./pages').then((m) => ({ default: m.PrivacyPage })));
const ProfilePage = lazy(() => import('./pages').then((m) => ({ default: m.ProfilePage })));
const TemplatesPage = lazy(() => import('./pages').then((m) => ({ default: m.TemplatesPage })));
const TermsPage = lazy(() => import('./pages').then((m) => ({ default: m.TermsPage })));
const ArticlePage = lazy(() => import('./resources').then((m) => ({ default: m.ArticlePage })));
const ResourcesPage = lazy(() => import('./resources').then((m) => ({ default: m.ResourcesPage })));

function NotFoundPage() {
  return <main className="page-width not-found-page"><div className="not-found-mark">?</div><div className="eyebrow">PAGE NOT FOUND</div><h1>That path is not here.</h1><p>The page may have moved, or the address may be incomplete.</p><Link to="/" className="button button-primary button-large">Back to PathCV</Link></main>;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function RouteLoading() {
  return <main className="page-width route-loading" aria-label="Loading page"><span className="route-spinner" aria-hidden="true" /><p>Loading…</p></main>;
}

function AppShell() {
  const { pathname } = useLocation();
  return <div className="app-shell"><SkipLink /><SiteHeader /><ErrorBoundary key={pathname}><ScrollToTop /><Suspense fallback={<RouteLoading />}><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/builder" element={<BuilderPage />} />
    <Route path="/express" element={<ExpressPage />} />
    <Route path="/templates" element={<TemplatesPage />} />
    <Route path="/profile" element={<ProfilePage />} />
    <Route path="/my-cvs" element={<MyCVsPage />} />
    <Route path="/cover-letter" element={<CoverLetterPage />} />
    <Route path="/help" element={<HelpPage />} />
    <Route path="/privacy" element={<PrivacyPage />} />
    <Route path="/terms" element={<TermsPage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/contact" element={<ContactPage />} />
    <Route path="/resources" element={<ResourcesPage />} />
    <Route path="/resources/:slug" element={<ArticlePage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes></Suspense></ErrorBoundary><Footer /></div>;
}

export default function App() {
  return <AppProvider><ThemeProvider><BrowserRouter><AppShell /></BrowserRouter></ThemeProvider></AppProvider>;
}
