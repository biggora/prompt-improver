import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/improve/route";
import { NextRequest } from "next/server";
import { generateText } from "ai";
import { resetRateLimits } from "@/lib/rate-limit";

// Mock the AI SDK
vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

describe("API Improve Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimits();
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

  it("returns 401 when API key is missing", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const req = createRequest({
      prompt: "hello",
      domainNames: "TEST",
      providerId: "anthropic",
      model: "claude-sonnet-4-6",
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("API key is missing");
  });

  it("returns 400 for unsupported model", async () => {
    const req = createRequest({
      prompt: "hello",
      domainNames: "TEST",
      providerId: "anthropic",
      model: "not-a-real-model",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Unsupported model");
  });

  it("returns 400 for oversized prompt", async () => {
    const req = createRequest({
      prompt: "a".repeat(32001),
      domainNames: "TEST",
      providerId: "anthropic",
      model: "claude-sonnet-4-6",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid prompt");
  });

  it("returns 400 for invalid mode", async () => {
    const req = createRequest({
      prompt: "good",
      domainNames: "TEST",
      providerId: "anthropic",
      model: "claude-sonnet-4-6",
      mode: "not-a-mode",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid mode");
  });

  it("returns 429 after exceeding the rate limit", async () => {
    vi.mocked(generateText).mockResolvedValue({
      text: JSON.stringify({
        issues: ["i"],
        improvements: ["imp"],
        improvedPrompt: "better",
      }),
    } as any);

    const makeReq = () =>
      createRequest({
        prompt: "good",
        domainNames: "WRITING",
        providerId: "anthropic",
        model: "claude-sonnet-4-6",
      });

    for (let i = 0; i < 20; i++) {
      const res = await POST(makeReq());
      expect(res.status).toBe(200);
    }

    const res = await POST(makeReq());
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toBe("Too many requests");
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
      model: "claude-sonnet-4-6",
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
      model: "claude-sonnet-4-6",
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

  it("handles AI generation failure without leaking the raw provider message", async () => {
    vi.mocked(generateText).mockRejectedValue(new Error("AI Hub down"));

    const req = createRequest({
      prompt: "good",
      domainNames: "WRITING",
      providerId: "anthropic",
      model: "claude-sonnet-4-6",
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Provider request failed");
    expect(data.error).not.toContain("AI Hub down");
  });

  it("returns 401 when the provider reports an auth error", async () => {
    const authError = Object.assign(new Error("invalid x-api-key"), {
      statusCode: 401,
    });
    vi.mocked(generateText).mockRejectedValue(authError);

    const req = createRequest({
      prompt: "good",
      domainNames: "WRITING",
      providerId: "anthropic",
      model: "claude-sonnet-4-6",
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Invalid API key");
    expect(data.error).not.toContain("invalid x-api-key");
  });

  it("returns 429 when the provider reports a rate limit error", async () => {
    const rateLimitError = Object.assign(new Error("rate limited"), {
      statusCode: 429,
    });
    vi.mocked(generateText).mockRejectedValue(rateLimitError);

    const req = createRequest({
      prompt: "good",
      domainNames: "WRITING",
      providerId: "anthropic",
      model: "claude-sonnet-4-6",
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toBe("Provider rate limit exceeded");
  });

  it("returns 502 with a generic message when the AI response cannot be parsed", async () => {
    vi.mocked(generateText).mockResolvedValue({
      text: "not json at all",
    } as any);

    const req = createRequest({
      prompt: "good",
      domainNames: "WRITING",
      providerId: "anthropic",
      model: "claude-sonnet-4-6",
    });

    const res = await POST(req);
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toBe(
      "AI returned an unparseable response. Please try again.",
    );
  });
});
