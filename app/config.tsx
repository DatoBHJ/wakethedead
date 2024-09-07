export const config = {
    useOllamaInference: false,
    useOllamaEmbeddings: false,
    inferenceAPIKey: process.env.GROQ_API_KEY, 
    embeddingsModel: 'text-embedding-3-small',
    textChunkSize: 800, 
    textChunkOverlap: 200, 
    numberOfSimilarityResults: 4, 
    nonOllamaBaseURL: 'https://api.groq.com/openai/v1', 
    useSemanticCache: true, 
    numberOfPagesToScan: 5,
    timeout: 700,
    similarityThreshold: 0.8,
    numberOfVideosToScan: 6,
    numberOfImagesToScan: 9,
}

