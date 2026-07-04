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
  Settings,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { aiService } from "@/lib/ai-service";
import { AI_PROVIDERS, SUPPORTED_LANGUAGES, DOMAINS } from "@/lib/constants";
import { getDesktopBridge, isDesktop } from "@/lib/desktop-bridge";
import ProviderSelector from "./provider-selector";
import PromptHistory from "./history";
import LanguageSwitcher from "./language-switcher";
import ThemeToggle from "./theme-toggle";
import ApiKeysSettings from "./api-keys-settings";
import { useToast } from "./ui/toast";
import { isAuthError, isRateLimitError, isNetworkError } from "@/lib/retry";
import type {
  AIModel,
  ImprovePromptResponse,
  ConfiguredProviders,
  PromptMode,
} from "@/lib/types";

interface PromptImproverProps {
  configuredProviders: ConfiguredProviders;
}

export default function PromptImprover({
  configuredProviders: initialProviders,
}: PromptImproverProps) {
  const t = useTranslations();
  const toast = useToast();

  const [configuredProviders, setConfiguredProviders] =
    useState<ConfiguredProviders>(initialProviders);

  const refreshDesktopProviders = async () => {
    const bridge = getDesktopBridge();
    if (!bridge) return;
    try {
      const status = await bridge.listProviders();
      setConfiguredProviders((prev) => ({ ...prev, ...status }));
    } catch (err) {
      console.warn("Failed to refresh desktop providers:", err);
    }
  };

  // Find the first available provider
  const availableProviderIds = Object.keys(AI_PROVIDERS).filter(
    (id) => configuredProviders[id],
  );
  const initialProvider = availableProviderIds[0] || "";

  const [originalPrompt, setOriginalPrompt] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState(initialProvider);
  const [selectedModel, setSelectedModel] = useState(
    initialProvider ? AI_PROVIDERS[initialProvider]?.defaultModel : "",
  );
  const locale = useLocale();
  const [responseLanguage, setResponseLanguage] = useState(locale);
  const [promptMode, setPromptMode] = useState<PromptMode>("standalone");
  const [ollamaModels, setOllamaModels] = useState<AIModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [result, setResult] = useState<ImprovePromptResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [desktopMode, setDesktopMode] = useState(false);

  useEffect(() => {
    setDesktopMode(isDesktop());
    refreshDesktopProviders();
  }, []);

  const toggleDomain = (domainId: string) => {
    setSelectedDomains((prev) =>
      prev.includes(domainId)
        ? prev.filter((d) => d !== domainId)
        : [...prev, domainId],
    );
  };

  const handleProviderChange = async (providerId: string) => {
    // Avoid redundant work (and a duplicate Ollama models fetch) when the
    // provider is already selected and, for Ollama, models are already loaded.
    if (
      providerId === selectedProvider &&
      (providerId !== "ollama" || ollamaModels.length > 0)
    ) {
      return;
    }

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
    if (selectedProvider) {
      handleProviderChange(selectedProvider);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-select first available provider when configuredProviders changes
  // (e.g. after refreshDesktopProviders resolves or user saves a new key)
  useEffect(() => {
    const available = Object.keys(AI_PROVIDERS).filter(
      (id) => configuredProviders[id],
    );
    if (available.length === 0) return;
    if (!selectedProvider || !configuredProviders[selectedProvider]) {
      handleProviderChange(available[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configuredProviders]);

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

    const requestProvider = selectedProvider;
    const requestModel = selectedModel;
    const requestDomains = selectedDomains;
    const requestMode = promptMode;

    const domainNames = requestDomains
      .map((id) => t(`domains.${id}`))
      .join(", ");

    try {
      const result = await aiService.improvePrompt(
        originalPrompt,
        domainNames,
        requestProvider,
        requestModel,
        requestMode,
        SUPPORTED_LANGUAGES.find((l) => l.code === responseLanguage)?.name ||
          responseLanguage,
      );
      setResult(result);

      // Show success toast
      toast.success(t("results.improvedPrompt") + "!");

      // Save to database
      try {
        const { savePromptResult } = await import("@/lib/database");
        await savePromptResult({
          originalPrompt,
          improvedPrompt: result.improvedPrompt,
          domains: requestDomains,
          provider: requestProvider,
          model: requestModel,
          mode: requestMode,
          issues: result.issues,
          improvements: result.improvements,
        });
      } catch (dbError) {
        console.error("Failed to save to database:", dbError);
        toast.warning(t("errors.saveFailed"));
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");

      // Show appropriate toast based on error type
      if (isAuthError(error)) {
        toast.error(
          t("errors.authError") ||
            "API key not configured. Please check your settings.",
          {
            duration: 8000,
          },
        );
      } else if (isRateLimitError(error)) {
        toast.warning(t("errors.rateLimit") || "Rate limited. Retrying...", {
          duration: 6000,
        });
      } else if (isNetworkError(error)) {
        toast.error(
          t("errors.network") || "Network error. Please check your connection.",
        );
      } else {
        toast.error(
          t("errors.general") || "Failed to improve prompt. Please try again.",
        );
      }

      setError(error.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (result?.improvedPrompt) {
      try {
        await navigator.clipboard.writeText(result.improvedPrompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success(t("common.copied") || "Copied to clipboard!");
      } catch {
        toast.error(t("errors.copyFailed"));
      }
    }
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-end items-center gap-2 mb-3">
          {desktopMode && (
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg bg-muted/50 hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors"
              aria-label={t("settings.openButton")}
              title={t("settings.openButton")}
            >
              <Settings size={16} />
            </button>
          )}
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        <ApiKeysSettings
          open={showSettings}
          onClose={() => setShowSettings(false)}
          onSaved={refreshDesktopProviders}
        />
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 bg-primary text-white px-3 py-1.5 rounded-full text-sm font-medium mb-3 shadow-lg shadow-violet-500/20">
            <Sparkles size={14} />
            {t("common.title")}
          </div>
          <h1 className="text-3xl font-extrabold text-foreground mb-1.5 tracking-tight">
            {t("common.transformPrompts")}
          </h1>
          <p className="text-muted-foreground text-base">
            {t("common.subtitle")}
          </p>
        </div>

        {/* AI Provider and Model Selection */}
        <div className="bg-card/50 rounded-2xl p-4 mb-4 border border-border backdrop-blur-sm">
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

        {/* Response Language Selection */}
        <div className="bg-card/50 rounded-2xl p-4 mb-4 border border-border backdrop-blur-sm">
          <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">
            {t("input.responseLanguage")}
          </label>
          <div className="flex flex-wrap gap-2">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setResponseLanguage(lang.code)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 border ${
                  responseLanguage === lang.code
                    ? "bg-primary/20 border-primary text-primary shadow-inner"
                    : "bg-muted/30 border-border text-muted-foreground hover:border-slate-400 dark:hover:border-slate-600"
                }`}
              >
                <span>{lang.flag}</span>
                <span className="text-sm font-medium">{lang.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Domain Selection */}
        <div className="bg-card/50 rounded-2xl p-4 mb-4 border border-border backdrop-blur-sm">
          <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">
            {t("domains.label")}
          </label>
          <div className="flex flex-wrap gap-2">
            {DOMAINS.map((domain) => (
              <button
                key={domain.id}
                onClick={() => toggleDomain(domain.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                  selectedDomains.includes(domain.id)
                    ? "bg-primary/20 border-primary text-primary border-2 shadow-inner"
                    : "bg-muted/50 border-border text-muted-foreground border hover:border-slate-400 dark:hover:border-slate-500 hover:bg-muted"
                }`}
                title={t(`domains.${domain.descriptionKey}`)}
              >
                <span className="text-lg">{domain.icon}</span>
                <span className="font-semibold text-sm">
                  {t(`domains.${domain.labelKey}`)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Analysis Mode Toggle */}
        <div className="bg-card/50 rounded-2xl p-4 mb-4 border border-border backdrop-blur-sm">
          <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">
            {t("modes.label")}
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setPromptMode("standalone")}
              className={`flex-1 flex flex-col gap-1 p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                promptMode === "standalone"
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-muted/50 border-border text-muted-foreground hover:border-slate-400 dark:hover:border-slate-500 hover:bg-muted"
              }`}
            >
              <span className="font-bold text-xs uppercase tracking-wide">
                {t("modes.standalone")}
              </span>
              <span className="text-xs opacity-80 font-medium">
                {t("modes.standaloneDesc")}
              </span>
            </button>
            <button
              onClick={() => setPromptMode("continuation")}
              className={`flex-1 flex flex-col gap-1 p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                promptMode === "continuation"
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-muted/50 border-border text-muted-foreground hover:border-slate-400 dark:hover:border-slate-500 hover:bg-muted"
              }`}
            >
              <span className="font-bold text-xs uppercase tracking-wide">
                {t("modes.continuation")}
              </span>
              <span className="text-xs opacity-80 font-medium">
                {t("modes.continuationDesc")}
              </span>
            </button>
          </div>
        </div>

        {/* Input */}
        <div className="bg-card/50 rounded-2xl p-4 mb-4 border border-border backdrop-blur-sm">
          <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">
            {t("input.label")}
          </label>
          <textarea
            value={originalPrompt}
            onChange={(e) => setOriginalPrompt(e.target.value)}
            placeholder={t("input.placeholder")}
            className="w-full h-32 bg-background border border-border rounded-xl p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all shadow-inner"
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={improvePrompt}
              disabled={
                !originalPrompt.trim() ||
                selectedDomains.length === 0 ||
                !selectedModel ||
                isLoading
              }
              className="group flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-violet-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-violet-500/25 active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t("input.improving")}
                </>
              ) : (
                <>
                  <Sparkles size={16} className="group-hover:animate-pulse" />
                  {t("input.improveBtn")}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 flex items-center gap-2 text-red-400 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Analysis */}
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 shadow-sm">
                <div className="flex items-center gap-2 text-amber-400 font-bold mb-2 uppercase text-xs tracking-widest">
                  <AlertCircle size={14} />
                  {t("results.issues")}
                </div>
                <ul className="space-y-1.5">
                  {result.issues?.map((issue, i) => (
                    <li
                      key={i}
                      className="text-foreground/90 text-sm flex items-start gap-2 leading-snug"
                    >
                      <span className="text-amber-500 mt-0.5 font-bold">
                        &bull;
                      </span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 shadow-sm">
                <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2 uppercase text-xs tracking-widest">
                  <Lightbulb size={14} />
                  {t("results.improvements")}
                </div>
                <ul className="space-y-1.5">
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
            <div className="bg-card/50 rounded-2xl p-4 border border-border backdrop-blur-sm shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-widest">
                  <ArrowRight size={14} />
                  {t("results.improvedPrompt")}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="group flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground transition-all bg-muted/50 hover:bg-muted px-3 py-1.5 rounded-lg border border-border"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-emerald-400" />
                      {t("common.copied")}
                    </>
                  ) : (
                    <>
                      <Copy
                        size={14}
                        className="group-hover:scale-110 transition-transform"
                      />
                      {t("common.copy")}
                    </>
                  )}
                </button>
              </div>
              <div className="bg-background rounded-xl p-3 border border-border shadow-inner">
                <p className="text-foreground whitespace-pre-wrap leading-relaxed text-sm">
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
