import * as keytar from "keytar";

const SERVICE_NAME = "prompt-improver";

export const PROVIDER_ENV_MAP: Record<string, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  zhipu: "ZHIPU_API_KEY",
  gemini: "GEMINI_API_KEY",
};

const SUPPORTED_PROVIDERS = Object.keys(PROVIDER_ENV_MAP);

export async function setKey(provider: string, value: string): Promise<void> {
  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    throw new Error(`Unknown provider: ${provider}`);
  }
  if (!value || value.trim().length === 0) {
    await keytar.deletePassword(SERVICE_NAME, provider);
    return;
  }
  await keytar.setPassword(SERVICE_NAME, provider, value.trim());
}

export async function getKey(provider: string): Promise<string | null> {
  if (!SUPPORTED_PROVIDERS.includes(provider)) return null;
  return keytar.getPassword(SERVICE_NAME, provider);
}

export async function deleteKey(provider: string): Promise<boolean> {
  if (!SUPPORTED_PROVIDERS.includes(provider)) return false;
  return keytar.deletePassword(SERVICE_NAME, provider);
}

export async function getAllKeysAsEnv(): Promise<Record<string, string>> {
  const env: Record<string, string> = {};
  for (const provider of SUPPORTED_PROVIDERS) {
    const value = await keytar.getPassword(SERVICE_NAME, provider);
    if (value) {
      env[PROVIDER_ENV_MAP[provider]] = value;
    }
  }
  return env;
}

export async function listConfiguredProviders(): Promise<Record<string, boolean>> {
  const status: Record<string, boolean> = {};
  for (const provider of SUPPORTED_PROVIDERS) {
    const value = await keytar.getPassword(SERVICE_NAME, provider);
    status[provider] = !!value;
  }
  return status;
}
