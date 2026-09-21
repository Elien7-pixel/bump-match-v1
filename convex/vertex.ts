"use node";
import { createSign } from "crypto";

/**
 * Gemini through Vertex AI, authenticated with a service account — the same
 * credentials Fit Check uses, so both apps bill against the same Cloud credits.
 *
 * Convex env: VERTEX_PROJECT_ID, VERTEX_SERVICE_ACCOUNT_JSON, and optionally
 * VERTEX_LOCATION (defaults to us-central1).
 *
 * The service-account JWT is signed by hand rather than via
 * google-auth-library to keep this free of extra dependencies.
 */

export type VertexAuth = { token: string; projectId: string; location: string };

const b64url = (input: string | Buffer) => Buffer.from(input).toString("base64url");

// Access tokens last an hour; reuse one while the action container stays warm.
let cached: { auth: VertexAuth; expiresAt: number } | null = null;

/** Throws when the env vars are missing/malformed or Google rejects the key. */
export async function vertexAuth(): Promise<VertexAuth> {
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.auth;
  }

  const projectId = process.env.VERTEX_PROJECT_ID;
  const location = process.env.VERTEX_LOCATION || "us-central1";
  const json = process.env.VERTEX_SERVICE_ACCOUNT_JSON;
  if (!projectId || !json) {
    throw new Error("VERTEX_PROJECT_ID / VERTEX_SERVICE_ACCOUNT_JSON not configured");
  }

  let credentials: { client_email: string; private_key: string };
  try {
    credentials = JSON.parse(json);
  } catch {
    throw new Error("VERTEX_SERVICE_ACCOUNT_JSON is not valid JSON");
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const unsigned =
    b64url(JSON.stringify({ alg: "RS256", typ: "JWT" })) +
    "." +
    b64url(
      JSON.stringify({
        iss: credentials.client_email,
        scope: "https://www.googleapis.com/auth/cloud-platform",
        aud: "https://oauth2.googleapis.com/token",
        iat: nowSec,
        exp: nowSec + 3600,
      })
    );
  const signature = createSign("RSA-SHA256").update(unsigned).sign(credentials.private_key);
  const assertion = `${unsigned}.${b64url(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }).toString(),
  });
  if (!res.ok) {
    throw new Error(`Vertex token exchange failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();

  const auth = { token: data.access_token as string, projectId, location };
  cached = { auth, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return auth;
}

/** `method` is "generateContent" for Gemini models, "predict" for embeddings. */
export function vertexUrl(auth: VertexAuth, model: string, method: "generateContent" | "predict"): string {
  return (
    `https://${auth.location}-aiplatform.googleapis.com/v1/projects/${auth.projectId}` +
    `/locations/${auth.location}/publishers/google/models/${model}:${method}`
  );
}
