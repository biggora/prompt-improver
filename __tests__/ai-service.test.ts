import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AIService, AI_PROVIDERS } from "@/lib/ai-service";

describe("AIService", () => {
  let service: AIService;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    service = new AIService();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("parses JSON responses with code fences", () => {
    const result = service.parseResponse(
      '```json\n{"issues":[],"improvements":[],"improvedPrompt":"ok"}\n```',
    );
    expect(result).toEqual({
      issues: [],
      improvements: [],
      improvedPrompt: "ok",
    });
  });

  it("throws on invalid JSON responses", () => {
    expect(() => service.parseResponse("{not valid}")).toThrow();
  });

  it("calls the improve API for cloud providers", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        issues: ["a"],
        improvements: ["b"],
        improvedPrompt: "c",
      }),
    });

    const result = await service.improvePrompt(
      "Prompt",
      "PROGRAMMING",
      "anthropic",
      "claude-3-5-sonnet-latest",
    );

    expect(result).toEqual({
      issues: ["a"],
      improvements: ["b"],
      improvedPrompt: "c",
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/improve",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns a helpful error when API request fails", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "API key missing" }),
    });

    await expect(
      service.improvePrompt(
        "Prompt",
        "WRITING",
        "anthropic",
        "claude-3-5-sonnet-latest",
      ),
    ).rejects.toThrow("Anthropic Claude");
  });

  it("throws when ollama model is not provided", async () => {
    await expect(
      service.improvePromptWithOllama("Prompt", "BUSINESS"),
    ).rejects.toThrow("Please select an Ollama model");
  });

  it("handles ollama responses", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response: '{"issues":[],"improvements":[],"improvedPrompt":"ok"}',
      }),
    });

    const result = await service.improvePromptWithOllama(
      "Prompt",
      "BUSINESS",
      "llama3",
    );

    expect(result.improvedPrompt).toBe("ok");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://localhost:11434/api/generate",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("throws when ollama returns an error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Ollama error" }),
    });

    await expect(
      service.improvePromptWithOllama("Prompt", "BUSINESS", "llama3"),
    ).rejects.toThrow("Ollama error");
  });

  it("loads ollama models when available", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        models: [{ name: "llama3", details: { parameter_size: "8B" } }],
      }),
    });

    const result = await service.getOllamaModels();

    expect(result).toEqual([{ id: "llama3", name: "llama3 (8B)" }]);
  });

  it("returns empty models list when ollama fetch fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const result = await service.getOllamaModels();

    expect(result).toEqual([]);
    warnSpy.mockRestore();
  });

  it("validates providers with a test request", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ valid: true }),
    });

    const result = await service.validateProvider("anthropic");

    expect(result).toEqual({ valid: true });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/validate",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns available providers", () => {
    const providers = service.getAvailableProviders();
    expect(providers.length).toBe(Object.keys(AI_PROVIDERS).length);
    expect(providers.map((p) => p.id)).toContain("anthropic");
    expect(providers.map((p) => p.id)).toContain("openai");
    expect(providers.map((p) => p.id)).toContain("ollama");
  });
});
