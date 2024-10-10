export const config = {
    useOllamaInference: false,
    useOllamaEmbeddings: false,
    inferenceAPIKey: process.env.GROQ_API_KEY, 
    embeddingsModel: 'text-embedding-3-small',
    textChunkSize: 800, 
    textChunkOverlap: 200, 
    nonOllamaBaseURL: 'https://api.groq.com/openai/v1', 
    useSemanticCache: true, 
    startIndexOfPagesToScan: 0,
    numberOfPagesToScan: 7,
    timeout: 700, 
    embedTimeout: 15000, // 15 seconds
    similarityThreshold: 0.6,
    numberOfSimilarityResults: 4, 
    numberOfVideosToScan: 6,
    numberOfImagesToScan: 9,
}

