# custix.ai Website — Product Requirements Document

## Problem Statement

Lawyers and tax advisors in the DACH region increasingly use AI tools (ChatGPT, Claude, etc.) for drafting briefs, research, and case work. Sending client data to US cloud providers violates GDPR and professional secrecy obligations (Verschwiegenheitspflicht, Steuergeheimnis). Current workarounds — avoiding AI entirely, using it secretly, or manually anonymizing documents — are either a competitive disadvantage, a legal risk, or cost 30–60 minutes per document.

custix.ai solves this with a local desktop tool that anonymizes documents in under 5 seconds and re-identifies AI responses automatically. The product is pre-launch and needs a website to establish market presence, capture SEO keywords across five audience segments, and convert visitors into 14-day free trial signups.

## Solution

A multi-page, bilingual (DE/EN) marketing website that:

- Communicates the core value proposition in under 3 seconds (animated mockup showing anonymization in action)
- Targets five distinct audience segments with dedicated, SEO-optimized landing pages
- Builds trust through prominent security signals (100% local, GDPR-compliant, no cloud)
- Converts visitors through a lightweight trial signup flow (name, email, profession)
- Establishes credibility through a team section featuring a lawyer co-founder

## User Stories

1. As a German-speaking lawyer, I want to find custix.ai when I search "Mandantendaten anonymisieren KI", so that I can discover a solution to my GDPR compliance problem
2. As a visiting lawyer, I want to understand what custix.ai does within 3 seconds of landing on the homepage, so that I can decide whether it's worth my time
3. As a visiting lawyer, I want to see an animated demo of the anonymization workflow, so that I can understand how the tool works without reading a wall of text
4. As a risk-averse lawyer, I want to see prominent trust signals (100% local, DSGVO-konform, Keine Cloud), so that I can feel confident the tool meets my compliance requirements
5. As a lawyer evaluating the tool, I want a dedicated page explaining how custix.ai solves my specific pain points (Verschwiegenheitspflicht, DSGVO), so that I can justify the purchase to my firm
6. As a tax advisor, I want a dedicated page addressing Steuergeheimnis and my specific workflow, so that I feel the tool was built for my profession, not just lawyers
7. As an HR professional, I want to find custix.ai when searching "Bewerberdaten anonymisieren", so that I can discover the tool for my recruiting workflow
8. As a healthcare professional, I want a landing page explaining how custix.ai handles Patientendaten, so that I can evaluate it for my medical practice
9. As an insurance professional, I want to see how custix.ai handles Schadensberichte, so that I can evaluate it for claims processing
10. As an English-speaking visitor, I want to browse the full site in English with proper SEO-optimized content (not just a translation), so that I find custix.ai through English search queries like "anonymize documents for AI"
11. As a visitor on any page, I want to start a 14-day free trial with minimal friction (3 fields: name, email, profession), so that I can try the tool without a sales call
12. As a visitor who prefers talking to someone, I want to book a 15-minute call directly from the contact page via Cal.com, so that I can get my questions answered live
13. As a privacy-conscious visitor, I want a DSGVO-compliant cookie banner that blocks GA4 until I consent, so that the website practices what the product preaches
14. As a visitor on mobile, I want a sticky "Kostenlos testen" button always visible at the bottom of my screen, so that I can sign up at any moment
15. As a mobile visitor, I want the animated mockup to stack vertically (legal brief first, tax filing below), so that it's readable on my screen
16. As a visitor evaluating trust, I want to see the founding team with photos, names, roles, and LinkedIn links, so that I know real people stand behind this product
17. As a visitor comparing options, I want a clear pricing page with two tiers (Einzelplatz and Team) and no hidden costs, so that I can make a quick decision
18. As a German visitor, I want to see Impressum, Datenschutzerklärung, and AGB in the footer, so that I trust this is a legitimate operation
19. As the custix.ai team, I want trial signups stored in Supabase with name, email, profession, locale, and timestamp, so that I can track conversions by segment
20. As the custix.ai team, I want a transactional confirmation email sent via Resend after signup, so that leads receive immediate acknowledgment
21. As the custix.ai team, I want GA4 tracking (with consent) to understand which audience pages convert best, so that I can prioritize marketing spend
22. As the custix.ai team, I want the site deployed on Vercel with automatic git deployments, so that updates go live immediately
23. As a visitor switching languages, I want a DE/EN toggle in the navigation that preserves my current page context, so that I don't lose my place
24. As a search engine crawler, I want proper hreflang tags on every page, so that German results show the DE version and English results show the EN version

## Implementation Decisions

### Architecture
- **Framework:** Next.js 14+ with App Router, TypeScript, Tailwind CSS
- **Hosting:** Vercel (free tier)
- **Database:** Supabase (Postgres, free tier) — single `signups` table
- **Email:** Resend (free tier, 3,000 emails/month) — transactional confirmation emails
- **Analytics:** GA4, loaded conditionally after cookie consent
- **Booking:** Cal.com embed (https://www.cal.eu/moritz-1xki/15min)

### i18n Strategy
- Next.js middleware-based routing: `/de/...` and `/en/...` with DE as default
- Translation files as JSON: one file per language, keyed by page/section
- Not a literal translation — each language version has independently optimized SEO headlines and content
- hreflang tags on all pages for proper search engine indexing

### Color Palette
| Role | Hex | Usage |
|---|---|---|
| Primary (Deep Navy) | #1E3A5F | Headings, nav, footer |
| Accent (Royal Blue) | #2563EB | CTAs, links, interactive elements |
| Warm Accent (Soft Amber) | #F59E0B | Trust badges, highlights |
| Background (Snow) | #F8FAFC | Page background |
| Surface (White) | #FFFFFF | Cards, sections |
| Text (Slate) | #334155 | Body text |
| Muted (Cool Gray) | #94A3B8 | Secondary text, borders |

### Typography
- **Headings:** Plus Jakarta Sans (Google Fonts)
- **Body:** Inter (Google Fonts)

### Entity Highlight Colors (Animated Mockup)
- Persons: Blue #DBEAFE
- Addresses: Green #DCFCE7
- IDs/Case numbers: Amber #FEF3C7

### Page Structure
| Route (DE) | Route (EN) | Purpose |
|---|---|---|
| `/` | `/en` | Homepage — audience-neutral hero, animated mockup, trust badges, audience switcher, security section, FAQ |
| `/fuer-anwaelte` | `/en/for-lawyers` | Lawyer funnel — Verschwiegenheitspflicht, DSGVO pain points |
| `/fuer-steuerberater` | `/en/for-tax-advisors` | Tax advisor funnel — Steuergeheimnis pain points |
| `/fuer-hr` | `/en/for-hr` | HR funnel — Bewerberdaten, recruiting compliance |
| `/fuer-gesundheitswesen` | `/en/for-healthcare` | Healthcare funnel — Patientendaten |
| `/fuer-versicherungen` | `/en/for-insurance` | Insurance funnel — Schadensberichte |
| `/preise` | `/en/pricing` | Two-tier pricing + trial signup |
| `/ueber-uns` | `/en/about` | Team section with photos |
| `/kontakt` | `/en/contact` | Form + email + Cal.com embed |
| `/impressum` | `/en/legal-notice` | Legal notice (placeholder) |
| `/datenschutz` | `/en/privacy` | Privacy policy (placeholder) |
| `/agb` | `/en/terms` | Terms of service (placeholder) |

### SEO Headlines (H1 per audience page)
| Page | DE H1 | EN H1 |
|---|---|---|
| Lawyers | Mandantendaten anonymisieren — KI sicher nutzen als Anwalt | Anonymize Client Data — Use AI Safely as a Lawyer |
| Tax Advisors | Mandantendaten anonymisieren — KI sicher nutzen als Steuerberater | Anonymize Client Data — Use AI Safely as a Tax Advisor |
| HR | Bewerberdaten anonymisieren — KI datenschutzkonform im Recruiting nutzen | Anonymize Applicant Data — Use AI in Recruiting, GDPR-Compliant |
| Healthcare | Patientendaten anonymisieren — KI sicher nutzen im Gesundheitswesen | Anonymize Patient Data — Use AI Safely in Healthcare |
| Insurance | Schadensberichte anonymisieren — KI sicher nutzen in der Versicherung | Anonymize Claims Reports — Use AI Safely in Insurance |
| Homepage | Dokumente anonymisieren in 5 Sekunden — KI sicher nutzen mit custix | Anonymize Documents in 5 Seconds — Use AI Safely with custix |

### Navigation
Main nav (5 items max): `custix.ai` | Lösungen ▾ | Preise | Über uns | **Kostenlos testen** | 🌐 DE/EN

Lösungen dropdown:
- **Für Ihre Branche:** Anwälte, Steuerberater
- **Weitere Branchen:** HR & Recruiting, Gesundheitswesen, Versicherungen

### Signup Flow
- Light-gate modal: 3 fields (Name, E-Mail, Beruf dropdown)
- Beruf options: Anwalt, Steuerberater, HR, Gesundheitswesen, Versicherung, Sonstiges
- CTA label: "14 Tage kostenlos testen"
- On submit: insert into Supabase `signups` table, send confirmation email via Resend
- Supabase schema: `id`, `name`, `email`, `profession`, `locale` (de/en), `created_at`

### Animated Mockup
- Two documents side by side: legal brief (left) + tax filing (right)
- Language-neutral sample data (e.g. "John Smith, 42 Oak Street, Case #2024-1847")
- Three-beat animation loop (~5 seconds): documents appear → entities highlighted and replaced with colored placeholders → clean anonymized result with "Re-Identify" button pulse
- Mobile: stacks vertically, legal brief first
- Pure CSS/JS animation, no external dependencies

### Mobile
- Hamburger nav with sticky "Kostenlos testen" button at screen bottom
- Animated mockup stacks vertically
- Audience switcher as swipeable cards with dot indicators

### Cookie Consent
- Custom banner component, blocks GA4 until explicit opt-in
- Consent stored in localStorage
- GA4 script injected conditionally after consent
- Must be DSGVO-compliant (no pre-checked boxes, clear opt-in/opt-out)

### Footer
- Column 1: custix.ai + tagline
- Column 2: Lösungen (links to all 5 audience pages)
- Column 3: Unternehmen (Über uns, Preise, Kontakt)
- Column 4: Rechtliches (Impressum, Datenschutz, AGB)
- Bottom bar: © 2026 custix.ai

### Team
- Laurenz Lettner — Lawyer / Legal
- Lorenz Kutschka — Developer / Tech
- Moritz Lumetsberger — Product

## Testing Decisions

Testing focuses on the signup flow — the only module where bugs directly lose leads. Presentational components are not tested.

- **What makes a good test:** Tests should verify external behavior (API response codes, database state, email dispatch) not implementation details (which function was called, internal state). Tests should be runnable without external services by mocking Supabase and Resend at the HTTP boundary.
- **Signup API route:** Test that valid submissions return 200 and insert a row. Test that missing fields return 400. Test that duplicate emails are handled gracefully. Test that the Resend email is triggered on success.
- **Cookie consent logic:** Test that GA4 script is not present in DOM before consent. Test that it appears after consent. Test that localStorage persists the choice.

## Out of Scope

- Blog / content marketing pages (future SEO play, not needed for launch)
- Admin dashboard for viewing signups (use Supabase dashboard directly)
- Actual product download or distribution (the trial signup captures leads; download delivery is manual for now)
- CMS integration (all content lives in i18n JSON files, edited in code)
- A/B testing infrastructure
- Social media integration (no LinkedIn company page yet)
- Chat widget or live support
- Multi-language beyond DE/EN (no French, Italian, etc.)

## Further Notes

- The site must go live today. Prioritize speed over perfection — placeholder content is acceptable for legal pages and secondary audience pages.
- Team photos need to be provided by Moritz. Use placeholder avatars until real photos are available.
- The domain custix.ai ownership needs to be confirmed before Vercel deployment.
- Cal.com booking link: https://www.cal.eu/moritz-1xki/15min?overlayCalendar=true
- Taglines: "KI nutzen. Mandanten schützen." (lawyers), "KI nutzen. Clienten schützen." (tax advisors)
- The animated mockup is the highest-impact visual element — invest time here over other sections.
