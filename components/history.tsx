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
} from "lucide-react";
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
    if (!confirm("Are you sure you want to delete this prompt?")) return;

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
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateText = (text: string, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 bg-violet-500 hover:bg-violet-600 text-white p-4 rounded-full shadow-lg transition-all z-40"
        title="Show History"
      >
        <History size={20} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex">
      <div className="bg-slate-900 w-full max-w-4xl h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <History size={24} />
              Prompt History
            </h2>
            <button
              onClick={onToggle}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <EyeOff size={24} />
            </button>
          </div>

          {/* Search */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search prompts..."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-violet-500 hover:bg-violet-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-slate-400">Loading history...</div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <History size={48} className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No prompt history yet</p>
              <p className="text-slate-500 text-sm mt-2">
                Start improving prompts to see them here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden"
                >
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 text-sm text-slate-400 mb-2">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(item.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Cpu size={14} />
                            {item.provider}
                          </span>
                          <span className="flex items-center gap-1">
                            <Hash size={14} />
                            {Array.isArray(item.domains)
                              ? item.domains.join(", ")
                              : item.domains}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleCopy(item.improved_prompt, `copy-${item.id}`)
                          }
                          className="text-slate-400 hover:text-white transition-colors"
                          title="Copy improved prompt"
                        >
                          {copiedId === `copy-${item.id}` ? (
                            <Check size={16} className="text-emerald-400" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => item.id && handleDelete(item.id)}
                          className="text-slate-400 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          onClick={() => item.id && toggleExpanded(item.id)}
                          className="text-slate-400 hover:text-white transition-colors"
                          title={
                            item.id && expandedItems.has(item.id)
                              ? "Show less"
                              : "Show more"
                          }
                        >
                          {item.id && expandedItems.has(item.id) ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Content Preview */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">
                          ORIGINAL PROMPT
                        </p>
                        <p className="text-slate-300 text-sm">
                          {item.id && expandedItems.has(item.id)
                            ? item.original_prompt
                            : truncateText(item.original_prompt)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">
                          IMPROVED PROMPT
                        </p>
                        <p className="text-slate-200 text-sm font-medium">
                          {item.id && expandedItems.has(item.id)
                            ? item.improved_prompt
                            : truncateText(item.improved_prompt)}
                        </p>
                      </div>

                      {item.id &&
                        expandedItems.has(item.id) &&
                        (item.issues?.length > 0 ||
                          item.improvements?.length > 0) && (
                          <div className="grid md:grid-cols-2 gap-3 pt-3 border-t border-slate-700">
                            {item.issues?.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-amber-400 mb-2">
                                  Issues Found
                                </p>
                                <ul className="space-y-1">
                                  {item.issues.slice(0, 3).map((issue, i) => (
                                    <li
                                      key={i}
                                      className="text-xs text-slate-400 flex items-start gap-1"
                                    >
                                      <span className="text-amber-500">
                                        &bull;
                                      </span>
                                      {issue}
                                    </li>
                                  ))}
                                  {item.issues.length > 3 && (
                                    <li className="text-xs text-slate-500">
                                      ...and {item.issues.length - 3} more
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}

                            {item.improvements?.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-emerald-400 mb-2">
                                  Improvements
                                </p>
                                <ul className="space-y-1">
                                  {item.improvements
                                    .slice(0, 3)
                                    .map((imp, i) => (
                                      <li
                                        key={i}
                                        className="text-xs text-slate-400 flex items-start gap-1"
                                      >
                                        <span className="text-emerald-500">
                                          &#10003;
                                        </span>
                                        {imp}
                                      </li>
                                    ))}
                                  {item.improvements.length > 3 && (
                                    <li className="text-xs text-slate-500">
                                      ...and {item.improvements.length - 3} more
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
