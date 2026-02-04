import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  closeDatabase,
  deletePrompt,
  getPromptById,
  getPromptHistory,
  getStats,
  initializeDatabase,
  savePromptResult,
  searchPrompts,
  type SavePromptData,
} from "@/lib/database";

const DB_NAME = "PromptImproverDB";

const deleteDatabase = () =>
  new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });

const sampleRecord = (
  overrides: Partial<SavePromptData> = {},
): SavePromptData => ({
  originalPrompt: "Original",
  improvedPrompt: "Improved",
  domains: ["WRITING"],
  provider: "anthropic",
  model: "claude-3-5-sonnet-latest",
  issues: ["issue"],
  improvements: ["improvement"],
  ...overrides,
});

describe("database", () => {
  beforeEach(async () => {
    closeDatabase();
    await deleteDatabase();
  });

  afterEach(async () => {
    closeDatabase();
    await deleteDatabase();
  });

  it("initializes the database and store", async () => {
    const db = await initializeDatabase();
    expect(db.objectStoreNames.contains("prompt_history")).toBe(true);
  });

  it("saves and retrieves prompt results", async () => {
    const id = await savePromptResult(sampleRecord());
    const record = await getPromptById(id);

    expect(record?.original_prompt).toBe("Original");
    expect(record?.improved_prompt).toBe("Improved");
    expect(record?.domains).toEqual(["WRITING"]);
    expect(record?.issues).toEqual(["issue"]);
    expect(record?.improvements).toEqual(["improvement"]);
  });

  it("returns prompt history with limit and offset", async () => {
    await savePromptResult(sampleRecord({ originalPrompt: "First" }));
    await new Promise((resolve) => setTimeout(resolve, 5));
    await savePromptResult(sampleRecord({ originalPrompt: "Second" }));
    await new Promise((resolve) => setTimeout(resolve, 5));
    await savePromptResult(sampleRecord({ originalPrompt: "Third" }));

    const history = await getPromptHistory(2, 1);

    expect(history).toHaveLength(2);
    expect(history[0].original_prompt).toBe("Second");
    expect(history[1].original_prompt).toBe("First");
  });

  it("deletes prompts by id", async () => {
    const id = await savePromptResult(sampleRecord());

    await deletePrompt(id);
    const record = await getPromptById(id);

    expect(record).toBeNull();
  });

  it("searches prompts by text", async () => {
    await savePromptResult(sampleRecord({ originalPrompt: "Find me" }));
    await savePromptResult(sampleRecord({ originalPrompt: "Ignore me" }));

    const results = await searchPrompts("find");

    expect(results).toHaveLength(1);
    expect(results[0].original_prompt).toBe("Find me");
  });

  it("computes prompt stats", async () => {
    await savePromptResult(
      sampleRecord({ provider: "anthropic", domains: ["WRITING"] }),
    );
    await savePromptResult(
      sampleRecord({ provider: "openai", domains: ["PROGRAMMING"] }),
    );

    const stats = await getStats();

    expect(stats).toEqual({
      total_prompts: 2,
      unique_providers: 2,
      unique_domain_combinations: 2,
    });
  });
});
