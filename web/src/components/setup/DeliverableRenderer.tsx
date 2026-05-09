"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface DeliverableRendererProps {
  content: string;
}

export function DeliverableRenderer({ content }: DeliverableRendererProps) {
  const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
  const parts: Array<{ type: "text" | "code"; content: string; lang?: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: content.slice(lastIndex, match.index) });
    }
    const langMatch = content.slice(match.index).match(/```([\w]*)\n/);
    parts.push({ type: "code", content: match[1], lang: langMatch?.[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", content: content.slice(lastIndex) });
  }

  return (
    <div className="space-y-4">
      {parts.map((part, i) =>
        part.type === "text" ? (
          <p key={i} className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {part.content}
          </p>
        ) : (
          <CodeBlock key={i} code={part.content} lang={part.lang} />
        )
      )}
    </div>
  );
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative group">
      <div className="flex items-center justify-between bg-gray-900 border border-gray-700 px-4 py-2">
        <span className="text-xs font-mono text-gray-500">{lang ?? "text"}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={copy}
          className="text-xs opacity-0 group-hover:opacity-100"
        >
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
      <pre className="bg-gray-950 border border-t-0 border-gray-700 p-4 overflow-x-auto text-sm font-mono text-gray-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}
