# Prompt Improver

A Next.js web application that helps users optimize their prompts using AI analysis. Transform your prompts for better results across different domains.

<img width="3676" height="1726" alt="ui" src="https://github.com/user-attachments/assets/9d7d181f-50fe-498c-b6b7-4903a26527e0" />

## 🚀 Features

- **Multi-Provider Support**: Choose from Anthropic Claude, OpenAI, Google Gemini, Zhipu AI, or local Ollama
- **Domain-Specific Optimization**: Choose from 5 specialized domains (Programming, Writing, Research, Business, Data Analysis)
- **AI-Powered Analysis**: Identifies issues and generates comprehensive improvements
- **Interactive Results**: See exactly what was changed and why
- **Prompt History**: Browse and search your previous prompt improvements
- **Easy Copy-to-Clipboard**: Instantly copy your optimized prompts
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Modern UI**: Clean, gradient-based dark theme with smooth interactions

## 🛠️ Tech Stack

- **Framework**: Next.js 16 with Turbopack
- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI Integration**: Vercel AI SDK with multiple providers
- **Database**: IndexedDB (browser-based storage)
- **Package Manager**: pnpm

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/prompt-improver.git
cd prompt-improver

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Add your API keys to .env file

# Start development server
pnpm run dev
```

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

#### 🤖 Anthropic Claude

- **Models**: Claude Sonnet 4, Claude 3.5 Sonnet, Claude 3.5 Haiku
- **Requirements**: Anthropic API key
- **Setup**: Get API key from [Anthropic Console](https://console.anthropic.com/)

#### 🧠 OpenAI

- **Models**: GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo
- **Requirements**: OpenAI API key
- **Setup**: Get API key from [OpenAI Platform](https://platform.openai.com/)

#### ✨ Google Gemini

- **Models**: Gemini 2.5 Flash, Gemini 2.5 Pro, Gemini 2.0 Flash
- **Requirements**: Gemini API key
- **Setup**: Get API key from [Google AI Studio](https://aistudio.google.com/)

#### 🌐 Zhipu AI (Z.AI)

- **Models**: GLM-4 Plus, GLM-4, GLM-4 Flash, GLM-4 Air
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
├── app/
│   ├── api/
│   │   ├── improve/route.ts    # AI improvement endpoint
│   │   └── validate/route.ts   # API key validation
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main page
├── components/
│   ├── prompt-improver.tsx     # Main component
│   ├── prompt-history.tsx      # History component
│   └── provider-selector.tsx   # Provider/model selector
├── lib/
│   ├── ai-service.ts           # AI service & providers
│   ├── database.ts             # IndexedDB storage
│   ├── prompts.ts              # System prompts
│   └── types.ts                # TypeScript types
├── .env.example                # Environment template
├── package.json                # Dependencies
└── README.md                   # This file
```

## 🚧 Current Status & Roadmap

### ✅ Completed

- Multi-provider AI integration (Anthropic, OpenAI, Gemini, Zhipu, Ollama)
- Domain-specific prompt optimization
- Modern UI with Tailwind CSS dark theme
- Prompt history with search functionality
- Copy-to-clipboard functionality
- Responsive design for all devices
- Error handling and loading states

### 📋 Planned

- [ ] Unit and integration tests
- [ ] E2E testing
- [ ] Enhanced rate limiting
- [ ] Advanced input validation
- [ ] Export/import prompt history
- [ ] API key validation UI

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the package.json file for details.

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
