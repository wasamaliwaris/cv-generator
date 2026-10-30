import { useEffect, useId, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Copy, Plus, Sparkles, Trash2, Upload, X } from 'lucide-react';
import type { EducationEntry, LanguageEntry, MonthDate, OptionalSectionEntry, Profile, SectionKey, SkillCategory, WorkExperience } from './model';
import { OPTIONAL_SECTION_KEYS, SECTION_LABELS, uid } from './model';
import { ACTION_VERBS, BULLET_EXAMPLES, SUMMARY_EXAMPLES } from './starters';
import { Field, SelectField, TextAreaField, Button, InlineNotice } from './ui';

const countryCodes: Array<[string, string]> = [
  ['+93', 'Afghanistan'], ['+355', 'Albania'], ['+213', 'Algeria'], ['+376', 'Andorra'],
  ['+244', 'Angola'], ['+1', 'Antigua and Barbuda'], ['+54', 'Argentina'], ['+374', 'Armenia'],
  ['+297', 'Aruba'], ['+61', 'Australia'], ['+43', 'Austria'], ['+994', 'Azerbaijan'],
  ['+1', 'Bahamas'], ['+973', 'Bahrain'], ['+880', 'Bangladesh'], ['+1', 'Barbados'],
  ['+375', 'Belarus'], ['+32', 'Belgium'], ['+501', 'Belize'], ['+229', 'Benin'],
  ['+1', 'Bermuda'], ['+975', 'Bhutan'], ['+591', 'Bolivia'], ['+387', 'Bosnia and Herzegovina'],
  ['+267', 'Botswana'], ['+55', 'Brazil'], ['+673', 'Brunei'], ['+359', 'Bulgaria'],
  ['+226', 'Burkina Faso'], ['+257', 'Burundi'], ['+238', 'Cabo Verde'], ['+855', 'Cambodia'],
  ['+237', 'Cameroon'], ['+1', 'Canada'], ['+1', 'Cayman Islands'], ['+236', 'Central African Republic'],
  ['+235', 'Chad'], ['+56', 'Chile'], ['+86', 'China'], ['+57', 'Colombia'],
  ['+269', 'Comoros'], ['+242', 'Congo'], ['+243', 'Congo (DRC)'], ['+682', 'Cook Islands'],
  ['+506', 'Costa Rica'], ['+385', 'Croatia'], ['+53', 'Cuba'], ['+599', 'Curacao'],
  ['+357', 'Cyprus'], ['+420', 'Czechia'], ['+45', 'Denmark'], ['+253', 'Djibouti'],
  ['+1', 'Dominica'], ['+1', 'Dominican Republic'], ['+593', 'Ecuador'], ['+20', 'Egypt'],
  ['+503', 'El Salvador'], ['+240', 'Equatorial Guinea'], ['+291', 'Eritrea'], ['+372', 'Estonia'],
  ['+251', 'Ethiopia'], ['+500', 'Falkland Islands'], ['+298', 'Faroe Islands'], ['+679', 'Fiji'],
  ['+358', 'Finland'], ['+33', 'France'], ['+594', 'French Guiana'], ['+689', 'French Polynesia'],
  ['+241', 'Gabon'], ['+220', 'Gambia'], ['+995', 'Georgia'], ['+49', 'Germany'],
  ['+233', 'Ghana'], ['+350', 'Gibraltar'], ['+30', 'Greece'], ['+299', 'Greenland'],
  ['+1', 'Grenada'], ['+590', 'Guadeloupe'], ['+1', 'Guam'], ['+502', 'Guatemala'],
  ['+224', 'Guinea'], ['+245', 'Guinea-Bissau'], ['+592', 'Guyana'], ['+509', 'Haiti'],
  ['+504', 'Honduras'], ['+852', 'Hong Kong'], ['+36', 'Hungary'], ['+354', 'Iceland'],
  ['+91', 'India'], ['+62', 'Indonesia'], ['+98', 'Iran'], ['+964', 'Iraq'],
  ['+353', 'Ireland'], ['+972', 'Israel'], ['+39', 'Italy'], ['+225', 'Ivory Coast'],
  ['+1', 'Jamaica'], ['+81', 'Japan'], ['+962', 'Jordan'], ['+7', 'Kazakhstan'],
  ['+254', 'Kenya'], ['+686', 'Kiribati'], ['+850', 'North Korea'], ['+82', 'South Korea'],
  ['+383', 'Kosovo'], ['+965', 'Kuwait'], ['+996', 'Kyrgyzstan'], ['+856', 'Laos'],
  ['+371', 'Latvia'], ['+961', 'Lebanon'], ['+266', 'Lesotho'], ['+231', 'Liberia'],
  ['+218', 'Libya'], ['+423', 'Liechtenstein'], ['+370', 'Lithuania'], ['+352', 'Luxembourg'],
  ['+853', 'Macau'], ['+389', 'North Macedonia'], ['+261', 'Madagascar'], ['+265', 'Malawi'],
  ['+60', 'Malaysia'], ['+960', 'Maldives'], ['+223', 'Mali'], ['+356', 'Malta'],
  ['+692', 'Marshall Islands'], ['+596', 'Martinique'], ['+222', 'Mauritania'], ['+230', 'Mauritius'],
  ['+262', 'Mayotte'], ['+52', 'Mexico'], ['+691', 'Micronesia'], ['+373', 'Moldova'],
  ['+377', 'Monaco'], ['+976', 'Mongolia'], ['+382', 'Montenegro'], ['+1', 'Montserrat'],
  ['+212', 'Morocco'], ['+258', 'Mozambique'], ['+95', 'Myanmar'], ['+264', 'Namibia'],
  ['+674', 'Nauru'], ['+977', 'Nepal'], ['+31', 'Netherlands'], ['+687', 'New Caledonia'],
  ['+64', 'New Zealand'], ['+505', 'Nicaragua'], ['+227', 'Niger'], ['+234', 'Nigeria'],
  ['+683', 'Niue'], ['+672', 'Norfolk Island'], ['+1', 'Northern Mariana Islands'], ['+47', 'Norway'],
  ['+968', 'Oman'], ['+92', 'Pakistan'], ['+680', 'Palau'], ['+970', 'Palestine'],
  ['+507', 'Panama'], ['+675', 'Papua New Guinea'], ['+595', 'Paraguay'], ['+51', 'Peru'],
  ['+63', 'Philippines'], ['+48', 'Poland'], ['+351', 'Portugal'], ['+1', 'Puerto Rico'],
  ['+974', 'Qatar'], ['+262', 'Reunion'], ['+40', 'Romania'], ['+7', 'Russia'],
  ['+250', 'Rwanda'], ['+590', 'Saint Barthelemy'], ['+1', 'Saint Kitts and Nevis'], ['+1', 'Saint Lucia'],
  ['+590', 'Saint Martin'], ['+508', 'Saint Pierre and Miquelon'], ['+1', 'Saint Vincent and the Grenadines'], ['+685', 'Samoa'],
  ['+378', 'San Marino'], ['+239', 'Sao Tome and Principe'], ['+966', 'Saudi Arabia'], ['+221', 'Senegal'],
  ['+381', 'Serbia'], ['+248', 'Seychelles'], ['+232', 'Sierra Leone'], ['+65', 'Singapore'],
  ['+1', 'Sint Maarten'], ['+421', 'Slovakia'], ['+386', 'Slovenia'], ['+677', 'Solomon Islands'],
  ['+252', 'Somalia'], ['+27', 'South Africa'], ['+211', 'South Sudan'], ['+34', 'Spain'],
  ['+94', 'Sri Lanka'], ['+249', 'Sudan'], ['+597', 'Suriname'], ['+46', 'Sweden'],
  ['+41', 'Switzerland'], ['+963', 'Syria'], ['+886', 'Taiwan'], ['+992', 'Tajikistan'],
  ['+255', 'Tanzania'], ['+66', 'Thailand'], ['+670', 'Timor-Leste'], ['+228', 'Togo'],
  ['+690', 'Tokelau'], ['+676', 'Tonga'], ['+1', 'Trinidad and Tobago'], ['+216', 'Tunisia'],
  ['+90', 'Turkey'], ['+993', 'Turkmenistan'], ['+1', 'Turks and Caicos Islands'], ['+688', 'Tuvalu'],
  ['+256', 'Uganda'], ['+380', 'Ukraine'], ['+971', 'United Arab Emirates'], ['+44', 'United Kingdom'],
  ['+1', 'United States'], ['+598', 'Uruguay'], ['+1', 'US Virgin Islands'], ['+998', 'Uzbekistan'],
  ['+678', 'Vanuatu'], ['+379', 'Vatican City'], ['+58', 'Venezuela'], ['+84', 'Vietnam'],
  ['+681', 'Wallis and Futuna'], ['+967', 'Yemen'], ['+260', 'Zambia'], ['+263', 'Zimbabwe'],
];

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
  'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
  'Croatia', 'Cuba', 'Cyprus', 'Czechia', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt',
  'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon',
  'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
  'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel',
  'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan',
  'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar',
  'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia',
  'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal',
  'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan',
  'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar',
  'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia',
  'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa',
  'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan',
  'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan',
  'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City',
  'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
];

function countryMatches(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts: string[] = [];
  const contains: string[] = [];
  for (const name of COUNTRIES) {
    const lower = name.toLowerCase();
    if (lower.startsWith(q)) starts.push(name);
    else if (lower.includes(q)) contains.push(name);
  }
  return [...starts, ...contains].slice(0, 9);
}

function HighlightedMatch({ name, query }: { name: string; query: string }) {
  const index = name.toLowerCase().indexOf(query.toLowerCase());
  if (!query || index < 0) return <>{name}</>;
  return <>{name.slice(0, index)}<mark>{name.slice(index, index + query.length)}</mark>{name.slice(index + query.length)}</>;
}

export function CountryField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const rawId = useId();
  const listId = `country-list-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const query = value.trim();
  const matches = countryMatches(query);
  const exact = matches.length === 1 && matches[0].toLowerCase() === query.toLowerCase();
  const showList = open && query.length > 0 && !exact;
  const safeHighlight = matches.length ? highlight % matches.length : 0;
  useEffect(() => {
    listRef.current?.children[safeHighlight]?.scrollIntoView({ block: 'nearest' });
  }, [safeHighlight, showList]);
  const select = (name: string) => { onChange(name); setOpen(false); };
  return <label className="field"><span className="field-label">Country</span><span className="combo-wrap"><input
    role="combobox" aria-expanded={showList} aria-controls={listId} aria-autocomplete="list"
    aria-activedescendant={showList && matches[safeHighlight] ? `${listId}-${safeHighlight}` : undefined}
    autoComplete="country-name" placeholder="Start typing — e.g. Pak" value={value}
    onChange={(e) => { onChange(e.target.value); setOpen(true); setHighlight(0); }}
    onFocus={() => setOpen(true)}
    onBlur={() => setOpen(false)}
    onKeyDown={(e) => {
      if (e.key === 'ArrowDown' && matches.length) { e.preventDefault(); setOpen(true); setHighlight((h) => (h + 1) % matches.length); }
      else if (e.key === 'ArrowUp' && matches.length) { e.preventDefault(); setOpen(true); setHighlight((h) => (h - 1 + matches.length) % matches.length); }
      else if (e.key === 'Enter' && showList && matches[safeHighlight]) { e.preventDefault(); select(matches[safeHighlight]); }
      else if (e.key === 'Escape') setOpen(false);
    }}
  />{showList && <ul ref={listRef} id={listId} role="listbox" aria-label="Matching countries" className="combo-list">{matches.length ? matches.map((name, i) => <li key={name} id={`${listId}-${i}`} role="option" aria-selected={i === safeHighlight} className={`combo-option ${i === safeHighlight ? 'active' : ''}`} onMouseDown={(e) => { e.preventDefault(); select(name); }} onMouseEnter={() => setHighlight(i)}><HighlightedMatch name={name} query={query} /></li>) : <li className="combo-option combo-empty" role="presentation">No matching country — your text will be kept as typed.</li>}</ul>}</span><span className="field-hint">Type two or three letters, then choose from the list.</span></label>;
}

function codeMatches(query: string): Array<[string, string]> {
  const q = query.trim().toLowerCase().replace(/^\+/, '');
  if (!q) return countryCodes;
  const starts: Array<[string, string]> = [];
  const contains: Array<[string, string]> = [];
  for (const [code, name] of countryCodes) {
    const digits = code.replace('+', '');
    const lower = name.toLowerCase();
    if (lower.startsWith(q) || digits.startsWith(q)) starts.push([code, name]);
    else if (lower.includes(q) || digits.includes(q)) contains.push([code, name]);
  }
  return [...starts, ...contains].slice(0, 80);
}

export function CountryCodeField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rawId = useId();
  const listId = `code-list-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const matches = codeMatches(query);
  const safeHighlight = matches.length ? highlight % matches.length : 0;
  const selected = countryCodes.find(([code]) => code === value);
  const close = () => { setOpen(false); setQuery(''); setHighlight(0); };
  const select = (code: string) => { onChange(code); close(); buttonRef.current?.focus(); };
  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const onDown = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) close();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    wrapRef.current?.querySelectorAll('.code-combo-option')[safeHighlight]?.scrollIntoView({ block: 'nearest' });
  }, [safeHighlight, open, query]);
  const trimmed = query.trim();
  return <span className="code-combo-wrap" ref={wrapRef}>
    <button
      ref={buttonRef} type="button" className="code-combo-button"
      aria-haspopup="listbox" aria-expanded={open} aria-controls={listId}
      aria-label={selected ? `Country calling code, selected ${selected[0]} ${selected[1]}` : 'Country calling code'}
      title={selected ? `${selected[0]} · ${selected[1]}` : 'Choose a country calling code'}
      onClick={() => (open ? close() : setOpen(true))}
      onKeyDown={(e) => {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true); }
        else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) { setOpen(true); setQuery((q) => q + e.key); setHighlight(0); }
      }}
    >
      <span className="code-combo-value">{selected ? selected[0] : 'Code'}</span>
      <ChevronDown size={14} />
    </button>
    {open && <span className="code-combo-panel">
      <input
        ref={searchRef} role="combobox" aria-expanded="true" aria-controls={listId} aria-autocomplete="list"
        aria-activedescendant={matches[safeHighlight] ? `${listId}-${safeHighlight}` : undefined}
        aria-label="Search country or calling code" placeholder="Type to search — e.g. Pak or 92"
        autoComplete="off" value={query}
        onChange={(e) => { setQuery(e.target.value); setHighlight(0); }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && matches.length) { e.preventDefault(); setHighlight((h) => (h + 1) % matches.length); }
          else if (e.key === 'ArrowUp' && matches.length) { e.preventDefault(); setHighlight((h) => (h - 1 + matches.length) % matches.length); }
          else if (e.key === 'Enter' && matches[safeHighlight]) { e.preventDefault(); select(matches[safeHighlight][0]); }
          else if (e.key === 'Escape') { e.preventDefault(); close(); buttonRef.current?.focus(); }
        }}
      />
      <ul id={listId} role="listbox" aria-label="Calling codes" className="combo-list code-combo-list">
        {!trimmed && value && <li className="combo-option code-combo-clear" role="option" aria-selected="false" onMouseDown={(e) => { e.preventDefault(); select(''); }}>Clear — no code</li>}
        {matches.length ? matches.map(([code, name], i) => <li key={name} id={`${listId}-${i}`} role="option" aria-selected={i === safeHighlight} className={`combo-option code-combo-option ${i === safeHighlight ? 'active' : ''}`} onMouseDown={(e) => { e.preventDefault(); select(code); }} onMouseEnter={() => setHighlight(i)}><span className="code-combo-code"><HighlightedMatch name={code} query={trimmed} /></span><span className="code-combo-name"><HighlightedMatch name={name} query={trimmed} /></span></li>) : <li className="combo-option combo-empty" role="presentation">No matches — try fewer letters.</li>}
      </ul>
    </span>}
  </span>;
}

export function DateFields({ label, value, onChange, error }: { label: string; value: MonthDate; onChange: (value: MonthDate) => void; error?: string }) {
  const [month, setMonth] = useState(value?.month ? String(value.month) : '');
  const [year, setYear] = useState(value?.year ? String(value.year) : '');
  useEffect(() => {
    setMonth(value?.month ? String(value.month) : '');
    setYear(value?.year ? String(value.year) : '');
  }, [value?.month, value?.year]);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const send = (m: string, y: string) => {
    const parsedYear = Number(y);
    const parsedMonth = Number(m);
    if (parsedMonth >= 1 && parsedMonth <= 12 && Number.isInteger(parsedYear) && parsedYear >= 1900 && parsedYear <= 2200) onChange({ month: parsedMonth, year: parsedYear });
    else onChange(null);
  };
  return <div className="date-field-wrap"><span className="field-label">{label}</span><div className="date-field-pair">
    <label className="sr-only" htmlFor={`month-${label.replace(/\W/g, '-')}`}>{label} month</label>
    <select id={`month-${label.replace(/\W/g, '-')}`} aria-label={`${label} month`} aria-invalid={Boolean(error)} value={month} onChange={(event) => { setMonth(event.target.value); send(event.target.value, year); }}>
      <option value="">Month</option>{monthNames.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
    </select>
    <label className="sr-only" htmlFor={`year-${label.replace(/\W/g, '-')}`}>{label} year</label>
    <input id={`year-${label.replace(/\W/g, '-')}`} aria-label={`${label} year`} aria-invalid={Boolean(error)} type="number" min="1900" max="2200" placeholder="Year" value={year} onChange={(event) => { setYear(event.target.value); send(month, event.target.value); }} />
  </div>{error && <span className="field-error" role="alert">{error}</span>}</div>;
}

export function PersonalFields({ profile, onChange }: { profile: Profile; onChange: (profile: Profile) => void }) {
  const [photoError, setPhotoError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const p = profile.personal;
  const set = (key: keyof typeof p, value: string) => onChange({ ...profile, personal: { ...p, [key]: value } });
  const onPhoto = (file?: File) => {
    setPhotoError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) { setPhotoError('Choose an image file.'); return; }
    if (file.size > 4 * 1024 * 1024) { setPhotoError('Please choose an image smaller than 4 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => set('photoDataUrl', typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => setPhotoError('This image could not be read. Try another file.');
    reader.readAsDataURL(file);
  };
  return <div className="form-stack">
    <div className="form-grid form-grid-two">
      <Field label="First name" autoComplete="given-name" value={p.firstName} onChange={(e) => set('firstName', e.target.value)} />
      <Field label="Last name" autoComplete="family-name" value={p.lastName} onChange={(e) => set('lastName', e.target.value)} />
      <Field label="Professional headline" hint="For example, Product designer or Operations coordinator" value={p.headline} onChange={(e) => set('headline', e.target.value)} className="span-two" />
      <Field label="Email" type="email" autoComplete="email" value={p.email} onChange={(e) => set('email', e.target.value)} error={p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email) ? 'Enter an email address in a valid format.' : undefined} />
      <div className="phone-field"><span className="field-label">Phone</span><div className="phone-input-row"><CountryCodeField value={p.phoneCountryCode} onChange={(code) => set('phoneCountryCode', code)} /><input aria-label="Phone number" type="tel" autoComplete="tel-national" placeholder="Phone number" value={p.phone} onChange={(e) => set('phone', e.target.value)} /></div><span className="field-hint">Search by country name or code — e.g. Pak or 92.</span></div>
      <Field label="City" autoComplete="address-level2" value={p.city} onChange={(e) => set('city', e.target.value)} />
      <Field label="Region / state" autoComplete="address-level1" value={p.region} onChange={(e) => set('region', e.target.value)} />
      <CountryField value={p.country} onChange={(country) => set('country', country)} />
      <Field label="Postal code (optional)" autoComplete="postal-code" value={p.postalCode} onChange={(e) => set('postalCode', e.target.value)} />
      <Field label="Website" type="url" placeholder="yourwebsite.example" value={p.website} onChange={(e) => set('website', e.target.value)} />
      <Field label="LinkedIn" placeholder="linkedin.com/in/you" value={p.linkedin} onChange={(e) => set('linkedin', e.target.value)} />
      <Field label="Portfolio" placeholder="portfolio.example" value={p.portfolio} onChange={(e) => set('portfolio', e.target.value)} />
      <Field label="Other link" placeholder="Optional link" value={p.otherLink} onChange={(e) => set('otherLink', e.target.value)} />
    </div>
    <div className="photo-row">
      <div className="photo-upload-copy"><strong>Profile photo <span className="optional-label">optional</span></strong><p>Only include one if it is appropriate for your industry and location. Center-cropped in the preview; the original file stays unchanged.</p>
        <div className="photo-actions"><Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}><Upload size={15} /> Choose photo</Button>{p.photoDataUrl && <Button type="button" variant="ghost" onClick={() => set('photoDataUrl', '')}><X size={15} /> Remove</Button>}</div>
        <input ref={fileRef} type="file" accept="image/*" aria-label="Choose an optional profile photo" className="sr-only" onChange={(e) => onPhoto(e.target.files?.[0])} />
        {photoError && <span className="field-error" role="alert">{photoError}</span>}
      </div>
      {p.photoDataUrl && <img className="photo-thumb" src={p.photoDataUrl} alt="Selected profile photo preview" />}
    </div>
    <InlineNotice tone="info">PathCV never asks for your date of birth, ID numbers, marital status, or full street address.</InlineNotice>
  </div>;
}

export function SummaryFields({ profile, onChange }: { profile: Profile; onChange: (profile: Profile) => void }) {
  return <div className="form-stack">
    <TextAreaField label="Professional summary" rows={7} maxLength={1400} value={profile.summary} onChange={(e) => onChange({ ...profile, summary: e.target.value })} hint={`${profile.summary.length} / 1,400 characters · A few specific sentences are usually enough.`} placeholder="Describe your experience, strengths, and the kind of work you do well." />
    <div className="starter-chips"><span className="starter-label"><Sparkles size={14} /> Try an example starter:</span><div className="suggestion-list">{SUMMARY_EXAMPLES.map((ex) => <button key={ex.label} type="button" className="suggestion-chip" onClick={() => { if (profile.summary.trim() && !window.confirm('Replace your current summary with this example? You can edit it afterwards.')) return; onChange({ ...profile, summary: ex.text }); }}>{ex.label}</button>)}</div><p className="field-hint">Examples contain [bracketed] placeholders — replace every one with your own details.</p></div>
    <div className="prompt-panel"><h4>Prompts to help you draft</h4><ul><li>What kinds of problems do people rely on you to solve?</li><li>Which strengths or areas of experience are most relevant to this opportunity?</li><li>What is one concrete contribution you are proud of?</li></ul><p>These are prompts only; nothing is filled in automatically.</p></div>
  </div>;
}

function sorted<T extends { order: number }>(entries: T[]) { return [...entries].sort((a, b) => a.order - b.order); }
function reorder<T extends { id: string; order: number }>(entries: T[], id: string, direction: -1 | 1): T[] {
  const list = sorted(entries);
  const index = list.findIndex((entry) => entry.id === id);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= list.length) return list.map((entry, i) => ({ ...entry, order: i }));
  [list[index], list[nextIndex]] = [list[nextIndex], list[index]];
  return list.map((entry, i) => ({ ...entry, order: i }));
}
function EntryCard({ id, title, subtitle, isOpen, onToggle, onMoveUp, onMoveDown, onDuplicate, onDelete, first, last, children }: {
  id: string; title: string; subtitle?: string; isOpen: boolean; onToggle: () => void; onMoveUp: () => void; onMoveDown: () => void;
  onDuplicate?: () => void; onDelete: () => void; first: boolean; last: boolean; children: React.ReactNode;
}) {
  return <article className={`entry-card ${isOpen ? 'entry-card-open' : ''}`}>
    <div className="entry-card-header">
      <button type="button" className="entry-title-button" aria-expanded={isOpen} aria-controls={`entry-fields-${id}`} onClick={onToggle}><ChevronDown size={17} className={isOpen ? 'chevron-open' : ''} /><span><strong>{title || 'Untitled entry'}</strong>{subtitle && <small>{subtitle}</small>}</span></button>
      <div className="entry-card-actions" aria-label="Entry actions">
        <button type="button" title="Move up" aria-label={`Move ${title || 'entry'} up`} disabled={first} onClick={onMoveUp}><ArrowUp size={15} /></button>
        <button type="button" title="Move down" aria-label={`Move ${title || 'entry'} down`} disabled={last} onClick={onMoveDown}><ArrowDown size={15} /></button>
        {onDuplicate && <button type="button" title="Duplicate" aria-label={`Duplicate ${title || 'entry'}`} onClick={onDuplicate}><Copy size={15} /></button>}
        <button type="button" title="Remove" aria-label={`Remove ${title || 'entry'}`} onClick={onDelete}><Trash2 size={15} /></button>
      </div>
    </div>
    {isOpen && <div id={`entry-fields-${id}`} className="entry-card-fields">{children}</div>}
  </article>;
}

function confirmedRemove(label: string) { return window.confirm(`Remove “${label || 'this entry'}”? This cannot be undone.`); }
function setOrder<T extends { order: number }>(rows: T[]) { return rows.map((row, i) => ({ ...row, order: i })); }
function reorderInGroup<T extends { id: string; order: number }>(rows: T[], id: string, direction: -1 | 1, groupKey: (row: T) => string): T[] {
  const target = rows.find((row) => row.id === id);
  if (!target) return rows;
  const group = sorted(rows.filter((row) => groupKey(row) === groupKey(target)));
  const index = group.findIndex((row) => row.id === id);
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= group.length) return rows;
  [group[index], group[nextIndex]] = [group[nextIndex], group[index]];
  const orderById = new Map(group.map((row, order) => [row.id, order]));
  return rows.map((row) => orderById.has(row.id) ? { ...row, order: orderById.get(row.id)! } : row);
}

export function WorkExperienceFields({ profile, onChange }: { profile: Profile; onChange: (profile: Profile) => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const entries = sorted(profile.workExperience);
  const update = (list: WorkExperience[]) => onChange({ ...profile, workExperience: list });
  const patch = (id: string, field: keyof WorkExperience, value: unknown) => update(profile.workExperience.map((item) => item.id === id ? { ...item, [field]: value } as WorkExperience : item));
  const add = () => {
    const entry: WorkExperience = { id: uid(), order: 0, title: '', employer: '', location: '', startDate: null, endDate: null, current: false, description: '', achievements: '', links: [] };
    update(setOrder([entry, ...entries])); setOpenId(entry.id);
  };
  return <div className="form-stack">
    <div className="section-intro"><p>Start with your most recent role. Use one thought per line for bullet points; nothing is required to continue.</p></div>
    {entries.length === 0 ? <div className="guided-empty"><strong>No experience added yet</strong><p>Include paid work, internships, freelance work, or other relevant roles.</p></div> : <div className="entry-list">{entries.map((item, index) => {
      const invalidEnd = !item.current && item.startDate && item.endDate && (item.endDate.year < item.startDate.year || (item.endDate.year === item.startDate.year && item.endDate.month < item.startDate.month));
      return <EntryCard key={item.id} id={item.id} title={item.title} subtitle={item.employer} isOpen={openId === item.id} onToggle={() => setOpenId(openId === item.id ? null : item.id)} first={index === 0} last={index === entries.length - 1} onMoveUp={() => update(reorder(profile.workExperience, item.id, -1))} onMoveDown={() => update(reorder(profile.workExperience, item.id, 1))} onDuplicate={() => { const copy = { ...item, id: uid(), title: item.title ? `${item.title} (copy)` : '', links: item.links.map((link) => ({ ...link, id: uid() })) }; update(setOrder([copy, ...entries])); setOpenId(copy.id); }} onDelete={() => { if (confirmedRemove(item.title || item.employer)) update(setOrder(entries.filter((row) => row.id !== item.id))); }}>
        <div className="form-grid form-grid-two">
          <Field label="Job title" value={item.title} onChange={(e) => patch(item.id, 'title', e.target.value)} />
          <Field label="Employer" value={item.employer} onChange={(e) => patch(item.id, 'employer', e.target.value)} />
          <Field label="Location" value={item.location} onChange={(e) => patch(item.id, 'location', e.target.value)} className="span-two" />
          <DateFields label={`Start date · ${index + 1}`} value={item.startDate} onChange={(value) => patch(item.id, 'startDate', value)} />
          {!item.current && <DateFields label={`End date · ${index + 1}`} value={item.endDate} onChange={(value) => patch(item.id, 'endDate', value)} error={invalidEnd ? 'End date cannot be earlier than start date.' : undefined} />}
          <label className="checkbox-row span-two"><input type="checkbox" checked={item.current} onChange={(e) => { patch(item.id, 'current', e.target.checked); if (e.target.checked) patch(item.id, 'endDate', null); }} /><span>I currently work here</span></label>
          <TextAreaField label="Description bullets" className="span-two" rows={4} value={item.description} onChange={(e) => patch(item.id, 'description', e.target.value)} hint="Write one bullet per line. Start with what you did." placeholder={'Coordinated weekly release planning\nImproved the handover between teams'} />
          <TextAreaField label="Achievements (optional)" className="span-two" rows={3} value={item.achievements} onChange={(e) => patch(item.id, 'achievements', e.target.value)} placeholder="Add a measurable result or specific contribution." />
          <div className="span-two verb-block"><span className="field-label">Stuck? Start a bullet with a verb</span><div className="verb-chips">{ACTION_VERBS.map((verb) => <button key={verb} type="button" className="verb-chip" onClick={() => patch(item.id, 'description', item.description ? `${item.description.replace(/\s+$/, '')}\n${verb} ` : `${verb} `)}>{verb}</button>)}</div><button type="button" className="text-action" onClick={() => { const examples = BULLET_EXAMPLES.join('\n'); if (item.description.trim() && !window.confirm('Add 4 example bullets to this role? They contain placeholders for you to replace.')) return; patch(item.id, 'description', item.description.trim() ? `${item.description.replace(/\s+$/, '')}\n${examples}` : examples); }}><Plus size={14} /> Insert example bullets</button></div>
          <div className="span-two link-list"><div className="field-label">Links (optional)</div>{item.links.map((link, linkIndex) => <div className="link-edit-row" key={link.id}><input aria-label="Link label" placeholder="Label" value={link.label} onChange={(e) => patch(item.id, 'links', item.links.map((old) => old.id === link.id ? { ...old, label: e.target.value } : old))} /><input aria-label="Link URL" placeholder="https://…" value={link.url} onChange={(e) => patch(item.id, 'links', item.links.map((old) => old.id === link.id ? { ...old, url: e.target.value } : old))} /><button type="button" className="icon-button" aria-label="Remove link" onClick={() => { if (window.confirm('Remove this link?')) patch(item.id, 'links', item.links.filter((old) => old.id !== link.id)); }}><X size={15} /></button>{linkIndex === 0 && <span className="sr-only">Use a short label and a full URL.</span>}</div>)}<button type="button" className="text-action" onClick={() => patch(item.id, 'links', [...item.links, { id: uid(), label: '', url: '' }])}><Plus size={14} /> Add a link</button></div>
        </div>
      </EntryCard>;
    })}</div>}
    <Button type="button" variant="secondary" onClick={add}><Plus size={16} /> Add work experience</Button>
  </div>;
}

export function EducationFields({ profile, onChange }: { profile: Profile; onChange: (profile: Profile) => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const entries = sorted(profile.education);
  const update = (list: EducationEntry[]) => onChange({ ...profile, education: list });
  const patch = (id: string, field: keyof EducationEntry, value: unknown) => update(profile.education.map((item) => item.id === id ? { ...item, [field]: value } as EducationEntry : item));
  const add = () => { const entry: EducationEntry = { id: uid(), order: 0, qualification: '', institution: '', location: '', startDate: null, endDate: null, currentlyStudying: false, fieldOfStudy: '', grade: '', coursework: '', credentialLink: '' }; update(setOrder([entry, ...entries])); setOpenId(entry.id); };
  return <div className="form-stack">
    <p className="section-intro">Add formal education, training, or other learning that supports your application.</p>
    {entries.length === 0 ? <div className="guided-empty"><strong>No education added yet</strong><p>You can leave this section empty or add a course, qualification, or training program.</p></div> : <div className="entry-list">{entries.map((item, index) => {
      const invalidEnd = !item.currentlyStudying && item.startDate && item.endDate && (item.endDate.year < item.startDate.year || (item.endDate.year === item.startDate.year && item.endDate.month < item.startDate.month));
      return <EntryCard key={item.id} id={item.id} title={item.qualification} subtitle={item.institution} isOpen={openId === item.id} onToggle={() => setOpenId(openId === item.id ? null : item.id)} first={index === 0} last={index === entries.length - 1} onMoveUp={() => update(reorder(profile.education, item.id, -1))} onMoveDown={() => update(reorder(profile.education, item.id, 1))} onDuplicate={() => { const copy = { ...item, id: uid(), order: 0 }; update(setOrder([copy, ...entries])); setOpenId(copy.id); }} onDelete={() => { if (confirmedRemove(item.qualification || item.institution)) update(setOrder(entries.filter((row) => row.id !== item.id))); }}>
        <div className="form-grid form-grid-two"><Field label="Qualification" value={item.qualification} onChange={(e) => patch(item.id, 'qualification', e.target.value)} /><Field label="Institution" value={item.institution} onChange={(e) => patch(item.id, 'institution', e.target.value)} /><Field label="Location" value={item.location} onChange={(e) => patch(item.id, 'location', e.target.value)} className="span-two" /><DateFields label={`Start date · edu ${index + 1}`} value={item.startDate} onChange={(value) => patch(item.id, 'startDate', value)} />{!item.currentlyStudying && <DateFields label={`End date · edu ${index + 1}`} value={item.endDate} onChange={(value) => patch(item.id, 'endDate', value)} error={invalidEnd ? 'End date cannot be earlier than start date.' : undefined} />}<label className="checkbox-row span-two"><input type="checkbox" checked={item.currentlyStudying} onChange={(e) => { patch(item.id, 'currentlyStudying', e.target.checked); if (e.target.checked) patch(item.id, 'endDate', null); }} /><span>I am currently studying here</span></label><Field label="Field of study" value={item.fieldOfStudy} onChange={(e) => patch(item.id, 'fieldOfStudy', e.target.value)} /><Field label="Grade (optional)" value={item.grade} onChange={(e) => patch(item.id, 'grade', e.target.value)} /><TextAreaField label="Relevant coursework (optional)" rows={2} className="span-two" value={item.coursework} onChange={(e) => patch(item.id, 'coursework', e.target.value)} /><Field label="Credential link (optional)" type="url" className="span-two" placeholder="https://…" value={item.credentialLink} onChange={(e) => patch(item.id, 'credentialLink', e.target.value)} /></div>
      </EntryCard>;
    })}</div>}
    <Button type="button" variant="secondary" onClick={add}><Plus size={16} /> Add education</Button>
  </div>;
}

const skillCategories: SkillCategory[] = ['Professional', 'Technical', 'Interpersonal', 'Digital', 'Custom'];
const skillSuggestions: Record<Exclude<SkillCategory, 'Custom'>, string[]> = {
  Professional: ['Project planning', 'Research', 'Quality assurance', 'Customer support'],
  Technical: ['Data analysis', 'Figma', 'SQL', 'Python'],
  Interpersonal: ['Collaboration', 'Clear communication', 'Mentoring', 'Facilitation'],
  Digital: ['Microsoft Excel', 'Google Workspace', 'Adobe Creative Cloud', 'CRM tools'],
};
export function SkillsFields({ profile, onChange }: { profile: Profile; onChange: (profile: Profile) => void }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SkillCategory>('Professional');
  const [customCategory, setCustomCategory] = useState('');
  const [proficiency, setProficiency] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const entries = sorted(profile.skills);
  const update = (list: typeof profile.skills) => onChange({ ...profile, skills: list });
  const patch = (id: string, field: keyof typeof profile.skills[number], value: unknown) => update(profile.skills.map((item) => item.id === id ? { ...item, [field]: value } as typeof item : item));
  const addSkill = (skillName = name.trim(), skillCategory = category) => {
    if (!skillName) return;
    const entry = { id: uid(), order: profile.skills.length, category: skillCategory, customCategory: skillCategory === 'Custom' ? customCategory : '', name: skillName, proficiency };
    update([...profile.skills, entry]);
    if (skillName === name.trim()) setName('');
  };
  return <div className="form-stack">
    <p className="section-intro">Choose useful, specific skills. Proficiency is optional; use a clear label rather than a star rating.</p>
    <div className="add-skill-panel"><div className="form-grid form-grid-two"><Field label="Skill" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} /><SelectField label="Category" value={category} onChange={(e) => setCategory(e.target.value as SkillCategory)}>{skillCategories.map((item) => <option key={item}>{item}</option>)}</SelectField>{category === 'Custom' && <Field label="Custom category" className="span-two" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} />}<Field label="Proficiency label (optional)" placeholder="e.g. Working knowledge" value={proficiency} onChange={(e) => setProficiency(e.target.value)} /></div><Button type="button" variant="secondary" disabled={!name.trim()} onClick={() => addSkill()}><Plus size={16} /> Add skill</Button></div>
    {entries.length === 0 ? <div className="guided-empty"><strong>No skills added yet</strong><p>Suggested skills below are examples only; select one to add it.</p></div> : <div className="entry-list">{entries.map((skill, index) => <EntryCard key={skill.id} id={skill.id} title={skill.name} subtitle={[skill.category === 'Custom' ? skill.customCategory || 'Custom' : skill.category, skill.proficiency].filter(Boolean).join(' · ')} isOpen={openId === skill.id} onToggle={() => setOpenId(openId === skill.id ? null : skill.id)} first={index === 0} last={index === entries.length - 1} onMoveUp={() => update(reorder(profile.skills, skill.id, -1))} onMoveDown={() => update(reorder(profile.skills, skill.id, 1))} onDuplicate={() => { const copy = { ...skill, id: uid(), order: 0, name: skill.name ? `${skill.name} (copy)` : '' }; update(setOrder([copy, ...entries])); setOpenId(copy.id); }} onDelete={() => { if (confirmedRemove(skill.name)) update(setOrder(entries.filter((item) => item.id !== skill.id))); }}><div className="form-grid form-grid-two"><Field label="Skill" value={skill.name} onChange={(e) => patch(skill.id, 'name', e.target.value)} /><SelectField label="Category" value={skill.category} onChange={(e) => patch(skill.id, 'category', e.target.value as SkillCategory)}>{skillCategories.map((item) => <option key={item}>{item}</option>)}</SelectField>{skill.category === 'Custom' && <Field label="Custom category" className="span-two" value={skill.customCategory} onChange={(e) => patch(skill.id, 'customCategory', e.target.value)} />}<Field label="Proficiency label (optional)" className="span-two" value={skill.proficiency} onChange={(e) => patch(skill.id, 'proficiency', e.target.value)} /></div></EntryCard>)}</div>}
    <div className="suggestions"><h4>Suggestions · click to add</h4>{category !== 'Custom' ? <div className="suggestion-list">{skillSuggestions[category].filter((suggestion) => !entries.some((skill) => skill.name.toLowerCase() === suggestion.toLowerCase())).map((suggestion) => <button key={suggestion} type="button" className="suggestion-chip" onClick={() => addSkill(suggestion, category)}><Plus size={13} /> {suggestion}</button>)}</div> : <p>Choose another category to see examples.</p>}</div>
  </div>;
}

export function LanguageFields({ profile, onChange }: { profile: Profile; onChange: (profile: Profile) => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const entries = sorted(profile.languages);
  const update = (list: LanguageEntry[]) => onChange({ ...profile, languages: list });
  const add = () => { const entry: LanguageEntry = { id: uid(), order: 0, language: '', proficiency: 'Intermediate', cefr: '' }; update(setOrder([entry, ...entries])); setOpenId(entry.id); };
  const patch = (id: string, field: keyof LanguageEntry, value: string) => update(profile.languages.map((item) => item.id === id ? { ...item, [field]: value } as LanguageEntry : item));
  return <div className="form-stack"><p className="section-intro">Use a level that feels accurate to your own experience. CEFR is optional and not independently verified.</p>
    {entries.length === 0 ? <div className="guided-empty"><strong>No languages added yet</strong><p>Add the languages you want employers or readers to know about.</p></div> : <div className="entry-list">{entries.map((item, index) => <EntryCard key={item.id} id={item.id} title={item.language} subtitle={[item.proficiency, item.cefr && `CEFR ${item.cefr}`].filter(Boolean).join(' · ')} isOpen={openId === item.id} onToggle={() => setOpenId(openId === item.id ? null : item.id)} first={index === 0} last={index === entries.length - 1} onMoveUp={() => update(reorder(profile.languages, item.id, -1))} onMoveDown={() => update(reorder(profile.languages, item.id, 1))} onDuplicate={() => { const copy = { ...item, id: uid(), order: 0 }; update(setOrder([copy, ...entries])); setOpenId(copy.id); }} onDelete={() => { if (confirmedRemove(item.language)) update(setOrder(entries.filter((row) => row.id !== item.id))); }}><div className="form-grid form-grid-two"><Field label="Language" value={item.language} onChange={(e) => patch(item.id, 'language', e.target.value)} /><SelectField label="Proficiency" value={item.proficiency} onChange={(e) => patch(item.id, 'proficiency', e.target.value)}>{['Native', 'Beginner', 'Intermediate', 'Advanced', 'Fluent'].map((value) => <option key={value}>{value}</option>)}</SelectField><SelectField label="CEFR level (optional)" className="span-two" value={item.cefr} onChange={(e) => patch(item.id, 'cefr', e.target.value)}><option value="">Not specified</option>{['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((value) => <option key={value}>{value}</option>)}</SelectField></div></EntryCard>)}</div>}
    <Button type="button" variant="secondary" onClick={add}><Plus size={16} /> Add language</Button>
  </div>;
}

const sectionHelp: Record<OptionalSectionEntry['sectionKey'], { action: string; titleLabel: string; orgLabel: string }> = {
  projects: { action: 'Add project', titleLabel: 'Project name', orgLabel: 'Organization or context' },
  volunteering: { action: 'Add volunteering', titleLabel: 'Role', orgLabel: 'Organization' },
  certifications: { action: 'Add certification', titleLabel: 'Certification', orgLabel: 'Issuing organization' },
  publications: { action: 'Add publication', titleLabel: 'Publication title', orgLabel: 'Publisher' },
  awards: { action: 'Add award', titleLabel: 'Award', orgLabel: 'Awarding organization' },
  memberships: { action: 'Add membership', titleLabel: 'Membership or role', orgLabel: 'Organization' },
  courses: { action: 'Add course', titleLabel: 'Course', orgLabel: 'Provider' },
  references: { action: 'Add reference', titleLabel: 'Reference name', orgLabel: 'Relationship or role' },
  interests: { action: 'Add interest', titleLabel: 'Interest', orgLabel: 'Optional context' },
  custom: { action: 'Add custom entry', titleLabel: 'Entry title', orgLabel: 'Organization or context' },
};

export function AdditionalSectionFields({ profile, onChange, visibility, onVisibilityChange }: { profile: Profile; onChange: (profile: Profile) => void; visibility?: Record<SectionKey, boolean>; onVisibilityChange?: (key: SectionKey, visible: boolean) => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const update = (list: OptionalSectionEntry[]) => onChange({ ...profile, optionalSections: list });
  const add = (key: OptionalSectionEntry['sectionKey']) => {
    const entry: OptionalSectionEntry = { id: uid(), order: profile.optionalSections.filter((row) => row.sectionKey === key).length, sectionKey: key, customTitle: key === 'custom' ? 'Additional section' : '', title: '', organization: '', location: '', startDate: null, endDate: null, description: '', link: '' };
    update([...profile.optionalSections, entry]); setOpenId(entry.id);
  };
  const patch = (id: string, field: keyof OptionalSectionEntry, value: unknown) => update(profile.optionalSections.map((item) => item.id === id ? { ...item, [field]: value } as OptionalSectionEntry : item));
  return <div className="form-stack additional-sections">
    <p className="section-intro">Add only sections that strengthen this CV. Nothing is inserted automatically, including references.</p>
    {OPTIONAL_SECTION_KEYS.map((key) => {
      const entries = sorted(profile.optionalSections.filter((item) => item.sectionKey === key));
      return <section className="optional-type-section" key={key}>
        <div className="optional-type-heading"><div><h3>{SECTION_LABELS[key]}</h3>{key === 'references' && <p>Reference contact details are optional; no “available on request” text is added.</p>}</div>{visibility && onVisibilityChange && <label className="switch-label"><input type="checkbox" checked={visibility[key]} onChange={(e) => onVisibilityChange(key, e.target.checked)} /><span>Show</span></label>}</div>
        {entries.length > 0 && <div className="entry-list">{entries.map((item, index) => {
          const help = sectionHelp[key];
          const rangeError = item.startDate && item.endDate && (item.endDate.year < item.startDate.year || (item.endDate.year === item.startDate.year && item.endDate.month < item.startDate.month));
          return <EntryCard key={item.id} id={item.id} title={item.title} subtitle={item.organization} isOpen={openId === item.id} onToggle={() => setOpenId(openId === item.id ? null : item.id)} first={index === 0} last={index === entries.length - 1} onMoveUp={() => update(reorderInGroup(profile.optionalSections, item.id, -1, (row) => row.sectionKey))} onMoveDown={() => update(reorderInGroup(profile.optionalSections, item.id, 1, (row) => row.sectionKey))} onDuplicate={() => { const copy = { ...item, id: uid(), title: item.title ? `${item.title} (copy)` : '' }; update([...profile.optionalSections, copy]); setOpenId(copy.id); }} onDelete={() => { if (confirmedRemove(item.title || help.action)) update(setOrder(profile.optionalSections.filter((row) => row.id !== item.id))); }}>
            <div className="form-grid form-grid-two">{key === 'custom' && <Field label="Section title" className="span-two" value={item.customTitle} onChange={(e) => patch(item.id, 'customTitle', e.target.value)} />}<Field label={help.titleLabel} value={item.title} onChange={(e) => patch(item.id, 'title', e.target.value)} /><Field label={help.orgLabel} value={item.organization} onChange={(e) => patch(item.id, 'organization', e.target.value)} /><Field label="Location (optional)" value={item.location} onChange={(e) => patch(item.id, 'location', e.target.value)} /><DateFields label={`Start date · ${key} ${index + 1}`} value={item.startDate} onChange={(value) => patch(item.id, 'startDate', value)} /><DateFields label={`End date · ${key} ${index + 1}`} value={item.endDate} onChange={(value) => patch(item.id, 'endDate', value)} error={rangeError ? 'End date cannot be earlier than start date.' : undefined} /><TextAreaField label="Details" className="span-two" rows={3} value={item.description} onChange={(e) => patch(item.id, 'description', e.target.value)} hint="Optional; one bullet per line." /><Field label="Link (optional)" className="span-two" value={item.link} onChange={(e) => patch(item.id, 'link', e.target.value)} placeholder="https://…" /></div>
          </EntryCard>;
        })}</div>}
        <button type="button" className="text-action add-optional" onClick={() => add(key)}><Plus size={15} /> {sectionHelp[key].action}</button>
      </section>;
    })}
  </div>;
}
