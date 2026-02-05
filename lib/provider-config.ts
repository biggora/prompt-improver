import "server-only";
import { ConfiguredProviders } from "./types";

export function getConfiguredProviders(): ConfiguredProviders {
  return {
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    zhipu: !!process.env.ZHIPU_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    ollama: !!process.env.NEXT_PUBLIC_OLLAMA_BASE_URL,
  };
}
