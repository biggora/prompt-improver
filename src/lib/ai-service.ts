"use client";

import type {
  AIProvider,
  ImprovePromptResponse,
  ValidateProviderResponse,
  PromptMode,
} from "./types";
import { parseAIResponse } from "./utils";
import {
  AI_PROVIDERS,
  SYSTEM_PROMPT,
  OLLAMA_DEFAULT_BASE_URL,
} from "./constants";

// AI Service class
export class AIService {
  private ollamaBaseUrl: string =
    process.env.NEXT_PUBLIC_OLLAMA_BASE_URL || OLLAMA_DEFAULT_BASE_URL;

  setOllamaBaseUrl(url: string) {
    this.ollamaBaseUrl = url;
  }

  async improvePrompt(
    prompt: string,
    domainNames: string | string[],
    providerId: string,
    model: string,
    mode: PromptMode = "standalone",
    responseLanguage?: string,
  ): Promise<ImprovePromptResponse> {
    if (providerId === "ollama") {
      return await this.improvePromptWithOllama(
        prompt,
        domainNames,
        model,
        mode,
        responseLanguage,
      );
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
          mode,
          responseLanguage,
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
    mode: PromptMode = "standalone",
    responseLanguage?: string,
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
          prompt: `${SYSTEM_PROMPT}\n\nDomain(s): ${domainNames}\nMode: ${mode}${responseLanguage ? `\nLanguage: ${responseLanguage}` : ""}\n\nOriginal prompt to improve:\n${prompt}\n\nResponse format (JSON only, no markdown):`,
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
