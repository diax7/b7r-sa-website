# Getting into AI answers: what the 2026 evidence says, and what B7R does about it

Written 2026-09-14 for Dhia, on the question "how do we guarantee we appear in AI chat
answers and rank very high, including unofficial tricks". Sources at the end; the numbers
quoted are theirs, the judgement is ours. This document feeds §7 of the BRD and the Level 5
and 6 work; it is not a checklist to run blindly.

## The short answer

Nobody can guarantee a citation: the five engines barely read the same web (only 2.7 % of
cited domains are cited by all five; the same page is cited by two engines 6.8 % of the time),
answers are non-deterministic, and the source mix shifts inside a single quarter (Reddit fell
from about 60 % to about 10 % of ChatGPT answers between July and October 2025). What can be
done is to be *eligible* on every engine, *quotable* on every page, and *corroborated* off the
site, and to measure it per engine. The "tricks" (hidden text, instructions to the AI, paid
placements, mass-generated pages, seeded mentions) have been inside Google's spam policy since
15 May 2026 ("attempting to manipulate generative AI responses in Google Search") and were
enforced in the June 2026 spam update; the measured gains from them are contested and
temporary, the penalties are not. We do not do them.

## What the studies agree on

1. **Retrieval first.** Most citations come from live retrieval, not training data. ChatGPT
   retrieves through Bing (about 87 % of the URLs it cites are in Bing's index, Ahrefs 2026),
   Gemini and AI Overviews through Google, Perplexity through its own crawl. Not indexed in the
   engine's source, not cited. Almost no AI crawler runs JavaScript; 46 % of ChatGPT bot visits
   fetch raw HTML with no CSS or JS.
2. **Query type beats industry.** "Best X" questions get cited on 91 % of answers, definitions
   on 81 %; the page you publish moves your odds more than your sector does. Longer, specific
   prompts pull more citations on the chatbots (Claude 0.1 sources on a short query, 3 on a
   long one); AI Overviews do the reverse.
3. **Quotable beats long.** The only controlled experiment (Princeton GEO, KDD 2024, 10,000
   queries) found statistics +41 % visibility, quotations +37 %, cited sources +22 %, keyword
   stuffing minus 10 %. Pages with original first-party data are cited at 4.5x the rate of
   pages without (Gobiya 2026). Length has no measured effect.
4. **Corroboration beats links.** Branded web mentions correlate with AI Overview visibility
   at 0.66; backlinks at 0.22 (Ahrefs, 75,000 brands). Roughly 4.5 % of branded citations
   point at the brand's own pages in English; the rest is third parties. Engines look for
   consensus: a brand named in four of six retrieved sources gets named.
5. **Structured data helps outside Google.** About 30 % higher citation rates on ChatGPT and
   Perplexity with schema (Article with author and dates, FAQ, BreadcrumbList); Google's own
   May 2026 AI guide says it is not required for its generative surfaces. Google also says it
   does not read `llms.txt`, and that no AI-specific markup, Markdown or "chunking" is needed.
6. **Language decides the pool.** Engines cite in-language sources for in-language questions:
   Japanese questions send 26 % of citations to `.jp` domains against 1 % for the same
   questions in English (Weglot 2026). Content that exists only in one language is mostly
   invisible to questions asked in the other.

## What is different in Arabic (this changes our plan)

- Arabic is 0.6 % of the web's content for one of the largest language populations; 45.2 %
  of Saudi internet users use AI tools (CST 2026); ChatGPT holds about 91 % of the chatbot
  market in Saudi Arabia (Statcounter via AGBI, 2025). The pool of Arabic sources is thin, so
  the bar to enter the citation set is lower than in English, and it will rise.
- **Arabic answers are written from company websites, not from third parties.** In a 16-prompt
  audit of Google AI Overviews (Voctos, August 2026), 91 % of Arabic citations were the
  vendor's own pages, and not one was a directory or a ranking list; in English 67 % were
  vendor pages and directories and lists took 8 of 43 citations. Profound's 3.25 bn-citation
  analysis finds social platform citations "near-eliminated" in Arabic AI Overviews and at
  3 to 5 % in non-English ChatGPT. The Reddit playbook is an English playbook.
- Engines fall back to English sources when the Arabic answer is thin (ChatGPT cites the CDC
  and the NHS for Arabic health questions), and they skip Arabic pages that read like machine
  translation.
- Arabic Wikipedia and Wikidata are small; an entity there is "infrastructure" few competitors
  have.

So for Arabic the lever is our own site: real Arabic pages that state checkable facts with
numbers and dates, an FAQ that answers the questions buyers actually type (Khaleeji and
Arabizi phrasings in headings and FAQs, clean fusha in the answer body), named authors,
Organization and Article schema, and an entity presence. For English the lever is the
site plus corroboration: comparison content, reviews, mentions in publications and
communities, and Bing.

## What B7R already does (verified on the review server, 2026-09-14)

| Need | State |
|---|---|
| Crawlable without JS | Every public page is static HTML; the article is in the response |
| Retrieval bots allowed | `robots.txt` names OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Bingbot, Applebot; training bots not blocked (C-08) |
| Bing | IndexNow ping on every publish; Bing Webmaster in the launch checklist |
| Quotable structure | The engine's prompts and rubric require question H2s each opening with a one-sentence direct answer, a numeric example, and 3 takeaways up top |
| Facts with numbers | Every number comes from the facts sheet (B7R's own prices, delivery days, credit, catalogue) and is checked against it; a number not on the sheet costs points |
| Freshness | `datePublished` and `dateModified` in markup and on the page; the weekly freshness pass rewrites a post whose numbers left the sheet |
| Entity signals | `Organization` with logo and `sameAs` (X, Instagram, TikTok); `Person` for the author with `jobTitle` and `sameAs`; `BlogPosting` with `inLanguage`; `BreadcrumbList`; `Product` with `Offer` in SAR |
| Measurement | GA4 "AI Assistants" channel group; the quarterly 20-prompt audit (BRD §7.7) |
| Velocity and review | One post a day by default, a facts sheet, a human read of the first live posts (`reviewFirstRuns`), banned phrases and refusals: inside Google's "AI-assisted, human-reviewed, adds value" line, outside "scaled content abuse" |

## What we add, and where

| Action | Evidence | Where |
|---|---|---|
| The English site with hreflang pairs | Language decides the pool; translated sites gain visibility for English prompts (Weglot's 327 % is vendor data; the direction is confirmed by the citation studies) | Level 5 (in progress) |
| `FAQPage` schema on `/faq` and question-and-answer markup on posts whose H2s are questions (the visible text, never more) | ~30 % on ChatGPT and Perplexity; nothing on Google, nothing lost | Level 5b (BRD §7.4 amendment; the "no FAQPage" decision was about Google's rich result) |
| Original data pages: B7R's own numbers (delivery times measured, the most ordered products, average merchant margin, cost per piece by product) as a small "numbers" page updated quarterly, cited from posts | Statistics +41 %, first-party data 4.5x; nobody else has these numbers | Level 6 candidate; needs Dhia's data |
| Comparison content the site owns (B7R vs Printful vs Printify for a Saudi merchant), written from facts with the trade-offs stated honestly | "best X"/comparison queries are the most cited type; it is also in §12.5 | Level 6 candidate; already a BRD future block |
| Arabizi and dialect phrasings in FAQ questions and post headings, fusha in the answers | Arabic GEO guides; how people actually type | Content rule for the engine's outline prompt (5c) and the FAQ copy |
| `llms.txt` per language | Cheap; Google ignores it, OpenAI unconfirmed, Anthropic and others read it | Level 5c |
| A named author with credentials on every post, the author page linked | Institution and named expertise signals in both languages | Done; keep it |

## Dhia's part (nothing here can be done from the code)

1. Bing Webmaster Tools and Google Search Console at launch, sitemap submitted, IndexNow key
   in the environment; keep "Search generative AI control" on Include.
2. An entity outside the site: a Wikidata item for بحر برنت (a company with a registered
   entity and any press coverage qualifies), consistent name, description and category on
   LinkedIn, X, Instagram, TikTok, Maroof and the Salla and Zid app listings. An Arabic
   Wikipedia article only if independent coverage exists (their notability bar is real).
3. Corroboration in English: honest mentions in "print on demand in Saudi Arabia" roundups,
   a Trustpilot or Google reviews presence, the Salla and Zid marketplaces' reviews, a
   founder LinkedIn presence. Never paid placements or seeded threads (spam policy).
4. First-party numbers for the data page (above) once orders exist.
5. The quarterly prompt audit in Arabic, in dialect and in English, per engine, logged.

## What we will not do, and why

Hidden text or instructions addressed to "the AI" in a page, adversarial suffixes, cloaking a
different page to bots, "summarise with AI" share links that carry instructions, paid or
swapped mentions, fake reviews, seeded Reddit threads, and mass-generated near-duplicate
pages. All of it fails the one test that matters: it stops working the moment it is
explained. Google put it in the spam policy on 15 May 2026 and ran the enforcement pass on
24 to 26 June 2026; Reddit blocks about 23 million spam views a day with its own models; the
academic results that "worked" were measured with a single attacker in an empty room and
shrank or reversed under competition. The gains are temporary, a domain penalty is not, and
the site is the brand.

## Sources

- Cloro, AI Search Index (July 2026) and LLM Citations study; Wellows, 22.7 M citations
  (Jan to Jun 2026); SurfacedBy, 127,198 citations across five engines (June 2026); Geonimo,
  2.1 M sources (April 2026); DeltaV, 25,337 citations (July 2026); Gobiya, 3,217 citations
  (July 2026).
- Aggarwal et al., "GEO: Generative Engine Optimization", KDD 2024 (the controlled
  experiment); GEO-16 (arXiv 2509.10762).
- Google, AI Optimization Guide and the revised Web Search Spam Policies (15 May 2026); the
  June 2026 spam update coverage; Lily Ray's analysis of 220 sites scaling AI content.
- GEO Wiki, "GEO spam and manipulation" (July 2026), including the Microsoft Defender
  "AI recommendation poisoning" findings and the Cornell Tech deep-research poisoning paper.
- Voctos, "The state of Arabic AI citations" (August 2026), the 16-prompt Arabic vs English
  audit (August 2026) and the Saudi healthcare study (September 2026); AI in Arabia, Arabic
  GEO guide (June 2026); Weglot, citations by language and country (July 2026).
- Layer3, Rankosys, Dupple, Dattva, Okara, Am I Cited, CrawlRaven: practitioner guides,
  used for the mechanics (Bing behind ChatGPT, bot names), not for numbers.
