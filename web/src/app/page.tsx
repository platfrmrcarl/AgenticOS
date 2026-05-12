import Link from "next/link";
import type Stripe from "stripe";
import {
  BarChart3,
  CalendarClock,
  ClipboardList,
  Headphones,
  Receipt,
  RefreshCw,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { getStripe } from "@/lib/stripe";
import type { StripePlan } from "@/lib/plans";

export const dynamic = "force-dynamic";

async function getPlans(): Promise<StripePlan[]> {
  const stripe = getStripe();
  const products = await stripe.products.list({
    active: true,
    limit: 100,
    expand: ["data.default_price"],
  });

  return products.data
    .filter((p) => p.metadata?.product === "agentic")
    .sort((a, b) => {
      const aAmt = (a.default_price as Stripe.Price)?.unit_amount ?? 0;
      const bAmt = (b.default_price as Stripe.Price)?.unit_amount ?? 0;
      return aAmt - bAmt;
    })
    .slice(0, 3)
    .map((product) => {
      const price = product.default_price as Stripe.Price | null;
      const features = (product.marketing_features ?? [])
        .map((f) => f.name)
        .filter((n): n is string => Boolean(n));
      return {
        id: price?.id ?? product.id,
        name: product.name,
        price: (price?.unit_amount ?? 0) / 100,
        interval: price?.recurring?.interval ?? "month",
        features,
      };
    });
}

// ─── AnimatedSwarm ────────────────────────────────────────────────────────────

function AnimatedSwarm() {
  const nodes = [
    { label: "AUTOMATE", angle: 0 },
    { label: "ANALYZE", angle: 60 },
    { label: "SCHEDULE", angle: 120 },
    { label: "OPTIMIZE", angle: 180 },
    { label: "REPORT", angle: 240 },
    { label: "MONITOR", angle: 300 },
  ];

  const cx = 260;
  const cy = 260;
  const orbitR = 165;
  const nodeR = 48;

  return (
    <svg
      viewBox="0 0 520 520"
      className="w-full max-w-sm mx-auto"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </radialGradient>
        <clipPath id="hex-core">
          <polygon points="260,220 294,240 294,280 260,300 226,280 226,240" />
        </clipPath>
      </defs>

      {/* Glow background */}
      <circle cx={cx} cy={cy} r="200" fill="url(#glow)" />

      {/* Orbit ring */}
      <circle
        cx={cx}
        cy={cy}
        r={orbitR}
        fill="none"
        stroke="var(--color-primary)"
        strokeOpacity="0.2"
        strokeWidth="1"
        strokeDasharray="4 8"
      />

      {/* Connection lines */}
      {nodes.map((node, i) => {
        const rad = (node.angle * Math.PI) / 180;
        const x = cx + orbitR * Math.cos(rad);
        const y = cy + orbitR * Math.sin(rad);
        return (
          <line
            key={`line-${i}`}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="var(--color-primary)"
            strokeOpacity="0.3"
            strokeWidth="1.5"
            style={{
              animation: `sw-flow 2s ease-in-out ${i * 0.33}s infinite`,
            }}
          />
        );
      })}

      {/* Outer nodes */}
      {nodes.map((node, i) => {
        const rad = (node.angle * Math.PI) / 180;
        const x = cx + orbitR * Math.cos(rad);
        const y = cy + orbitR * Math.sin(rad);
        const hexPoints = [0, 60, 120, 180, 240, 300]
          .map((a) => {
            const r = (a * Math.PI) / 180;
            return `${x + nodeR * Math.cos(r)},${y + nodeR * Math.sin(r)}`;
          })
          .join(" ");
        return (
          <g key={`node-${i}`}>
            <polygon
              points={hexPoints}
              fill="var(--color-primary)"
              fillOpacity="0.1"
              stroke="var(--color-primary)"
              strokeWidth="1.5"
              style={{
                animation: `sw-pulse 3s ease-in-out ${i * 0.5}s infinite`,
              }}
            />
            <text
              x={x}
              y={y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="7"
              fontWeight="600"
              letterSpacing="0.5"
              fill="var(--color-primary)"
            >
              {node.label}
            </text>
          </g>
        );
      })}

      {/* Center AGENT CORE */}
      <polygon
        points="260,222 290,239 290,273 260,290 230,273 230,239"
        fill="var(--color-primary)"
        fillOpacity="0.2"
        stroke="var(--color-primary)"
        strokeWidth="2"
        style={{ animation: "sw-core 4s ease-in-out infinite" }}
      />
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="7"
        fontWeight="700"
        letterSpacing="1"
        fill="var(--color-primary)"
      >
        AGENT
      </text>
      <text
        x={cx}
        y={cy + 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="7"
        fontWeight="700"
        letterSpacing="1"
        fill="var(--color-primary)"
      >
        CORE
      </text>
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const plans = await getPlans();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative">
          <span className="text-xl font-bold text-primary">Agentic Operations</span>
          <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            <Link
              href="#how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              How it Works
            </Link>
            <Link
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
          </div>
          <Link
            href="/api/auth/signin"
            className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
            Automate Operations.{" "}
            <span className="text-primary">Stay in Command.</span>
          </h1>
          <p className="mt-6 text-xl text-muted-foreground max-w-2xl">
            Agentic Operations creates custom agentic workflows that handle the
            repetitive work so you can focus on what matters.
          </p>
          <div className="mt-10 w-full max-w-sm">
            <AnimatedSwarm />
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="#pricing"
              className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg hover:bg-primary/90 transition-colors"
            >
              Start Automating
            </Link>
            <Link
              href="#how-it-works"
              className="px-8 py-4 border border-border text-foreground rounded-xl font-semibold text-lg hover:bg-muted transition-colors"
            >
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Automation Examples */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            What can you automate?
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Whether you run a small shop, a growing company, or a fast-moving
            startup — there&apos;s always more to automate.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Startups",
                emoji: "🚀",
                items: [
                  "User onboarding sequences",
                  "Churn detection & outreach",
                  "Investor update drafts",
                  "Support ticket triage",
                  "Feature usage analytics",
                ],
              },
              {
                title: "Small Businesses",
                emoji: "🏪",
                items: [
                  "Invoice generation & follow-up",
                  "Appointment reminders",
                  "Inventory alerts",
                  "Customer review requests",
                  "Social media scheduling",
                ],
              },
              {
                title: "Medium Businesses",
                emoji: "🏢",
                items: [
                  "Weekly performance reports",
                  "Lead scoring & nurturing",
                  "Employee onboarding flows",
                  "Contract renewal reminders",
                  "Cross-system data sync",
                ],
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-background rounded-2xl p-8 border border-border shadow-sm"
              >
                <div className="text-4xl mb-4">{card.emoji}</div>
                <h3 className="text-xl font-bold mb-4">{card.title}</h3>
                <ul className="space-y-2">
                  {card.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Three steps to full automation
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Describe",
                desc: "Tell Agentic Operations what you want to automate in plain English. No technical knowledge required.",
              },
              {
                step: "02",
                title: "Connect",
                desc: "Link your existing tools — email, CRM, spreadsheets, Slack. We handle the integrations.",
              },
              {
                step: "03",
                title: "Automate",
                desc: "Your agents run 24/7, handling tasks, sending updates, and keeping your business moving.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold text-lg">{item.step}</span>
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything your business needs
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Invoice Automation", desc: "Generate, send, and follow up on invoices automatically.", Icon: Receipt },
              { title: "Meeting Summaries", desc: "AI-generated summaries and action items from every meeting.", Icon: ClipboardList },
              { title: "Lead Follow-up", desc: "Nurture leads with personalized, timely outreach.", Icon: UserCheck },
              { title: "Reporting", desc: "Weekly and monthly reports delivered to your inbox.", Icon: BarChart3 },
              { title: "Smart Scheduling", desc: "Coordinate calendars and book meetings without back-and-forth.", Icon: CalendarClock },
              { title: "Customer Support", desc: "First-response handling and ticket routing at scale.", Icon: Headphones },
              { title: "Data Sync", desc: "Keep your tools in sync — no more copy-pasting between apps.", Icon: RefreshCw },
              { title: "Financial Reports", desc: "Cash flow, expenses, and forecasts compiled automatically.", Icon: TrendingUp },
            ].map(({ title, desc, Icon }) => (
              <div
                key={title}
                className="bg-background rounded-xl p-6 border border-border"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 mb-3 flex items-center justify-center text-primary">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground text-center mb-12">
            Start free. Scale as you grow.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <div
                key={plan.id}
                className={`rounded-2xl p-8 border ${
                  i === 1
                    ? "border-primary bg-primary/5 ring-2 ring-primary"
                    : "border-border bg-background"
                } relative`}
              >
                {i === 1 && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold">${plan.price}</span>
                  <span className="text-muted-foreground">/{plan.interval}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.id.startsWith("price_") ? `/checkout?priceId=${plan.id}` : "/api/auth/signin"}
                  className={`block text-center py-3 rounded-xl font-semibold transition-colors ${
                    i === 1
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border hover:bg-muted"
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-4 bg-primary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Start automating today
          </h2>
          <p className="text-primary-foreground/80 mb-8 text-lg">
            Join hundreds of businesses that have eliminated repetitive work with
            Agentic Operations.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center px-10 py-5 bg-white text-primary rounded-xl font-bold text-lg hover:bg-white/90 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            © 2026 Agentic Operations. All rights reserved.
          </span>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
