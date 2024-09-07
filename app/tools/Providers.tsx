import { config } from '../config';

interface SearchResult {
    title: string;
    url: string;
    pageContent: string;
  }

  interface VideoResult {
    title: string;
    link: string;
    imageUrl: string;
    duration?: string;
}

interface ImageResult {
  title: string;
  link: string;
}


export async function duckDuckGoSearch(message: string, numberOfPagesToScan): Promise<SearchResult[]> {
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
            url: result.url
        }));
        return final.slice(0, numberOfPagesToScan);
    } catch (error) {
        console.error('Error fetching DuckDuckGo search results:', error);
        throw error;
    }
}

export async function serperSearch(message: string, numberOfPagesToScan): Promise<SearchResult[]> {
    const url = 'https://google.serper.dev/search';
    const data = JSON.stringify({
        "q": message
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
            url: result.link
        }));
        return final.slice(0, numberOfPagesToScan);
    } catch (error) {
        console.error('Error fetching search results:', error);
        throw error;
    }
}


export async function performWebSearch(query: string, numberOfPagesToScan: number): Promise<SearchResult[]> {
    try {
      // First, try DuckDuckGo search
      const duckDuckGoResults = await duckDuckGoSearch(query, numberOfPagesToScan);
      return duckDuckGoResults
    } catch (error) {
      console.error('DuckDuckGo search error:', error);
      
      // Fallback to serperSearch
      console.log('Falling back to serperSearch');
      try {
        const serperResults = await serperSearch(query, numberOfPagesToScan);
        return serperResults
      } catch (serperError) {
        console.error('Serper search error:', serperError);
        throw new Error('Both search methods failed');
      }
    }
  }

  export async function duckDuckGoVideo(message: string, numberOfVideosToScan): Promise<VideoResult[]> {
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
            duration: result.duration || 'Unknown' // 새로 추가된 필드
        }));
        return videos.slice(0, numberOfVideosToScan);
    } catch (error) {
        console.error('Error fetching DuckDuckGo video search results:', error);
        throw error;
    }
}

export async function getVideos(message: string, numberOfVideosToScan): Promise<VideoResult[]> {
    const url = 'https://google.serper.dev/videos';
    const data = JSON.stringify({
        "q": message
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
                const duration = video.duration || 'Unknown'; // 새로 추가된 필드
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
        return filteredLinks.slice(0, numberOfVideosToScan);
    } catch (error) {
        console.error('Error fetching videos:', error);
        throw error;
    }
}

export async function performVideoSearch(query: string, numberOfVideosToScan: number): Promise<VideoResult[]> {
    try {
        // First, try DuckDuckGo video search
        const duckDuckGoResults = await duckDuckGoVideo(query, numberOfVideosToScan);
        return duckDuckGoResults.slice(0, 9);
    } catch (error) {
        console.error('DuckDuckGo video search error:', error);
        
        console.log('Falling back to serper video search');
        try {
            const serperResults = await getVideos(query, numberOfVideosToScan);
            return serperResults || [];
        } catch (serperError) {
            console.error('Serper video search error:', serperError);
            throw new Error('Both video search methods failed');
        }
    }
}


export async function duckDuckGoImage(message: string, numberOfImagesToScan): Promise<ImageResult[]> {
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
      return final.slice(0, numberOfImagesToScan);
  } catch (error) {
      console.error('Error fetching DuckDuckGo image search results:', error);
      throw error;
  }
}

export async function performImageSearch(query: string, numberOfImagesToScan:number): Promise<ImageResult[]> {
  try {
      // First, try DuckDuckGo image search
      const duckDuckGoResults = await duckDuckGoImage(query,numberOfImagesToScan);
      return duckDuckGoResults
  } catch (error) {
      console.error('DuckDuckGo image search error:', error);
      
      // Fallback to serperSearch (getImages)
      console.log('Falling back to serper image search');
      try {
          const serperResults = await getImages(query, numberOfImagesToScan);
          return serperResults;
      } catch (serperError) {
          console.error('Serper image search error:', serperError);
          throw new Error('Both image search methods failed');
      }
  }
}

// 기존의 getImages 함수를 수정합니다.
export async function getImages(message: string, numberOfImagesToScan): Promise<ImageResult[]> {
  const url = 'https://google.serper.dev/images';
  const data = JSON.stringify({
    "q": message
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
    return filteredLinks.slice(0, numberOfImagesToScan);
  } catch (error) {
    console.error('Error fetching images:', error);
    throw error;
  }
}