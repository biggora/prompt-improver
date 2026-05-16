# Prompt Improver

A Next.js web application that helps users optimize their prompts using AI analysis. Transform your prompts for better results across different domains.

<img width="3676" height="2090" alt="prompt-improver-ui_" src="https://github.com/user-attachments/assets/8be3fff2-45a5-49f5-ac8d-95536f3b420b" />

## 🚀 Features

- **Multi-Provider Support**: Choose from Anthropic Claude, OpenAI, Google Gemini, Zhipu AI, or local Ollama
- **Domain-Specific Optimization**: 5 specialized domains (Programming, Writing, Research, Business, Data Analysis) — combine any
- **Prompt Modes**: `standalone` for new requests, `continuation` for refining previous content
- **Response Language**: Force the AI to return issues / improvements / prompt in your chosen language (en, ru, de, fr, es)
- **Localized UI**: Interface available in English, Russian, German, French, Spanish (`next-intl`)
- **Theme Toggle**: Light, dark, and system themes (`next-themes`)
- **Resilience**: Automatic retry with exponential backoff and an offline request queue
- **AI-Powered Analysis**: Identifies issues and generates comprehensive improvements
- **Prompt History**: Browse and search previous improvements (stored locally in IndexedDB)
- **Easy Copy-to-Clipboard**: Instantly copy your optimized prompts
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack, `output: "standalone"`)
- **Frontend**: React 19 with TypeScript (strict)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI Integration**: Vercel AI SDK (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`, `zhipu-ai-provider`)
- **i18n**: `next-intl` with locale-prefixed routing (5 locales)
- **Theming**: `next-themes` (light / dark / system)
- **Storage**: IndexedDB in the browser (no backend database)
- **Testing**: Vitest + jsdom + `fake-indexeddb`
- **Package Manager**: pnpm

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/prompt-improver.git
cd prompt-improver

# Install dependencies
pnpm install

# Copy environment file (use `copy` on Windows cmd, `cp` on PowerShell/bash)
cp .env.example .env

# Add your API keys to .env file

# Start development server
pnpm run dev
```

### Scripts

| Command              | Purpose                                                  |
| -------------------- | -------------------------------------------------------- |
| `pnpm run dev`       | Dev server with Turbopack (`http://localhost:3000`)      |
| `pnpm run build`     | Production build (standalone output)                     |
| `pnpm run start`     | Serve the production build                               |
| `pnpm run lint`      | ESLint (flat config)                                     |
| `pnpm run lint:fix`  | ESLint with `--fix`                                      |
| `pnpm run typecheck` | `tsc --noEmit`                                           |
| `pnpm run format`    | Prettier across `ts/tsx/js/jsx/mjs/json/md/yml`          |
| `pnpm run test`      | Vitest single run                                        |
| `pnpm run test:watch`| Vitest in watch mode                                     |
| `pnpm run kill:app`  | Windows-only: free port 3000 (`kill-app.cmd`)            |

## 🐳 Docker Support

The application is containerized for easy deployment and local testing.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Running with Docker

1. **Configure Environment**: Ensure your `.env` file contains the necessary API keys.
2. **Build and Start**:
   ```bash
   docker compose up -d --build
   ```
3. **Access the App**: Open `http://localhost:3000` in your browser.

### Docker Commands

- **Stop Containers**: `docker compose down`
- **View Logs**: `docker compose logs -f`
- **Rebuild**: `docker compose up -d --build`

## 🎯 Usage

1. **Choose AI Provider**: Select from Anthropic Claude, OpenAI, Google Gemini, Zhipu AI, or local Ollama
2. **Select Model**: Choose the specific AI model you want to use
3. **Select Domain(s)**: Choose one or more domains that match your use case
4. **Enter Your Prompt**: Paste your original prompt in the textarea
5. **Click "Improve Prompt"**: Let the AI analyze and optimize your prompt
6. **Review Results**: See the issues found and improvements made
7. **Copy & Use**: Copy the improved prompt to your clipboard

## 🔧 Supported Domains

### 💻 Programming

- Code generation and debugging
- Architecture and design patterns
- Code review and optimization

### ✍️ Writing

- Creative writing and copywriting
- Content creation and editing
- Technical documentation

### 🔬 Research

- Academic papers and analysis
- Data investigation and reports
- Literature reviews

### 💼 Business

- Strategy and planning
- Professional communication
- Project management

### 📊 Data Analysis

- Statistical analysis
- Data visualization
- Insights and reporting

## 🔒 API Configuration

Configure API keys via environment variables for security.

Copy the example environment file:

```bash
cp .env.example .env
```

Edit the `.env` file with your API keys:

```bash
# API Keys (server-side only - no prefix needed)
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-...
ZHIPU_API_KEY=...
GEMINI_API_KEY=...

# Ollama configuration (client-side - needs NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_OLLAMA_BASE_URL=http://localhost:11434
```

### AI Providers

> Model lists are defined in `src/lib/constants.ts` (`AI_PROVIDERS`). Update that file to add or change models.

#### 🤖 Anthropic Claude

- **Models**: Claude Opus 4.7, Claude Sonnet 4.6, Claude Haiku 4.5 (default)
- **Requirements**: Anthropic API key
- **Setup**: Get API key from [Anthropic Console](https://console.anthropic.com/)

#### 🧠 OpenAI

- **Models**: GPT-5.5, GPT-5.4, GPT-5.4 Mini (default), GPT-5.4 Nano
- **Requirements**: OpenAI API key
- **Setup**: Get API key from [OpenAI Platform](https://platform.openai.com/)
- **Note**: Reasoning models (`gpt-5*`, `o1*`, `o3*`) are detected automatically and the `temperature` parameter is suppressed for them.

#### ✨ Google Gemini

- **Models**: Gemini 3.0 Pro, Gemini 2.5 Pro, Gemini 2.5 Flash (default)
- **Requirements**: Gemini API key
- **Setup**: Get API key from [Google AI Studio](https://aistudio.google.com/)

#### 🌐 Zhipu AI (Z.AI)

- **Models**: GLM-5.1, GLM-5, GLM-5 Turbo (default), GLM-4.7, GLM-4.7 Flash
- **Requirements**: Zhipu API key
- **Setup**: Get API key from [Zhipu AI Platform](https://open.bigmodel.cn/)

#### 🦙 Ollama (Local)

- **Models**: All local Ollama models
- **Requirements**: Local Ollama installation
- **Setup**:
  1. Install Ollama from [ollama.ai](https://ollama.ai/)
  2. Start Ollama service
  3. Pull models: `ollama pull llama2` or any other model
  4. Configure optional custom URL in `.env`

## 🏗️ Project Structure

```
prompt-improver/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx          # Locale-aware root layout (theme + i18n providers)
│   │   │   └── page.tsx            # Main page (server component)
│   │   └── api/
│   │       ├── improve/route.ts    # Cloud-provider prompt improvement endpoint
│   │       └── validate/route.ts   # API-key validation endpoint
│   ├── components/
│   │   ├── prompt-improver.tsx     # Main client component
│   │   ├── provider-selector.tsx   # Provider/model selector
│   │   ├── history.tsx             # Prompt history panel
│   │   ├── language-switcher.tsx   # UI locale switcher
│   │   ├── theme-provider.tsx      # next-themes wrapper
│   │   ├── theme-toggle.tsx        # Light/dark/system toggle
│   │   ├── error-boundary.tsx      # Global error boundary
│   │   └── ui/                     # Loading skeletons + toast system
│   ├── lib/
│   │   ├── ai-service.ts           # Client-side AI service (cloud + Ollama)
│   │   ├── constants.ts            # Providers, models, system prompt, domains
│   │   ├── database.ts             # IndexedDB storage layer
│   │   ├── provider-config.ts      # server-only env-var resolver
│   │   ├── retry.ts                # withRetry + error classification
│   │   ├── request-queue.ts        # Offline request queue
│   │   ├── types.ts                # TypeScript type definitions
│   │   └── utils.ts                # cn() + parseAIResponse()
│   ├── i18n/                       # next-intl config + request handler
│   ├── messages/                   # en.json, ru.json, de.json, fr.json, es.json
│   ├── proxy.ts                    # Next.js middleware (named `proxy`, picked up by next-intl plugin)
│   └── globals.css                 # Tailwind entry
├── __tests__/                      # Vitest tests (ai-service, api routes, database, utils, prompts)
├── .env.example                    # Environment template
├── Dockerfile / docker-compose.yml # Containerized deployment
├── eslint.config.mjs               # ESLint flat config
├── vitest.config.ts                # Vitest config (jsdom, fake-indexeddb)
├── package.json
└── README.md                       # This file
```

## 🚧 Current Status

### ✅ Completed

- Multi-provider AI integration (Anthropic, OpenAI, Gemini, Zhipu, Ollama)
- Domain-specific prompt optimization (`standalone` / `continuation` modes)
- Configurable response language (5 locales)
- Localized UI via `next-intl` (en, ru, de, fr, es)
- Light / dark / system theme via `next-themes`
- Retry with exponential backoff + offline request queue
- Prompt history with search (IndexedDB)
- Error boundary, toast notifications, loading skeletons
- Copy-to-clipboard, responsive design
- Vitest test suite (services, API routes, storage, utilities)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

## 🐳 Docker Deployment

The project includes a multi-stage Docker configuration optimized for Next.js.

### Core Files

- `Dockerfile`: Multi-stage build process (deps, builder, runner).
- `docker-compose.yml`: Service definition and port mapping.
- `.dockerignore`: Excludes unnecessary files from the build context.

### Build Details

- **Base Image**: `node:22-alpine`
- **PackageManager**: `pnpm`
- **Output Mode**: `standalone` (for minimized image size)
- **User**: Runs as non-root `nextjs` user for security.

## 🔗 Resources

- [Anthropic Claude API Documentation](https://docs.anthropic.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

Built with ❤️ for better prompt engineering
