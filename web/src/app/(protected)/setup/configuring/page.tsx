"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { readSSEStream } from "@/lib/sse";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";

interface DraftSkill {
  name: string;
  description: string;
  frequency: string;
  input: string;
  output: string;
  successCriteria: string;
}
interface DraftDomain {
  name: string;
  successVision: string;
  skills: DraftSkill[];
}

type Phase = "streaming" | "saving" | "done" | "error";

export default function ConfiguringPage() {
  const router = useRouter();
  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [domains, setDomains] = useState<DraftDomain[]>([]);
  const [phase, setPhase] = useState<Phase>("streaming");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    async function run() {
      const raw = sessionStorage.getItem("auto-configure-answers");
      if (!raw) {
        router.replace("/setup");
        return;
      }
      const { role, vision } = JSON.parse(raw) as { role: string; vision: string };

      const collected: DraftDomain[] = [];

      let resp: Response;
      try {
        resp = await fetch("/api/setup/auto-configure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role, vision }),
        });
      } catch {
        if (!cancelled) {
          setPhase("error");
          setErrorMsg("Network error — couldn't reach the agent service.");
        }
        return;
      }
      if (!resp.ok) {
        if (!cancelled) {
          setPhase("error");
          setErrorMsg(`Upstream error (${resp.status}). Try again.`);
        }
        return;
      }

      let completeReceived = false;

      await readSSEStream(resp, (evt) => {
        if (cancelled) return;
        const type = evt.type as string;
        if (type === "status") {
          setStatusLog((prev) => [...prev, evt.message as string]);
        } else if (type === "domain_drafted") {
          collected.push({
            name: evt.name as string,
            successVision: (evt.success_vision as string) ?? "",
            skills: [],
          });
          setDomains([...collected]);
        } else if (type === "skill_drafted") {
          const domain = collected.find((d) => d.name === (evt.domain_name as string));
          if (domain) {
            domain.skills.push({
              name: (evt.name as string) ?? "",
              description: (evt.description as string) ?? "",
              frequency: (evt.frequency as string) ?? "ON_DEMAND",
              input: (evt.input as string) ?? "",
              output: (evt.output as string) ?? "",
              successCriteria: (evt.success_criteria as string) ?? "",
            });
            setDomains([...collected]);
          }
        } else if (type === "complete") {
          completeReceived = true;
        } else if (type === "error") {
          setPhase("error");
          setErrorMsg((evt.message as string) ?? "Agent failed.");
        }
      });

      if (cancelled) return;

      if (!completeReceived) {
        setPhase("error");
        setErrorMsg("Stream ended unexpectedly.");
        return;
      }

      setPhase("saving");
      const save = await fetch("/api/setup/save-drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domains: collected }),
      });
      if (cancelled) return;
      if (!save.ok) {
        setPhase("error");
        setErrorMsg("Couldn't save drafts. Try again.");
        return;
      }

      sessionStorage.removeItem("auto-configure-answers");
      setPhase("done");
      router.push("/setup/review");
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-[calc(100vh-49px)] px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Auto-Configuring
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight">
          {phase === "error"
            ? "Something went wrong"
            : phase === "saving"
              ? "Saving your draft..."
              : phase === "done"
                ? "Done — taking you to review"
                : "Setting up your operations..."}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {phase === "error"
            ? errorMsg
            : "The agent is reading your answers and drafting domains + skills. Hang tight — usually under 30 seconds."}
        </p>

        {phase === "error" ? (
          <div className="mt-8">
            <Button onClick={() => router.push("/setup")}>Try again</Button>
          </div>
        ) : (
          <>
            <div className="mt-10 space-y-1 text-sm font-mono text-muted-foreground">
              {statusLog.map((line, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i === statusLog.length - 1 && phase === "streaming" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary/70" />
                  )}
                  <span>{line}</span>
                </div>
              ))}
              {statusLog.length === 0 && (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span>Warming up...</span>
                </div>
              )}
            </div>

            <div className="mt-10 space-y-4">
              {domains.map((d) => (
                <div
                  key={d.name}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-semibold text-base">{d.name}</h3>
                    <span className="text-xs text-muted-foreground">
                      {d.skills.length} skill{d.skills.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  {d.successVision && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {d.successVision}
                    </p>
                  )}
                  {d.skills.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm">
                      {d.skills.map((s, i) => (
                        <li
                          key={`${s.name}-${i}`}
                          className="flex items-start gap-2 text-foreground"
                        >
                          <span className="text-primary mt-0.5">+</span>
                          <span>{s.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
