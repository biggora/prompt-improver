import { ImprovePromptResponse } from "./types";

/**
 * Parses a JSON response from an AI provider, handling common issues like
 * markdown code blocks, unescaped newlines, and preamble text.
 */
export function parseAIResponse(text: string): ImprovePromptResponse {
  // Remove markdown code fences
  const cleaned = text.replace(/```json\s*|```\s*/g, "").trim();

  // Find the JSON object boundaries
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No valid JSON object found in response");
  }

  // Extract the JSON portion
  const jsonStr = cleaned.slice(start, end + 1);

  try {
    return JSON.parse(jsonStr);
  } catch {
    // Try to fix common JSON issues
    // Replace unescaped newlines in string values
    const fixed = jsonStr
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");

    try {
      return JSON.parse(fixed);
    } catch {
      console.error(
        "Failed to parse JSON response:",
        jsonStr.substring(0, 500),
      );
      throw new Error("Invalid JSON response from AI");
    }
  }
}
