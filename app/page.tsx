import PromptImprover from "@/components/prompt-improver";
import { getConfiguredProviders } from "@/lib/provider-config";

export default function Home() {
  const configuredProviders = getConfiguredProviders();
  return <PromptImprover configuredProviders={configuredProviders} />;
}
