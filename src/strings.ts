/* English message catalog. Keep interface copy keyed here as additional locales are added. */
export const messages = {
  en: {
    nav: {
      howItWorks: 'How it works',
      templates: 'Templates',
      help: 'Help',
      createMyCv: 'Create my CV free',
    },
    footer: {
      profile: 'Profile',
      savedCvs: 'Saved CVs',
      coverLetter: 'Cover letter',
      privacy: 'Privacy',
      contactComingLater: 'Contact · coming later',
    },
    status: {
      saved: 'Saved',
      saving: 'Saving…',
      saveIssue: 'Save issue',
    },
    export: {
      downloadPdf: 'Download PDF (opens print dialog)',
      printHelp: 'Choose “Save as PDF” in your browser’s print dialog.',
    },
    promise: 'Build your CV free. Download the PDF free. No signup, no watermark, no catch.',
    trust: ['Free PDF download', 'No account needed', 'Data stays on your device'],
    locale: {
      default: 'en',
      interfaceLanguages: ['English'],
      cvContentAutoTranslation: false,
    },
  },
} as const;

export type InterfaceLocale = keyof typeof messages;
export function message<K extends keyof typeof messages.en>(key: K, locale: InterfaceLocale = 'en') {
  return messages[locale][key];
}
