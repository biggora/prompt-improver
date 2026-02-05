"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { aiService, AI_PROVIDERS } from "@/lib/ai-service";
import ProviderSelector from "./provider-selector";
import PromptHistory from "./history";
import LanguageSwitcher from "./language-switcher";
import ThemeToggle from "./theme-toggle";
import type {
  AIModel,
  ImprovePromptResponse,
  ConfiguredProviders,
  PromptMode,
} from "@/lib/types";

interface PromptImproverProps {
  configuredProviders: ConfiguredProviders;
}

interface Domain {
  id: string;
  labelKey: string;
  icon: string;
  descriptionKey: string;
}

const DOMAINS: Domain[] = [
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

export default function PromptImprover({
  configuredProviders,
}: PromptImproverProps) {
  const t = useTranslations();

  // Find the first available provider
  const availableProviderIds = Object.keys(AI_PROVIDERS).filter(
    (id) => configuredProviders[id],
  );
  const initialProvider = availableProviderIds.includes("anthropic")
    ? "anthropic"
    : availableProviderIds[0] || "";

  const [originalPrompt, setOriginalPrompt] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState(initialProvider);
  const [selectedModel, setSelectedModel] = useState(
    initialProvider ? AI_PROVIDERS[initialProvider]?.defaultModel : "",
  );
  const [promptMode, setPromptMode] = useState<PromptMode>("standalone");
  const [ollamaModels, setOllamaModels] = useState<AIModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [result, setResult] = useState<ImprovePromptResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const toggleDomain = (domainId: string) => {
    setSelectedDomains((prev) =>
      prev.includes(domainId)
        ? prev.filter((d) => d !== domainId)
        : [...prev, domainId],
    );
  };

  const handleProviderChange = async (providerId: string) => {
    setSelectedProvider(providerId);
    const provider = AI_PROVIDERS[providerId];
    setSelectedModel(provider.defaultModel);
    setError(null);

    if (providerId === "ollama") {
      setIsLoadingModels(true);
      try {
        const models = await aiService.getOllamaModels();
        setOllamaModels(models);
        if (models.length > 0 && !selectedModel) {
          setSelectedModel(models[0].id);
        }
      } catch (err) {
        console.warn("Failed to load Ollama models:", err);
        setOllamaModels([]);
      } finally {
        setIsLoadingModels(false);
      }
    } else {
      setOllamaModels([]);
    }
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
  };

  useEffect(() => {
    if (configuredProviders.ollamaBaseUrl) {
      aiService.setOllamaBaseUrl(configuredProviders.ollamaBaseUrl as string);
    }
    handleProviderChange(selectedProvider);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const improvePrompt = async () => {
    if (
      !originalPrompt.trim() ||
      selectedDomains.length === 0 ||
      !selectedModel
    )
      return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    const domainNames = selectedDomains
      .map((id) => t(`domains.${id}`))
      .join(", ");

    try {
      const result = await aiService.improvePrompt(
        originalPrompt,
        domainNames,
        selectedProvider,
        selectedModel,
        promptMode,
      );
      setResult(result);

      // Save to database
      try {
        const { savePromptResult } = await import("@/lib/database");
        await savePromptResult({
          originalPrompt,
          improvedPrompt: result.improvedPrompt,
          domains: selectedDomains,
          provider: selectedProvider,
          model: selectedModel,
          mode: promptMode,
          issues: result.issues,
          improvements: result.improvements,
        });
      } catch (dbError) {
        console.error("Failed to save to database:", dbError);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to improve prompt. Please try again.",
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (result?.improvedPrompt) {
      await navigator.clipboard.writeText(result.improvedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-end items-center gap-3 mb-4">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-4 shadow-lg shadow-violet-500/20">
            <Sparkles size={16} />
            {t("common.title")}
          </div>
          <h1 className="text-4xl font-extrabold text-foreground mb-2 tracking-tight">
            {t("common.transformPrompts")}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t("common.subtitle")}
          </p>
        </div>

        {/* AI Provider and Model Selection */}
        <div className="bg-card/50 rounded-2xl p-6 mb-6 border border-border backdrop-blur-sm">
          <ProviderSelector
            selectedProvider={selectedProvider}
            selectedModel={selectedModel}
            onProviderChange={handleProviderChange}
            onModelChange={handleModelChange}
            ollamaModels={ollamaModels}
            configuredProviders={configuredProviders}
          />
          {/* Loading indicator for Ollama models */}
          {isLoadingModels && (
            <div className="flex items-center gap-2 text-slate-400 text-sm mt-2">
              <Loader2 size={14} className="animate-spin" />
              {t("provider.ollamaModels")}
            </div>
          )}
        </div>

        {/* Domain Selection */}
        <div className="bg-card/50 rounded-2xl p-6 mb-6 border border-border backdrop-blur-sm">
          <label className="text-sm font-semibold text-muted-foreground mb-3 block uppercase tracking-wider">
            {t("domains.label")}
          </label>
          <div className="flex flex-wrap gap-3">
            {DOMAINS.map((domain) => (
              <button
                key={domain.id}
                onClick={() => toggleDomain(domain.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                  selectedDomains.includes(domain.id)
                    ? "bg-primary/20 border-primary text-primary border-2 shadow-inner"
                    : "bg-muted/50 border-border text-muted-foreground border hover:border-slate-400 dark:hover:border-slate-500 hover:bg-muted"
                }`}
                title={t(`domains.${domain.descriptionKey}`)}
              >
                <span className="text-xl">{domain.icon}</span>
                <span className="font-semibold">
                  {t(`domains.${domain.labelKey}`)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Analysis Mode Toggle */}
        <div className="bg-card/50 rounded-2xl p-6 mb-6 border border-border backdrop-blur-sm">
          <label className="text-sm font-semibold text-muted-foreground mb-3 block uppercase tracking-wider">
            {t("modes.label")}
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setPromptMode("standalone")}
              className={`flex-1 flex flex-col gap-1 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                promptMode === "standalone"
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-muted/50 border-border text-muted-foreground hover:border-slate-400 dark:hover:border-slate-500 hover:bg-muted"
              }`}
            >
              <span className="font-bold text-sm uppercase tracking-wide">
                {t("modes.standalone")}
              </span>
              <span className="text-xs opacity-80 font-medium">
                {t("modes.standaloneDesc")}
              </span>
            </button>
            <button
              onClick={() => setPromptMode("continuation")}
              className={`flex-1 flex flex-col gap-1 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                promptMode === "continuation"
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-muted/50 border-border text-muted-foreground hover:border-slate-400 dark:hover:border-slate-500 hover:bg-muted"
              }`}
            >
              <span className="font-bold text-sm uppercase tracking-wide">
                {t("modes.continuation")}
              </span>
              <span className="text-xs opacity-80 font-medium">
                {t("modes.continuationDesc")}
              </span>
            </button>
          </div>
        </div>

        {/* Input */}
        <div className="bg-card/50 rounded-2xl p-6 mb-6 border border-border backdrop-blur-sm">
          <label className="text-sm font-semibold text-muted-foreground mb-3 block uppercase tracking-wider">
            {t("input.label")}
          </label>
          <textarea
            value={originalPrompt}
            onChange={(e) => setOriginalPrompt(e.target.value)}
            placeholder={t("input.placeholder")}
            className="w-full h-44 bg-background border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all shadow-inner"
          />
          <div className="flex justify-end mt-4">
            <button
              onClick={improvePrompt}
              disabled={
                !originalPrompt.trim() ||
                selectedDomains.length === 0 ||
                !selectedModel ||
                isLoading
              }
              className="group flex items-center gap-2 bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-8 py-3.5 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-violet-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-violet-500/25 active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t("input.improving")}
                </>
              ) : (
                <>
                  <Sparkles size={18} className="group-hover:animate-pulse" />
                  {t("input.improveBtn")}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-400 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Analysis */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 text-amber-400 font-bold mb-3 uppercase text-xs tracking-widest">
                  <AlertCircle size={18} />
                  {t("results.issues")}
                </div>
                <ul className="space-y-2">
                  {result.issues?.map((issue, i) => (
                    <li
                      key={i}
                      className="text-foreground/90 text-sm flex items-start gap-2 leading-snug"
                    >
                      <span className="text-amber-500 mt-1 font-bold">
                        &bull;
                      </span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 text-emerald-400 font-bold mb-3 uppercase text-xs tracking-widest">
                  <Lightbulb size={18} />
                  {t("results.improvements")}
                </div>
                <ul className="space-y-2">
                  {result.improvements?.map((imp, i) => (
                    <li
                      key={i}
                      className="text-foreground/90 text-sm flex items-start gap-2 leading-snug"
                    >
                      <span className="text-emerald-500 mt-0.5 font-bold">
                        &#10003;
                      </span>
                      {imp}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Improved Prompt */}
            <div className="bg-card/50 rounded-2xl p-6 border border-border backdrop-blur-sm shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-widest">
                  <ArrowRight size={18} />
                  {t("results.improvedPrompt")}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="group flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground transition-all bg-muted/50 hover:bg-muted px-4 py-2 rounded-lg border border-border"
                >
                  {copied ? (
                    <>
                      <Check size={16} className="text-emerald-400" />
                      {t("common.copied")}
                    </>
                  ) : (
                    <>
                      <Copy
                        size={16}
                        className="group-hover:scale-110 transition-transform"
                      />
                      {t("common.copy")}
                    </>
                  )}
                </button>
              </div>
              <div className="bg-background rounded-xl p-5 border border-border shadow-inner">
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {result.improvedPrompt}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* History Component */}
        <PromptHistory
          isVisible={showHistory}
          onToggle={() => setShowHistory(!showHistory)}
        />
      </div>
    </div>
  );
}
