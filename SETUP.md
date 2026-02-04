# Getting Started

## Quick Start

1. **Copy the environment file:**

   ```bash
   cp .env.example .env
   ```

2. **Add your API keys:**
   Edit the `.env` file and add the API keys for the providers you want to use:

   ```bash
   # API Keys (server-side only - no prefix needed)
   ANTHROPIC_API_KEY=sk-ant-api03-...
   OPENAI_API_KEY=sk-...
   ZHIPU_API_KEY=...
   GEMINI_API_KEY=...

   # Ollama configuration (client-side - needs NEXT_PUBLIC_ prefix)
   NEXT_PUBLIC_OLLAMA_BASE_URL=http://localhost:11434
   ```

3. **Install dependencies:**

   ```bash
   pnpm install
   ```

4. **Start the development server:**

   ```bash
   pnpm run dev
   ```

5. **Open your browser** and navigate to `http://localhost:3000`

## Usage

1. **Choose AI Provider**: Select from Anthropic Claude, OpenAI, Google Gemini, Zhipu AI, or local Ollama
2. **Select Model**: Choose the specific AI model to use
3. **Select Domains**: Pick one or more domains that match your use case
4. **Enter Prompt**: Paste your original prompt in the textarea
5. **Improve**: Click "Improve Prompt" to get AI-powered optimizations
6. **Review**: See the issues found and improvements made
7. **Copy**: Use the copy button to get the improved prompt

## Provider Setup

### For Anthropic Claude:

1. Get API key from [Anthropic Console](https://console.anthropic.com/)
2. Add `ANTHROPIC_API_KEY=your_key` to `.env`
3. Available models: Claude Sonnet 4, Claude 3.5 Sonnet, Claude 3.5 Haiku

### For OpenAI:

1. Get API key from [OpenAI Platform](https://platform.openai.com/)
2. Add `OPENAI_API_KEY=your_key` to `.env`
3. Available models: GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo

### For Google Gemini:

1. Get API key from [Google AI Studio](https://aistudio.google.com/)
2. Add `GEMINI_API_KEY=your_key` to `.env`
3. Available models: Gemini 2.5 Flash, Gemini 2.5 Pro, Gemini 2.0 Flash

### For Zhipu AI (Z.AI):

1. Get API key from [Zhipu AI Platform](https://open.bigmodel.cn/)
2. Add `ZHIPU_API_KEY=your_key` to `.env`
3. Available models: GLM-4 Plus, GLM-4, GLM-4 Flash, GLM-4 Air

### For Ollama (Local):

1. Install Ollama from [ollama.ai](https://ollama.ai/)
2. Start Ollama service: `ollama serve`
3. Pull models: `ollama pull llama2` (or any model you prefer)
4. The app will auto-detect your local Ollama models
5. (Optional) Set custom URL: `NEXT_PUBLIC_OLLAMA_BASE_URL=http://localhost:11434`

## Production Build

```bash
# Build the application
pnpm run build

# Start production server
pnpm run start
```

## Troubleshooting

| Issue                      | Solution                                                                        |
| -------------------------- | ------------------------------------------------------------------------------- |
| "API key is missing"       | Check that you've set the correct environment variable in `.env`                |
| "Cannot connect to Ollama" | Make sure Ollama is running: `ollama serve`                                     |
| "Quota exceeded" (Gemini)  | Check your Gemini API quota at [Google AI Studio](https://aistudio.google.com/) |
| Build errors               | Run `pnpm install` to ensure all dependencies are installed                     |
| Port 3000 in use           | Stop other services or use `pnpm run dev -- --port 3001`                        |

## Environment Variables Reference

| Variable                      | Required      | Description                                         |
| ----------------------------- | ------------- | --------------------------------------------------- |
| `ANTHROPIC_API_KEY`           | For Anthropic | Anthropic Claude API key                            |
| `OPENAI_API_KEY`              | For OpenAI    | OpenAI API key                                      |
| `GEMINI_API_KEY`              | For Gemini    | Google Gemini API key                               |
| `ZHIPU_API_KEY`               | For Zhipu     | Zhipu AI API key                                    |
| `NEXT_PUBLIC_OLLAMA_BASE_URL` | Optional      | Ollama server URL (default: http://localhost:11434) |

## Need Help?

- Check the [README.md](./README.md) for full documentation
- Review [GEMINI.md](./GEMINI.md) for developer/agent-specific guidance
- Ensure your API keys are valid and have sufficient quota
