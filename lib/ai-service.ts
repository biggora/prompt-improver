"use client";

import type {
  AIProvider,
  ImprovePromptResponse,
  ValidateProviderResponse,
} from "./types";
import { SYSTEM_PROMPT } from "./prompts";
import { parseAIResponse } from "./utils";

// AI Provider Configuration
export const AI_PROVIDERS: Record<string, AIProvider> = {
  anthropic: {
    id: "anthropic",
    name: "Anthropic Claude",
    models: [
      { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4" },
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
      { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
    ],
    defaultModel: "claude-sonnet-4-20250514",
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    models: [
      { id: "gpt-4o", name: "GPT-4o" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini" },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
      { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
    ],
    defaultModel: "gpt-4o",
  },
  zhipu: {
    id: "zhipu",
    name: "Zhipu AI (Z.AI)",
    models: [
      { id: "glm-4-plus", name: "GLM-4 Plus" },
      { id: "glm-4", name: "GLM-4" },
      { id: "glm-4-flash", name: "GLM-4 Flash" },
      { id: "glm-4-air", name: "GLM-4 Air" },
    ],
    defaultModel: "glm-4-plus",
  },
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    models: [
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
    ],
    defaultModel: "gemini-2.5-flash",
  },
  ollama: {
    id: "ollama",
    name: "Ollama (Local)",
    models: [], // Will be populated dynamically
    defaultModel: "",
  },
};

// AI Service class
export class AIService {
  private ollamaBaseUrl: string =
    process.env.NEXT_PUBLIC_OLLAMA_BASE_URL || "http://localhost:11434";

  setOllamaBaseUrl(url: string) {
    this.ollamaBaseUrl = url;
  }

  async improvePrompt(
    prompt: string,
    domainNames: string | string[],
    providerId: string,
    model: string,
  ): Promise<ImprovePromptResponse> {
    if (providerId === "ollama") {
      return await this.improvePromptWithOllama(prompt, domainNames, model);
    }

    try {
      const response = await fetch("/api/improve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          domainNames,
          providerId,
          model,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Server request failed");
      }

      return data;
    } catch (error) {
      console.error(`Error with ${providerId}:`, error);

      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("Cannot reach AI server. Make sure it is running.");
      }

      const providerName = AI_PROVIDERS[providerId]?.name || providerId;
      throw new Error(
        `Failed to improve prompt with ${providerName}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async improvePromptWithOllama(
    prompt: string,
    domainNames: string | string[],
    model?: string,
  ): Promise<ImprovePromptResponse> {
    if (!model) {
      throw new Error("Please select an Ollama model");
    }

    const baseUrl = this.ollamaBaseUrl;

    try {
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt: `${SYSTEM_PROMPT}\n\nDomain(s): ${domainNames}\n\nOriginal prompt to improve:\n${prompt}\n\nResponse format (JSON only, no markdown):`,
          stream: false,
          options: {
            temperature: 0.7,
            max_tokens: 1500,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Ollama API request failed");
      }

      return this.parseResponse(data.response);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Cannot connect to Ollama. Make sure Ollama is running at " + baseUrl,
        );
      }
      throw error;
    }
  }

  async getOllamaModels(): Promise<{ id: string; name: string }[]> {
    const baseUrl = this.ollamaBaseUrl;

    try {
      const response = await fetch(`${baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error("Failed to fetch Ollama models");
      }
      const data = await response.json();
      return data.models.map(
        (model: { name: string; details?: { parameter_size?: string } }) => ({
          id: model.name,
          name: `${model.name} (${model.details?.parameter_size || "Unknown"})`,
        }),
      );
    } catch (error) {
      console.warn("Could not fetch Ollama models:", error);
      return [];
    }
  }

  parseResponse(text: string): ImprovePromptResponse {
    return parseAIResponse(text);
  }

  // Method to get available providers and their models
  getAvailableProviders(): AIProvider[] {
    return Object.values(AI_PROVIDERS);
  }

  // Method to validate API keys
  async validateProvider(
    providerId: string,
  ): Promise<ValidateProviderResponse> {
    if (providerId === "ollama") {
      return { valid: true };
    }

    try {
      const response = await fetch("/api/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          providerId,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { valid: false, error: data.error || "Validation failed" };
      }

      return data;
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export const aiService = new AIService();
