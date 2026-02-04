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
import { aiService, AI_PROVIDERS } from "@/lib/ai-service";
import ProviderSelector from "./provider-selector";
import PromptHistory from "./history";
import type { AIModel, ImprovePromptResponse } from "@/lib/types";

interface Domain {
  id: string;
  label: string;
  icon: string;
  description: string;
}

const DOMAINS: Domain[] = [
  {
    id: "programming",
    label: "Programming",
    icon: "\uD83D\uDCBB",
    description: "Code, debugging, architecture",
  },
  {
    id: "writing",
    label: "Writing",
    icon: "\u270D\uFE0F",
    description: "Creative, copywriting, content",
  },
  {
    id: "research",
    label: "Research",
    icon: "\uD83D\uDD2C",
    description: "Analysis, papers, investigation",
  },
  {
    id: "business",
    label: "Business",
    icon: "\uD83D\uDCBC",
    description: "Strategy, planning, professional",
  },
  {
    id: "data",
    label: "Data Analysis",
    icon: "\uD83D\uDCCA",
    description: "Statistics, visualization, insights",
  },
];

export default function PromptImprover() {
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("anthropic");
  const [selectedModel, setSelectedModel] = useState(
    AI_PROVIDERS.anthropic.defaultModel,
  );
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
      .map((id) => DOMAINS.find((d) => d.id === id)?.label)
      .join(", ");

    try {
      const result = await aiService.improvePrompt(
        originalPrompt,
        domainNames,
        selectedProvider,
        selectedModel,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles size={16} />
            Prompt Improver
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Transform Your Prompts
          </h1>
          <p className="text-slate-400">
            Choose your AI provider, select domains, paste your prompt, get an
            optimized version
          </p>
        </div>

        {/* AI Provider and Model Selection */}
        <div className="bg-slate-800/50 rounded-2xl p-6 mb-6 border border-slate-700">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <ProviderSelector
                selectedProvider={selectedProvider}
                selectedModel={selectedModel}
                onProviderChange={handleProviderChange}
                onModelChange={handleModelChange}
                ollamaModels={ollamaModels}
              />
            </div>
            <div>
              {/* Loading indicator for Ollama models */}
              {isLoadingModels && (
                <div className="flex items-center gap-2 text-slate-400 text-sm mt-2">
                  <Loader2 size={14} className="animate-spin" />
                  Loading Ollama models...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Domain Selection */}
        <div className="bg-slate-800/50 rounded-2xl p-6 mb-6 border border-slate-700">
          <label className="text-sm font-medium text-slate-300 mb-3 block">
            Select Domain(s)
          </label>
          <div className="flex flex-wrap gap-3">
            {DOMAINS.map((domain) => (
              <button
                key={domain.id}
                onClick={() => toggleDomain(domain.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                  selectedDomains.includes(domain.id)
                    ? "bg-violet-500/20 border-violet-500 text-violet-300 border-2"
                    : "bg-slate-700/50 border-slate-600 text-slate-300 border hover:border-slate-500"
                }`}
              >
                <span>{domain.icon}</span>
                <span className="font-medium">{domain.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="bg-slate-800/50 rounded-2xl p-6 mb-6 border border-slate-700">
          <label className="text-sm font-medium text-slate-300 mb-3 block">
            Original Prompt
          </label>
          <textarea
            value={originalPrompt}
            onChange={(e) => setOriginalPrompt(e.target.value)}
            placeholder="Paste your prompt here..."
            className="w-full h-40 bg-slate-900/50 border border-slate-600 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
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
              className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-violet-600 hover:to-indigo-600 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Improving...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Improve Prompt
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-400">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Analysis */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-amber-400 font-medium mb-3">
                  <AlertCircle size={18} />
                  Issues Found
                </div>
                <ul className="space-y-2">
                  {result.issues?.map((issue, i) => (
                    <li
                      key={i}
                      className="text-slate-300 text-sm flex items-start gap-2"
                    >
                      <span className="text-amber-500 mt-1">&bull;</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-emerald-400 font-medium mb-3">
                  <Lightbulb size={18} />
                  Improvements Made
                </div>
                <ul className="space-y-2">
                  {result.improvements?.map((imp, i) => (
                    <li
                      key={i}
                      className="text-slate-300 text-sm flex items-start gap-2"
                    >
                      <span className="text-emerald-500 mt-1">&#10003;</span>
                      {imp}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Improved Prompt */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-violet-400 font-medium">
                  <ArrowRight size={18} />
                  Improved Prompt
                </div>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors bg-slate-700/50 px-3 py-1.5 rounded-lg"
                >
                  {copied ? (
                    <>
                      <Check size={16} className="text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-600">
                <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
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
