export async function readSSEStream(
  response: Response,
  onChunk: (data: Record<string, unknown>) => void
): Promise<void> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop()!;
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6);
      if (payload === "[DONE]") return;
      try {
        const evt = JSON.parse(payload) as Record<string, unknown>;
        onChunk(evt);
      } catch {
        // ignore malformed chunks
      }
    }
  }
}
