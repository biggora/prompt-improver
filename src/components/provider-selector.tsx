"use client";

import { ChevronDown, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { AI_PROVIDERS } from "@/lib/constants";
import type { AIModel, ConfiguredProviders } from "@/lib/types";

interface ProviderSelectorProps {
  selectedProvider: string;
  selectedModel: string;
  onProviderChange: (providerId: string) => void;
  onModelChange: (modelId: string) => void;
  ollamaModels?: AIModel[];
  configuredProviders: ConfiguredProviders;
}

export default function ProviderSelector({
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
  ollamaModels = [],
  configuredProviders,
}: ProviderSelectorProps) {
  const t = useTranslations("provider");
  const availableProviders = Object.values(AI_PROVIDERS).filter(
    (p) => configuredProviders[p.id],
  );

  const currentProvider = AI_PROVIDERS[selectedProvider];
  const availableModels =
    selectedProvider === "ollama"
      ? ollamaModels
      : currentProvider?.models || [];

  if (availableProviders.length === 0) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-4">
        <div className="bg-amber-500/20 p-2 rounded-lg text-amber-500">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h3 className="text-amber-500 dark:text-amber-400 font-semibold mb-1">
            {t("noProviders")}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t("noProvidersDesc")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {/* Provider Selection */}
      <div className="">
        <label className="text-sm font-medium text-muted-foreground mb-2 block">
          {t("label")}
        </label>
        <div className="relative">
          <select
            value={selectedProvider}
            onChange={(e) => onProviderChange(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
          >
            {availableProviders.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={18}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
        </div>
      </div>

      {/* Model Selection */}
      <div className="">
        <label className="text-sm font-medium text-muted-foreground mb-2 block w-full">
          {t("model")}
        </label>
        <div className="relative">
          <select
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
            disabled={
              selectedProvider === "ollama" && ollamaModels.length === 0
            }
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedProvider === "ollama" && ollamaModels.length === 0 ? (
              <option value="">{t("noModels")}</option>
            ) : (
              <>
                {selectedProvider !== "ollama" && !selectedModel && (
                  <option value="">{t("selectModel")}</option>
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
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
        </div>

        {/* Provider-specific hints */}
        <div className="mt-2 text-xs text-muted-foreground">
          {selectedProvider === "anthropic" && <p>{t("anthropicHint")}</p>}
          {selectedProvider === "openai" && <p>{t("openaiHint")}</p>}
          {selectedProvider === "zhipu" && <p>{t("zhipuHint")}</p>}
          {selectedProvider === "gemini" && <p>{t("geminiHint")}</p>}
          {selectedProvider === "ollama" && <p>{t("ollamaHint")}</p>}
        </div>
      </div>
    </div>
  );
}
