import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createZhipu } from "zhipu-ai-provider";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { SYSTEM_PROMPT, PROVIDER_KEY_NAMES } from "@/lib/constants";
import type { ImprovePromptRequest } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProviderFactory = (apiKey: string) => any;

const providerFactories: Record<string, ProviderFactory> = {
  anthropic: (apiKey) => createAnthropic({ apiKey }),
  openai: (apiKey) => createOpenAI({ apiKey }),
  zhipu: (apiKey) => createZhipu({ apiKey }),
  gemini: (apiKey) => createGoogleGenerativeAI({ apiKey }),
};

function getApiKey(providerId: string): string | null {
  const keyName = PROVIDER_KEY_NAMES[providerId];
  return keyName ? process.env[keyName] || null : null;
}

import { parseAIResponse } from "@/lib/utils";

export async function POST(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any = null;
  try {
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

    const apiKey = getApiKey(providerId);
    if (!apiKey) {
      const keyName = PROVIDER_KEY_NAMES[providerId] || "API_KEY";
      return NextResponse.json(
        {
          error: `${providerId} API key is missing. Please set ${keyName} environment variable.`,
        },
        { status: 500 },
      );
    }

    const provider = providerFactories[providerId](apiKey);
    const domainLabel = Array.isArray(domainNames)
      ? domainNames.join(", ")
      : domainNames;

    const languageInstruction = body.responseLanguage
      ? `\nIMPORTANT: All text in the JSON response (issues, improvements, and improvedPrompt) MUST be in ${body.responseLanguage} language.`
      : "";

    const isReasoningModel =
      model.includes("gpt-5") || model.includes("o1") || model.includes("o3");

    result = await generateText({
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
    const message = error instanceof Error ? error.message : "Server error";
    // For debugging JSON issues
    const debugInfo =
      error instanceof Error && error.message.includes("JSON")
        ? ` | Raw: ${result?.text?.substring(0, 500)}`
        : "";
    return NextResponse.json({ error: message + debugInfo }, { status: 500 });
  }
}
