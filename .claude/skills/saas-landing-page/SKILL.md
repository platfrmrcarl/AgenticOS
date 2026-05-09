---
name: saas-landing-page
description: Use this skill whenever building or improving a SaaS landing page, marketing page, pricing page, or conversion-focused web page. Trigger on any mention of landing page, marketing page, hero section, pricing page, conversion, copywriting for landing, OG image, hero copy, social proof, or "make this page convert better". Encodes Platfrmr's conversion-focused SaaS landing page patterns; do NOT default to generic Tailwind component examples that look obviously AI-generated — landing pages need conversion craft, not template aesthetics.
---

# SaaS Landing Page

Patterns for building landing pages that actually convert. Pairs with the `frontend-design` skill for visual quality. This skill focuses on **conversion structure and copy**, not just styling.

## When to use this skill

- Building a marketing/landing page from scratch
- Adding a pricing page
- Writing or rewriting hero copy
- Adding social proof, testimonials, FAQ
- Generating OG images for social sharing
- Reviewing a page for conversion issues

## Decisions to fill in

- **Brand voice**: [confident-and-direct / playful / technical-precise / etc.]
- **Tone**: [first-person "we" / second-person "you" / both]
- **Primary CTA**: [Start free trial / Book demo / Get started — pick ONE primary]
- **Pricing model**: [self-serve / sales-assisted / both — tiered]

## The structure that converts

For a SaaS landing page, this order works ~80% of the time:

1. **Hero** — single value prop + primary CTA + supporting visual
2. **Logo bar** (if you have customers/integrations to show)
3. **Problem / status quo** — what's broken without you
4. **Solution + how it works** — usually 3 steps or 3 features
5. **Social proof** — testimonials with photos + role + company
6. **Detailed features** — for visitors who scroll, give them depth
7. **Pricing** — transparent, with FAQ inline
8. **FAQ** — handle objections explicitly
9. **Final CTA** — restate the primary CTA with stronger urgency

Skip what's weak. A bad logo bar (3 logos no one's heard of) is worse than no logo bar.

## Hero copy formula

The hero is the one thing every visitor reads. Get it right.

**Pattern**: `<Specific outcome> for <specific audience>, without <painful tradeoff>.`

Examples:
- "Ship agentic SaaS to production in days, without a DevOps team."
- "Generate LinkedIn content that actually sounds like you, without spending hours writing."
- "Cancel any subscription in two clicks, without doom-scrolling settings menus."

**Anti-pattern**: vague benefit statements.
- ❌ "The future of work"
- ❌ "AI-powered productivity"
- ❌ "Empowering teams to do more"

**Sub-headline pattern**: One sentence that names the mechanism — *how* you achieve the outcome. This is where you earn credibility.

## Primary CTA rules

- **One** primary CTA per page. Secondary CTAs are visually subordinate.
- Verb-led, specific: "Start free trial" > "Get started" > "Learn more"
- Repeat the primary CTA every ~1.5 viewport heights of scroll
- The primary CTA in the nav matches the primary CTA in the hero

## Social proof patterns

In order of credibility (highest to lowest):

1. **Quantified outcome** — "Saved 12 hours/week for 200+ teams" with proof
2. **Recognizable customer logos** — only if recognizable to your ICP
3. **Named testimonials with photo + role + company** — specifics > superlatives
4. **Star ratings with platform attribution** — "4.9 on G2 (200 reviews)"
5. **Press mentions** — only if relevant publications
6. **Generic testimonials** — usually skip

Specifics multiply credibility. "Saved us 12 hours/week" hits harder than "Saved us tons of time."

## Pricing page rules

- **3 tiers max.** More than 3 paralyzes choice.
- **Highlight the recommended tier** visually (border, "most popular" badge)
- **Show monthly + annual toggle**, default to annual (better LTV)
- **Be transparent about limits** — usage caps go in the table, not buried in docs
- **FAQ inline below pricing** — handle "what if I need more seats" without making people leave
- **No "contact us" for the entry tier** — if your ICP is self-serve, *all* tiers must be self-serve

## FAQ — handle real objections

Don't write softball FAQs. Write the questions skeptical visitors are actually asking:

- "How is this different from <obvious competitor>?"
- "What if I cancel — do I lose my data?"
- "Can I start without a credit card?"
- "What if my team only has 2 people?"
- "How does this work with <tool I already use>?"

Ducking the hard questions kills conversion.

## Performance and Core Web Vitals

Google rewards fast pages, but more importantly, *visitors abandon slow ones*. Targets:

- **LCP** < 2.5s
- **CLS** < 0.1
- **INP** < 200ms

Practical tips:
- Hero image: use Next.js `<Image priority>` with `fetchPriority="high"`
- Font loading: `next/font` for self-hosted, `display: 'swap'`
- Above-the-fold: server-rendered, no hydration blockers
- Defer everything non-critical (analytics, chat widgets)

## OG images

Every page needs an `og:image`. Generate dynamically with `next/og`:

```tsx
// app/og/route.tsx
import { ImageResponse } from 'next/og';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') ?? 'Platfrmr';
  // ... return ImageResponse with title overlaid on brand template
}
```

See `templates/og-route.tsx`.

## Reference files

- `reference/hero-copy-examples.md` — Side-by-side weak vs strong hero copy
- `reference/pricing-page-patterns.md` — 3-tier vs usage-based vs hybrid layouts
- `reference/conversion-checklist.md` — Pre-launch QA list
- `templates/landing-page.tsx` — Full Next.js landing page scaffold
- `templates/pricing-section.tsx` — Pricing table component
- `templates/og-route.tsx` — Dynamic OG image generator
- `templates/testimonial-card.tsx` — Testimonial component

## Anti-patterns to avoid

- ❌ Vague hero ("AI-powered productivity for the future of work")
- ❌ Multiple competing CTAs in the hero
- ❌ "Trusted by leading companies" with logos no one recognizes
- ❌ Generic stock photography in testimonials (use real photos or no photos)
- ❌ Pricing locked behind "Contact Sales" for entry tiers (kills self-serve)
- ❌ FAQ that ducks real objections (writes "How easy is it?" instead of "How is this different from X?")
- ❌ Hero image that's a screenshot of your product (people don't know what they're looking at — show outcome, not interface)
- ❌ Auto-playing video with sound
- ❌ Newsletter popup before the visitor has read anything
- ❌ Cookie banner blocking the hero (legitimate consent flows can be deferred 2-3 seconds)
