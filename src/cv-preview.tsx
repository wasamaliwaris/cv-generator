import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { CVDocument, Profile, SectionKey, OptionalSectionEntry, WorkExperience, EducationEntry } from './model';
import { SECTION_LABELS, cleanUrl, dateRange } from './model';

function bulletLines(value: string) {
  return value.split(/\r?\n/).map((line) => line.replace(/^\s*[•*-]\s*/, '').trim()).filter(Boolean);
}

function SafeLink({ value, label }: { value: string; label?: string }) {
  if (!value.trim()) return null;
  const href = cleanUrl(value);
  return <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{label || value}</a>;
}

function hasWorkContent(item: WorkExperience) {
  return Boolean(item.title.trim() || item.employer.trim() || item.location.trim() || item.description.trim() || item.achievements.trim() || item.startDate || item.endDate || item.links.some((link) => link.url.trim()));
}
function hasEducationContent(item: EducationEntry) {
  return Boolean(item.qualification.trim() || item.institution.trim() || item.location.trim() || item.fieldOfStudy.trim() || item.grade.trim() || item.coursework.trim() || item.credentialLink.trim() || item.startDate || item.endDate);
}
function hasOptionalContent(item: OptionalSectionEntry) {
  return Boolean(item.title.trim() || item.organization.trim() || item.location.trim() || item.description.trim() || item.link.trim() || item.startDate || item.endDate);
}

function WorkItem({ item, doc }: { item: WorkExperience; doc: CVDocument }) {
  if (!hasWorkContent(item)) return null;
  const range = dateRange(item.startDate, item.endDate, item.current, doc.dateFormat);
  const bullets = [...bulletLines(item.description), ...bulletLines(item.achievements)];
  const title = item.title || item.employer;
  const subtitle = [item.title ? item.employer : '', item.location].filter(Boolean).join(' · ');
  return (
    <article className="cv-entry">
      <div className="cv-entry-top">
        <div>{title && <h3>{title}</h3>}{subtitle && <div className="cv-subline">{subtitle}</div>}</div>
        {range && <time>{range}</time>}
      </div>
      {bullets.length > 0 && <ul className="cv-bullets">{bullets.map((line, index) => <li key={`${item.id}-b-${index}`}>{line}</li>)}</ul>}
      {item.links.some((link) => link.url) && <div className="cv-entry-links">{item.links.filter((link) => link.url).map((link) => <SafeLink key={link.id} value={link.url} label={link.label || link.url} />)}</div>}
    </article>
  );
}

function EducationItem({ item, doc }: { item: EducationEntry; doc: CVDocument }) {
  if (!hasEducationContent(item)) return null;
  const range = dateRange(item.startDate, item.endDate, item.currentlyStudying, doc.dateFormat);
  const title = item.qualification || item.institution;
  const subtitle = [item.qualification ? item.institution : '', item.location].filter(Boolean).join(' · ');
  return (
    <article className="cv-entry">
      <div className="cv-entry-top">
        <div>{title && <h3>{title}</h3>}{subtitle && <div className="cv-subline">{subtitle}</div>}</div>
        {range && <time>{range}</time>}
      </div>
      {(item.fieldOfStudy || item.grade) && <p className="cv-detail-line">{[item.fieldOfStudy, item.grade && `Grade: ${item.grade}`].filter(Boolean).join(' · ')}</p>}
      {item.coursework && <p className="cv-detail-line">Relevant coursework: {item.coursework}</p>}
      {item.credentialLink && <div className="cv-entry-links"><SafeLink value={item.credentialLink} label="Credential" /></div>}
    </article>
  );
}

function OptionalItem({ item, doc }: { item: OptionalSectionEntry; doc: CVDocument }) {
  if (!hasOptionalContent(item)) return null;
  const range = dateRange(item.startDate, item.endDate, false, doc.dateFormat);
  const bulletList = bulletLines(item.description);
  const title = item.title || item.organization;
  const sub = [item.title ? item.organization : '', item.location].filter(Boolean).join(' · ');
  return (
    <article className="cv-entry">
      <div className="cv-entry-top"><div>{title && <h3>{title}</h3>}{sub && <div className="cv-subline">{sub}</div>}</div>{range && <time>{range}</time>}</div>
      {bulletList.length > 1 ? <ul className="cv-bullets">{bulletList.map((line, index) => <li key={`${item.id}-o-${index}`}>{line}</li>)}</ul> : bulletList.length === 1 ? <p className="cv-entry-description">{bulletList[0]}</p> : null}
      {item.link && <div className="cv-entry-links"><SafeLink value={item.link} label={item.link.replace(/^https?:\/\//, '')} /></div>}
    </article>
  );
}

function categoryName(key: SectionKey, entry?: OptionalSectionEntry) {
  return key === 'custom' ? (entry?.customTitle.trim() || 'Additional section') : SECTION_LABELS[key];
}

function SectionContent({ keyName, profile, doc }: { keyName: SectionKey; profile: Profile; doc: CVDocument }) {
  if (keyName === 'summary') return profile.summary.trim() ? <div className="cv-summary">{profile.summary.split(/\n+/).map((line, index) => line.trim() && <p key={index}>{line}</p>)}</div> : null;
  if (keyName === 'experience') {
    const rows = [...profile.workExperience].filter(hasWorkContent).sort((a, b) => a.order - b.order);
    return rows.length ? <div>{rows.map((item) => <WorkItem key={item.id} item={item} doc={doc} />)}</div> : null;
  }
  if (keyName === 'education') {
    const rows = [...profile.education].filter(hasEducationContent).sort((a, b) => a.order - b.order);
    return rows.length ? <div>{rows.map((item) => <EducationItem key={item.id} item={item} doc={doc} />)}</div> : null;
  }
  if (keyName === 'skills') {
    const rows = [...profile.skills].sort((a, b) => a.order - b.order).filter((skill) => skill.name.trim());
    if (!rows.length) return null;
    const grouped = new Map<string, typeof rows>();
    for (const skill of rows) {
      const category = skill.category === 'Custom' ? skill.customCategory.trim() || 'Other skills' : skill.category;
      grouped.set(category, [...(grouped.get(category) || []), skill]);
    }
    return <div className="cv-skill-groups">{Array.from(grouped.entries()).map(([category, skills]) => <div className="cv-skill-row" key={category}><strong>{category}</strong><span>{skills.map((skill) => skill.proficiency ? `${skill.name} (${skill.proficiency})` : skill.name).join(' · ')}</span></div>)}</div>;
  }
  if (keyName === 'languages') {
    const rows = [...profile.languages].sort((a, b) => a.order - b.order).filter((language) => language.language.trim());
    return rows.length ? <div className="cv-language-list">{rows.map((language) => <div className="cv-language" key={language.id}><strong>{language.language}</strong><span>{[language.proficiency, language.cefr && `CEFR ${language.cefr}`].filter(Boolean).join(' · ')}</span></div>)}</div> : null;
  }
  const rows = [...profile.optionalSections].filter((entry) => entry.sectionKey === keyName && hasOptionalContent(entry)).sort((a, b) => a.order - b.order);
  if (!rows.length) return null;
  if (keyName === 'custom') {
    const groups = new Map<string, OptionalSectionEntry[]>();
    rows.forEach((row) => {
      const title = categoryName(keyName, row);
      groups.set(title, [...(groups.get(title) || []), row]);
    });
    return <div>{Array.from(groups.entries()).map(([title, entries]) => <div className="cv-custom-group" key={title}><h3 className="cv-custom-title">{title}</h3>{entries.map((entry) => <OptionalItem key={entry.id} item={entry} doc={doc} />)}</div>)}</div>;
  }
  return <div>{rows.map((item) => <OptionalItem key={item.id} item={item} doc={doc} />)}</div>;
}

export function CVPreview({ document: doc, showControls = true }: { document: CVDocument; showControls?: boolean }) {
  const paperRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(100);
  const [fitScale, setFitScale] = useState(0.6);
  const [height, setHeight] = useState(1123);
  const [pageCount, setPageCount] = useState(1);
  const profile = doc.profileSnapshot;
  const fullName = [profile.personal.firstName, profile.personal.lastName].filter(Boolean).join(' ') || 'Your name';
  const location = [profile.personal.city, profile.personal.region, profile.personal.country].filter(Boolean).join(', ');
  const contacts = useMemo(() => [
    profile.personal.email && { label: profile.personal.email, href: `mailto:${profile.personal.email}` },
    profile.personal.phone.trim() && { label: [profile.personal.phoneCountryCode, profile.personal.phone].filter(Boolean).join(' '), href: `tel:${[profile.personal.phoneCountryCode, profile.personal.phone].filter(Boolean).join('')}` },
    location && { label: location },
    profile.personal.postalCode && { label: profile.personal.postalCode },
    profile.personal.website && { label: profile.personal.website.replace(/^https?:\/\//, ''), href: cleanUrl(profile.personal.website) },
    profile.personal.linkedin && { label: profile.personal.linkedin.replace(/^https?:\/\//, ''), href: cleanUrl(profile.personal.linkedin) },
    profile.personal.portfolio && { label: profile.personal.portfolio.replace(/^https?:\/\//, ''), href: cleanUrl(profile.personal.portfolio) },
    profile.personal.otherLink && { label: profile.personal.otherLink.replace(/^https?:\/\//, ''), href: cleanUrl(profile.personal.otherLink) },
  ].filter(Boolean) as { label: string; href?: string }[], [profile.personal, location]);

  useLayoutEffect(() => {
    const node = paperRef.current;
    if (!node) return;
    const update = () => {
      const nextHeight = Math.max(1123, node.scrollHeight);
      setHeight(nextHeight);
      setPageCount(Math.max(1, Math.ceil(nextHeight / 1123)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [doc]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const update = () => setFitScale(Math.min(1, Math.max(0.3, viewport.clientWidth / 794)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [showControls]);

  const scale = fitScale * zoom / 100;
  const order = doc.sectionOrder;
  const templateClass = `cv-template cv-${doc.templateId} cv-font-${doc.fontChoice}`;
  const fontStyle = { '--cv-accent': doc.accentColor } as React.CSSProperties;

  return (
    <div className="cv-preview-component">
      {showControls && <div className="preview-toolbar">
        <div><strong>{pageCount} {pageCount === 1 ? 'page' : 'pages'}</strong><span className="preview-toolbar-divider">·</span><span>A4 preview</span></div>
        <div className="zoom-controls" aria-label="Preview zoom controls">
          <button type="button" aria-label="Zoom out" disabled={zoom <= 60} onClick={() => setZoom((value) => Math.max(60, value - 10))}><Minus size={15} /></button>
          <span>{zoom}%</span>
          <button type="button" aria-label="Zoom in" disabled={zoom >= 130} onClick={() => setZoom((value) => Math.min(130, value + 10))}><Plus size={15} /></button>
        </div>
      </div>}
      <div className="preview-viewport" ref={viewportRef}>
        <div className="preview-stage" style={{ width: `${210 * scale}mm`, height: `${height * scale}px` }}>
          <div
            ref={paperRef}
            id="printable-cv"
            className={`cv-paper printable-document ${templateClass}`}
            style={{ ...fontStyle, transform: `scale(${scale})` }}
          >
            <header className="cv-personal-header">
              {doc.showPhoto && profile.personal.photoDataUrl && <img className="cv-photo" src={profile.personal.photoDataUrl} alt={`${fullName} profile`} />}
              <div className="cv-personal-main">
                <h1>{fullName || <span className="cv-placeholder">Your name</span>}</h1>
                {profile.personal.headline && <p className="cv-headline">{profile.personal.headline}</p>}
                {contacts.length > 0 && <div className="cv-contact-list">{contacts.map((contact, index) => <span className="cv-contact" key={`${contact.label}-${index}`}>{contact.href ? <a href={contact.href}>{contact.label}</a> : contact.label}</span>)}</div>}
              </div>
            </header>
            <div className="cv-content">
              {order.map((key) => {
                if (!doc.sectionVisibility[key]) return null;
                const content = <SectionContent keyName={key} profile={profile} doc={doc} />;
                const hasContent = key === 'summary'
                  ? Boolean(profile.summary.trim())
                  : key === 'experience'
                    ? profile.workExperience.some(hasWorkContent)
                    : key === 'education'
                      ? profile.education.some(hasEducationContent)
                      : key === 'skills'
                        ? profile.skills.some((skill) => skill.name.trim())
                        : key === 'languages'
                          ? profile.languages.some((language) => language.language.trim())
                          : profile.optionalSections.some((item) => item.sectionKey === key && hasOptionalContent(item));
                if (!content || !hasContent) return null;
                const sectionLabel = key === 'custom'
                  ? categoryName(key, profile.optionalSections.find((x) => x.sectionKey === 'custom'))
                  : SECTION_LABELS[key];
                if (key === 'custom') {
                  const customNames = [...new Set(profile.optionalSections.filter((x) => x.sectionKey === 'custom' && hasOptionalContent(x)).map((x) => categoryName('custom', x)))];
                  return customNames.map((name) => <section className="cv-section" key={`custom-${name}`}><h2>{name}</h2><div><SectionContent keyName="custom" profile={{ ...profile, optionalSections: profile.optionalSections.filter((x) => categoryName('custom', x) === name) }} doc={doc} /></div></section>);
                }
                return <section className="cv-section" key={key}><h2>{sectionLabel}</h2><div>{content}</div></section>;
              })}
            </div>
            <footer className="cv-print-footer">Made with PathCV</footer>
          </div>
        </div>
      </div>
    </div>
  );
}
