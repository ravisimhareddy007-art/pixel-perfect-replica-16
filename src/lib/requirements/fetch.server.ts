// src/lib/requirements/fetch.server.ts
// SERVER-ONLY. Calls Claude with web search to fetch current, official document requirements.
// Never import this into client code — it holds the API key. Call it from a server route/function.

import { SYSTEM_PROMPT, userPrompt } from "./prompt";
import { parseRequirements, type PackRequirements } from "./schema";
import { rankSources } from "./sources";

// Pin these; update when Anthropic ships new versions (verified against platform.claude.com docs).
const MODEL = "claude-sonnet-5";
const WEB_SEARCH_TOOL = "web_search_20260318";
const API_URL = "https://api.anthropic.com/v1/messages";

export interface FetchResult {
  ok: boolean;
  data?: PackRequirements;
  error?: string;
}

// One attempt against the Claude API.
async function callClaude(query: string, jurisdictionHint?: string): Promise<string> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "x-api-key": process.env['ANTHROPIC_API_KEY'] ?? "",
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1800,
      system: SYSTEM_PROMPT,
      tools: [{ type: WEB_SEARCH_TOOL, name: "web_search", max_uses: 6 }],
      messages: [{ role: "user", content: userPrompt(query, jurisdictionHint) }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  // Concatenate all text blocks (ignore tool_use / server_tool blocks).
  return (data.content ?? [])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n");
}

// Public entry: fetch → validate → re-tier sources. Retries once on parse/validation failure.
export async function fetchRequirements(query: string, jurisdictionHint?: string): Promise<FetchResult> {
  if (!process.env['ANTHROPIC_API_KEY']) return { ok: false, error: "Missing ANTHROPIC_API_KEY" };
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await callClaude(query, jurisdictionHint);
      const parsed = parseRequirements(text);
      parsed.sources = rankSources(parsed.sources);        // official/embassy first, tiered
      if (!parsed.lastChecked) parsed.lastChecked = new Date().toISOString().slice(0, 10);
      return { ok: true, data: parsed };
    } catch (e: any) {
      if (attempt === 1) return { ok: false, error: e?.message ?? "Failed to fetch requirements" };
    }
  }
  return { ok: false, error: "Unreachable" };
}
