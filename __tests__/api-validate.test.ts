import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/validate/route";
import { NextRequest } from "next/server";
import { generateText } from "ai";
import { resetRateLimits } from "@/lib/rate-limit";

// Mock the AI SDK
vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

describe("API Validate Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimits();
    process.env.OPENAI_API_KEY = "test-key";
  });

  const createRequest = (body: any) => {
    return new NextRequest("http://localhost/api/validate", {
      method: "POST",
      body: JSON.stringify(body),
    });
  };

  it("returns 400 for unsupported provider", async () => {
    const req = createRequest({ providerId: "unknown" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 401 when API key is missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const req = createRequest({ providerId: "openai" });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("API key is missing");
  });

  it("returns valid: true for correct key", async () => {
    (generateText as any).mockResolvedValue({ text: "ok" });

    const req = createRequest({ providerId: "openai" });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.valid).toBe(true);
  });

  it("returns 500 without leaking the raw provider message when validation call fails", async () => {
    (generateText as any).mockRejectedValue(new Error("Invalid API Key"));

    const req = createRequest({ providerId: "openai" });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Validation failed");
    expect(data.error).not.toContain("Invalid API Key");
  });

  it("returns 401 when the provider reports an auth error", async () => {
    const authError = Object.assign(new Error("invalid key"), {
      statusCode: 401,
    });
    (generateText as any).mockRejectedValue(authError);

    const req = createRequest({ providerId: "openai" });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Validation failed");
  });

  it("returns 429 when the provider reports a rate limit error", async () => {
    const rateLimitError = Object.assign(new Error("rate limited"), {
      statusCode: 429,
    });
    (generateText as any).mockRejectedValue(rateLimitError);

    const req = createRequest({ providerId: "openai" });
    const res = await POST(req);
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toBe("Validation failed");
  });

  it("returns 429 after exceeding the rate limit", async () => {
    (generateText as any).mockResolvedValue({ text: "ok" });

    for (let i = 0; i < 10; i++) {
      const res = await POST(createRequest({ providerId: "openai" }));
      expect(res.status).toBe(200);
    }

    const res = await POST(createRequest({ providerId: "openai" }));
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toBe("Too many requests");
  });
});
