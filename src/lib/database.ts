"use client";

import type { PromptHistoryRecord, PromptStats, PromptMode } from "./types";

const DB_NAME = "PromptImproverDB";
const DB_VERSION = 1;
const STORE_NAME = "prompt_history";

let db: IDBDatabase | null = null;

function isClient(): boolean {
  return typeof window !== "undefined";
}

export function initializeDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isClient()) {
      reject(new Error("IndexedDB is not available on the server"));
      return;
    }

    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("Failed to open database");
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log("Database initialized successfully");
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create object store for prompt history
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });

        // Create indexes for searching and sorting
        store.createIndex("created_at", "created_at", { unique: false });
        store.createIndex("provider", "provider", { unique: false });
        store.createIndex("domains", "domains", { unique: false });
      }
    };
  });
}

async function ensureDatabase(): Promise<IDBDatabase> {
  if (!db) {
    await initializeDatabase();
  }
  return db!;
}

export interface SavePromptData {
  originalPrompt: string;
  improvedPrompt: string;
  domains: string[];
  provider: string;
  model: string;
  mode?: PromptMode;
  issues?: string[];
  improvements?: string[];
}

export async function savePromptResult(data: SavePromptData): Promise<number> {
  if (!isClient()) {
    throw new Error("IndexedDB is not available on the server");
  }

  const database = await ensureDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const record = {
      original_prompt: data.originalPrompt,
      improved_prompt: data.improvedPrompt,
      domains: JSON.stringify(data.domains),
      provider: data.provider,
      model: data.model,
      mode: data.mode || "standalone",
      issues: JSON.stringify(data.issues || []),
      improvements: JSON.stringify(data.improvements || []),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const request = store.add(record);

    request.onsuccess = () => {
      resolve(request.result as number);
    };

    request.onerror = () => {
      console.error("Failed to save prompt result:", request.error);
      reject(request.error);
    };
  });
}

export async function getPromptHistory(
  limit = 50,
  offset = 0,
): Promise<PromptHistoryRecord[]> {
  if (!isClient()) {
    return [];
  }

  const database = await ensureDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("created_at");

    const request = index.openCursor(null, "prev");

    const results: PromptHistoryRecord[] = [];
    let skipped = 0;

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

      if (cursor) {
        if (skipped < offset) {
          skipped++;
          cursor.continue();
        } else if (results.length < limit) {
          const record = cursor.value;
          results.push({
            ...record,
            domains: JSON.parse(record.domains),
            issues: JSON.parse(record.issues),
            improvements: JSON.parse(record.improvements),
          });
          cursor.continue();
        } else {
          resolve(results);
        }
      } else {
        resolve(results);
      }
    };

    request.onerror = () => {
      console.error("Failed to get prompt history:", request.error);
      reject(request.error);
    };
  });
}

export async function getPromptById(
  id: number,
): Promise<PromptHistoryRecord | null> {
  if (!isClient()) {
    return null;
  }

  const database = await ensureDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);

    const request = store.get(id);

    request.onsuccess = () => {
      const record = request.result;
      if (!record) {
        resolve(null);
        return;
      }

      resolve({
        ...record,
        domains: JSON.parse(record.domains),
        issues: JSON.parse(record.issues),
        improvements: JSON.parse(record.improvements),
      });
    };

    request.onerror = () => {
      console.error("Failed to get prompt by ID:", request.error);
      reject(request.error);
    };
  });
}

export async function deletePrompt(id: number): Promise<boolean> {
  if (!isClient()) {
    return false;
  }

  const database = await ensureDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const request = store.delete(id);

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = () => {
      console.error("Failed to delete prompt:", request.error);
      reject(request.error);
    };
  });
}

export async function searchPrompts(
  query: string,
  limit = 50,
): Promise<PromptHistoryRecord[]> {
  if (!isClient()) {
    return [];
  }

  const database = await ensureDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("created_at");

    const request = index.openCursor(null, "prev");

    const results: PromptHistoryRecord[] = [];
    const lowerQuery = query.toLowerCase();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

      if (cursor && results.length < limit) {
        const record = cursor.value;

        const originalMatch = record.original_prompt
          .toLowerCase()
          .includes(lowerQuery);
        const improvedMatch = record.improved_prompt
          .toLowerCase()
          .includes(lowerQuery);

        if (originalMatch || improvedMatch) {
          results.push({
            ...record,
            domains: JSON.parse(record.domains),
            issues: JSON.parse(record.issues),
            improvements: JSON.parse(record.improvements),
          });
        }

        cursor.continue();
      } else {
        resolve(results);
      }
    };

    request.onerror = () => {
      console.error("Failed to search prompts:", request.error);
      reject(request.error);
    };
  });
}

export async function getStats(): Promise<PromptStats> {
  if (!isClient()) {
    return {
      total_prompts: 0,
      unique_providers: 0,
      unique_domain_combinations: 0,
    };
  }

  const database = await ensureDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);

    const request = store.getAll();

    request.onsuccess = () => {
      const records = request.result;

      const providers = new Set<string>();
      const domainCombinations = new Set<string>();

      records.forEach((record) => {
        providers.add(record.provider);
        domainCombinations.add(record.domains);
      });

      resolve({
        total_prompts: records.length,
        unique_providers: providers.size,
        unique_domain_combinations: domainCombinations.size,
      });
    };

    request.onerror = () => {
      console.error("Failed to get stats:", request.error);
      reject(request.error);
    };
  });
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
