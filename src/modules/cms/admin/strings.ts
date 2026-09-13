/**
 * The shell's interface strings (ADR-031: interface copy is ours). The panel is English
 * (Dhia, 2026-09-13); the content it edits stays Arabic. Payload's own strings come from its
 * `en` pack. No em dashes (.claude/rules/writing.md).
 */
export const adminStrings = {
  nav: {
    label: 'Main navigation',
    brand: 'B7R Print Website',
    expand: 'Expand the sidebar',
    collapse: 'Collapse the sidebar',
    closeMenu: 'Close the menu',
    groupToggle: 'collapse or expand the group',
    viewSite: 'View website',
  },
  header: {
    search: 'Search or jump to…',
    searchAria: 'Search or jump to a section',
    viewSite: 'View website',
  },
  account: {
    menu: 'Account menu',
    profile: 'My account',
    logout: 'Log out',
    roles: { admin: 'Admin', editor: 'Editor' } as Record<string, string>,
  },
  palette: {
    title: 'Jump to…',
    placeholder: 'Type a section, a page or a product',
    hint: 'Type two characters or more to search the content',
    sections: 'Sections',
    results: 'Content',
    empty: 'Nothing matches.',
    open: 'open',
    shortcut: 'Press Ctrl K anywhere',
    searching: 'Searching…',
    status: { draft: 'Draft', published: 'Published' } as Record<string, string>,
  },
  login: {
    noAccount: 'No account? Ask the site admin for one.',
  },
  savedBy: {
    by: 'by',
    never: 'No save recorded yet.',
  },
  dashboard: {
    greeting: 'Welcome, {name}',
    intro: 'Everything on the site starts here.',
    quick: 'Start here',
    actions: {
      home: { title: 'Home page', text: 'Edit the sections and publish' },
      addPage: { title: 'Add a page', text: 'A new page with its own URL' },
      addProduct: { title: 'Add a product', text: 'Prices, photos and sizes' },
      addFaq: { title: 'Add a question', text: 'A new entry in the FAQ' },
      media: { title: 'Upload a file', text: 'An image or a file for the pages' },
      site: { title: 'View website', text: 'As a visitor sees it' },
    },
    health: {
      title: 'System status',
      check: 'Full report',
      version: 'Version',
      rows: {
        db: { ok: 'Database answering', error: 'Database not answering' },
        jobs: { on: 'Scheduled jobs running', off: 'Scheduled jobs not started yet' },
        jobsFailed: {
          none: 'No failed jobs',
          some: '{n} failed jobs',
          unknown: 'Job status unknown',
        },
        email: {
          resend: 'E-mail goes out through Resend',
          console: 'E-mail printed to the log, no provider',
        },
        turnstile: { on: 'Bot check on', off: 'Bot check off' },
        indexnow: { on: 'Search-engine pings on', off: 'Search-engine pings off' },
        media: { s3: 'Media on cloud storage', local: 'Media on the server disk' },
        contact: {
          live: 'Contact form sending',
          mock: 'Contact form in test mode',
          off: 'Contact form off',
        },
        newsletter: {
          live: 'Newsletter recording subscribers',
          mock: 'Newsletter in test mode',
          off: 'Newsletter off',
        },
      },
    },
    recent: {
      title: 'Latest changes',
      empty: 'No changes yet. Start with the home page.',
      by: 'by {name}',
      draft: 'Draft',
      published: 'Published',
    },
  },
} as const;
