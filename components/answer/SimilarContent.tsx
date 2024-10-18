import React, { useEffect, useState } from 'react';
import { Index } from '@upstash/vector';
import { OpenAIEmbeddings } from '@langchain/openai';
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { config } from '@/app/config';

interface SimilarContentProps {
  title: string;
  embeddings: OllamaEmbeddings | OpenAIEmbeddings;
  index: Index;
}

interface SimilarDocument {
  title: string;
  pageContent: string;
  url: string;
  score: number;
}

async function getUserSharedDocument(userMessage: string, embeddings: OllamaEmbeddings | OpenAIEmbeddings, index: Index) {
    const queryEmbedding = await embeddings.embedQuery(userMessage);
    const queryResults = await index.query({
      vector: queryEmbedding,
      topK: config.numberOfSimilarityResults,
      includeMetadata: true,
      includeVectors: false,
    });
  
    return queryResults
      .filter((result) => 
        result.score >= config.similarityThreshold &&
        result.metadata.title &&
        result.metadata.content &&
        result.metadata.link
      )
      .map((result) => ({
        title: result.metadata.title as string,
        pageContent: result.metadata.content as string,
        url: result.metadata.link as string,
        score: result.score
      }));
  }

  
const SimilarContent: React.FC<SimilarContentProps> = ({ title, embeddings, index }) => {
  const [similarDocuments, setSimilarDocuments] = useState<SimilarDocument[]>([]);

  useEffect(() => {
    const fetchSimilarDocuments = async () => {
      const documents = await getUserSharedDocument(title, embeddings, index);
      setSimilarDocuments(documents.slice(0, 3)); // Get top 3 results
    };

    fetchSimilarDocuments();
  }, [title, embeddings, index]);

  return (
    <div className="mt-4 space-y-4">
      <h3 className="text-lg font-semibold">Similar Content</h3>
      {similarDocuments.map((doc, index) => (
        <div key={index} className="bg-card dark:bg-card-dark p-4 rounded-lg shadow">
          <h4 className="font-medium mb-2">{doc.title}</h4>
          <p className="text-sm text-muted-foreground mb-2">{doc.pageContent.slice(0, 100)}...</p>
          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
            Read more
          </a>
        </div>
      ))}
    </div>
  );
};

export default SimilarContent;