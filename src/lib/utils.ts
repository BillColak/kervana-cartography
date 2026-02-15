import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse JSON from LLM response, stripping markdown code blocks if present.
 * Handles responses wrapped in ```json ... ``` or ``` ... ```
 */
export function parseJsonResponse<T>(response: string): T {
  let cleaned = response.trim();

  // Remove markdown code block wrapper if present
  if (cleaned.startsWith("```")) {
    // Remove opening ``` with optional language identifier
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "");
    // Remove closing ```
    cleaned = cleaned.replace(/\n?```\s*$/, "");
  }

  return JSON.parse(cleaned);
}
