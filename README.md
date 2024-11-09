# Wake The Dead 🧠

Wake The Dead is an AI-powered knowledge management and learning assistant platform that makes content discovery and learning more efficient and engaging.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 Features

### ⚡ Smart Skimming
- AI-powered content summarization for articles, videos, and web pages
- Global caching system for instant access to previously processed content
- Multi-language support with dedicated caching per language and AI model
- YouTube video summarization with timestamp navigation
- Intelligent chunk processing with overlap for context preservation

### 🔍 Advanced RAG Search Engine
- Real-time web search integration
- Semantic similarity search using vector embeddings
- Community knowledge integration
- Multi-modal search (text, images, videos)
- Auto-generated follow-up questions
- Rate limiting for API stability

### 🌐 Community Knowledge Sharing
- Collaborative learning environment
- Knowledge base building through user interactions
- Semantic caching for shared content
- Cross-referencing between related content

### ⚙️ Customization Options
- Multiple AI model support (including Llama, Grok-beta)
- Language selection
- Customizable UI with dark/light mode
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
git clone https://github.com/yourusername/wakethedead.git
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

### Rate Limiting Configuration

Rate limiting can be disabled by setting `useRateLimiting` to `false` in `app/config.tsx`:

```typescript
// app/config.tsx
export const config = {
  useRateLimiting: false,  // Set to false to disable rate limiting
  // ... other configurations
}

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **AI/ML**: 
  - LLM support: OpenAI, Groq, Grok-beta
  - Embeddings: Ollama, OpenAI
- **Database**: Upstash Vector Database
- **Caching**: Semantic Cache with Upstash
- **APIs**: 
  - Search: Serper API
  - Various AI model APIs
- **Development Tools**: TypeScript, ESLint

## 📚 Core Components

### Content Summarization (`route.ts`)
- Processes URLs and generates AI-powered summaries
- Supports both article and video content
- Implements caching and rate limiting
- Handles multi-language support

### RAG Search Engine (`action.tsx`)
- Combines web search with vector similarity
- Processes and vectorizes content
- Generates relevant follow-up questions
- Handles rate limiting and caching

### User Interface (`page.tsx`)
- Responsive design with dark/light mode
- Interactive guide and documentation
- Image modal and video player components
- PWA installation support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ☕ Support

If you find this project helpful, consider buying us a coffee!

[Buy Me A Coffee](https://buymeacoffee.com/KingBob)

## 🙏 Acknowledgments

- OpenAI for AI capabilities
- Upstash for vector database and caching solutions
- All contributors and supporters of the project

## 📞 Contact

For questions and support, please open an issue in the GitHub repository.