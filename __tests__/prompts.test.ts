import { describe, expect, it } from "vitest";
import { SYSTEM_PROMPT } from "@/lib/prompts";

describe("SYSTEM_PROMPT", () => {
  it("contains all required domains", () => {
    const domains = ["PROGRAMMING", "WRITING", "RESEARCH", "BUSINESS", "DATA"];
    domains.forEach((domain) => {
      expect(SYSTEM_PROMPT).toContain(domain);
    });
  });

  it("specifies JSON response format", () => {
    expect(SYSTEM_PROMPT.toLowerCase()).toContain("json only");
    expect(SYSTEM_PROMPT).toContain('"issues"');
    expect(SYSTEM_PROMPT).toContain('"improvements"');
    expect(SYSTEM_PROMPT).toContain('"improvedPrompt"');
  });
});
