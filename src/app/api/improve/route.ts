import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createZhipu } from "zhipu-ai-provider";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import type { ImprovePromptRequest } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProviderFactory = (apiKey: string) => any;

const providerFactories: Record<string, ProviderFactory> = {
  anthropic: (apiKey) => createAnthropic({ apiKey }),
  openai: (apiKey) => createOpenAI({ apiKey }),
  zhipu: (apiKey) => createZhipu({ apiKey }),
  gemini: (apiKey) => createGoogleGenerativeAI({ apiKey }),
};

const providerKeyNames: Record<string, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  zhipu: "ZHIPU_API_KEY",
  gemini: "GEMINI_API_KEY",
};

function getApiKey(providerId: string): string | null {
  const keyName = providerKeyNames[providerId];
  return keyName ? process.env[keyName] || null : null;
}

import { parseAIResponse } from "@/lib/utils";

export async function POST(request: NextRequest) {
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
      const keyName = providerKeyNames[providerId] || "API_KEY";
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

    const result = await generateText({
      model: provider(model),
      system: SYSTEM_PROMPT + languageInstruction,
      messages: [
        {
          role: "user",
          content: `Domain(s): ${domainLabel}\nMode: ${body.mode || "standalone"}\n\nOriginal prompt to improve:\n${prompt}`,
        },
      ],
      maxOutputTokens: 1500,
      temperature: 0.7,
    });

    const parsed = parseAIResponse(result.text);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("API improve error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
