"use client";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

const STEPS = [
  {
    key: "role",
    label: "Question 1 of 2",
    title: "What's your role and what does your business do?",
    helper:
      "Be specific — \"Solo founder of a B2B SaaS for accountants\" beats \"founder\".",
    placeholder:
      "e.g. I'm the solo founder of a B2B SaaS that helps independent accountants automate their client intake. ~10 paying customers, growing slowly.",
  },
  {
    key: "vision",
    label: "Question 2 of 2",
    title: "What would success look like if your business ran on autopilot for a year?",
    helper:
      "Describe the outcome, not the steps. What's quietly happening in the background while you focus on what matters?",
    placeholder:
      "e.g. New trials get onboarded automatically. Churn risks reach out to me before they leave. Every Monday I get a clean dashboard of what moved last week. Invoices send themselves.",
  },
] as const;

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<{ role: string; vision: string }>({
    role: "",
    vision: "",
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const current = STEPS[step];
  const value = answers[current.key];
  const canContinue = value.trim().length >= 8;
  const isLast = step === STEPS.length - 1;

  function update(text: string) {
    setAnswers((prev) => ({ ...prev, [current.key]: text }));
  }

  function back() {
    if (step === 0) return;
    setStep((s) => s - 1);
  }

  function next() {
    if (!canContinue) return;
    if (!isLast) {
      setStep((s) => s + 1);
      requestAnimationFrame(() => textareaRef.current?.focus());
      return;
    }
    sessionStorage.setItem(
      "auto-configure-answers",
      JSON.stringify({ role: answers.role, vision: answers.vision }),
    );
    router.push("/setup/configuring");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      next();
    }
  }

  return (
    <div className="min-h-[calc(100vh-49px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          {current.label}
        </div>

        <h1 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight">
          {current.title}
        </h1>
        <p className="mt-3 text-muted-foreground">{current.helper}</p>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => update(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={current.placeholder}
          autoFocus
          rows={6}
          className="mt-8 w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none"
        />

        <div className="mt-2 text-xs text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono">⌘</kbd>+<kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono">Enter</kbd> to continue
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={back}
            disabled={step === 0}
            className="gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button type="button" onClick={next} disabled={!canContinue} className="gap-1">
            {isLast ? "Configure my account" : "Continue"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="mt-12 flex items-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
