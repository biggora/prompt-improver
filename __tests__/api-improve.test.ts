import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/improve/route";
import { NextRequest } from "next/server";
import { generateText } from "ai";

// Mock the AI SDK
vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

describe("API Improve Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  const createRequest = (body: Record<string, unknown>) => {
    return new NextRequest("http://localhost/api/improve", {
      method: "POST",
      body: JSON.stringify(body),
    });
  };

  it("returns 400 for missing fields", async () => {
    const req = createRequest({ prompt: "hello" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Missing required fields");
  });

  it("returns 400 for ollama", async () => {
    const req = createRequest({
      prompt: "hello",
      domainNames: "TEST",
      providerId: "ollama",
      model: "llama3",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Ollama is handled locally");
  });

  it("returns 500 when API key is missing", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const req = createRequest({
      prompt: "hello",
      domainNames: "TEST",
      providerId: "anthropic",
      model: "claude-3-5-sonnet-latest",
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain("API key is missing");
  });

  it("successfully improves a prompt", async () => {
    vi.mocked(generateText).mockResolvedValue({
      text: JSON.stringify({
        issues: ["i"],
        improvements: ["imp"],
        improvedPrompt: "better",
      }),
    } as any);

    const req = createRequest({
      prompt: "good",
      domainNames: ["WRITING"],
      providerId: "anthropic",
      model: "claude-3-5-sonnet-latest",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.improvedPrompt).toBe("better");
  });

  it("successfully improves a prompt with mode", async () => {
    vi.mocked(generateText).mockResolvedValue({
      text: JSON.stringify({
        issues: ["i"],
        improvements: ["imp"],
        improvedPrompt: "better continuation",
      }),
    } as any);

    const req = createRequest({
      prompt: "good",
      domainNames: ["WRITING"],
      providerId: "anthropic",
      model: "claude-3-5-sonnet-latest",
      mode: "continuation",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.improvedPrompt).toBe("better continuation");
    expect(vi.mocked(generateText)).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining("Mode: continuation"),
          }),
        ]),
      }),
    );
  });

  it("handles AI generation failure", async () => {
    vi.mocked(generateText).mockRejectedValue(new Error("AI Hub down"));

    const req = createRequest({
      prompt: "good",
      domainNames: "WRITING",
      providerId: "anthropic",
      model: "claude-3-5-sonnet-latest",
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("AI Hub down");
  });
});
