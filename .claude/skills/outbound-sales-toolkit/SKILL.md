---
name: outbound-sales-toolkit
description: Use this skill whenever working on outbound sales, cold email, LinkedIn outreach, ICP definition, sequence design, lead enrichment, deliverability (SPF/DKIM/DMARC), or reply handling. Trigger on any mention of cold email, outbound, prospecting, lead gen, sales sequence, LinkedIn outreach, ICP, deliverability, email warming, reply, or "getting more leads". Encodes Platfrmr's outbound playbook for getting startups to first revenue; do NOT default to spammy mass-mailer patterns or generic AI-sounding cold email — modern outbound is 1:1 personalized, low-volume, and high-relevance.
---

# Outbound Sales Toolkit

Patterns for outbound that works in 2026 — past the "spam 10,000 ICPs" era. Modern outbound is **low-volume, high-relevance, personally accountable**.

## When to use this skill

- Defining or refining an ICP
- Writing a cold email or LinkedIn outreach sequence
- Setting up email infrastructure (domains, warming, deliverability)
- Building a lead enrichment pipeline
- Reviewing reply handling / objection responses
- Auditing why an outbound campaign isn't working

## Decisions to fill in

- **Sending volume target**: keep it **<50/day per inbox, <500/day across the org** to stay deliverable
- **ICP**: [be specific — title, company size, signal] — vague ICP = vague results
- **Channel mix**: [email-only / email + LinkedIn / multichannel + phone]
- **Tone**: see your `saas-landing-page` brand voice — outbound should match marketing voice

## ICP definition

A useful ICP isn't "B2B SaaS founders." Useful ICP includes:

- **Title**: e.g., "Head of Engineering" or "VP of Marketing" — exact, not "decision maker"
- **Company size**: e.g., "Series A through Series C, 20-200 employees"
- **Industry**: be narrow — "B2B SaaS" beats "tech," "vertical SaaS for healthcare" beats "B2B SaaS"
- **Triggering signal**: what makes *now* the right time to reach out? (recent hire, funding, job posting, tool stack change)

The signal is the most important part. Without a signal, you're emailing cold; with a signal, you're emailing relevantly.

**Example signals**:
- Hired a VP of Engineering in last 90 days (LinkedIn)
- Raised Series A in last 60 days (Crunchbase)
- Posted a job for "Founding Engineer, AI" (job boards)
- Started using <competitor tool> (BuiltWith, Wappalyzer)
- Founder posted publicly about <pain point> (LinkedIn, X)

## Cold email anatomy

```
Subject: [4-6 words, lowercase, no emoji, no clickbait]

[1-line hook — references the SIGNAL specifically]

[1-line relevance — why you, why this, why now]

[1-line ask — specific, low-commitment]

[Signature with real name, title, company, calendar link]
```

Total length: **under 75 words**. Anything longer signals "automated and aggressive."

### Examples

**❌ Bad** (template-y, no signal, vague):
```
Subject: Quick question

Hi {firstName},

I noticed {company} is in the SaaS space and thought you'd be interested in our AI-powered platform that helps companies like yours drive efficiency and unlock growth.

Are you open to a 15-minute call this week to learn more?

Best,
Mike
```

**✅ Better** (specific signal, short, low-commitment):
```
Subject: noticed your founding engineer post

Hey Sarah —

Saw you posted the Founding Eng (AI) role last Tuesday. Cold-take: the hardest hire for that role isn't finding the eng, it's defining what "AI" means at Acme without a senior AI hire to scope it.

We help early teams ship their first agent in <2 weeks while the founding eng search runs. Worth a 15-min on whether that timeline pressure resonates?

Carl
[calendar link]
```

**The hook** — first line — earns the rest. If the first line doesn't land, nothing else gets read.

## Sequence design

Modern sequences are **shorter and more spaced** than the old 8-touch sequences:

```
Day 0:  Email 1 — initial outreach (signal-based)
Day 3:  Email 2 — value-add (resource, insight, no ask)
Day 7:  LinkedIn connection request (no message OR same-thread continuation)
Day 12: Email 3 — final ask, polite breakup
Day 30: Re-add to a quarterly check-in cadence (NOT another sequence)
```

**Don't bump the same thread 7 times.** It signals desperation and trains people to ignore you.

## Deliverability infrastructure

If your emails land in spam, none of the above matters. Setup checklist:

1. **SPF, DKIM, DMARC** — all three, configured strict
2. **Custom sending domain** (NOT your primary domain) — e.g., `try.platfrmr.com` or `platfrmr.io`
3. **Warm new domains for 4-6 weeks** before sending real outbound
4. **Multiple inboxes** rotating sends — never blast from one inbox
5. **Send volume limits**: 30-50/day per inbox, ramping up slowly
6. **Plain text first** — HTML emails with images, links, and tracking pixels look like marketing
7. **Avoid tracking pixels and click tracking** — Apple Mail Privacy Protection breaks the data anyway and they hurt deliverability
8. **No unsubscribe link in 1:1 outbound** — but always honor "stop emailing me" replies immediately

See `reference/deliverability-setup.md` for the full DNS records, warming sequence, and provider recommendations.

## Reply handling

Replies are 80% of the outcome. Common reply patterns:

| Reply type | Response pattern |
|---|---|
| "Tell me more" | One specific question to qualify before pitching |
| "Send info" | Send a Loom (1-2 min) not a deck |
| "Not now / Q4" | Acknowledge, schedule a calendar reminder, don't push |
| "Wrong person" | Ask for the right person, send a forwarded note |
| "We use [competitor]" | Don't bash competitor; ask one specific question about their experience |
| "Stop emailing me" | One reply: "Got it, removing you. Sorry for the noise." Then actually remove. |

## LinkedIn outreach

Different rules than email:

- **Connection request**: no message, OR ultra-short (under 200 chars) referencing the signal
- **First DM after connecting**: wait 1-2 days, then send a short message NOT pitching
- **Pitch on second DM at the earliest** — usually third
- **Voice notes** convert way better than text DMs (bandwidth + humanity)
- **No automation** — LinkedIn detects and limits/bans accounts that use it

## Reference files

- `reference/icp-definition.md` — Worksheet for nailing your ICP
- `reference/deliverability-setup.md` — DNS, warming, provider setup
- `reference/sequence-templates.md` — Annotated example sequences
- `reference/objection-handling.md` — Reply patterns for common objections
- `templates/cold-email-1.md` — Initial outreach template (signal-based)
- `templates/breakup-email.md` — Final-touch breakup email
- `templates/linkedin-sequence.md` — LinkedIn-only sequence

## Anti-patterns to avoid

- ❌ Vague ICP ("B2B SaaS decision-makers")
- ❌ Sending without a signal (you're spamming, even if you don't think you are)
- ❌ Long emails (>75 words for cold = too long)
- ❌ Multiple CTAs in one email
- ❌ "{firstName}" mail-merge tokens visible (check before send)
- ❌ Sending from the primary domain (one spam complaint = your real email is dead)
- ❌ Tracking pixels (broken by Apple, hurts deliverability)
- ❌ Bumping the same thread 5+ times
- ❌ Cold email written in the same voice as your marketing copy (more conversational, less polished)
- ❌ Asking for "15 minutes to learn about your needs" (it's about them — give value first)
- ❌ Not honoring opt-outs immediately (legal + reputational risk)
