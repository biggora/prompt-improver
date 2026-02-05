import type { AIProvider } from "./types";

// Database Constants
export const DB_NAME = "PromptImproverDB";
export const DB_VERSION = 1;
export const STORE_NAME = "prompt_history";

// AI Constants
export const OLLAMA_DEFAULT_BASE_URL = "http://localhost:11434";

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
];

export const AI_PROVIDERS: Record<string, AIProvider> = {
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    models: [
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
    ],
    defaultModel: "gemini-2.0-flash",
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    models: [
      { id: "gpt-5.2", name: "GPT-5.2" },
      { id: "gpt-5-mini", name: "GPT-5 Mini" },
      { id: "gpt-5-nano", name: "GPT-5 Nano" },
    ],
    defaultModel: "gpt-5-nano",
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic Claude",
    models: [
      { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5" },
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
      { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
    ],
    defaultModel: "claude-3-5-haiku-20241022",
  },
  zhipu: {
    id: "zhipu",
    name: "Zhipu AI (Z.AI)",
    models: [
      { id: "glm-4.7", name: "GLM-4.7 Plus" },
      { id: "glm-4.7-flash", name: "GLM-4.7 Flash" },
      { id: "glm-4-air", name: "GLM-4 Air" },
    ],
    defaultModel: "glm-4-air",
  },
  ollama: {
    id: "ollama",
    name: "Ollama (Local)",
    models: [], // Will be populated dynamically
    defaultModel: "",
  },
};

export const PROVIDER_KEY_NAMES: Record<string, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  zhipu: "ZHIPU_API_KEY",
  gemini: "GEMINI_API_KEY",
};

export const SYSTEM_PROMPT = `You are a prompt engineering expert. Your task is to analyze and improve prompts.

Given a prompt and its target domain(s), you will:
1. Analyze what's missing or weak in the original prompt
2. Create an improved version following best practices

Response format (JSON only, no markdown):
{
  "issues": ["issue 1", "issue 2", "issue 3"],
  "improvements": ["what you added/changed 1", "what you added/changed 2"],
  "improvedPrompt": "The full improved prompt text"
}

Domain-specific best practices:
- PROGRAMMING: Specify language/framework, expected output format, error handling needs, code style preferences, context about existing codebase
- WRITING: Define tone, target audience, length constraints, style references, purpose/goal
- RESEARCH: Specify depth needed, preferred source types, format requirements, specific questions to answer
- BUSINESS: Add context about stakeholders, constraints, deliverables, success metrics
- DATA: Specify data format, analysis type needed, visualization preferences, statistical rigor required

General improvements to always consider:
- Add specific context and constraints
- Define expected output format
- Include relevant examples if helpful
- Specify what to avoid
- Break complex requests into clear steps
- Add success criteria

PROMPT MODES:
- STANDALONE: Treat the prompt as a completely new request.
- CONTINUATION: Treat the prompt as a follow-up or adjustment to previous content. Focus on refining or extending existing ideas rather than starting from scratch.`;

export const DOMAINS = [
  {
    id: "programming",
    labelKey: "programming",
    icon: "\uD83D\uDCBB",
    descriptionKey: "programmingDesc",
  },
  {
    id: "writing",
    labelKey: "writing",
    icon: "\u270D\uFE0F",
    descriptionKey: "writingDesc",
  },
  {
    id: "research",
    labelKey: "research",
    icon: "\uD83D\uDD2C",
    descriptionKey: "researchDesc",
  },
  {
    id: "business",
    labelKey: "business",
    icon: "\uD83D\uDCBC",
    descriptionKey: "businessDesc",
  },
  {
    id: "data",
    labelKey: "data",
    icon: "\uD83D\uDCCA",
    descriptionKey: "dataDesc",
  },
];
