// src/lib/requirements/schema.ts
// Strict schema + validation for AI-fetched pack requirements. NEVER trust raw LLM JSON —
// everything is validated with zod before it touches the app.
import { z } from "zod";

// The standard requirement categories = the app's SATISFIES ontology keys.
// Mapping AI output to these makes readiness work against the user's on-device docs immediately.
export const ONTOLOGY_KEYS = [
  "Identity Proof", "Address Proof", "Date of Birth Proof", "Photo ID",
  "Income Proof", "Employment Proof", "Proof of Funds", "Accommodation Proof",
  "Travel Itinerary", "Property Ownership Proof", "Other",
] as const;

export const SourceTier = z.enum(["official", "embassy", "semiofficial", "general"]);
export type SourceTier = z.infer<typeof SourceTier>;

export const Source = z.object({
  url: z.string().url(),
  title: z.string().min(1).max(200),
  tier: SourceTier.default("general"),
});
export type Source = z.infer<typeof Source>;

export const Requirement = z.object({
  item: z.string().min(1).max(160),                 // concrete document, e.g. "Yellow Fever Vaccination Certificate"
  ontology: z.enum(ONTOLOGY_KEYS).default("Other"), // maps to a SATISFIES key when possible
  mandatory: z.boolean().default(true),
  condition: z.string().max(240).optional(),        // when a conditional item applies
  note: z.string().max(300).optional(),
});
export type Requirement = z.infer<typeof Requirement>;

export const PackRequirements = z.object({
  pack: z.string().min(1).max(120),
  jurisdiction: z.string().max(120).optional(),     // country/state the answer applies to
  requirements: z.array(Requirement).min(1).max(40),
  sources: z.array(Source).max(20).default([]),
  lastChecked: z.string(),                          // ISO date
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
  disclaimer: z.string().max(400).optional(),
});
export type PackRequirements = z.infer<typeof PackRequirements>;

// Parse + validate raw model text (strips code fences). Throws on invalid shape.
export function parseRequirements(raw: string): PackRequirements {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const json = JSON.parse(cleaned);
  return PackRequirements.parse(json);
}
