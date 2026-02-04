"use client";

import { ChevronDown } from "lucide-react";
import { AI_PROVIDERS } from "@/lib/ai-service";
import type { AIModel } from "@/lib/types";

interface ProviderSelectorProps {
  selectedProvider: string;
  selectedModel: string;
  onProviderChange: (providerId: string) => void;
  onModelChange: (modelId: string) => void;
  ollamaModels?: AIModel[];
}

export default function ProviderSelector({
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
  ollamaModels = [],
}: ProviderSelectorProps) {
  const currentProvider = AI_PROVIDERS[selectedProvider];
  const availableModels =
    selectedProvider === "ollama"
      ? ollamaModels
      : currentProvider?.models || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {/* Provider Selection */}
      <div className="">
        <label className="text-sm font-medium text-slate-300 mb-2 block">
          AI Provider
        </label>
        <div className="relative">
          <select
            value={selectedProvider}
            onChange={(e) => onProviderChange(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent cursor-pointer"
          >
            {Object.values(AI_PROVIDERS).map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={18}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>
      </div>

      {/* Model Selection */}
      <div className="">
        <label className="text-sm font-medium text-slate-300 mb-2 block w-full">
          Model
        </label>
        <div className="relative">
          <select
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
            disabled={
              selectedProvider === "ollama" && ollamaModels.length === 0
            }
            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedProvider === "ollama" && ollamaModels.length === 0 ? (
              <option value="">
                No models available (check Ollama connection)
              </option>
            ) : (
              <>
                {selectedProvider !== "ollama" && !selectedModel && (
                  <option value="">Select a model...</option>
                )}
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </>
            )}
          </select>
          <ChevronDown
            size={18}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>

        {/* Provider-specific hints */}
        <div className="mt-2 text-xs text-slate-400">
          {selectedProvider === "anthropic" && (
            <p>Requires Anthropic API key</p>
          )}
          {selectedProvider === "openai" && <p>Requires OpenAI API key</p>}
          {selectedProvider === "zhipu" && <p>Requires Zhipu API key</p>}
          {selectedProvider === "gemini" && <p>Requires Gemini API key</p>}
          {selectedProvider === "ollama" && (
            <p>Requires local Ollama installation</p>
          )}
        </div>
      </div>
    </div>
  );
}
