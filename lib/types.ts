export interface AIModel {
  id: string;
  name: string;
}

export interface AIProvider {
  id: string;
  name: string;
  models: AIModel[];
  defaultModel: string;
}

export interface ImprovePromptRequest {
  prompt: string;
  domainNames: string | string[];
  providerId: string;
  model: string;
}

export interface ImprovePromptResponse {
  issues: string[];
  improvements: string[];
  improvedPrompt: string;
}

export interface ValidateProviderRequest {
  providerId: string;
}

export interface ValidateProviderResponse {
  valid: boolean;
  error?: string;
}

export interface PromptHistoryRecord {
  id?: number;
  original_prompt: string;
  improved_prompt: string;
  domains: string[];
  provider: string;
  model: string;
  issues: string[];
  improvements: string[];
  created_at: string;
  updated_at: string;
}

export interface PromptStats {
  total_prompts: number;
  unique_providers: number;
  unique_domain_combinations: number;
}

export type ConfiguredProviders = Record<string, boolean | string>;
