"use client";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { readSSEStream } from "@/lib/sse";
import type { Skill } from "@prisma/client";

interface SkillRunnerProps {
  skill: Skill | null;
  onRunComplete: () => void;
}

export function SkillRunner({ skill, onRunComplete }: SkillRunnerProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  async function runSkill() {
    if (!skill || !input.trim() || running) return;
    setRunning(true);
    setOutput("");

    const resp = await fetch(`/api/skills/${skill.id}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: input.trim() }),
    });

    if (!resp.ok) {
      setOutput("Error: failed to start skill run. Please try again.");
      setRunning(false);
      return;
    }

    try {
      await readSSEStream(resp, (chunk) => {
        if (chunk.type === "text") {
          setOutput((prev) => prev + (chunk.content as string));
        }
      });
      onRunComplete();
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 h-full font-mono">
      <div className="px-4 py-2 border-b border-border text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
        {skill ? skill.name : "No skill selected"}
      </div>

      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-6 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed"
      >
        {!skill && (
          <p className="text-muted-foreground text-center mt-20">
            RUN A SKILL TO BEGIN
            <span className="inline-block w-2 h-4 bg-primary ml-2 animate-pulse align-middle" />
          </p>
        )}
        {skill && !output && !running && (
          <p className="text-muted-foreground">
            Ready to run: <span className="text-primary">{skill.name}</span>
          </p>
        )}
        {output}
        {running && (
          <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse align-middle" />
        )}
      </div>

      <div className="border-t border-border p-4 flex gap-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSkill()}
          placeholder={skill ? `Input for ${skill.name}...` : "Select a skill first"}
          disabled={!skill || running}
          className="flex-1"
        />
        <Button onClick={runSkill} disabled={!skill || !input.trim() || running}>
          {running ? "Running..." : "Run →"}
        </Button>
      </div>
    </div>
  );
}
