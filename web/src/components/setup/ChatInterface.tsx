"use client";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DeliverableRenderer } from "./DeliverableRenderer";
import { readSSEStream } from "@/lib/sse";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  sessionId: string;
  phase: number;
  onPhaseComplete: (phase: number, data: Record<string, unknown>) => void;
}

export function ChatInterface({ sessionId, phase, onPhaseComplete }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || streaming) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setStreaming(true);
    let assistantContent = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const resp = await fetch(`/api/sessions/${sessionId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMsg }),
    });

    if (!resp.ok) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Failed to send message. Please try again." };
        return updated;
      });
      setStreaming(false);
      return;
    }

    await readSSEStream(resp, (chunk) => {
      if (chunk.type === "text") {
        assistantContent += chunk.content as string;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: assistantContent };
          return updated;
        });
      } else if (chunk.type === "phase_complete") {
        onPhaseComplete(chunk.phase as number, chunk.data as Record<string, unknown>);
      }
    });

    setStreaming(false);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-primary/20 border border-primary/30 text-foreground"
                  : "bg-card border border-border text-muted-foreground"
              }`}
            >
              {msg.role === "assistant" && phase === 5 ? (
                <DeliverableRenderer content={msg.content} />
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              )}
              {streaming && i === messages.length - 1 && msg.role === "assistant" && (
                <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-border p-4 flex gap-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Type your response..."
          disabled={streaming}
          className="flex-1 font-mono"
        />
        <Button onClick={sendMessage} disabled={streaming || !input.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}
