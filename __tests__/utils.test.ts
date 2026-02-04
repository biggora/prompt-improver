import { describe, expect, it } from "vitest";
import { parseAIResponse } from "@/lib/utils";

describe("parseAIResponse", () => {
  it("parses valid JSON", () => {
    const input =
      '{"issues":["i1"],"improvements":["imp1"],"improvedPrompt":"p"}';
    const result = parseAIResponse(input);
    expect(result).toEqual({
      issues: ["i1"],
      improvements: ["imp1"],
      improvedPrompt: "p",
    });
  });

  it("handles markdown code blocks", () => {
    const input =
      '```json\n{"issues":[],"improvements":[],"improvedPrompt":"ok"}\n```';
    const result = parseAIResponse(input);
    expect(result.improvedPrompt).toBe("ok");
  });

  it("extracts JSON from text with preamble", () => {
    const input =
      'Here is your prompt:\n{"issues":[],"improvements":[],"improvedPrompt":"found it"}\nHope this helps!';
    const result = parseAIResponse(input);
    expect(result.improvedPrompt).toBe("found it");
  });

  it("fixes unescaped newlines in string values", () => {
    const input =
      '{"issues":[],"improvements":[],"improvedPrompt":"line 1\nline 2"}';
    const result = parseAIResponse(input);
    expect(result.improvedPrompt).toBe("line 1\nline 2");
  });

  it("throws error when no JSON object is found", () => {
    const input = "Just some text with no braces";
    expect(() => parseAIResponse(input)).toThrow("No valid JSON object found");
  });

  it("throws error for truly broken JSON", () => {
    const input = '{"unclosed": "brace"';
    expect(() => parseAIResponse(input)).toThrow("No valid JSON object found");
  });
});
