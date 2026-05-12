import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Rocket,
  Wrench,
  Compass,
  HelpCircle,
} from "lucide-react";
import { auth } from "@/auth";
import { UserMenu } from "@/components/user-menu";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Wiki — Agentic Operations",
  description:
    "How to set up agentic operations, what can and can't be automated, and how to use the platform day-to-day.",
};

const SECTIONS = [
  { id: "overview", label: "Overview", Icon: BookOpen },
  { id: "getting-started", label: "Getting Started", Icon: Rocket },
  { id: "what-you-can-automate", label: "What You Can Automate", Icon: CheckCircle2 },
  { id: "what-you-cant-automate", label: "What You Can't Automate", Icon: XCircle },
  { id: "how-to-use-it", label: "How to Use It Day-to-Day", Icon: Compass },
  { id: "operating-your-agents", label: "Operating Your Agents", Icon: Wrench },
  { id: "faq", label: "FAQ", Icon: HelpCircle },
];

export default async function WikiPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">
            Agentic Operations
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How it Works
            </Link>
            <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/wiki" className="text-sm text-foreground font-semibold">
              Wiki
            </Link>
          </div>
          {session?.user ? (
            <UserMenu
              name={session.user.name}
              email={session.user.email}
              image={session.user.image}
            />
          ) : (
            <Link
              href="/api/auth/signin"
              className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          )}
        </div>
      </nav>

      <div className="pt-24 pb-20 px-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <div className="lg:sticky lg:top-24">
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">
                Contents
              </div>
              <nav className="flex flex-col gap-1">
                {SECTIONS.map(({ id, label, Icon }) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{label}</span>
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Article */}
          <article className="flex-1 max-w-3xl space-y-16">
            <header>
              <div className="text-xs font-mono text-primary uppercase tracking-widest mb-2">
                Wiki
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight">
                Agentic Operations Handbook
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Everything you need to set up, run, and get value out of your
                agents — from your first workflow to a fully automated back
                office.
              </p>
            </header>

            {/* Overview */}
            <section id="overview" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Overview
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Agentic Operations is a platform for building and running
                AI-powered workflows that act on your behalf. You describe what
                you want to automate in plain English, the platform translates
                that into a running agent, and the agent does the work — on a
                schedule, on a trigger, or on demand.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Think of an agent as a junior teammate who never forgets a
                task, never misses a follow-up, and works 24/7. You stay in
                command; the agent does the running.
              </p>
            </section>

            {/* Getting Started */}
            <section id="getting-started" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <Rocket className="w-5 h-5 text-primary" />
                Getting Started
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Setup runs in three phases. Each one ends in a clear
                deliverable, so you always know where you stand.
              </p>

              <ol className="space-y-6">
                <li className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                      1
                    </span>
                    <h3 className="text-lg font-semibold">Collecting</h3>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    The setup chat asks about your business, the work you want
                    automated, and the tools you already use. You can be vague
                    — the agent will ask follow-ups until it has enough to
                    work with.
                  </p>
                </li>

                <li className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                      2
                    </span>
                    <h3 className="text-lg font-semibold">Automating</h3>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    The platform proposes a concrete workflow: what triggers
                    it, what the agent does, where the output goes, and what
                    integrations it needs. You approve, edit, or reject before
                    anything runs.
                  </p>
                </li>

                <li className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                      3
                    </span>
                    <h3 className="text-lg font-semibold">Delivering</h3>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    The agent goes live. The first run is observed closely so
                    you can spot anything off before it&apos;s habitual. After
                    that it runs on its own and reports back through the
                    dashboard.
                  </p>
                </li>
              </ol>

              <div className="mt-6 rounded-lg bg-primary/5 border border-primary/20 p-4">
                <p className="text-sm">
                  <span className="font-semibold text-primary">
                    Ready to start?
                  </span>{" "}
                  <Link href="/setup" className="underline hover:text-primary">
                    Open the setup flow
                  </Link>{" "}
                  — you&apos;ll need to be signed in.
                </p>
              </div>
            </section>

            {/* What You Can Automate */}
            <section id="what-you-can-automate" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                What You Can Automate
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                If the work is digital, repeatable, and follows clear rules
                most of the time, an agent can handle it. Concrete examples:
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    title: "Revenue & Billing",
                    items: [
                      "Invoice generation and follow-up",
                      "Subscription renewals and dunning",
                      "Quote-to-cash workflows",
                    ],
                  },
                  {
                    title: "Customer Lifecycle",
                    items: [
                      "Onboarding email sequences",
                      "Churn detection and outreach",
                      "Review and feedback requests",
                    ],
                  },
                  {
                    title: "Sales & Marketing",
                    items: [
                      "Lead scoring and nurture",
                      "Personalized cold outreach",
                      "Social media scheduling",
                    ],
                  },
                  {
                    title: "Operations & Reporting",
                    items: [
                      "Weekly and monthly performance reports",
                      "Cross-system data sync",
                      "Meeting summaries and action items",
                    ],
                  },
                  {
                    title: "Support",
                    items: [
                      "First-response ticket triage",
                      "FAQ answering",
                      "Escalation routing",
                    ],
                  },
                  {
                    title: "Internal Coordination",
                    items: [
                      "Employee onboarding flows",
                      "Contract renewal reminders",
                      "Appointment and inventory alerts",
                    ],
                  },
                ].map((group) => (
                  <div
                    key={group.title}
                    className="rounded-xl border border-border bg-card p-5"
                  >
                    <h3 className="font-semibold mb-3">{group.title}</h3>
                    <ul className="space-y-2">
                      {group.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span className="text-primary mt-0.5">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* What You Can't Automate */}
            <section id="what-you-cant-automate" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-primary" />
                What You Can&apos;t Automate
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Some work belongs to humans — for safety, for legal reasons,
                or because the judgment required isn&apos;t the kind that
                pattern-matches well. Agents won&apos;t do the following:
              </p>

              <ul className="space-y-3">
                {[
                  {
                    title: "Physical, in-person work",
                    body:
                      "Shipping, installation, hands-on service. Agents can coordinate humans who do this work, but they can't lift a box.",
                  },
                  {
                    title: "Legally binding decisions or filings",
                    body:
                      "Signing contracts, filing taxes, court submissions, regulated medical or financial advice. Agents draft and prepare; humans approve and sign.",
                  },
                  {
                    title: "Hiring, firing, and performance decisions",
                    body:
                      "Agents can screen, schedule, and summarize — but the call on a person's job stays with you.",
                  },
                  {
                    title: "Unbounded autonomous spending",
                    body:
                      "Agents won't move money or make purchases without an explicit, scoped approval policy you've set up.",
                  },
                  {
                    title: "Anything that violates a platform's terms",
                    body:
                      "Mass-sending without consent, scraping behind logins you don't own, evading rate limits — non-starters.",
                  },
                  {
                    title: "Decisions requiring confidential context not given to the agent",
                    body:
                      "If the agent doesn't have the data, it doesn't get to guess. It will ask, or escalate.",
                  },
                ].map((item) => (
                  <li
                    key={item.title}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <div className="font-semibold text-sm mb-1">{item.title}</div>
                    <div className="text-sm text-muted-foreground">{item.body}</div>
                  </li>
                ))}
              </ul>
            </section>

            {/* How to Use It */}
            <section id="how-to-use-it" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <Compass className="w-5 h-5 text-primary" />
                How to Use It Day-to-Day
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Once your agents are live, the rhythm is short and quiet.
                Here&apos;s where to look and what to do:
              </p>

              <div className="space-y-4">
                {[
                  {
                    label: "Dashboard",
                    href: "/dashboard",
                    body:
                      "Your home base. Shows running agents, recent activity, anything that needs your attention.",
                  },
                  {
                    label: "Setup",
                    href: "/setup",
                    body:
                      "Add a new automation or extend an existing one. The same three-phase flow as initial onboarding.",
                  },
                  {
                    label: "Skills",
                    href: "/skills",
                    body:
                      "Run one-off agentic tasks without wiring up a full automation. Good for ad-hoc work.",
                  },
                  {
                    label: "Account",
                    href: "/account",
                    body:
                      "Subscription, billing, connected integrations, team members.",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
                  >
                    <div>
                      <div className="font-semibold text-sm">{item.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.body}
                      </div>
                    </div>
                    <Link
                      href={item.href}
                      className="text-sm text-primary hover:underline shrink-0"
                    >
                      Open →
                    </Link>
                  </div>
                ))}
              </div>
            </section>

            {/* Operating Your Agents */}
            <section id="operating-your-agents" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary" />
                Operating Your Agents
              </h2>

              <div className="space-y-5">
                <div>
                  <h3 className="font-semibold mb-1">Watch the first few runs</h3>
                  <p className="text-sm text-muted-foreground">
                    The first three runs of any new agent are worth a glance.
                    Most calibration issues show up here — wrong tone, wrong
                    recipient, missing context.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-1">Edit by talking, not coding</h3>
                  <p className="text-sm text-muted-foreground">
                    To change behavior, open the agent and tell it what to
                    change in plain English (&quot;don&apos;t send invoices on
                    weekends&quot;, &quot;always cc the ops inbox&quot;). The
                    platform updates the workflow and shows you the diff.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-1">Set guardrails early</h3>
                  <p className="text-sm text-muted-foreground">
                    Spending caps, sending volume limits, &quot;require human
                    approval before X&quot; rules — set them when you create
                    the agent, not after something goes wrong.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-1">Pause, don&apos;t delete</h3>
                  <p className="text-sm text-muted-foreground">
                    If an agent misbehaves, pause it. Pausing keeps the
                    history and integrations; deleting throws them away.
                  </p>
                </div>
              </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                FAQ
              </h2>

              <div className="space-y-4">
                {[
                  {
                    q: "Do I need to know how to code?",
                    a: "No. Setup and editing both happen in plain English. If you can describe the work, the agent can run it.",
                  },
                  {
                    q: "What integrations are supported?",
                    a: "Email, calendars, common CRMs, spreadsheets, Slack, and most major SaaS tools through their APIs. If you need a tool we don't support yet, mention it during setup — most things can be wired up.",
                  },
                  {
                    q: "What happens if an agent makes a mistake?",
                    a: "All actions are logged. You can review them on the dashboard, roll back individual outputs where possible, and adjust the agent so it doesn't repeat the mistake.",
                  },
                  {
                    q: "Is my data used to train models?",
                    a: "No. Your business data isn't used to train foundation models. Agents use it to do your work — that's the whole contract.",
                  },
                  {
                    q: "Can I run agents for multiple businesses?",
                    a: "Yes, but each business should have its own workspace so data and integrations stay separated.",
                  },
                  {
                    q: "How much does it cost?",
                    a: "Pricing is on the landing page — there are three tiers and you can change plans from the Account page.",
                  },
                ].map((item) => (
                  <details
                    key={item.q}
                    className="rounded-lg border border-border bg-card p-4 group"
                  >
                    <summary className="font-semibold text-sm cursor-pointer list-none flex items-center justify-between">
                      <span>{item.q}</span>
                      <span className="text-muted-foreground group-open:rotate-45 transition-transform">
                        +
                      </span>
                    </summary>
                    <p className="text-sm text-muted-foreground mt-3">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>

            {/* CTA */}
            <section className="rounded-2xl bg-primary p-8 text-center">
              <h2 className="text-2xl font-bold text-primary-foreground mb-2">
                Still have questions?
              </h2>
              <p className="text-primary-foreground/80 mb-6">
                The setup chat is the fastest way to find out if your specific
                workflow can be automated. It costs nothing to ask.
              </p>
              <Link
                href={session?.user ? "/setup" : "/signup"}
                className="inline-flex items-center px-8 py-3 bg-white text-primary rounded-xl font-bold hover:bg-white/90 transition-colors"
              >
                {session?.user ? "Open Setup" : "Get Started"}
              </Link>
            </section>
          </article>
        </div>
      </div>

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
