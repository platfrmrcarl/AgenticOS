import { GoogleAuth } from "google-auth-library";

const googleAuth = new GoogleAuth();

let cached: { audience: string; token: string; expiresAt: number } | null = null;

export async function getAgentsAuthHeader(): Promise<Record<string, string>> {
  const audience = process.env.AGENTS_AUDIENCE;
  if (!audience) return {};

  const now = Date.now();
  if (cached && cached.audience === audience && cached.expiresAt > now + 60_000) {
    return { Authorization: `Bearer ${cached.token}` };
  }

  const client = await googleAuth.getIdTokenClient(audience);
  const token = await client.idTokenProvider.fetchIdToken(audience);

  let exp = now + 50 * 60 * 1000;
  try {
    const payloadB64 = token.split(".")[1];
    const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString()) as { exp?: number };
    if (typeof payload.exp === "number") exp = payload.exp * 1000;
  } catch {
    // fall back to default expiry
  }

  cached = { audience, token, expiresAt: exp };
  return { Authorization: `Bearer ${token}` };
}
