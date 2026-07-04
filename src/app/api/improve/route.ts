import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createZhipu } from "zhipu-ai-provider";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  SYSTEM_PROMPT,
  PROVIDER_KEY_NAMES,
  AI_PROVIDERS,
} from "@/lib/constants";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ImprovePromptRequest } from "@/lib/types";

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

const RATE_LIMIT_IMPROVE = parseInt(
  process.env.RATE_LIMIT_IMPROVE || "20",
  10,
);
const RATE_LIMIT_WINDOW_MS = 60000;

import { parseAIResponse } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const clientKey =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "local";
    if (!checkRateLimit(clientKey, RATE_LIMIT_IMPROVE, RATE_LIMIT_WINDOW_MS)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 },
      );
    }

    const body: ImprovePromptRequest = await request.json();
    const { prompt, domainNames, providerId, model } = body;

    if (!prompt || !providerId || !model) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (providerId === "ollama") {
      return NextResponse.json(
        { error: "Ollama is handled locally" },
        { status: 400 },
      );
    }

    if (!providerFactories[providerId]) {
      return NextResponse.json(
        { error: "Provider not supported" },
        { status: 400 },
      );
    }

    const allowedModels = AI_PROVIDERS[providerId]?.models.map((m) => m.id);
    if (
      typeof model !== "string" ||
      !allowedModels ||
      !allowedModels.includes(model)
    ) {
      return NextResponse.json(
        { error: "Unsupported model" },
        { status: 400 },
      );
    }

    if (
      typeof prompt !== "string" ||
      prompt.trim().length === 0 ||
      prompt.length > 32000
    ) {
      return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
    }

    if (
      body.mode !== undefined &&
      body.mode !== "standalone" &&
      body.mode !== "continuation"
    ) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    if (
      body.responseLanguage !== undefined &&
      (typeof body.responseLanguage !== "string" ||
        body.responseLanguage.length > 60)
    ) {
      return NextResponse.json(
        { error: "Invalid responseLanguage" },
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
    const domainLabel = (
      Array.isArray(domainNames) ? domainNames.join(", ") : domainNames
    ).slice(0, 500);

    const languageInstruction = body.responseLanguage
      ? `\nIMPORTANT: All text in the JSON response (issues, improvements, and improvedPrompt) MUST be in ${body.responseLanguage} language.`
      : "";

    const isReasoningModel =
      model.includes("gpt-5") || model.includes("o1") || model.includes("o3");

    const result = await generateText({
      model: provider(model),
      system: SYSTEM_PROMPT + languageInstruction,
      messages: [
        {
          role: "user",
          content: `Domain(s): ${domainLabel}\nMode: ${body.mode || "standalone"}\n\nOriginal prompt to improve:\n${prompt}`,
        },
      ],
      maxOutputTokens: 4000,
      ...(isReasoningModel ? {} : { temperature: 0.7 }),
    });

    const parsed = parseAIResponse(result.text);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("API improve error:", error);

    if (
      error instanceof Error &&
      (error.message === "No valid JSON object found in response" ||
        error.message === "Invalid JSON response from AI")
    ) {
      return NextResponse.json(
        { error: "AI returned an unparseable response. Please try again." },
        { status: 502 },
      );
    }

    const upstreamStatus = extractUpstreamStatus(error);
    if (upstreamStatus === 401 || upstreamStatus === 403) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }
    if (upstreamStatus === 429) {
      return NextResponse.json(
        { error: "Provider rate limit exceeded" },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { error: "Provider request failed" },
      { status: 500 },
    );
  }
}
