import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';
import { AppProvider } from './app-context';
import { BuilderPage } from './builder';
import { CoverLetterPage } from './cover-letter';
import { ExpressPage } from './express';
import { LandingPage } from './landing';
import { HelpPage, MyCVsPage, PrivacyPage, ProfilePage, TemplatesPage } from './pages';
import { Footer, SiteHeader } from './ui';

function NotFoundPage() {
  return <main className="page-width not-found-page"><div className="not-found-mark">?</div><div className="eyebrow">PAGE NOT FOUND</div><h1>That path is not here.</h1><p>The page may have moved, or the address may be incomplete.</p><Link to="/" className="button button-primary button-large">Back to PathCV</Link></main>;
}

function AppShell() {
  return <div className="app-shell"><SiteHeader /><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/builder" element={<BuilderPage />} />
    <Route path="/express" element={<ExpressPage />} />
    <Route path="/templates" element={<TemplatesPage />} />
    <Route path="/profile" element={<ProfilePage />} />
    <Route path="/my-cvs" element={<MyCVsPage />} />
    <Route path="/cover-letter" element={<CoverLetterPage />} />
    <Route path="/help" element={<HelpPage />} />
    <Route path="/privacy" element={<PrivacyPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes><Footer /></div>;
}

export default function App() {
  return <AppProvider><BrowserRouter><AppShell /></BrowserRouter></AppProvider>;
}
