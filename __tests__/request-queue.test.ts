import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RequestQueue } from "@/lib/request-queue";
import type { ImprovePromptRequest } from "@/lib/types";

const STORAGE_KEY = "prompt_improver_request_queue";

const sampleRequest: ImprovePromptRequest = {
  prompt: "Prompt",
  domainNames: "WRITING",
  providerId: "anthropic",
  model: "claude-3-5-sonnet-latest",
};

describe("RequestQueue", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("does not remove a request from the queue when no executor is configured", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const queue = new RequestQueue();

    queue.add(sampleRequest);
    await queue.processQueue();

    expect(queue.getAll()).toHaveLength(1);
    expect(queue.getAll()[0].status).toBe("pending");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("executes and removes a request once an executor is registered", async () => {
    const queue = new RequestQueue();
    const executor = vi.fn().mockResolvedValue(undefined);
    queue.setExecutor(executor);

    queue.add(sampleRequest);
    await queue.processQueue();

    expect(executor).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: "Prompt" }),
    );
    expect(queue.getAll()).toHaveLength(0);
  });

  it("resets 'processing' items to 'pending' when a fresh instance loads the same localStorage", () => {
    const queue = new RequestQueue();
    queue.add(sampleRequest);

    // Simulate a request that was interrupted mid-flight (tab closed).
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    stored[0].status = "processing";
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    const recovered = new RequestQueue();

    expect(recovered.getAll()[0].status).toBe("pending");
  });

  it("marks a request as failed once it exceeds the max attempt count", async () => {
    const executor = vi.fn().mockRejectedValue(new Error("boom"));

    // Seed the queue with a request that has already failed 5 times, then
    // requeue it as pending (preserving attempts) and confirm it is capped
    // without ever calling the executor again.
    const seeded = [
      {
        id: "req_1",
        timestamp: Date.now(),
        request: sampleRequest,
        status: "pending",
        attempts: 5,
      },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));

    const queue = new RequestQueue();
    queue.setExecutor(executor);

    await queue.processQueue();

    const [item] = queue.getAll();
    expect(item.status).toBe("failed");
    expect(item.lastError).toBe("Max attempts exceeded");
    expect(executor).not.toHaveBeenCalled();
  });

  it("never persists the apiKey field to localStorage", () => {
    const queue = new RequestQueue();
    queue.add({ ...sampleRequest, apiKey: "secret-key" });

    const stored = localStorage.getItem(STORAGE_KEY)!;
    expect(stored).not.toContain("secret-key");
    expect(stored).not.toContain("apiKey");
  });
});
