const AGENTS_URL = process.env.AGENTS_SERVICE_URL ?? "http://localhost:8000";

export async function agentsPost(
  path: string,
  body: unknown,
  userId?: string
): Promise<Response> {
  return fetch(`${AGENTS_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(userId ? { "X-User-ID": userId } : {}),
    },
    body: JSON.stringify(body),
  });
}
