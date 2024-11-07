interface SearchResult {
    title: string;
    url: string;
    pageContent: string;
    date?: string;
}

interface VideoResult {
    title: string;
    link: string;
    imageUrl: string;
    duration?: string;
    date?: string;
}

interface ImageResult {
    title: string;
    link: string;
    date?: string;
}

interface NewsResult {
    title: string;
    link: string;
    snippet: string;
    date: string;
    source: string;
}

interface DuckDuckGoNewsResult {
    date: number;
    excerpt: string;
    image?: string;
    relativeTime: string;
    syndicate: string;
    title: string;
    url: string;
    isOld: boolean;
}

// Performs a web search using DuckDuckGo API  
export async function duckDuckGoSearch(message: string, startIndexOfPagesToScan, numberOfPagesToScan): Promise<SearchResult[]> {
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/search?query=${encodeURIComponent(message)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Network response was not ok. Status: ${response.status}`);
        }
        const responseData = await response.json();
        if (!responseData.results) {
            throw new Error('Invalid API response format');
        }
        const final = responseData.results.map((result: any): SearchResult => ({
            title: result.title,
            pageContent: result.description,
            url: result.url,
            date: result.date || undefined 
        }));
        return final
    } catch (error) {
        console.error('Error fetching DuckDuckGo search results:', error);
        throw error;
    }
}


// Performs a news search using DuckDuckGo API
export async function duckDuckGoNewsSearch(message: string): Promise<NewsResult[]> {
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/news-search?query=${encodeURIComponent(message)}`;
    
    try {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Network response was not ok. Status: ${response.status}`);
    }
    const responseData = await response.json();
    if (!responseData.results) {
        throw new Error('Invalid API response format');
    }
    const newsResults = responseData.results.map((result: DuckDuckGoNewsResult): NewsResult => ({
        title: result.title,
        link: result.url,
        snippet: result.excerpt,
        date: new Date(result.date * 1000).toISOString(),
        source: result.syndicate
    }));
    return newsResults;
    } catch (error) {
    console.error('Error fetching DuckDuckGo news search results:', error);
    throw error;
    }
}


// Performs a video search using DuckDuckGo API
export async function duckDuckGoVideo(message: string): Promise<VideoResult[]> {
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/video-search?query=${encodeURIComponent(message)}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Network response was not ok. Status: ${response.status}`);
        }
        const responseData = await response.json();
        if (!responseData.results) {
            throw new Error('Invalid API response format');
        }
        const videos = responseData.results.map((result: any): VideoResult => ({
            title: result.title,
            link: result.url,
            imageUrl: result.image,
            duration: result.duration || 'Unknown' 
        }));
        return videos
    } catch (error) {
        console.error('Error fetching DuckDuckGo video search results:', error);
        throw error;
    }
}

// Performs an image search using DuckDuckGo API
export async function duckDuckGoImage(message: string): Promise<ImageResult[]> {
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/image-search?query=${encodeURIComponent(message)}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Network response was not ok. Status: ${response.status}`);
        }
        const responseData = await response.json();
        if (!responseData.results) {
            throw new Error('Invalid API response format');
        }
        const final =  responseData.results.map((result: any): ImageResult => ({
            title: result.title,
            link: result.image
        }));
        return final
    } catch (error) {
        console.error('Error fetching DuckDuckGo image search results:', error);
        throw error;
    }
  }

// Performs a web search using Serper API
export async function serperSearch(message: string, startIndexOfPagesToScan, numberOfPagesToScan): Promise<SearchResult[]> {
    const url = 'https://google.serper.dev/search';
    const data = JSON.stringify({
        "q": message,
        "tbs": "qdr:y", // Time-based search: Past year
    });
    const requestOptions: RequestInit = {
        method: 'POST',
        headers: {
            'X-API-KEY': process.env.SERPER_API as string,
            'Content-Type': 'application/json'
        },
        body: data
    };
    try {
        const response = await fetch(url, requestOptions);
        if (!response.ok) {
            throw new Error(`Network response was not ok. Status: ${response.status}`);
        }
        const responseData = await response.json();
        if (!responseData.organic) {
            throw new Error('Invalid API response format');
        }
        const final = responseData.organic.map((result: any): SearchResult => ({
            title: result.title,
            pageContent: result.snippet,
            url: result.link,
            date: result.date || undefined // 날짜 정보가 없으면 undefined
        }));
        return final;
    } catch (error) {
        console.error('Error fetching search results:', error);
        throw error;
    }
}

// Performs a news search using Serper API
export async function serperNewsSearch(message: string): Promise<NewsResult[]> {
    const url = 'https://google.serper.dev/news';
    const data = JSON.stringify({
        "q": message,
        "tbs": "qdr:y", // Time-based search: Past year
    });
    const requestOptions: RequestInit = {
        method: 'POST',
        headers: {
            'X-API-KEY': process.env.SERPER_API as string,
            'Content-Type': 'application/json'
        },
        body: data
    };
    try {
        const response = await fetch(url, requestOptions);
        if (!response.ok) {
            throw new Error(`Network response was not ok. Status: ${response.status}`);
        }
        const responseData = await response.json();
        if (!responseData.news) {
            throw new Error('Invalid API response format');
        }
        const newsResults = responseData.news.map((result: any): NewsResult => ({
            title: result.title,
            link: result.link,
            snippet: result.snippet,
            date: result.date,
            source: result.source
        }));
        return newsResults;
    } catch (error) {
        console.error('Error fetching news results:', error);
        throw error;
    }
}

// Performs a web search using multiple providers with fallback
export async function performWebSearch(query: string, startIndexOfPagesToScan: number, numberOfPagesToScan: number, isNewsQuery: boolean = false): Promise<SearchResult[] | NewsResult[]> {
    if (isNewsQuery) {
        try {
            // Primary: DuckDuckGo news search
            const duckDuckGoNewsResults = await duckDuckGoNewsSearch(query);
            console.log('DuckDuckGo news results:', duckDuckGoNewsResults);
        return duckDuckGoNewsResults;
        } catch (error) {        
            // Fallback to serperNewsSearch
            console.log('Falling back to serperNewsSearch');
        try {
            const serperNewsResults = await serperNewsSearch(query);
            console.log('Serper news results:', serperNewsResults);
            return serperNewsResults;
        } catch (serperError) {
            console.error('Serper news search error:', serperError);
            throw new Error('Both news search methods failed');
        }
        }
    } else {
        try {
            // Primary: DuckDuckGo search
            const duckDuckGoResults = await duckDuckGoSearch(query, startIndexOfPagesToScan, numberOfPagesToScan);
            console.log('DuckDuckGo results:', duckDuckGoResults);
            return duckDuckGoResults;
        } catch (error) {
            console.error('DuckDuckGo search error:', error);
            
            // Fallback to serperSearch
            console.log('Falling back to serperSearch');
            try {
                const serperResults = await serperSearch(query, startIndexOfPagesToScan, numberOfPagesToScan);
                console.log('Serper results:', serperResults);
                return serperResults;
            } catch (serperError) {
                console.error('Serper search error:', serperError);
                throw new Error('Both search methods failed');
            }
        }
    }
}


// Performs a video search using Serper API
export async function getVideos(message: string): Promise<VideoResult[]> {
    const url = 'https://google.serper.dev/videos';
    const data = JSON.stringify({
        "q": message,
        "gl": "us", // Country code
        "hl": "en", // Language code
        "autocorrect": false,
        "safe": "off"
    });
    const requestOptions: RequestInit = {
        method: 'POST',
        headers: {
            'X-API-KEY': process.env.SERPER_API as string,
            'Content-Type': 'application/json'
        },
        body: data
    };
    try {
        const response = await fetch(url, requestOptions);
        if (!response.ok) {
            throw new Error(`Network response was not ok. Status: ${response.status}`);
        }
        const responseData = await response.json();
        const validLinks = await Promise.all(
            responseData.videos.map(async (video: any) => {
                const imageUrl = video.imageUrl;
                const title = video.title;
                const duration = video.duration || 'Unknown'; 
                if (typeof imageUrl === 'string') {
                    try {
                        const imageResponse = await fetch(imageUrl, { method: 'HEAD' });
                        if (imageResponse.ok) {
                            const contentType = imageResponse.headers.get('content-type');
                            if (contentType && contentType.startsWith('image/')) {
                                return { imageUrl, link: video.link, title, duration };
                            }
                        }
                    } catch (error) {
                        console.error(`Error fetching image link ${imageUrl}:`, error);
                    }
                }
                return null;
            })
        );
        const filteredLinks = validLinks.filter((link): link is VideoResult => link !== null);
        return filteredLinks
    } catch (error) {
        console.error('Error fetching videos:', error);
        throw error;
    }
}

// Performs a video search using multiple providers with fallback
export async function performVideoSearch(query: string): Promise<VideoResult[]> {
    try {
            // First, try DuckDuckGo video search
            const duckDuckGoResults = await duckDuckGoVideo(query);
        return duckDuckGoResults
    } catch (error) {
        // Fallback to serperSearch (getVideos)
        console.log('Falling back to serper video search');
        try {
            const serperResults = await getVideos(query);
            return serperResults || [];
        } catch (serperError) {
            console.error('Serper video search error:', serperError);
            throw new Error('Both video search methods failed');
        }
    }
}

// Performs an image search using Serper API
export async function getImages(message: string): Promise<ImageResult[]> {
    const url = 'https://google.serper.dev/images';
    const data = JSON.stringify({
      "q": message,
      "gl": "us",
      "hl": "en",
      "autocorrect": false,
      "safe": "off"
    });
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API as string,
        'Content-Type': 'application/json'
      },
      body: data
    };
    try {
      const response = await fetch(url, requestOptions);
      if (!response.ok) {
        throw new Error(`Network response was not ok. Status: ${response.status}`);
      }
      const responseData = await response.json();
      const validLinks = await Promise.all(
        responseData.images.map(async (image: any) => {
          const link = image.imageUrl;
          if (typeof link === 'string') {
            try {
              const imageResponse = await fetch(link, { method: 'HEAD' });
              if (imageResponse.ok) {
                const contentType = imageResponse.headers.get('content-type');
                if (contentType && contentType.startsWith('image/')) {
                  return {
                    title: image.title,
                    link: link,
                  };
                }
              }
            } catch (error) {
              console.error(`Error fetching image link ${link}:`, error);
            }
          }
          return null;
        })
      );
      const filteredLinks = validLinks.filter((link): link is ImageResult => link !== null);
      return filteredLinks
    } catch (error) {
      console.error('Error fetching images:', error);
      throw error;
    }
  }

// Performs an image search using multiple providers with fallback
export async function performImageSearch(query: string): Promise<ImageResult[]> {
    try {
            // First, try DuckDuckGo image search
            const duckDuckGoResults = await duckDuckGoImage(query);
        return duckDuckGoResults
    } catch (error) {        
        // Fallback to serperSearch (getImages)
        console.log('Falling back to serper image search');
        try {
            const serperResults = await getImages(query);
        return serperResults;
        } catch (serperError) {
            console.error('Serper image search error:', serperError);
            throw new Error('Both image search methods failed');
        }
    }
  }
  