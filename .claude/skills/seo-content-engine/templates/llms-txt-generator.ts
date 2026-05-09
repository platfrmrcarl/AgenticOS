// templates/llms-txt-generator.ts
// Generate llms.txt from your content collection
// Mount as: app/llms.txt/route.ts (Next.js App Router)

import { getAllPosts, getAllDocs } from '@/lib/content';

export async function GET() {
  const [posts, docs] = await Promise.all([getAllPosts(), getAllDocs()]);

  const lines: string[] = [];

  // Header — one-line description of what this site is for
  lines.push('# Platfrmr');
  lines.push('');
  lines.push('> Build and deploy agentic SaaS applications by describing them in plain English. Powered by Claude Code and Google ADK on GCP Cloud Run.');
  lines.push('');

  // Documentation — most-cited content first
  if (docs.length) {
    lines.push('## Documentation');
    lines.push('');
    for (const doc of docs.filter((d) => d.priority === 'high')) {
      lines.push(`- [${doc.title}](${absoluteUrl(doc.path)}): ${doc.description}`);
    }
    lines.push('');
  }

  // Blog (use sparingly — only the canonical/evergreen posts)
  const evergreenPosts = posts.filter((p) => p.evergreen);
  if (evergreenPosts.length) {
    lines.push('## Guides');
    lines.push('');
    for (const post of evergreenPosts) {
      lines.push(`- [${post.title}](${absoluteUrl(`/blog/${post.slug}`)}): ${post.description}`);
    }
    lines.push('');
  }

  // Optional section — items the AI can skip without losing core understanding
  lines.push('## Optional');
  lines.push('');
  lines.push(`- [Pricing](${absoluteUrl('/pricing')}): Tier and pricing details`);
  lines.push(`- [Changelog](${absoluteUrl('/changelog')}): Release history`);
  if (posts.length > evergreenPosts.length) {
    lines.push(`- [All blog posts](${absoluteUrl('/blog')}): Full archive`);
  }

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',  // 1 hour
    },
  });
}

function absoluteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://platfrmr.com';
  return `${base}${path}`;
}
