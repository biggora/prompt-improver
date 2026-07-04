import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createZhipu } from "zhipu-ai-provider";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { PROVIDER_KEY_NAMES, AI_PROVIDERS } from "@/lib/constants";
import { checkRateLimit } from "@/lib/rate-limit";
import type {
  ValidateProviderRequest,
  ValidateProviderResponse,
} from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProviderFactory = (apiKey: string) => any;

const providerFactories: Record<string, ProviderFactory> = {
  anthropic: (apiKey) => createAnthropic({ apiKey }),
  openai: (apiKey) => createOpenAI({ apiKey }),
  zhipu: (apiKey) => createZhipu({ apiKey }),
  gemini: (apiKey) => createGoogleGenerativeAI({ apiKey }),
};

function resolveApiKey(providerId: string, bodyKey?: string): string | null {
  if (bodyKey && bodyKey.trim().length > 0) return bodyKey.trim();
  const keyName = PROVIDER_KEY_NAMES[providerId];
  return keyName ? process.env[keyName] || null : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractUpstreamStatus(error: any): number | undefined {
  const status = error?.statusCode ?? error?.status;
  return typeof status === "number" ? status : undefined;
}

const RATE_LIMIT_VALIDATE = parseInt(
  process.env.RATE_LIMIT_VALIDATE || "10",
  10,
);
const RATE_LIMIT_WINDOW_MS = 60000;

export async function POST(request: NextRequest) {
  try {
    const clientKey =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "local";
    if (
      !checkRateLimit(clientKey, RATE_LIMIT_VALIDATE, RATE_LIMIT_WINDOW_MS)
    ) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 },
      );
    }

    const body: ValidateProviderRequest = await request.json();
    const { providerId } = body;

    if (!providerId || providerId === "ollama") {
      return NextResponse.json(
        { error: "Provider not supported" },
        { status: 400 },
      );
    }

    if (!providerFactories[providerId]) {
      return NextResponse.json(
        { error: "Provider not supported" },
        { status: 400 },
      );
    }

    const apiKey = resolveApiKey(providerId, body.apiKey);
    if (!apiKey) {
      const keyName = PROVIDER_KEY_NAMES[providerId] || "API_KEY";
      return NextResponse.json(
        {
          error: `${providerId} API key is missing. Provide it via desktop Settings or set ${keyName} env variable.`,
        },
        { status: 401 },
      );
    }

    const provider = providerFactories[providerId](apiKey);
    const model = AI_PROVIDERS[providerId]?.defaultModel;
    if (!model) {
      return NextResponse.json(
        { error: "No default model configured" },
        { status: 500 },
      );
    }

    await generateText({
      model: provider(model),
      messages: [{ role: "user", content: "test" }],
      maxOutputTokens: 5,
    });

    const response: ValidateProviderResponse = { valid: true };
    return NextResponse.json(response);
  } catch (error) {
    console.error("API validate error:", error);

    const upstreamStatus = extractUpstreamStatus(error);
    if (upstreamStatus === 401 || upstreamStatus === 403) {
      return NextResponse.json(
        { error: "Validation failed" },
        { status: 401 },
      );
    }
    if (upstreamStatus === 429) {
      return NextResponse.json(
        { error: "Validation failed" },
        { status: 429 },
      );
    }

    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }
}
