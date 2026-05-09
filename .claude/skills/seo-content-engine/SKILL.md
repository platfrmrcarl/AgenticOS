---
name: seo-content-engine
description: Use this skill whenever working on SEO, content marketing, programmatic SEO, blog content, sitemaps, schema.org markup, or LLMs.txt files. Trigger on any mention of SEO, AEO, AI search optimization, content cluster, keyword research, sitemap, schema markup, structured data, JSON-LD, blog post structure, llms.txt, or "ranking on Google/AI search". Encodes Platfrmr's content strategy for both Google and AI-engine visibility; do NOT default to outdated SEO tactics like keyword density or thin programmatic SEO that gets penalized.
---

# SEO + AI Search Content Engine

Inbound content strategy for SaaS — both Google rankings and visibility in AI search engines (Claude, ChatGPT, Perplexity, Google AI Overviews). This is your inbound moat.

## When to use this skill

- Writing or planning a blog post
- Setting up programmatic SEO pages
- Adding schema.org markup to pages
- Generating or updating `llms.txt` and `sitemap.xml`
- Researching keywords or topics
- Auditing existing content for SEO/AEO
- Building content clusters around a topic

## Decisions to fill in

- **Content focus**: [topical authority on / specific JTBD / etc.]
- **Publishing cadence**: [N posts/month — sustainable beats frequent]
- **Word count target**: 1500-3000 for pillar, 800-1500 for satellite
- **Authorship**: real human bylines (impacts E-E-A-T)

## SEO + AEO: optimize for both

"SEO" used to mean Google. Now you're also optimizing for AI engines that synthesize answers from sources. The good news: **what works for AI engines mostly works for Google in 2026**. Both reward:

- **Clear, specific answers to specific questions**
- **First-hand experience and expertise** (E-E-A-T)
- **Quotable, structured passages** (good for snippets AND AI citations)
- **Proper schema markup** (helps both)
- **Trustworthy linking and citations**

What's diverging:

- AI engines reward **directly answering the question in the first paragraph**. Google has tolerated build-up; AI engines don't.
- AI engines pay attention to **`llms.txt`** and structured `/api/` endpoints — Google doesn't (yet).
- AI engines weigh **fresh content** more aggressively for time-sensitive topics.

## Content cluster strategy

Don't write isolated posts. Build clusters:

```
Pillar page: "Complete guide to building agentic SaaS" (3000+ words, broad)
  ├── Satellite: "How to choose between LangChain and Google ADK" (1200 words)
  ├── Satellite: "Multi-agent vs single-agent: when to use which" (1200 words)
  ├── Satellite: "Cost analysis of GPT-4 vs Claude vs Gemini for agents" (1500 words)
  └── Satellite: "Authentication patterns for agentic SaaS" (1000 words)
```

Pillar links to all satellites. Satellites link back to pillar and to relevant siblings. This signals topical authority to Google and gives AI engines a coherent body to draw from.

## Blog post structure that ranks

```markdown
# [Specific Question or Outcome]

[1-paragraph TL;DR that directly answers the title — AI engines lift this for citations]

## [First specific sub-question]

[Direct answer]

[Specifics, examples, code, screenshots]

## [Second specific sub-question]

...

## FAQ

[Questions people ACTUALLY ask, lifted from "People also ask", forums, support tickets]

## Related reading

[Links to 3-5 related cluster posts]
```

**The TL;DR matters more than ever.** AI engines disproportionately quote the first paragraph as a citation. If you bury the answer, you lose AI visibility.

## Schema markup essentials

Every blog post needs `Article` schema. Pricing pages need `Product` + `Offer`. FAQ sections need `FAQPage`. How-tos need `HowTo`.

```tsx
import { Article, WithContext } from 'schema-dts';

export default function BlogPost({ post }) {
  const schema: WithContext<Article> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    image: post.ogImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Person', name: post.author.name, url: post.author.url },
    publisher: {
      '@type': 'Organization',
      name: 'Platfrmr',
      logo: { '@type': 'ImageObject', url: 'https://platfrmr.com/logo.png' },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {/* ... article content ... */}
    </>
  );
}
```

See `templates/schema-helpers.ts`.

## llms.txt

`llms.txt` is the emerging standard for telling AI crawlers what your site is about and where the canonical content lives. Lives at `/llms.txt` at the domain root.

```
# Platfrmr

> Build and deploy agentic SaaS applications by describing them in plain English.

## Docs

- [Quickstart](https://platfrmr.com/docs/quickstart): Get started in 5 minutes
- [Agent SDK](https://platfrmr.com/docs/agents): Build custom agents with Google ADK
- [Deployment](https://platfrmr.com/docs/deploy): Deploy to GCP Cloud Run

## Examples

- [LinkedIn post generator](https://platfrmr.com/examples/linkedin): ...
- [Software factory](https://platfrmr.com/examples/factory): ...

## Optional

- [Blog](https://platfrmr.com/blog): Long-form content on agentic SaaS
- [Pricing](https://platfrmr.com/pricing): Tier and pricing details
```

See `templates/llms-txt-generator.ts` for generating this from your content collection.

## Programmatic SEO (do it carefully)

Generating thousands of pages from a template can rank well — or get penalized as thin content. The line:

**Acceptable programmatic SEO**: pages where each variant has unique, useful data
- "[Tool A] vs [Tool B]" comparison pages with real feature comparison data
- "[City] [Service]" landing pages with actual local listings
- Glossary terms with substantive definitions and examples

**Spammy programmatic SEO** (will get penalized):
- "[City] [Service]" pages with identical body content + city name swapped
- AI-generated content with no editorial review
- Pages targeting keyword variants with substantively identical content

**Rule of thumb**: if a human reading two of your programmatic pages can't tell them apart in 10 seconds, neither can Google.

## Sitemap

Generate dynamically. Include only canonical URLs. Update on content changes.

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/content';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  return [
    { url: 'https://platfrmr.com', lastModified: new Date(), priority: 1.0 },
    { url: 'https://platfrmr.com/pricing', lastModified: new Date(), priority: 0.9 },
    ...posts.map((p) => ({
      url: `https://platfrmr.com/blog/${p.slug}`,
      lastModified: p.updatedAt,
      priority: 0.7,
    })),
  ];
}
```

## Reference files

- `reference/keyword-research.md` — Practical keyword research workflow
- `reference/content-clusters.md` — Building topical authority
- `reference/aeo-tactics.md` — Optimizing specifically for AI engines
- `templates/blog-post.mdx` — Canonical blog post structure with frontmatter
- `templates/schema-helpers.ts` — JSON-LD generators for common page types
- `templates/llms-txt-generator.ts` — Auto-generate llms.txt from content
- `templates/sitemap.ts` — Dynamic sitemap

## Anti-patterns to avoid

- ❌ Burying the answer past the fold (AI engines won't quote it)
- ❌ Keyword stuffing (penalty risk + reads terribly)
- ❌ AI-generated posts published without editorial review (Google can detect, ranks poorly)
- ❌ Thin programmatic SEO (pages substantively identical except for swapped tokens)
- ❌ Missing schema markup on blog posts
- ❌ No `llms.txt` (you're invisible to AI crawlers' canonical index)
- ❌ Topic-hopping with no cluster strategy (no topical authority)
- ❌ Content marked `noindex` accidentally (audit `robots.txt` + meta tags)
- ❌ Blog hosted on a subdomain (`blog.platfrmr.com`) instead of subfolder (`platfrmr.com/blog`) — splits authority
