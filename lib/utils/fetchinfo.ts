export async function fetchVideoInfo(videoId: string) {
    try {
      const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const oEmbedResponse = await fetch(oEmbedUrl);
      const oEmbedData = await oEmbedResponse.json();
  
      return {
        title: oEmbedData.title,
        author: oEmbedData.author_name,
        thumbnail: oEmbedData.thumbnail_url,
      };
    } catch (error) {
      console.error('Error fetching video info:', error);
      throw new Error('Failed to fetch video info');
    }
  }
  
  
  async function extractMetadata(html: string): Promise<{ title: string; content: string; publishedTime: string }> {
    const getMetaContent = (name: string): string => {
      const match = html.match(new RegExp(`<meta.*?name=["']${name}["'].*?content=["'](.*?)["']`, 'i'));
      return match ? match[1] : '';
    };
  
    const title = html.match(/<title>(.*?)<\/title>/i)?.[1] || '';
    
    // Improved content extraction
    let content = '';
    const mainContent = html.match(/<main[\s\S]*?>([\s\S]*?)<\/main>/i) ||
                        html.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i) ||
                        html.match(/<div[\s\S]*?class=["'][\s\S]*?content[\s\S]*?["'][\s\S]*?>([\s\S]*?)<\/div>/i);
    
    if (mainContent) {
      content = mainContent[1]
        .replace(/<script[\s\S]*?<\/script>/gi, '') // Remove script tags
        .replace(/<style[\s\S]*?<\/style>/gi, '')   // Remove style tags
        .replace(/<[^>]*>/g, ' ')              // Remove remaining HTML tags
        .replace(/\s+/g, ' ')                  // Replace multiple spaces with single space
        .trim();                               // Trim leading and trailing spaces
    } else {
      // Fallback to extracting content from body if main content is not found
      content = html.replace(/<head[\s\S]*?<\/head>/i, '')
                    .replace(/<script[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[\s\S]*?<\/style>/gi, '')
                    .replace(/<[^>]*>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
    }
  
    const publishedTime = getMetaContent('article:published_time') || 
                          getMetaContent('publishedDate') || 
                          getMetaContent('datePublished') || '';
  
    return { title, content, publishedTime };
  }
  
  export async function fetchLinkInfo(link: string): Promise<{ title: string; content: string; publishedTime: string }> {
    try {
      console.log('Attempting standard scraping method');
      const scrapingResult = await fallbackScraping(link);
      
      if (scrapingResult.title && scrapingResult.content && scrapingResult.content.length > 100) {
        return scrapingResult;
      }
  
      console.log('Standard scraping failed or incomplete, attempting Jina.ai');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
  
      try {
        const jinaResponse = await fetch(`https://r.jina.ai/${link}`, {
          headers: {
            'Accept': 'application/json',
            'X-Timeout': '30'
          },
          signal: controller.signal
        });
  
        clearTimeout(timeoutId);
  
        if (jinaResponse.ok) {
          const data = await jinaResponse.json();
          if (data.code === 200) {
            // Instagram 링크 처리
            if (link.includes('instagram.com')) {
              return {
                title: '',  // Instagram의 경우 title을 비워둠
                content: data.data.title || '',  // data.data.title을 content에 할당
                publishedTime: data.data.publishedTime || '',
              };
            } else {
              // 다른 링크들의 경우 기존 처리 방식 유지
              return {
                title: data.data.title || '',
                content: data.data.content || '',
                publishedTime: data.data.publishedTime || '',
              };
            }
          }
        }
      } catch (jinaError) {
        console.error('Error with Jina.ai:', jinaError);
      }
  
      console.log('Both scraping methods failed, returning best available data');
      return scrapingResult;
  
    } catch (error) {
      console.error('Error fetching link info:', error);
      console.log('Error occurred, falling back to standard scraping method');
      return await fallbackScraping(link);
    }
  }
  
  // The fallbackScraping and extractMetadata functions remain unchanged
  async function fallbackScraping(url: string): Promise<{ title: string; content: string; publishedTime: string }> {
    const response = await fetch(url);
    const html = await response.text();
    return extractMetadata(html);
  }
  