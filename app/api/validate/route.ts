import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createZhipu } from "zhipu-ai-provider";
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
};

const defaultModels: Record<string, string> = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  zhipu: "glm-4-plus",
};

const providerKeyNames: Record<string, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  zhipu: "ZHIPU_API_KEY",
};

function getApiKey(providerId: string): string | null {
  const keyName = providerKeyNames[providerId];
  return keyName ? process.env[keyName] || null : null;
}

export async function POST(request: NextRequest) {
  try {
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
    const model = defaultModels[providerId];
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
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
