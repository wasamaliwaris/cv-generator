import { useEffect, useRef, useState } from 'react';
import { Download, FileJson, Import, ShieldAlert, Trash2 } from 'lucide-react';
import { useAppData } from './app-context';
import { emptyProfile, blankCoverLetter } from './model';
import { makeBackup, parseBackup, STORAGE_KEY } from './storage';
import { Button, InlineNotice } from './ui';

function downloadBackup(data: ReturnType<typeof useAppData>['data']) {
  const blob = new Blob([makeBackup(data)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = `pathcv-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
}

export function DataTools() {
  const { data, setData } = useAppData();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [importError, setImportError] = useState('');
  const [message, setMessage] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!confirmClear) return;
    const dialog = dialogRef.current;
    const buttons = () => Array.from(dialog?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') || []);
    buttons()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setConfirmClear(false); }
      if (event.key === 'Tab') {
        const items = buttons();
        if (!items.length) return;
        const first = items[0]; const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmClear]);

  const onImportFile = async (file?: File) => {
    if (!file) return;
    setImportError(''); setMessage(''); setBusy(true);
    try {
      const raw = await file.text();
      const imported = parseBackup(raw);
      const confirmed = window.confirm('Import this PathCV backup and overwrite the profile, saved CV versions, and cover letter currently in this browser? This cannot be undone unless you have another backup.');
      if (!confirmed) { setBusy(false); return; }
      setData(imported);
      setMessage('Backup imported. Your local data has been replaced with the selected file.');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'The backup could not be imported.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const clearEverything = () => {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* The in-memory reset below still works. */ }
    setData({ profile: emptyProfile(), documents: [], coverLetter: blankCoverLetter() });
    setConfirmClear(false); setImportError(''); setMessage('All PathCV data in this browser has been cleared.');
  };

  return <section className="data-tools-card">
    <div className="data-tools-heading"><div className="data-tools-icon"><FileJson size={19} /></div><div><h2>Back up or remove your data</h2><p>These actions affect PathCV data stored in this browser on this device.</p></div></div>
    <div className="data-tools-actions"><Button type="button" variant="secondary" onClick={() => { try { downloadBackup(data); setMessage('JSON backup downloaded.'); setImportError(''); } catch { setImportError('The backup could not be downloaded. Try again or use a different browser.'); } }}><Download size={16} /> Export JSON</Button><Button type="button" variant="secondary" disabled={busy} onClick={() => inputRef.current?.click()}><Import size={16} /> {busy ? 'Reading backup…' : 'Import JSON'}</Button><Button type="button" variant="danger" onClick={() => { setMessage(''); setConfirmClear(true); }}><Trash2 size={16} /> Clear all data</Button><input ref={inputRef} type="file" accept=".json,application/json" className="sr-only" aria-label="Choose a PathCV JSON backup" onChange={(e) => onImportFile(e.target.files?.[0])} /></div>
    <p className="field-hint data-tools-hint">Import validates the file, then asks before replacing all current PathCV data. Export includes your profile, CV versions, and cover-letter draft.</p>
    {importError && <InlineNotice tone="error">{importError}</InlineNotice>}{message && <InlineNotice tone="success">{message}</InlineNotice>}
    {confirmClear && <div className="dialog-backdrop" role="presentation"><div ref={dialogRef} className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="clear-dialog-title" aria-describedby="clear-dialog-description"><div className="dialog-icon"><ShieldAlert size={20} /></div><h3 id="clear-dialog-title">Clear all PathCV data?</h3><p id="clear-dialog-description">This removes your reusable profile, saved CV versions, and cover-letter draft from this browser. Export a JSON backup first if you may need it later.</p><div className="dialog-actions"><Button type="button" variant="ghost" onClick={() => setConfirmClear(false)}>Keep my data</Button><Button type="button" variant="danger" onClick={clearEverything}>Clear all data</Button></div></div></div>}
  </section>;
}
