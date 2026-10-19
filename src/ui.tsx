import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AlertCircle, ArrowRight, Check, CheckCircle2, ChevronDown, Info, Menu, TriangleAlert, X } from 'lucide-react';
import { message } from './strings';

export function Button({ children, className = '', variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return <button className={`button button-${variant} inline-flex items-center justify-center ${className}`} {...props}>{children}</button>;
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const close = () => setOpen(false);
  return (
    <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="site-header-inner page-width">
        <Link to="/" className="brand" aria-label="PathCV home" onClick={close}>
          <span className="brand-mark" aria-hidden="true">P</span><span>Path<span className="brand-light">CV</span></span>
        </Link>
        <button className="mobile-menu-button" type="button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav className={`main-nav ${open ? 'main-nav-open' : ''}`} aria-label="Main navigation">
          <NavLink to="/#how-it-works" end onClick={close}>{message('nav').howItWorks}</NavLink>
          <NavLink to="/templates" onClick={close}>{message('nav').templates}</NavLink>
          <NavLink to="/resources" onClick={close}>Resources</NavLink>
          <NavLink to="/my-cvs" onClick={close}>My CVs</NavLink>
          <NavLink to="/help" onClick={close}>{message('nav').help}</NavLink>
          <NavLink to="/about" onClick={close}>About</NavLink>
          <Link to="/builder" className="button button-primary nav-cta" onClick={close}>{message('nav').createMyCv} <ArrowRight size={16} /></Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="page-width footer-inner">
        <div className="footer-brand">
          <Link to="/" className="brand"><span className="brand-mark" aria-hidden="true">P</span><span>Path<span className="brand-light">CV</span></span></Link>
          <p>Make your next step your own. Free forever — your data never leaves this device.</p>
          <div className="footer-badges"><span className="footer-badge">No signup</span><span className="footer-badge">No watermark</span><span className="footer-badge">Free PDF</span></div>
        </div>
        <nav className="footer-grid" aria-label="Footer navigation">
          <div className="footer-col"><strong>Build</strong><Link to="/builder">CV builder</Link><Link to="/express">Express mode</Link><Link to="/templates">{message('nav').templates}</Link><Link to="/cover-letter">{message('footer').coverLetter}</Link></div>
          <div className="footer-col"><strong>Workspace</strong><Link to="/my-cvs">{message('footer').savedCvs}</Link><Link to="/profile">{message('footer').profile}</Link><Link to="/help">Export &amp; backup</Link></div>
          <div className="footer-col"><strong>Resources</strong><Link to="/#how-it-works">{message('nav').howItWorks}</Link><Link to="/resources">Guides &amp; articles</Link><Link to="/help">{message('nav').help}</Link><Link to="/privacy">{message('footer').privacy}</Link></div>
          <div className="footer-col"><strong>Company</strong><Link to="/about">About us</Link><Link to="/contact">Contact</Link><Link to="/terms">Terms of use</Link></div>
        </nav>
      </div>
      <div className="page-width footer-bottom"><span>© {new Date().getFullYear()} PathCV</span><span className="footer-note">Free to build. Yours to keep.</span></div>
    </footer>
  );
}

export function Field({ label, hint, error, className = '', children, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string; children?: React.ReactNode; className?: string }) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">{label}</span>
      {children ?? <input {...props} aria-invalid={Boolean(error) || props['aria-invalid']} />}
      {hint && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error" role="alert">{error}</span>}
    </label>
  );
}

export function TextAreaField({ label, hint, error, className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string; error?: string; className?: string }) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">{label}</span>
      <textarea {...props} aria-invalid={Boolean(error) || props['aria-invalid']} />
      {hint && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error" role="alert">{error}</span>}
    </label>
  );
}

export function SelectField({ label, children, className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`field ${className}`}><span className="field-label">{label}</span><select {...props}>{children}</select></label>;
}

export function PageHeading({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="page-heading">
      <div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div>
      {actions && <div className="page-heading-actions">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="empty-state"><div className="empty-state-mark"><ChevronDown size={19} /></div><h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function LocalDataNotice() {
  return <div className="local-note"><span className="local-note-check"><Check size={14} /></span><span><strong>Private by design.</strong> Your data stays in this browser on this device. Clearing browser data will remove it. Use Export JSON to back up.</span></div>;
}

const noticeIcons = {
  info: <Info size={16} />,
  success: <CheckCircle2 size={16} />,
  warning: <TriangleAlert size={16} />,
  error: <AlertCircle size={16} />,
};

export function InlineNotice({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'info' | 'success' | 'warning' | 'error' }) {
  return <div className={`inline-notice notice-${tone}`} role={tone === 'error' ? 'alert' : undefined}><span className="notice-icon">{noticeIcons[tone]}</span><span>{children}</span></div>;
}

export function BackLink({ to, children }: { to: string; children: React.ReactNode }) {
  return <Link to={to} className="back-link">← {children}</Link>;
}

export function HelpAboutTabs() {
  const { pathname } = useLocation();
  return <nav className="page-tabs" aria-label="Help and about">
    <NavLink to="/help" className={pathname === '/help' ? 'active' : ''}>Help</NavLink>
    <NavLink to="/about" className={pathname === '/about' ? 'active' : ''}>About</NavLink>
  </nav>;
}

const DEFAULT_PAGE_TITLE = 'PathCV — A CV that moves with you';

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title;
    return () => { document.title = DEFAULT_PAGE_TITLE; };
  }, [title]);
}

export function ScoreRing({ score, size = 44 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
  const tone = score >= 70 ? 'good' : score >= 40 ? 'ok' : 'low';
  return (
    <span className={`score-ring score-${tone}`} style={{ width: size, height: size }} role="img" aria-label={`CV completeness ${score} percent`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} className="score-track" />
        <circle cx={size / 2} cy={size / 2} r={radius} className="score-fill" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <strong>{score}</strong>
    </span>
  );
}
