import { describe, it, expect, vi } from "vitest";
import { readSSEStream } from "./sse";

function makeResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  let index = 0;
  const readable = new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index++]));
      } else {
        controller.close();
      }
    },
  });
  return { body: readable } as unknown as Response;
}

describe("readSSEStream", () => {
  it("parses a single text chunk", async () => {
    const chunks = ['data: {"type":"text","content":"hello"}\n\n'];
    const collected: Record<string, unknown>[] = [];
    const res = makeResponse(chunks);
    await readSSEStream(res, (d) => collected.push(d));
    expect(collected).toHaveLength(1);
    expect(collected[0]).toEqual({ type: "text", content: "hello" });
  });

  it("stops at [DONE] sentinel", async () => {
    const chunks = [
      'data: {"type":"text","content":"a"}\n\n',
      "data: [DONE]\n\n",
      'data: {"type":"text","content":"b"}\n\n',
    ];
    const collected: Record<string, unknown>[] = [];
    const res = makeResponse(chunks);
    await readSSEStream(res, (d) => collected.push(d));
    expect(collected).toHaveLength(1);
  });

  it("ignores malformed JSON chunks", async () => {
    const chunks = ["data: not-json\n\n", 'data: {"type":"ok"}\n\n'];
    const collected: Record<string, unknown>[] = [];
    const res = makeResponse(chunks);
    await readSSEStream(res, (d) => collected.push(d));
    expect(collected).toHaveLength(1);
    expect(collected[0]).toEqual({ type: "ok" });
  });

  it("handles multi-chunk buffering", async () => {
    const chunks = [
      'data: {"type":"tex',
      't","content":"hi"}\n\n',
    ];
    const collected: Record<string, unknown>[] = [];
    const res = makeResponse(chunks);
    await readSSEStream(res, (d) => collected.push(d));
    expect(collected).toHaveLength(1);
    expect(collected[0]).toEqual({ type: "text", content: "hi" });
  });
});
