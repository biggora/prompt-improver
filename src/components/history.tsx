"use client";

import { useState, useEffect } from "react";
import {
  History,
  Search,
  Trash2,
  Copy,
  Check,
  Calendar,
  Cpu,
  Hash,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import type { PromptHistoryRecord } from "@/lib/types";

interface PromptHistoryProps {
  onSelectHistory?: (record: PromptHistoryRecord) => void;
  isVisible: boolean;
  onToggle: () => void;
}

export default function PromptHistory({
  isVisible,
  onToggle,
}: PromptHistoryProps) {
  const t = useTranslations("history");
  const locale = useLocale();
  const [history, setHistory] = useState<PromptHistoryRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isVisible) {
      loadHistory();
    }
  }, [isVisible]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const { getPromptHistory } = await import("@/lib/database");
      const data = await getPromptHistory(100);
      setHistory(data);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadHistory();
      return;
    }

    try {
      setLoading(true);
      const { searchPrompts } = await import("@/lib/database");
      const data = await searchPrompts(searchQuery, 100);
      setHistory(data);
    } catch (error) {
      console.error("Failed to search history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("deleteConfirm"))) return;

    try {
      const { deletePrompt } = await import("@/lib/database");
      await deletePrompt(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const toggleExpanded = (id: number) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString(locale, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const truncateText = (text: string, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 bg-violet-500 hover:bg-violet-600 text-white p-4 rounded-full shadow-lg transition-all z-40 transform hover:scale-110 active:scale-95"
        title={t("title")}
      >
        <History size={20} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex animate-in fade-in duration-300">
      <div className="bg-slate-900 w-full max-w-4xl h-full overflow-hidden flex flex-col shadow-2xl border-l border-slate-700 animate-in slide-in-from-right duration-500">
        {/* Header */}
        <div className="bg-slate-800/80 border-b border-slate-700 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
              <History size={28} className="text-violet-400" />
              {t("title")}
            </h2>
            <button
              onClick={onToggle}
              className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600 transition-all active:scale-95"
            >
              <EyeOff size={24} />
            </button>
          </div>

          {/* Search */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder={t("search")}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-xl pl-11 pr-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-violet-500 hover:bg-violet-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-violet-500/20"
            >
              {t("searchBtn")}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Loader2 className="animate-spin text-violet-500" size={32} />
              <div className="text-slate-400 font-medium">{t("loading")}</div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-20 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-700">
                <History size={40} className="text-slate-600" />
              </div>
              <p className="text-slate-300 text-xl font-bold">{t("empty")}</p>
              <p className="text-slate-500 mt-2 max-w-xs mx-auto">
                {t("emptyDesc")}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-800/40 rounded-2xl border border-slate-700/50 overflow-hidden hover:border-slate-600 transition-all hover:bg-slate-800/60 shadow-sm"
                >
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
                          <span className="flex items-center gap-1.5 bg-slate-700/50 px-2 py-1 rounded-md">
                            <Calendar size={14} className="text-violet-400" />
                            {formatDate(item.created_at)}
                          </span>
                          <span className="flex items-center gap-1.5 bg-slate-700/50 px-2 py-1 rounded-md">
                            <Cpu size={14} className="text-indigo-400" />
                            {item.provider}
                          </span>
                          <span className="flex items-center gap-1.5 bg-slate-700/50 px-2 py-1 rounded-md max-w-[200px] truncate">
                            <Hash size={14} className="text-emerald-400" />
                            {Array.isArray(item.domains)
                              ? item.domains.join(", ")
                              : item.domains}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            handleCopy(item.improved_prompt, `copy-${item.id}`)
                          }
                          className="bg-slate-700/50 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-600 transition-all active:scale-90"
                          title="Copy improved prompt"
                        >
                          {copiedId === `copy-${item.id}` ? (
                            <Check size={18} className="text-emerald-400" />
                          ) : (
                            <Copy size={18} />
                          )}
                        </button>
                        <button
                          onClick={() => item.id && handleDelete(item.id)}
                          className="bg-slate-700/50 p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-90"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button
                          onClick={() => item.id && toggleExpanded(item.id)}
                          className="bg-slate-700/50 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-600 transition-all active:scale-90"
                          title={
                            item.id && expandedItems.has(item.id)
                              ? t("showLess")
                              : t("showMore")
                          }
                        >
                          {item.id && expandedItems.has(item.id) ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Content Preview */}
                    <div className="space-y-4">
                      <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-700/30 shadow-inner">
                        <p className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">
                          {t("originalLabel")}
                        </p>
                        <p className="text-slate-300 text-sm leading-relaxed">
                          {item.id && expandedItems.has(item.id)
                            ? item.original_prompt
                            : truncateText(item.original_prompt)}
                        </p>
                      </div>

                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 shadow-inner">
                        <p className="text-[10px] font-bold text-violet-400 mb-1.5 uppercase tracking-widest">
                          {t("improvedLabel")}
                        </p>
                        <p className="text-slate-200 text-sm font-medium leading-relaxed">
                          {item.id && expandedItems.has(item.id)
                            ? item.improved_prompt
                            : truncateText(item.improved_prompt)}
                        </p>
                      </div>

                      {item.id &&
                        expandedItems.has(item.id) &&
                        (item.issues?.length > 0 ||
                          item.improvements?.length > 0) && (
                          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-slate-700/50">
                            {item.issues?.length > 0 && (
                              <div className="bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                                <p className="text-[10px] font-bold text-amber-500 mb-2 uppercase tracking-widest">
                                  Issues Found
                                </p>
                                <ul className="space-y-1.5">
                                  {item.issues.slice(0, 5).map((issue, i) => (
                                    <li
                                      key={i}
                                      className="text-[11px] text-slate-400 flex items-start gap-1.5 leading-snug"
                                    >
                                      <span className="text-amber-600 font-bold">
                                        &bull;
                                      </span>
                                      {issue}
                                    </li>
                                  ))}
                                  {item.issues.length > 5 && (
                                    <li className="text-[11px] text-slate-500 italic ml-3">
                                      ...and {item.issues.length - 5} more
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}

                            {item.improvements?.length > 0 && (
                              <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                                <p className="text-[10px] font-bold text-emerald-500 mb-2 uppercase tracking-widest">
                                  Improvements
                                </p>
                                <ul className="space-y-1.5">
                                  {item.improvements
                                    .slice(0, 5)
                                    .map((imp, i) => (
                                      <li
                                        key={i}
                                        className="text-[11px] text-slate-400 flex items-start gap-1.5 leading-snug"
                                      >
                                        <span className="text-emerald-600 font-bold">
                                          &#10003;
                                        </span>
                                        {imp}
                                      </li>
                                    ))}
                                  {item.improvements.length > 5 && (
                                    <li className="text-[11px] text-slate-500 italic ml-3">
                                      ...and {item.improvements.length - 5} more
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
