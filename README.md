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
