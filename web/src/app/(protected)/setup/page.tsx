"use client";
import { useState, useEffect } from "react";
import { PhaseIndicator } from "@/components/setup/PhaseIndicator";
import { ChatInterface } from "@/components/setup/ChatInterface";

function toUiStep(backendPhase: number): number {
  if (backendPhase <= 1) return 1;
  if (backendPhase >= 5) return 3;
  return 2;
}

export default function SetupPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [phase, setPhase] = useState(1);
  const [initError, setInitError] = useState(false);

  useEffect(() => {
    async function initSession() {
      try {
        const resp = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phase: 1 }),
        });
        if (!resp.ok) throw new Error("Failed to create session");
        const data = await resp.json() as { id: string };
        setSessionId(data.id);
      } catch {
        setInitError(true);
      }
    }
    initSession();
  }, []);

  function handlePhaseComplete(completedPhase: number, _data: Record<string, unknown>) {
    if (completedPhase < 5) setPhase(completedPhase + 1);
  }

  if (initError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-400 font-mono text-sm">Failed to initialize session. Please refresh.</div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-primary font-mono text-sm animate-pulse">Initializing session...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-49px)]">
      <aside className="w-56 border-r border-border shrink-0">
        <div className="px-4 pt-6 pb-2 text-xs font-mono text-muted-foreground uppercase tracking-widest">
          Setup Progress
        </div>
        <PhaseIndicator currentPhase={toUiStep(phase)} />
      </aside>
      <main className="flex-1 overflow-hidden">
        <ChatInterface
          sessionId={sessionId}
          phase={phase}
          onPhaseComplete={handlePhaseComplete}
        />
      </main>
    </div>
  );
}
