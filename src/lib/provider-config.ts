import "server-only";
import { ConfiguredProviders } from "./types";

export function getConfiguredProviders(): ConfiguredProviders {
  return {
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    zhipu: !!process.env.ZHIPU_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    ollama: true, // Always allow Ollama if requested, but we'll check connectivity on client
    ollamaBaseUrl:
      process.env.NEXT_PUBLIC_OLLAMA_BASE_URL ||
      process.env.OLLAMA_BASE_URL ||
      "http://localhost:11434",
  };
}
