"use client";
import { useState, useEffect } from "react";
import { PhaseIndicator } from "@/components/setup/PhaseIndicator";
import { ChatInterface } from "@/components/setup/ChatInterface";

export default function SetupPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [phase, setPhase] = useState(1);

  useEffect(() => {
    async function initSession() {
      const resp = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: 1 }),
      });
      const data = await resp.json() as { id: string };
      setSessionId(data.id);
    }
    initSession();
  }, []);

  function handlePhaseComplete(completedPhase: number, _data: Record<string, unknown>) {
    if (completedPhase < 5) setPhase(completedPhase + 1);
  }

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-orange-500 font-mono text-sm animate-pulse">Initializing session...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-49px)]">
      <aside className="w-56 border-r border-gray-800 shrink-0">
        <div className="px-4 pt-6 pb-2 text-xs font-mono text-gray-500 uppercase tracking-widest">
          Setup Progress
        </div>
        <PhaseIndicator currentPhase={phase} />
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
