import PromptImprover from "@/components/prompt-improver";
import { getConfiguredProviders } from "@/lib/provider-config";

export const dynamic = "force-dynamic";

export default async function Home() {
  const configuredProviders = getConfiguredProviders();
  return <PromptImprover configuredProviders={configuredProviders} />;
}
