# 🧟‍♂️ Wake The Dead

[![Website](https://img.shields.io/badge/Visit-WakeTheDead.ai-blue)](https://www.wakethedead.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Try it now: [WakeTheDead.ai](https://www.wakethedead.ai)

## Perplexity AI 🤝 Link Reader

> AI tool that makes reading, watching, and searching easier

Paste any link and:
- ⚡ Get smart summaries from articles and videos. Skim through them in seconds.
- 🔍 Find what you actually need
- 🤝 See what others found useful
- 🌍 Works in your language

## 🖼️ Preview

![Website Preview](https://github.com/DatoBHJ/wakethedead/blob/main/assets/preview.png?raw=true)

[Try Wake The Dead Now →](https://www.wakethedead.ai)

## 🌟 Features

### ⚡ Smart Skimming
- AI-powered content summarization for articles, videos, and web pages
- Global caching system for instant access to previously processed content
- Multi-language support with dedicated caching per language and AI model
- YouTube video summarization with timestamp navigation

### 🔍 Advanced RAG Search Engine
- Real-time web search integration
- Semantic similarity search using vector embeddings
- Community knowledge integration
- Auto-generated follow-up questions
- Rate limiting for API stability

### 🌐 Community Knowledge Sharing
- Knowledge base building through user interactions
- Semantic caching for shared content
- Cross-referencing between related content

### ⚙️ Customization Options
- Multiple AI model support (including llama, gemma2, mixtral & Grok-beta)
- Language selection
- Progressive Web App (PWA) support

## 🚀 Getting Started

### Prerequisites
- Node.js (Latest LTS version)
- Next.js 13+
- An Ollama instance running locally (optional, for local embeddings)
- Various API keys (see Configuration section)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/datobhj/wakethedead.git
cd wakethedead
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with the following variables:
```env
# Required API Keys
GROQ_API_KEY=your_groq_api_key                    # Required: Main LLM API key
OPENAI_API_KEY=your_openai_api_key                # Required: For chunk embeddings
UPSTASH_REDIS_REST_URL_1=your_upstash_url        # Required: For article caching
UPSTASH_REDIS_REST_TOKEN_1=your_upstash_token    # Required: For article caching
UPSTASH_REDIS_REST_URL_2=your_upstash_url_2      # Required: For chunk embeddings
UPSTASH_REDIS_REST_TOKEN_2=your_upstash_token_2  # Required: For chunk embeddings

# Optional API Keys
NEXT_PUBLIC_BASE_URL=http://localhost:3000        # Optional: Default is localhost:3000
OLLAMA_BASE_URL=http://localhost:11434/v1         # Optional: For local embeddings
SERPER_API=your_serper_api_key                    # Optional: Alternative search API
SEARCH_API_KEY=your_search_api_key                # Optional: Alternative search API
XAI_API_KEY=your_xai_api_key                      # Optional: For xAI model access
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **AI/LLM**: 
  - LLM support: OpenAI, Groq, Grok-beta
  - Embeddings: OpenAI
- **Database**: Upstash Vector Database
- **Caching**: Semantic Cache with Upstash
- **APIs**: 
  - Search: Serper API
  - Various AI model APIs
- **Development Tools**: TypeScript, ESLint

## 📚 Core Components

### Content Summarization (`app/summarizeVideo/route.ts`)
- Processes URLs and generates AI-powered summaries
- Supports both article and video content
- Implements caching and rate limiting
- Handles rate limiting and caching

### RAG Search Engine (`app/action.tsx`)
- Combines web search with vector similarity
- Processes and vectorizes content
- Generates relevant follow-up questions
- Handles rate limiting and caching

## ☕ Support

If you think this is cool, you can:
- ⭐ Star this repo
- 🌐 Visit [WakeTheDead.ai](https://www.wakethedead.ai)
- ☕ [Buy me a coffee](https://buymeacoffee.com/KingBob) (I run on caffeine)

## 🙏 Acknowledgments

- OpenAI for AI capabilities
- Upstash for vector database and caching solutions
- All contributors and supporters of the project

## 📞 Contact

- 🐦 DM me on X: [@DatoBHJ](https://x.com/DatoBHJ)
- 📧 Email me: datobhj@gmail.com
- 🌐 Visit: [WakeTheDead.ai](https://www.wakethedead.ai)

---

Built with 🧠 and ❤️ by someone who drinks too much coffee