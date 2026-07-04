/**
 * Request Queue for offline support and automatic retry
 */

"use client";

import type { ImprovePromptRequest } from "./types";

export type QueuedRequestStatus = "pending" | "processing" | "failed";

export interface QueuedRequest {
  id: string;
  timestamp: number;
  request: ImprovePromptRequest;
  status: QueuedRequestStatus;
  attempts: number;
  lastError?: string;
}

const STORAGE_KEY = "prompt_improver_request_queue";
const MAX_ATTEMPTS = 5;

/**
 * Request Queue Manager
 * Handles queuing, persistence, and automatic retry of failed requests
 */
export class RequestQueue {
  private queue: QueuedRequest[] = [];
  private isOnline: boolean = true;
  private processing: boolean = false;
  private listeners: Set<(queue: QueuedRequest[]) => void> = new Set();
  private executor:
    | ((request: ImprovePromptRequest) => Promise<unknown>)
    | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.isOnline = navigator.onLine;
      this.loadQueue();
      this.setupEventListeners();
    }
  }

  /**
   * Set up online/offline event listeners
   */
  private setupEventListeners(): void {
    window.addEventListener("online", () => {
      this.isOnline = true;
      console.log("Connection restored. Processing queued requests...");
      this.processQueue();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      console.log("Connection lost. Requests will be queued.");
    });
  }

  /**
   * Load queue from localStorage
   */
  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.queue = Array.isArray(parsed) ? parsed : [];
        // Recover items that were mid-flight when the tab closed/crashed.
        this.queue.forEach((item) => {
          if (item.status === "processing") {
            item.status = "pending";
          }
        });
        this.notifyListeners();
      }
    } catch (error) {
      console.error("Failed to load request queue:", error);
      this.queue = [];
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveQueue(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error("Failed to save request queue:", error);
    }
  }

  /**
   * Notify all listeners of queue changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener([...this.queue]));
  }

  /**
   * Generates a unique id for a queued request.
   */
  private generateId(): string {
    const suffix =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2, 11);
    return `req_${Date.now()}_${suffix}`;
  }

  /**
   * Add a request to the queue
   */
  add(request: ImprovePromptRequest): string {
    // Never persist API keys to localStorage.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { apiKey: _apiKey, ...safeRequest } = request;

    const queuedRequest: QueuedRequest = {
      id: this.generateId(),
      timestamp: Date.now(),
      request: safeRequest,
      status: "pending",
      attempts: 0,
    };

    this.queue.push(queuedRequest);
    this.saveQueue();
    this.notifyListeners();

    // Try to process immediately if online
    if (this.isOnline) {
      this.processQueue();
    }

    return queuedRequest.id;
  }

  /**
   * Register the executor used to actually run queued requests when
   * processQueue() is called without one explicitly (e.g. from online
   * events, add(), retry(), retryAll()).
   */
  setExecutor(
    executor: (request: ImprovePromptRequest) => Promise<unknown>,
  ): void {
    this.executor = executor;
  }

  /**
   * Process the queue
   */
  async processQueue(
    executor?: (request: ImprovePromptRequest) => Promise<unknown>,
  ): Promise<void> {
    if (this.processing || !this.isOnline) {
      return;
    }

    const activeExecutor = executor ?? this.executor;
    if (!activeExecutor) {
      console.warn(
        "processQueue called without an executor; skipping until setExecutor() is called.",
      );
      return;
    }

    this.processing = true;

    const pendingRequests = this.queue.filter((r) => r.status === "pending");

    for (const queuedRequest of pendingRequests) {
      if (!this.isOnline) {
        break;
      }

      if (queuedRequest.attempts >= MAX_ATTEMPTS) {
        queuedRequest.status = "failed";
        queuedRequest.lastError = "Max attempts exceeded";
        this.saveQueue();
        this.notifyListeners();
        continue;
      }

      queuedRequest.status = "processing";
      queuedRequest.attempts++;
      this.saveQueue();
      this.notifyListeners();

      try {
        await activeExecutor(queuedRequest.request);

        // Remove successfully processed request
        this.remove(queuedRequest.id);
        console.log(`Request ${queuedRequest.id} completed successfully`);
      } catch (error) {
        queuedRequest.status = "failed";
        queuedRequest.lastError =
          error instanceof Error ? error.message : String(error);
        this.saveQueue();
        this.notifyListeners();

        console.error(
          `Request ${queuedRequest.id} failed:`,
          queuedRequest.lastError,
        );
      }
    }

    this.processing = false;
  }

  /**
   * Remove a request from the queue
   */
  remove(id: string): boolean {
    const index = this.queue.findIndex((r) => r.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.saveQueue();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Retry a failed request
   */
  retry(id: string): void {
    const request = this.queue.find((r) => r.id === id);
    if (request) {
      request.status = "pending";
      request.attempts = 0;
      request.lastError = undefined;
      this.saveQueue();
      this.notifyListeners();

      if (this.isOnline) {
        this.processQueue();
      }
    }
  }

  /**
   * Retry all failed requests
   */
  retryAll(): void {
    this.queue.forEach((request) => {
      if (request.status === "failed") {
        request.status = "pending";
        request.attempts = 0;
        request.lastError = undefined;
      }
    });
    this.saveQueue();
    this.notifyListeners();

    if (this.isOnline) {
      this.processQueue();
    }
  }

  /**
   * Clear all requests from the queue
   */
  clear(): void {
    this.queue = [];
    this.saveQueue();
    this.notifyListeners();
  }

  /**
   * Get all queued requests
   */
  getAll(): QueuedRequest[] {
    return [...this.queue];
  }

  /**
   * Get pending request count
   */
  getPendingCount(): number {
    return this.queue.filter((r) => r.status === "pending").length;
  }

  /**
   * Get failed request count
   */
  getFailedCount(): number {
    return this.queue.filter((r) => r.status === "failed").length;
  }

  /**
   * Check if currently processing
   */
  isProcessing(): boolean {
    return this.processing;
  }

  /**
   * Check if online
   */
  getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Subscribe to queue changes
   */
  subscribe(listener: (queue: QueuedRequest[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

// Global queue instance
let globalQueue: RequestQueue | null = null;

/**
 * Get the global request queue instance
 */
export function getRequestQueue(): RequestQueue {
  if (!globalQueue) {
    globalQueue = new RequestQueue();
  }
  return globalQueue;
}

/**
 * Hook to use the request queue in React components
 */
export function useRequestQueue() {
  const queue = getRequestQueue();
  const [queueState, setQueueState] = React.useState<QueuedRequest[]>(
    queue.getAll(),
  );
  const [isOnline, setIsOnline] = React.useState(queue.getIsOnline());

  React.useEffect(() => {
    const unsubscribe = queue.subscribe((newQueue) => {
      setQueueState(newQueue);
      setIsOnline(queue.getIsOnline());
    });

    // Also listen to online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [queue]);

  return {
    queue: queueState,
    pendingCount: queue.getPendingCount(),
    failedCount: queue.getFailedCount(),
    isOnline,
    isProcessing: queue.isProcessing(),
    add: (request: ImprovePromptRequest) => queue.add(request),
    retry: (id: string) => queue.retry(id),
    retryAll: () => queue.retryAll(),
    clear: () => queue.clear(),
    remove: (id: string) => queue.remove(id),
  };
}

// Import React for the hook (declare at top to avoid issues)
import React from "react";
