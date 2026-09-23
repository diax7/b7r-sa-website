import { rtlLanguages } from '@payloadcms/translations';

/**
 * The shell's interface strings (ADR-031: interface copy is ours), in the panel's two
 * languages (ADR-056). `adminStrings` is the English tree and the shape; `adminStringsAr`
 * is the Arabic tree, typed against it, so a string added in one language without the other
 * is a type error and `tests/admin-strings.test.ts` reads the Arabic under the ux-araby
 * rules. A component picks its tree per render with `adminStringsFor(i18n.language)` on the
 * server or `useAdminStrings()` on the client, never at module top level: the language is
 * the request's, not the build's.
 *
 * Two axes that never share a control: the UI language (Payload's `i18n`, the account view's
 * language select, the `payload-lng` cookie) decides which of these trees renders; the
 * content languages (the AR / EN pills) are both in every form at once (ADR-057: no locale
 * switch), so the `bilingual` branch names them as nouns and nothing here names an "open"
 * language.
 *
 * Payload's own strings come from its `en` and `ar` packs (the `ar` one patched in the
 * config). No em dashes (.claude/rules/writing.md).
 */
export const adminStrings = {
  nav: {
    label: 'Main navigation',
    brand: 'B7R Print Website',
    dashboard: 'Dashboard',
    expand: 'Expand the sidebar',
    collapse: 'Collapse the sidebar',
    openMenu: 'Open the menu',
    closeMenu: 'Close the menu',
    viewSite: 'View website',
    /** The language switch's group (the header, the drawer's foot); the names are Payload's own. */
    language: 'Panel language',
    /** The header's one-icon switch at 1024 px and under: it toggles to the other language. */
    switchLanguage: 'Switch to Arabic',
    /**
     * Asked before a switch while a document form holds unsaved changes: the refresh behind
     * the switch reloads the form from the server, so the consequence and the way out.
     */
    unsaved: {
      title: 'Unsaved changes',
      text: 'Unsaved changes are lost when the language changes. Save first, or switch anyway.',
      switchAnyway: 'Switch anyway',
      cancel: 'Cancel',
    },
    /**
     * The badges (ADR-058), read to a screen reader after the entry's name. The runs and the
     * drafts badges say what the dashboard says (`dashboard.hand.failedRuns`,
     * `dashboard.tiles.drafts`): one number, one sentence.
     */
    badges: {
      overLimit: (n: number) =>
        `${n} ${n === 1 ? 'connection' : 'connections'} over the monthly limit`,
    },
  },
  entityHeader: {
    shows: 'Shows on:',
    listing: (label: string) => `See ${label} on the site`,
    sectionsOn: (total: number, on: number) => `${total} sections, ${on} on`,
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
  warnings: {
    none: 'Nothing to flag.',
  },
  fields: {
    pickColor: 'Pick a colour',
  },
  common: {
    /** An admin action's failure line when the route answered with no message. */
    serverAnswered: 'The server answered {status}',
    /** A document with no title yet (a draft in progress); the list view says the same. */
    untitled: 'Untitled',
  },
  time: {
    /** Under a minute; the rest comes from `Intl.RelativeTimeFormat` (`admin/format.ts`). */
    justNow: 'just now',
    /** A moment ahead (`formatSlot`): the day word, then the hour, then the clock it is read on. */
    today: 'today',
    tomorrow: 'tomorrow',
    dayAt: '{day} {time}',
    riyadh: '{when} Riyadh',
  },
  bilingual: {
    /** The content locales by code, as nouns, for the two lines below (ADR-057). */
    languages: { ar: 'Arabic', en: 'English' } as Record<string, string>,
    /** The other language's input while its stored text is on its way. */
    loading: 'Loading {language}…',
    /** The other language's input when the read failed: what happened, then the way out. */
    failed: 'The {language} text could not be loaded. Reload the page to edit it.',
    /** A read-only fact's other language when the read failed (nothing to edit). */
    unavailable: 'The {language} value could not be loaded. Reload the page.',
    /** A read-only fact one language has no value for yet (a post without its English body). */
    empty: 'Empty',
  },
  engine: {
    generateNow: 'Generate now',
    queueing: 'Queueing…',
    queued: 'Queued: the run starts within a minute; see Runs.',
    postTitle: 'Content engine',
    regenerate: 'Regenerate',
    regenerateHint: 'A new run from the topic replaces the text under the same address and cover.',
    importTitle: 'Add topics from CSV',
    importHint:
      'Columns: title, hub (slug), primaryKeyword, secondaryKeywords (separated by ;), intent, priority. A header row is fine.',
    importPlaceholder: 'title,hub,primaryKeyword,secondaryKeywords,intent,priority',
    importButton: 'Import',
    importing: 'Importing…',
    importResult: '{created} added, {skipped} already there.',
    factsTitle: 'What the engine may say',
    factsHint:
      'Built from the site settings, the products and the connected stores, in both languages; every number a draft states is checked against it.',
    factsNumbers: '{n} numbers on the sheet.',
    card: {
      title: 'Engine and spend',
      state: {
        off: 'Off',
        on: 'On',
        mock: 'Mock connection',
        noConnection: 'No connection',
        connectionOff: 'Connection off',
      },
      runStatus: {
        done: 'Done',
        failed: 'Failed',
        running: 'Running',
        skipped: 'Skipped',
      } as Record<string, string>,
      connection: 'Connection',
      connectionOff: 'off',
      pickConnection: 'None picked: add one under Connections, then pick it in the engine settings',
      postsThisMonth: 'Posts this month',
      costToday: 'Cost today',
      cost: 'Cost this month (estimate)',
      ofCap: '{n} of {cap}',
      nextSlot: 'Next slot',
      nextSlotOff: 'No run while the engine is off',
      nextSlotNoConnection: 'No run without a working connection',
      nextSlotToday: 'Today at {hour}:00 Riyadh',
      nextSlotDone: 'Done for today; tomorrow at {hour}:00 Riyadh',
      nextSlotSoon: 'Within the hour',
      connections: 'Connections',
      spend: 'Spend this month',
      runsThisMonth: 'Runs',
      lastTest: 'Last test',
      testPassed: 'passed {when}',
      testFailed: 'failed {when}',
      neverTested: 'never tested',
      overLimit: 'over the limit',
      noConnections: 'No AI connection yet. Add one under Connections.',
      allConnections: 'All connections',
      settings: 'Settings',
      topics: 'Topics',
      runs: 'Runs',
    },
  },
  connections: {
    test: 'Test connection',
    testing: 'Testing…',
    works: 'Works.',
    worksWith: 'Works: {model} answered. Recorded on the connection.',
    saveFirst: 'Save, then test.',
    /** The Umami Test (PR 4c): a refusal of ours before the call, and yesterday's numbers after it. */
    umami: {
      noId: 'No Umami website id in Site settings, Analytics: fill it first, then test.',
      yesterday: (date: string, visitors: number, pageviews: number) =>
        `${date}: ${visitors} visitors, ${pageviews} page views`,
    },
    /** The Google Calendar Test (ADR-062): a refusal of ours before the call, and today's busy blocks after it. */
    googleCalendar: {
      noHost: 'No calendar owner in Booking: fill the e-mail first, then test.',
      today: (host: string, busy: number) =>
        `${host}: ${busy} busy block${busy === 1 ? '' : 's'} today`,
    },
  },
  bookings: {
    /** The action above a booking (ADR-062): a `wa.me` link with a reminder in the merchant's language. */
    remindWhatsApp: 'Remind on WhatsApp',
    /**
     * The reminder's text, keyed by the merchant's language (the booking's `locale`) like
     * `inbox.reply`; the Meet sentence follows it when the row has a link.
     */
    reminder: {
      ar: 'مرحباً {name}، معك بحر برنت: نذكّرك بموعد استشارتك {when} بتوقيت الرياض.',
      en: 'Hello {name}, this is B7R Print: a reminder of your consultation on {when}, Riyadh time.',
    } as Record<string, string>,
    reminderLink: {
      ar: 'رابط Meet: {link}',
      en: 'Meet link: {link}',
    } as Record<string, string>,
  },
  appearance: {
    /** The five brand colours inside a sentence ("Choose a darker {colour}"). */
    colours: {
      primary: 'primary',
      primaryDark: 'primary dark',
      accent: 'accent',
      navy: 'navy',
      ink: 'ink',
    },
    /** The derived colours: the strip's names. */
    derived: {
      primaryHover: 'Primary under the pointer',
      accentTint: 'Accent tint',
      accentOnTint: 'Accent on its tint',
      ground: 'Grey sections',
      border: 'Hairlines',
      textMuted: 'Secondary text',
    },
    /** The derived colours inside a sentence. */
    derivedInSentence: {
      primaryHover: 'primary under the pointer',
      accentTint: 'accent tint',
      accentOnTint: 'accent on its tint',
      ground: 'grey sections',
      border: 'hairlines',
      textMuted: 'secondary text',
    },
    strip: {
      title: 'Derived colours',
      lead: 'Computed from the brand colours as you change them. Set one by hand only when its computed colour is wrong for the site.',
      computed: 'Computed',
      designed: 'Designed value',
      byHand: 'Set by hand',
      from: 'From the {colour}',
      designedNote: 'Kept until the {colour} changes',
      setByHand: 'Set it by hand',
      reset: 'Reset it',
      valueLabel: '{name}: the value set by hand',
      waiting: 'Waiting for a valid brand colour',
    },
    verdict: {
      title: 'Contrast check',
      lead: 'Every pair of colours the site puts together, as the colours above stand now.',
      allPass: 'Every pair passes: saving keeps the site readable.',
      failing: (n: number) =>
        n === 1
          ? '1 pair falls short: saving is refused until it passes.'
          : `${n} pairs fall short: saving is refused until they pass.`,
      passes: 'Passes',
      short: 'Too low',
      needs: 'needs {ratio}',
    },
    /** Every pair the check reads (`src/modules/brand/pairs.ts`), where it shows on the site. */
    pairs: {
      buttonPrimary: 'White text on the primary (the buttons, the bottom banner)',
      buttonPrimaryHover: 'White text on a button under the pointer',
      buttonSecondary: 'Primary text on the page (links, outline buttons)',
      buttonInverseHover: 'Primary text on the accent tint (a light button under the pointer)',
      badgeAccent: 'Accent text on its tint (the badges)',
      bodyOnSurface: 'Body text on the page',
      bodyOnGround: 'Body text on the grey sections',
      mutedOnSurface: 'Secondary text on the page',
      mutedOnGround: 'Secondary text on the grey sections',
      footerOnNavy: 'White text on the footer',
      ribbonOnPrimaryDark: 'White text on the primary dark',
    },
    /** A refused save: the pair, what it reads, what it needs, and the one change that fixes it. */
    refusal: {
      darker: '{pair} reads {got} and needs {wanted}. Choose a darker {colour}.',
      lighter: '{pair} reads {got} and needs {wanted}. Choose a lighter {colour}.',
    },
    /** The same on a colour set by hand, which can also be reset to what the site computes. */
    pinRefusal: {
      darker: '{pair} reads {got} and needs {wanted}. Choose a darker {colour}, or reset it.',
      lighter: '{pair} reads {got} and needs {wanted}. Choose a lighter {colour}, or reset it.',
    },
    more: 'The contrast check lists the rest.',
    notAColour: 'Write the colour as #1f6feb: a hash, then six digits or letters from a to f.',
    typefacePreview: 'Design your product; we print it and deliver it to your customer.',
    notFollowing: {
      title: 'Does not follow',
      lead: 'These keep the shipped colours after a change: each is a file, not a field.',
      items: {
        icons3d: {
          name: 'The six 3D icons',
          why: 'The blue is in their shading and no source files exist to recolour.',
        },
        logo: {
          name: 'The logo',
          why: 'Image files with the blues drawn in; an upload in the Logo tab replaces them.',
        },
        appIcons: {
          name: 'The browser tab and phone icons',
          why: 'Image files cut from the logo.',
        },
        themeColour: {
          name: 'The browser bar colour on phones',
          why: 'Set in the code as the shipped primary.',
        },
        gonePage: {
          name: 'The page for a removed address',
          why: 'Served before the site loads, with the shipped colours in the code.',
        },
        shareImages: {
          name: 'The share images',
          why: 'Drawn once at each deploy with the shipped colours.',
        },
        videoPoster: {
          name: 'The video still on the home page',
          why: 'An image flattened onto the shipped grey.',
        },
        emails: {
          name: 'The e-mails',
          why: 'The confirmation, the message copy and the password reset carry the shipped colours.',
        },
      },
    },
  },
  inbox: {
    /** The three actions above a message (ADR-061); the outcome beside the third. */
    replyWhatsApp: 'Reply on WhatsApp',
    replyEmail: 'Reply by e-mail',
    markHandled: 'Mark handled',
    marking: 'Marking…',
    handled: 'Handled. The list shows it green.',
    alreadyHandled: 'Handled already.',
    /** The route's refusals, by status: the row is gone, or the rule says no. */
    gone: 'This message no longer exists. Reload the list.',
    refused: 'You may not change this message.',
    /**
     * What the reply opens with, in the sender's language (the message's `locale`), whatever
     * the panel's: the same pair in both trees, keyed by the content locale like
     * `bilingual.languages`, never a string of the panel.
     */
    reply: {
      greeting: {
        ar: 'مرحباً {name}، معك بحر برنت بخصوص رسالتك على b7r.sa.',
        en: 'Hello {name}, this is B7R Print about your message on b7r.sa.',
      } as Record<string, string>,
      subject: {
        ar: 'بخصوص رسالتك إلى بحر برنت',
        en: 'About your message to B7R Print',
      } as Record<string, string>,
    },
  },
  cells: {
    yesNo: ['Yes', 'No'] as const,
    onOff: ['On', 'Off'] as const,
    notYet: 'Not yet',
    /** The document's status in a list (ADR-060): the glossary's words, one pill each. */
    status: { published: 'Published', draft: 'Draft', changed: 'Changed' },
  },
  readOnly: {
    /** A read-only date the jobs have not written yet (a connection never tested). */
    noDate: 'Not yet',
  },
  jsonView: {
    copy: 'Copy',
    copied: 'Copied',
  },
  views: {
    adminsOnlyTitle: 'Admins only',
    adminsOnly: 'This page is for admins.',
  },
  visibility: {
    overall: 'Visibility score',
    open: 'Open',
    countOf: '{done} of {total}',
    andMore: 'and {n} more',
    moreDone: '{n} more done',
    guaranteed: 'The site guarantees',
    status: { done: 'Done', next: 'Next', missing: 'Missing' },
    sections: {
      identity: 'Identity',
      crawl: 'Crawl access',
      extractability: 'Extractability',
      corroboration: 'Corroboration',
      measurement: 'Measurement',
      signals: 'Outside signals',
    },
    page: {
      title: 'Visibility score',
      siteOnly: 'What you control: {n}%',
      intro: '{open} things to do. Every item links to the field that fixes it.',
      introOne: 'One thing to do. It links to the field that fixes it.',
      recompute: 'Recompute',
      howOverall:
        'Every item weighed, outside signals included: 100% means the site, the search engines and the assistants all agree. A filled site with no service connected scores about 70.',
      howSiteOnly:
        'Only the items that need no outside service or assistant; an item over many documents earns pro rata (4 of 5 is 80%).',
      up: 'up {n} points since {date}',
      down: 'down {n} points since {date}',
      same: 'unchanged since {date}',
    },
    signals: {
      title: 'Outside signals',
      pullNow: 'Pull now',
      pulling: 'Queuing',
      queued: 'Queued: the snapshots land within the minute; reload to see them',
      asOf: 'as of {date}',
      waiting: 'Connected; the first snapshot lands after the next pull.',
      notConnected: 'Not connected.',
      connect: 'Connect',
      clicks: 'Clicks',
      impressions: 'Impressions',
      ctr: 'CTR',
      position: 'Position',
      query: 'Query',
      page: 'Page',
      mobile: 'Mobile',
      desktop: 'Desktop',
      window: '{from} to {to}',
      psiErrors: '{n} audit(s) failed; the row is partial.',
      tooSoon: 'A pull ran a moment ago; wait ten minutes.',
    },
    ledger: {
      title: 'Citation ledger',
      hint: 'Every morning each enabled AI connection is asked the questions that are due; the rates cover the last four weeks, on the questions that do not name the brand.',
      runNow: 'Run now',
      queuing: 'Queuing',
      queued:
        'Queued: every prompt, whatever its period; the answers land within minutes, reload to see them',
      tooSoon: 'A ledger run was queued a moment ago; wait ten minutes.',
      every: (n: number) => `(every ${n} days)`,
      viewAnswer: 'View answer',
      answerTitle: '{engine}, {date}',
      answerHint: 'The answer as the engine gave it; the links it cited are listed under it.',
      close: 'Close',
      noLimit: 'No monthly limit',
      empty:
        'No run yet. Add an AI connection under Admin, then press Run now or wait for the morning run.',
      prompts: 'The prompts',
      prompt: 'Prompt',
      notRun: 'not run',
      cited: 'Named B7R',
      uncited: 'Did not name B7R',
      linked: 'Linked to the site',
      brand: '(names the brand)',
      rateLine: '{cited} of {runs} named B7R; {linked} linked',
      fix: 'No engine names B7R here: improve the answer block of',
      competitors: 'Competitors named most:',
    },
  },
  traffic: {
    groups: {
      ai: 'AI assistants',
      search: 'Search',
      social: 'Social',
      referral: 'Other sites',
      direct: 'Direct',
    },
    /** The channels that are words, not brands (`CHANNELS` in `traffic/channels.ts`). */
    channels: {
      'ai-other': 'Other AI',
      'search-other': 'Other search',
      'social-other': 'Other social',
      referral: 'Other sites',
      direct: 'Direct',
    } as Record<string, string>,
    card: {
      title: 'Where visits come from',
      landings: 'Landings',
      topChannel: 'Top channel',
      crawls: 'Crawler reads',
      pages: 'Top entry pages',
      empty: 'No landings yet: the count starts with the first visitor.',
      link: 'All traffic',
      /** The people row (ADR-048 amended): Umami's numbers for the range, through yesterday. */
      visitors: 'Visitors',
      pageViews: 'Page views',
      averageTime: 'Average visit',
      people: 'People, by Umami through yesterday',
      /** While no snapshot carries the range: the days' uniques added up, a person on three days counted thrice. */
      peopleSummed: 'Daily visitors, summed, by Umami through yesterday',
    },
    families: {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      google: 'Google',
      perplexity: 'Perplexity',
      microsoft: 'Microsoft',
      apple: 'Apple',
      meta: 'Meta',
      amazon: 'Amazon',
      bytedance: 'ByteDance',
      commoncrawl: 'Common Crawl',
      duckduckgo: 'DuckDuckGo',
      yandex: 'Yandex',
      other: 'Other',
    },
    roles: {
      answer: 'Answering a person',
      search: 'Indexing for search',
      training: 'Gathering for training',
    },
    page: {
      title: 'Traffic',
      intro: (days: number, since: string) =>
        `Where visitors came from and what the AI crawlers read over the last ${days} days, from ${since} (Riyadh).`,
      range: 'Range',
      days: (n: number) => `${n} days`,
      aiShare: 'From AI assistants',
      channels: 'Channels',
      channel: 'Channel',
      group: 'Group',
      landings: 'Landings',
      share: 'Share',
      seen: 'Seen',
      window: '{from} to {to}',
      sources: 'Sources',
      source: 'Source',
      pages: 'Landing pages',
      pageCol: 'Page',
      topChannel: 'Brought most by',
      crawlers: 'Crawlers',
      bot: 'Bot',
      family: 'Company',
      role: 'Purpose',
      reads: 'Reads',
      readMost: 'Read most',
      empty: 'Nothing in this range yet.',
      honesty: [
        'Our own count, not an audit: a page opened from another site or from nowhere; nothing about the visitor is kept.',
        'Google’s AI Overviews and AI Mode arrive as Google.',
        'The native apps (ChatGPT’s, in-app browsers) send no referrer, so some of their visits count as direct.',
      ],
    },
  },
  dashboard: {
    /** By the Riyadh hour (ADR-059): morning from 5, afternoon from 12, evening from 17. */
    greeting: {
      morning: 'Good morning, {name}',
      afternoon: 'Good afternoon, {name}',
      evening: 'Good evening, {name}',
    },
    range: 'Range',
    /** One line under the greeting: what needs a person today, each item a link to its place. */
    hand: {
      title: 'Needs a hand today',
      none: 'Nothing needs a hand today.',
      failedRuns: (n: number) => `${n} failed run${n === 1 ? '' : 's'} this week`,
      overLimit: '{label} is over its monthly limit',
      failedTest: 'The {label} connection failed its last test',
      missingEnglish: (n: number) => `${n} document${n === 1 ? '' : 's'} without English`,
      staleDrafts: (n: number, collection: string) =>
        `${n} draft${n === 1 ? '' : 's'} in ${collection} older than a week`,
    },
    /** The four numbers at a glance, each tile a link to its place. */
    tiles: {
      visits: 'Visits',
      /**
       * When Umami counts (ADR-048 amended) the tile is its visitors and our landings move to
       * the line under: the number is the people, the landings the site's own count.
       */
      visitors: 'Visitors',
      landings: (n: number, text: string) => `${text} ${n === 1 ? 'landing' : 'landings'}`,
      summed: 'daily visitors, summed',
      visitsUp: (n: number, days: number) => `${n}% more than the previous ${days} days`,
      visitsDown: (n: number, days: number) => `${n}% fewer than the previous ${days} days`,
      visitsSame: (days: number) => `the same as the previous ${days} days`,
      visitsFirst: (days: number) => `none in the previous ${days} days`,
      cited: 'Cited rate',
      citedDetail: (engines: number) =>
        `on the category prompts, 28 days, ${engines} engine${engines === 1 ? '' : 's'}`,
      citedNone: 'No ledger run in the last 28 days',
      score: 'Visibility score',
      published: 'Went live',
      publishedDetail: (days: number) => `posts, pages and products in ${days} days`,
      drafts: (n: number) =>
        n === 0 ? 'no drafts waiting' : `${n} draft${n === 1 ? '' : 's'} waiting`,
      unavailable: 'Not available',
    },
    /**
     * The inbox card (ADR-061, ADR-062): the new messages and the newest three, today's
     * bookings and the next three; the two counts added are the sidebar's badge, whose
     * sentence is `waiting`.
     */
    inbox: {
      title: 'Inbox',
      newMessages: (n: number) =>
        n === 0 ? 'No new messages' : `${n} new message${n === 1 ? '' : 's'}`,
      link: 'All messages',
      waiting: (n: number) =>
        n === 0 ? 'Nothing waiting in the inbox' : `${n} waiting in the inbox`,
      todayBookings: (n: number) =>
        n === 0 ? 'No bookings today' : `${n} booking${n === 1 ? '' : 's'} today`,
      bookingsLink: 'All bookings',
    },
    assistants: {
      title: 'What the assistants say',
      lastRun: 'Last run',
      nextRun: 'Next run',
      nextRunDue: '07:00 Riyadh, when a prompt is due',
      link: 'The full ledger',
      notYet: 'No run yet',
    },
    content: {
      title: 'Content',
      kind: 'Kind',
      homePublished: 'published {when}',
      homeDraft: 'draft saved {when}',
      published: 'Published',
      drafts: 'Drafts',
      missingEnglish: 'Missing English',
      saves: 'Latest saves',
      empty: 'No saves yet. Start with the home page.',
      by: 'by {name}',
      draft: 'Draft',
      publishedBadge: 'Published',
    },
    actions: {
      home: { title: 'Home page', text: 'Edit the sections and publish' },
      addProduct: { title: 'Add a product', text: 'Prices, photos and sizes' },
      addPost: { title: 'Write a post', text: 'A new article on the blog' },
    },
    health: {
      title: 'Server',
      queue: 'Jobs queue',
      schedules: {
        pull: 'Nightly pull',
        ledger: 'Citation ledger',
        freshness: 'Weekly freshness',
        digest: 'Weekly digest',
        bookings: 'Booking reminders',
      },
      engine: {
        on: 'Content engine on',
        off: 'Content engine off',
        mock: 'Content engine on (mock connection)',
        noConnection: 'Content engine on with no connection',
        connectionOff: 'Content engine on, its connection off',
      },
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
  },
} as const;

/**
 * The shape of the tree with every literal widened: a string leaf is `string`, a two-word
 * pair stays a pair, a list of lines a list, a function keeps its signature, a record its
 * keys. The Arabic tree is typed as this, so a key missing there is a compile error.
 */
type Widen<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => R
  : T extends readonly [string, string]
    ? readonly [string, string]
    : T extends readonly string[]
      ? readonly string[]
      : T extends string
        ? string
        : T extends object
          ? { readonly [K in keyof T]: Widen<T[K]> }
          : T;

export type AdminStrings = Widen<typeof adminStrings>;

/**
 * A counted noun in the four Arabic plurals: the singular carries «واحد» or «واحدة», the dual
 * stands alone, three to ten take the plural, eleven and up the accusative singular.
 */
function arabicCount(
  n: number,
  forms: { one: string; two: string; few: string; many: string },
): string {
  if (n === 1) return forms.one;
  if (n === 2) return forms.two;
  if (n >= 3 && n <= 10) return `${n} ${forms.few}`;
  return `${n} ${forms.many}`;
}

/** Arabic counts of days («يوم», «يومين», «7 أيام», «30 يوماً»). */
function arabicDays(n: number): string {
  return arabicCount(n, { one: 'يوم', two: 'يومين', few: 'أيام', many: 'يوماً' });
}

/**
 * The Arabic tree, under the ux-araby rules (design system §5): nominal labels, verb-first
 * actions, light passives and never «تم», the Arabic comma, «أو» not «/», no «!», Western
 * digits, brand and product names and codes kept Latin. The keys are the English tree's.
 */
export const adminStringsAr: AdminStrings = {
  nav: {
    label: 'التنقل الرئيسي',
    brand: 'موقع بحر برنت',
    dashboard: 'لوحة التحكم',
    expand: 'وسّع الشريط الجانبي',
    collapse: 'اطوِ الشريط الجانبي',
    openMenu: 'افتح القائمة',
    closeMenu: 'أغلق القائمة',
    viewSite: 'عرض الموقع',
    language: 'لغة اللوحة',
    switchLanguage: 'بدّل إلى الإنجليزية',
    unsaved: {
      title: 'تغييرات غير محفوظة',
      text: 'تُفقد التغييرات غير المحفوظة عند تغيير اللغة. احفظ أولاً، أو غيّر اللغة رغم ذلك.',
      switchAnyway: 'غيّر اللغة',
      cancel: 'إلغاء',
    },
    badges: {
      overLimit: (n) =>
        arabicCount(n, {
          one: 'اتصال واحد تجاوز حدّه الشهري',
          two: 'اتصالان تجاوزا حدّهما الشهري',
          few: 'اتصالات تجاوزت حدّها الشهري',
          many: 'اتصالاً تجاوز حدّه الشهري',
        }),
    },
  },
  entityHeader: {
    shows: 'يظهر في:',
    listing: (label) => `شاهد ${label} في الموقع`,
    sectionsOn: (total, on) => `${total} أقسام، ${on} منها مفعّلة`,
  },
  header: {
    search: 'ابحث أو انتقل إلى…',
    searchAria: 'ابحث أو انتقل إلى قسم',
    viewSite: 'عرض الموقع',
  },
  account: {
    menu: 'قائمة الحساب',
    profile: 'حسابي',
    logout: 'تسجيل الخروج',
    roles: { admin: 'مدير', editor: 'محرّر' },
  },
  palette: {
    title: 'انتقل إلى…',
    placeholder: 'اكتب اسم قسم أو صفحة أو منتج',
    hint: 'اكتب حرفين أو أكثر للبحث في المحتوى',
    sections: 'الأقسام',
    results: 'المحتوى',
    empty: 'لا نتائج مطابقة.',
    open: 'فتح',
    shortcut: 'اضغط Ctrl K من أي مكان',
    searching: 'جارٍ البحث…',
    status: { draft: 'مسودة', published: 'منشور' },
  },
  login: {
    noAccount: 'ليس لديك حساب؟ اطلب واحداً من مدير الموقع.',
  },
  savedBy: {
    by: 'بواسطة',
    never: 'لا حفظ مسجّل بعد.',
  },
  warnings: {
    none: 'لا تنبيهات.',
  },
  fields: {
    pickColor: 'اختر لوناً',
  },
  common: {
    serverAnswered: 'أجاب الخادم بالرمز {status}',
    untitled: 'بلا عنوان',
  },
  time: {
    justNow: 'الآن',
    today: 'اليوم',
    tomorrow: 'غداً',
    dayAt: '{day} الساعة {time}',
    riyadh: '{when} بتوقيت الرياض',
  },
  bilingual: {
    languages: { ar: 'العربية', en: 'الإنجليزية' },
    loading: 'تحميل {language}…',
    failed: 'تعذّر تحميل نص اللغة {language}. أعد تحميل الصفحة لتحريره.',
    unavailable: 'تعذّر تحميل قيمة اللغة {language}. أعد تحميل الصفحة.',
    empty: 'فارغ',
  },
  engine: {
    generateNow: 'ولّد الآن',
    queueing: 'جارٍ الإرسال…',
    queued: 'في الطابور: تبدأ الجولة خلال دقيقة؛ راجع الجولات.',
    postTitle: 'محرّك المحتوى',
    regenerate: 'أعد التوليد',
    regenerateHint: 'جولة جديدة من الموضوع تستبدل النص وتبقي الرابط والغلاف كما هما.',
    importTitle: 'أضف مواضيع من CSV',
    importHint:
      'الأعمدة: title، hub (slug)، primaryKeyword، secondaryKeywords (مفصولة بـ ;)، intent، priority. لا بأس بصف عناوين.',
    importPlaceholder: 'title,hub,primaryKeyword,secondaryKeywords,intent,priority',
    importButton: 'استيراد',
    importing: 'جارٍ الاستيراد…',
    importResult: '{created} مضافة، {skipped} موجودة مسبقاً.',
    factsTitle: 'ما يجوز للمحرّك قوله',
    factsHint:
      'تُبنى من إعدادات الموقع والمنتجات والمتاجر المتصلة، باللغتين؛ وكل رقم تذكره المسودة يُراجع عليها.',
    factsNumbers: 'الأرقام في الورقة: {n}.',
    card: {
      title: 'المحرّك والإنفاق',
      state: {
        off: 'متوقف',
        on: 'يعمل',
        mock: 'اتصال تجريبي',
        noConnection: 'بلا اتصال',
        connectionOff: 'الاتصال معطّل',
      },
      runStatus: {
        done: 'اكتملت',
        failed: 'فشلت',
        running: 'تعمل',
        skipped: 'تُخطّيت',
      },
      connection: 'الاتصال',
      connectionOff: 'معطّل',
      pickConnection: 'لم يُختر اتصال: أضف واحداً في الاتصالات، ثم اختره في إعدادات المحرّك',
      postsThisMonth: 'مقالات هذا الشهر',
      costToday: 'تكلفة اليوم',
      cost: 'تكلفة هذا الشهر (تقديرية)',
      ofCap: '{n} من {cap}',
      nextSlot: 'الموعد التالي',
      nextSlotOff: 'لا جولة والمحرّك متوقف',
      nextSlotNoConnection: 'لا جولة بلا اتصال يعمل',
      nextSlotToday: 'اليوم الساعة {hour}:00 بتوقيت الرياض',
      nextSlotDone: 'اكتمل اليوم؛ غداً الساعة {hour}:00 بتوقيت الرياض',
      nextSlotSoon: 'خلال ساعة',
      connections: 'الاتصالات',
      spend: 'إنفاق هذا الشهر',
      runsThisMonth: 'الجولات',
      lastTest: 'آخر اختبار',
      testPassed: 'نجح {when}',
      testFailed: 'فشل {when}',
      neverTested: 'لم يُختبر بعد',
      overLimit: 'تجاوز الحد',
      noConnections: 'لا اتصال ذكاء اصطناعي بعد. أضف واحداً في الاتصالات.',
      allConnections: 'كل الاتصالات',
      settings: 'الإعدادات',
      topics: 'المواضيع',
      runs: 'الجولات',
    },
  },
  connections: {
    test: 'اختبر الاتصال',
    testing: 'جارٍ الاختبار…',
    works: 'يعمل.',
    worksWith: 'يعمل: أجاب {model}. سُجّلت النتيجة في الاتصال.',
    saveFirst: 'احفظ أولاً، ثم اختبر.',
    umami: {
      noId: 'لا معرّف موقع في Umami ضمن إعدادات الموقع، قسم التحليلات: املأه أولاً، ثم اختبر.',
      yesterday: (date, visitors, pageviews) =>
        `${date}: ${arabicCount(visitors, { one: 'زائر واحد', two: 'زائران', few: 'زوّار', many: 'زائراً' })}، ${arabicCount(pageviews, { one: 'مشاهدة صفحة واحدة', two: 'مشاهدتا صفحة', few: 'مشاهدات صفحات', many: 'مشاهدة صفحة' })}`,
    },
    googleCalendar: {
      noHost: 'لا بريد لصاحب التقويم في إعدادات الحجز: املأه أولاً، ثم اختبر.',
      today: (host, busy) =>
        `${host}: ${busy === 0 ? 'لا فترات مشغولة' : arabicCount(busy, { one: 'فترة مشغولة واحدة', two: 'فترتان مشغولتان', few: 'فترات مشغولة', many: 'فترة مشغولة' })} اليوم`,
    },
  },
  bookings: {
    remindWhatsApp: 'ذكّر على WhatsApp',
    reminder: {
      ar: 'مرحباً {name}، معك بحر برنت: نذكّرك بموعد استشارتك {when} بتوقيت الرياض.',
      en: 'Hello {name}, this is B7R Print: a reminder of your consultation on {when}, Riyadh time.',
    },
    reminderLink: {
      ar: 'رابط Meet: {link}',
      en: 'Meet link: {link}',
    },
  },
  appearance: {
    colours: {
      primary: 'اللون الأساسي',
      primaryDark: 'الأساسي الداكن',
      accent: 'لون التمييز',
      navy: 'الكحلي',
      ink: 'لون النص',
    },
    derived: {
      primaryHover: 'الأساسي تحت المؤشر',
      accentTint: 'التمييز الفاتح',
      accentOnTint: 'التمييز على لونه الفاتح',
      ground: 'الأقسام الرمادية',
      border: 'الخطوط الفاصلة',
      textMuted: 'النص الثانوي',
    },
    derivedInSentence: {
      primaryHover: 'الأساسي تحت المؤشر',
      accentTint: 'التمييز الفاتح',
      accentOnTint: 'التمييز على لونه الفاتح',
      ground: 'الأقسام الرمادية',
      border: 'الخطوط الفاصلة',
      textMuted: 'النص الثانوي',
    },
    strip: {
      title: 'الألوان المشتقة',
      lead: 'تُحسب من ألوان العلامة كلما غيّرتها. ثبّت لوناً يدوياً فقط إذا لم يناسب الموقع لونه المحسوب.',
      computed: 'محسوب',
      designed: 'قيمة مصمّمة',
      byHand: 'مثبّت يدوياً',
      from: 'من {colour}',
      designedNote: 'تبقى حتى يتغيّر {colour}',
      setByHand: 'ثبّته يدوياً',
      reset: 'أعِده',
      valueLabel: '{name}: القيمة المثبّتة يدوياً',
      waiting: 'بانتظار لون علامة صالح',
    },
    verdict: {
      title: 'فحص التباين',
      lead: 'كل زوج من الألوان يجمعه الموقع، بالألوان المختارة أعلاه الآن.',
      allPass: 'تنجح الأزواج كلها: يبقى الموقع مقروءاً بعد الحفظ.',
      failing: (n: number) =>
        n === 1
          ? 'زوج واحد دون الحد: يُرفض الحفظ حتى ينجح.'
          : `${arabicCount(n, { one: 'زوج واحد', two: 'زوجان', few: 'أزواج', many: 'زوجاً' })} دون الحد: يُرفض الحفظ حتى تنجح كلها.`,
      passes: 'ناجح',
      short: 'منخفض',
      needs: 'المطلوب {ratio}',
    },
    pairs: {
      buttonPrimary: 'النص الأبيض على اللون الأساسي (الأزرار وشريط الدعوة)',
      buttonPrimaryHover: 'النص الأبيض على الزر تحت المؤشر',
      buttonSecondary: 'النص الأساسي على الصفحة (الروابط والأزرار المفرّغة)',
      buttonInverseHover: 'النص الأساسي على التمييز الفاتح (الزر الفاتح تحت المؤشر)',
      badgeAccent: 'نص التمييز على لونه الفاتح (الشارات)',
      bodyOnSurface: 'نص المحتوى على الصفحة',
      bodyOnGround: 'نص المحتوى على الأقسام الرمادية',
      mutedOnSurface: 'النص الثانوي على الصفحة',
      mutedOnGround: 'النص الثانوي على الأقسام الرمادية',
      footerOnNavy: 'النص الأبيض على التذييل',
      ribbonOnPrimaryDark: 'النص الأبيض على الأساسي الداكن',
    },
    refusal: {
      darker: '{pair}: التباين {got} والمطلوب {wanted}. غيّر {colour} إلى لون أغمق.',
      lighter: '{pair}: التباين {got} والمطلوب {wanted}. غيّر {colour} إلى لون أفتح.',
    },
    pinRefusal: {
      darker: '{pair}: التباين {got} والمطلوب {wanted}. غيّر {colour} إلى لون أغمق، أو أعِده.',
      lighter: '{pair}: التباين {got} والمطلوب {wanted}. غيّر {colour} إلى لون أفتح، أو أعِده.',
    },
    more: 'يعرض فحص التباين البقية.',
    notAColour: 'اكتب اللون بصيغة #1f6feb: علامة # ثم ستة أرقام أو حروف من a إلى f.',
    typefacePreview: 'صمّم منتجك، ونطبعه ونوصله لعميلك.',
    notFollowing: {
      title: 'لا يتبع المظهر',
      lead: 'تبقى هذه على الألوان الأصلية بعد أي تغيير: كل منها ملف، لا حقل.',
      items: {
        icons3d: {
          name: 'الأيقونات الثلاثية الأبعاد الست',
          why: 'الأزرق جزء من ظلالها، ولا توجد ملفات مصدر لإعادة تلوينها.',
        },
        logo: {
          name: 'الشعار',
          why: 'ملفات صور رُسمت فيها الألوان؛ ترفع بديلها من تبويب الشعار.',
        },
        appIcons: {
          name: 'أيقونة تبويب المتصفح وأيقونة الجوال',
          why: 'ملفات صور مقتطعة من الشعار.',
        },
        themeColour: {
          name: 'لون شريط المتصفح في الجوال',
          why: 'مكتوب في الشيفرة باللون الأساسي الأصلي.',
        },
        gonePage: {
          name: 'صفحة الرابط المحذوف',
          why: 'تُعرض قبل تحميل الموقع، وألوانها الأصلية مكتوبة في الشيفرة.',
        },
        shareImages: {
          name: 'صور المشاركة',
          why: 'تُرسم مرة عند كل نشر للموقع بالألوان الأصلية.',
        },
        videoPoster: {
          name: 'صورة الفيديو في الصفحة الرئيسية',
          why: 'صورة مدموجة على الرمادي الأصلي.',
        },
        emails: {
          name: 'رسائل البريد',
          why: 'رسالة التأكيد ونسخة الرسالة وإعادة تعيين كلمة المرور تحمل الألوان الأصلية.',
        },
      },
    },
  },
  inbox: {
    replyWhatsApp: 'رد على WhatsApp',
    replyEmail: 'رد بالبريد',
    markHandled: 'علّم كمعالَج',
    marking: 'جارٍ التعليم…',
    handled: 'عولجت. تظهر خضراء في القائمة.',
    alreadyHandled: 'معالَجة من قبل.',
    gone: 'لم تعد هذه الرسالة موجودة. أعد تحميل القائمة.',
    refused: 'لا يمكنك تغيير هذه الرسالة.',
    reply: {
      greeting: {
        ar: 'مرحباً {name}، معك بحر برنت بخصوص رسالتك على b7r.sa.',
        en: 'Hello {name}, this is B7R Print about your message on b7r.sa.',
      },
      subject: {
        ar: 'بخصوص رسالتك إلى بحر برنت',
        en: 'About your message to B7R Print',
      },
    },
  },
  cells: {
    yesNo: ['نعم', 'لا'],
    onOff: ['مفعّل', 'معطّل'],
    notYet: 'ليس بعد',
    status: { published: 'منشور', draft: 'مسودة', changed: 'معدّل' },
  },
  readOnly: {
    noDate: 'ليس بعد',
  },
  jsonView: {
    copy: 'انسخ',
    copied: 'نُسخ',
  },
  views: {
    adminsOnlyTitle: 'للمديرين فقط',
    adminsOnly: 'هذه الصفحة للمديرين.',
  },
  visibility: {
    overall: 'درجة الظهور',
    open: 'افتح',
    countOf: '{done} من {total}',
    andMore: 'و{n} أخرى',
    moreDone: '{n} أخرى مكتملة',
    guaranteed: 'ما يضمنه الموقع',
    status: { done: 'مكتمل', next: 'التالي', missing: 'ناقص' },
    sections: {
      identity: 'الهوية',
      crawl: 'إتاحة الزحف',
      extractability: 'قابلية الاستخلاص',
      corroboration: 'الإسناد',
      measurement: 'القياس',
      signals: 'الإشارات الخارجية',
    },
    page: {
      title: 'درجة الظهور',
      siteOnly: 'ما بيدك: {n}%',
      intro: 'البنود المفتوحة: {open}. كل بند يرتبط بالحقل الذي يصلحه.',
      introOne: 'بند واحد مفتوح. يرتبط بالحقل الذي يصلحه.',
      recompute: 'أعد الحساب',
      howOverall:
        'كل البنود بأوزانها، والإشارات الخارجية معها: 100% تعني أن الموقع ومحركات البحث والمساعدين متفقون جميعاً. موقع مكتمل بلا خدمة متصلة يحصل على نحو 70.',
      howSiteOnly:
        'البنود التي لا تحتاج خدمة خارجية ولا مساعداً فقط؛ والبند الممتد على مستندات كثيرة يُحتسب بالنسبة (4 من 5 تساوي 80%).',
      up: 'ارتفعت بمقدار {n} منذ {date}',
      down: 'انخفضت بمقدار {n} منذ {date}',
      same: 'بلا تغيير منذ {date}',
    },
    signals: {
      title: 'الإشارات الخارجية',
      pullNow: 'اسحب الآن',
      pulling: 'جارٍ الإرسال',
      queued: 'في الطابور: تصل اللقطات خلال دقيقة؛ أعد التحميل لرؤيتها',
      asOf: 'بتاريخ {date}',
      waiting: 'متصل؛ تصل أول لقطة بعد السحب التالي.',
      notConnected: 'غير متصل.',
      connect: 'اربط',
      clicks: 'النقرات',
      impressions: 'مرات الظهور',
      ctr: 'نسبة النقر',
      position: 'الترتيب',
      query: 'الاستعلام',
      page: 'الصفحة',
      mobile: 'الجوال',
      desktop: 'الحاسوب',
      window: 'من {from} إلى {to}',
      psiErrors: 'الفحوص الفاشلة: {n}؛ الصف ناقص.',
      tooSoon: 'جرى سحب قبل لحظات؛ انتظر عشر دقائق.',
    },
    ledger: {
      title: 'سجل الاستشهادات',
      hint: 'كل صباح يُسأل كل اتصال ذكاء اصطناعي مفعّل الأسئلة المستحقة؛ وتغطي النسب الأسابيع الأربعة الأخيرة، على الأسئلة التي لا تذكر العلامة.',
      runNow: 'شغّل الآن',
      queuing: 'جارٍ الإرسال',
      queued: 'في الطابور: كل الأسئلة أياً كانت دوريتها؛ تصل الإجابات خلال دقائق، أعد التحميل لرؤيتها',
      tooSoon: 'أُرسلت جولة قبل لحظات؛ انتظر عشر دقائق.',
      every: (n) => `(كل ${arabicDays(n)})`,
      viewAnswer: 'عرض الإجابة',
      answerTitle: '{engine}، {date}',
      answerHint: 'الإجابة كما أعطاها المحرّك؛ والروابط التي استشهد بها مدرجة تحتها.',
      close: 'إغلاق',
      noLimit: 'بلا حد شهري',
      empty:
        'لا جولات بعد. أضف اتصال ذكاء اصطناعي في الإدارة، ثم اضغط «شغّل الآن» أو انتظر جولة الصباح.',
      prompts: 'الأسئلة',
      prompt: 'السؤال',
      notRun: 'لم يُشغّل',
      cited: 'ذكر بحر برنت',
      uncited: 'لم يذكر بحر برنت',
      linked: 'أدرج رابط الموقع',
      brand: '(يذكر العلامة)',
      rateLine: '{cited} من {runs} ذكرت بحر برنت؛ {linked} أدرجت رابطاً',
      fix: 'لا محرّك يذكر بحر برنت هنا: حسّن كتلة الإجابة في',
      competitors: 'المنافسون الأكثر ذكراً:',
    },
  },
  traffic: {
    groups: {
      ai: 'مساعدو الذكاء الاصطناعي',
      search: 'البحث',
      social: 'التواصل الاجتماعي',
      referral: 'مواقع أخرى',
      direct: 'مباشر',
    },
    channels: {
      'ai-other': 'ذكاء اصطناعي آخر',
      'search-other': 'بحث آخر',
      'social-other': 'تواصل آخر',
      referral: 'مواقع أخرى',
      direct: 'مباشر',
    },
    card: {
      title: 'من أين تأتي الزيارات',
      landings: 'الزيارات',
      topChannel: 'القناة الأولى',
      crawls: 'قراءات الزواحف',
      pages: 'أكثر صفحات الدخول',
      empty: 'لا زيارات بعد: يبدأ العدّ مع أول زائر.',
      link: 'كل الزيارات',
      visitors: 'الزوّار',
      pageViews: 'مشاهدات الصفحات',
      averageTime: 'متوسط الزيارة',
      people: 'الأشخاص، بحسب Umami حتى أمس',
      peopleSummed: 'زوّار الأيام مجموعةً، بحسب Umami حتى أمس',
    },
    families: {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      google: 'Google',
      perplexity: 'Perplexity',
      microsoft: 'Microsoft',
      apple: 'Apple',
      meta: 'Meta',
      amazon: 'Amazon',
      bytedance: 'ByteDance',
      commoncrawl: 'Common Crawl',
      duckduckgo: 'DuckDuckGo',
      yandex: 'Yandex',
      other: 'أخرى',
    },
    roles: {
      answer: 'يجيب شخصاً',
      search: 'يفهرس للبحث',
      training: 'يجمع للتدريب',
    },
    page: {
      title: 'مصادر الزيارات',
      intro: (n, since) =>
        `من أين جاء الزوار وما قرأته زواحف الذكاء الاصطناعي خلال آخر ${arabicDays(n)}، منذ ${since} (بتوقيت الرياض).`,
      range: 'المدة',
      days: arabicDays,
      aiShare: 'من مساعدي الذكاء الاصطناعي',
      channels: 'القنوات',
      channel: 'القناة',
      group: 'المجموعة',
      landings: 'الزيارات',
      share: 'النسبة',
      seen: 'الفترة',
      window: 'من {from} إلى {to}',
      sources: 'المصادر',
      source: 'المصدر',
      pages: 'صفحات الدخول',
      pageCol: 'الصفحة',
      topChannel: 'أكثر قناة جلبت',
      crawlers: 'الزواحف',
      bot: 'الزاحف',
      family: 'الشركة',
      role: 'الغرض',
      reads: 'القراءات',
      readMost: 'الأكثر قراءة',
      empty: 'لا شيء في هذه المدة بعد.',
      honesty: [
        'عدّ الموقع نفسه، لا تدقيق: صفحة فُتحت من موقع آخر أو من غير مصدر؛ ولا يُحفظ شيء عن الزائر.',
        'AI Overviews وAI Mode من Google تُحسب على Google.',
        'التطبيقات الأصلية (تطبيق ChatGPT والمتصفحات داخل التطبيقات) لا ترسل مُحيلاً، فتُحسب بعض زياراتها مباشرة.',
      ],
    },
  },
  dashboard: {
    greeting: {
      morning: 'صباح الخير، {name}',
      afternoon: 'مساء الخير، {name}',
      evening: 'مساء الخير، {name}',
    },
    range: 'المدة',
    hand: {
      title: 'يحتاج انتباهك اليوم',
      none: 'لا شيء يحتاج انتباهك اليوم.',
      failedRuns: (n) =>
        `${arabicCount(n, { one: 'جولة فاشلة واحدة', two: 'جولتان فاشلتان', few: 'جولات فاشلة', many: 'جولة فاشلة' })} هذا الأسبوع`,
      overLimit: '{label} تجاوز حده الشهري',
      failedTest: 'فشل اتصال {label} في آخر اختبار',
      missingEnglish: (n) =>
        `${arabicCount(n, { one: 'مستند واحد', two: 'مستندان', few: 'مستندات', many: 'مستنداً' })} بلا نسخة إنجليزية`,
      staleDrafts: (n, collection) =>
        `${arabicCount(n, { one: 'مسودة واحدة', two: 'مسودتان', few: 'مسودات', many: 'مسودة' })} في ${collection} أقدم من أسبوع`,
    },
    tiles: {
      visits: 'الزيارات',
      visitors: 'الزوّار',
      landings: (_n, text) => `الزيارات: ${text}`,
      summed: 'زوّار الأيام، مجموعةً',
      visitsUp: (n, days) => `أكثر بنسبة ${n}% من المدة السابقة (${arabicDays(days)})`,
      visitsDown: (n, days) => `أقل بنسبة ${n}% من المدة السابقة (${arabicDays(days)})`,
      visitsSame: (days) => `مثل المدة السابقة (${arabicDays(days)})`,
      visitsFirst: (days) => `لا زيارات في المدة السابقة (${arabicDays(days)})`,
      cited: 'نسبة الاستشهاد',
      citedDetail: (engines) =>
        `على أسئلة الفئة، 28 يوماً، ${arabicCount(engines, { one: 'محرّك واحد', two: 'محرّكان', few: 'محرّكات', many: 'محرّكاً' })}`,
      citedNone: 'لا جولة للسجل في آخر 28 يوماً',
      score: 'درجة الظهور',
      published: 'نُشر',
      publishedDetail: (days) => `مقالات وصفحات ومنتجات خلال ${arabicDays(days)}`,
      drafts: (n) =>
        n === 0
          ? 'لا مسودات بانتظارك'
          : `${arabicCount(n, { one: 'مسودة واحدة', two: 'مسودتان', few: 'مسودات', many: 'مسودة' })} بانتظارك`,
      unavailable: 'غير متاح',
    },
    inbox: {
      title: 'الوارد',
      newMessages: (n) =>
        n === 0
          ? 'لا رسائل جديدة'
          : arabicCount(n, {
              one: 'رسالة جديدة واحدة',
              two: 'رسالتان جديدتان',
              few: 'رسائل جديدة',
              many: 'رسالة جديدة',
            }),
      link: 'كل الرسائل',
      waiting: (n) =>
        n === 0
          ? 'لا شيء بانتظارك في الوارد'
          : `${arabicCount(n, { one: 'عنصر واحد', two: 'عنصران', few: 'عناصر', many: 'عنصراً' })} بانتظارك في الوارد`,
      todayBookings: (n) =>
        n === 0
          ? 'لا حجوزات اليوم'
          : `${arabicCount(n, { one: 'حجز واحد', two: 'حجزان', few: 'حجوزات', many: 'حجزاً' })} اليوم`,
      bookingsLink: 'كل الحجوزات',
    },
    assistants: {
      title: 'ماذا يقول المساعدون',
      lastRun: 'آخر جولة',
      nextRun: 'الجولة التالية',
      nextRunDue: 'الساعة 07:00 بتوقيت الرياض حين يحين موعد أحد الأسئلة',
      link: 'السجل كاملاً',
      notYet: 'لا جولة بعد',
    },
    content: {
      title: 'المحتوى',
      kind: 'النوع',
      homePublished: 'نُشرت {when}',
      homeDraft: 'مسودة حُفظت {when}',
      published: 'منشور',
      drafts: 'مسودات',
      missingEnglish: 'بلا إنجليزية',
      saves: 'آخر عمليات الحفظ',
      empty: 'لا حفظ بعد. ابدأ بالصفحة الرئيسية.',
      by: 'بواسطة {name}',
      draft: 'مسودة',
      publishedBadge: 'منشور',
    },
    actions: {
      home: { title: 'الصفحة الرئيسية', text: 'عدّل الأقسام وانشر' },
      addProduct: { title: 'أضف منتجاً', text: 'الأسعار والصور والمقاسات' },
      addPost: { title: 'اكتب مقالاً', text: 'مقال جديد في المدونة' },
    },
    health: {
      title: 'الخادم',
      queue: 'طابور المهام',
      schedules: {
        pull: 'السحب الليلي',
        ledger: 'سجل الاستشهادات',
        freshness: 'التحديث الأسبوعي',
        digest: 'الملخص الأسبوعي',
        bookings: 'تذكيرات الحجز',
      },
      engine: {
        on: 'محرّك المحتوى يعمل',
        off: 'محرّك المحتوى متوقف',
        mock: 'محرّك المحتوى يعمل (اتصال تجريبي)',
        noConnection: 'محرّك المحتوى يعمل بلا اتصال',
        connectionOff: 'محرّك المحتوى يعمل واتصاله معطّل',
      },
      check: 'التقرير الكامل',
      version: 'الإصدار',
      rows: {
        db: { ok: 'قاعدة البيانات تستجيب', error: 'قاعدة البيانات لا تستجيب' },
        jobs: { on: 'المهام المجدولة تعمل', off: 'المهام المجدولة لم تبدأ بعد' },
        jobsFailed: {
          none: 'لا مهام فاشلة',
          some: 'المهام الفاشلة: {n}',
          unknown: 'حالة المهام غير معروفة',
        },
        email: {
          resend: 'البريد يُرسل عبر Resend',
          console: 'البريد يُطبع في السجل، بلا خدمة إرسال',
        },
        turnstile: { on: 'فحص الروبوتات مفعّل', off: 'فحص الروبوتات معطّل' },
        indexnow: { on: 'تنبيهات محركات البحث مفعّلة', off: 'تنبيهات محركات البحث معطّلة' },
        media: { s3: 'الصور على التخزين السحابي', local: 'الصور على قرص الخادم' },
        contact: {
          live: 'نموذج التواصل يُرسل',
          mock: 'نموذج التواصل في وضع الاختبار',
          off: 'نموذج التواصل معطّل',
        },
        newsletter: {
          live: 'النشرة البريدية تسجّل المشتركين',
          mock: 'النشرة البريدية في وضع الاختبار',
          off: 'النشرة البريدية معطّلة',
        },
      },
    },
  },
};

/**
 * Whether a UI language is Arabic: the one comparison behind the strings tree, the number
 * and date locale (`admin/format.ts`) and a validation message's language
 * (`cms/fields/message.ts`). The content locale (which language of a document is open) is
 * the other axis (ADR-056) and never goes through here.
 */
export function isArabic(language: string | undefined): boolean {
  return language === 'ar';
}

/** The tree for a UI language: Arabic for `ar`, English for anything else (the fallback). */
export function adminStringsFor(language: string): AdminStrings {
  return isArabic(language) ? adminStringsAr : adminStrings;
}

/** Payload's own rule for the document direction, so our components agree with `html[dir]`. */
export function adminDirection(language: string): 'ltr' | 'rtl' {
  return (rtlLanguages as readonly string[]).includes(language) ? 'rtl' : 'ltr';
}
