import Link from "next/link";
import { getStripe } from "@/lib/stripe";

// ─── Plan fetching ────────────────────────────────────────────────────────────

interface StripePlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  description?: string;
}

const FALLBACK_PLANS: StripePlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 49,
    interval: "month",
    features: [
      "5 automated workflows",
      "Basic reporting",
      "Email support",
      "1 integration",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 149,
    interval: "month",
    features: [
      "Unlimited workflows",
      "Advanced analytics",
      "Priority support",
      "All integrations",
      "Custom scheduling",
    ],
  },
  {
    id: "enterprise",
    name: "Scale",
    price: 399,
    interval: "month",
    description: "For teams and enterprises running complex agentic operations",
    features: [
      "Everything in Pro",
      "Multi-agent orchestration",
      "Custom integrations",
      "SLA guarantee",
      "Dedicated success manager",
    ],
  },
];

// Exported for testing only
export const FALLBACK_PLANS_TEST = FALLBACK_PLANS;

async function getPlans(): Promise<StripePlan[]> {
  try {
    const stripe = getStripe();
    const prices = await stripe.prices.list({
      active: true,
      expand: ["data.product"],
      limit: 10,
    });

    const filtered = prices.data.filter((price) => {
      const product = price.product as { metadata?: Record<string, string> };
      return product?.metadata?.product === "agenticos";
    });

    if (filtered.length === 0) return FALLBACK_PLANS;

    return filtered.map((price) => {
      const product = price.product as {
        name: string;
        metadata?: Record<string, string>;
      };
      const featuresRaw = product.metadata?.features ?? "";
      const features = featuresRaw
        ? featuresRaw.split(",").map((f) => f.trim())
        : ["Automated workflows", "Priority support", "All integrations"];
      return {
        id: price.id,
        name: product.name,
        price: (price.unit_amount ?? 0) / 100,
        interval: price.recurring?.interval ?? "month",
        features,
      };
    });
  } catch {
    return FALLBACK_PLANS;
  }
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
      aria-label="AgenticOS agent network visualization"
      role="img"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-primary">AgenticOS</span>
          <div className="flex items-center gap-4">
            <Link
              href="#pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/api/auth/signin"
              className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
              Running a business without full automation is{" "}
              <span className="text-primary">living in the past</span>
            </h1>
            <p className="mt-6 text-xl text-muted-foreground">
              AgenticOS creates custom agentic workflows that handle the
              repetitive work so you can focus on what matters.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
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
          <AnimatedSwarm />
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
                title: "Small Business",
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
                title: "Medium Business",
                emoji: "🏢",
                items: [
                  "Weekly performance reports",
                  "Lead scoring & nurturing",
                  "Employee onboarding flows",
                  "Contract renewal reminders",
                  "Cross-system data sync",
                ],
              },
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
                desc: "Tell AgenticOS what you want to automate in plain English. No technical knowledge required.",
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
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything your business needs
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Invoice Automation", desc: "Generate, send, and follow up on invoices automatically." },
              { title: "Meeting Summaries", desc: "AI-generated summaries and action items from every meeting." },
              { title: "Lead Follow-up", desc: "Nurture leads with personalized, timely outreach." },
              { title: "Reporting", desc: "Weekly and monthly reports delivered to your inbox." },
              { title: "Smart Scheduling", desc: "Coordinate calendars and book meetings without back-and-forth." },
              { title: "Customer Support", desc: "First-response handling and ticket routing at scale." },
              { title: "Data Sync", desc: "Keep your tools in sync — no more copy-pasting between apps." },
              { title: "Financial Reports", desc: "Cash flow, expenses, and forecasts compiled automatically." },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-background rounded-xl p-6 border border-border"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 mb-3" />
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
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
                  href={`/checkout?priceId=${plan.id}`}
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
            AgenticOS.
          </p>
          <Link
            href="#pricing"
            className="inline-flex items-center px-8 py-4 bg-white text-primary rounded-xl font-semibold hover:bg-white/90 transition-colors"
          >
            See Pricing
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            © 2026 AgenticOS. All rights reserved.
          </span>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
