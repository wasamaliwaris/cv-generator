import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AlertCircle, ArrowRight, Check, CheckCircle2, ChevronDown, Info, Menu, TriangleAlert, X } from 'lucide-react';
import { message } from './strings';

export function Button({ children, className = '', variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return <button className={`button button-${variant} inline-flex items-center justify-center ${className}`} {...props}>{children}</button>;
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <header className="site-header">
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
          <NavLink to="/my-cvs" onClick={close}>My CVs</NavLink>
          <NavLink to="/help" onClick={close}>{message('nav').help}</NavLink>
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
          <p>Make your next step your own.</p>
        </div>
        <div className="footer-links" aria-label="Footer navigation">
          <Link to="/templates">{message('nav').templates}</Link><Link to="/help">{message('nav').help}</Link><Link to="/privacy">{message('footer').privacy}</Link>
          <Link to="/profile">{message('footer').profile}</Link><Link to="/my-cvs">{message('footer').savedCvs}</Link><Link to="/cover-letter">{message('footer').coverLetter}</Link>
          <Link to="/help#contact">Contact <span className="coming-tag">coming later</span></Link>
        </div>
        <div className="footer-note">Free to build. Yours to keep.</div>
      </div>
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
