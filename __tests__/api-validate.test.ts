import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/validate/route";
import { NextRequest } from "next/server";
import { generateText } from "ai";

// Mock the AI SDK
vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

describe("API Validate Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("returns 500 when API key is missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const req = createRequest({ providerId: "openai" });
    const res = await POST(req);
    expect(res.status).toBe(500);
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

  it("returns 500 when validation call fails", async () => {
    (generateText as any).mockRejectedValue(new Error("Invalid API Key"));

    const req = createRequest({ providerId: "openai" });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Invalid API Key");
  });
});
