// @ts-nocheck
import { OpenAI } from 'openai';
import { config } from './config';
import { SpotifyApi } from "@spotify/web-api-ts-sdk";

const client = new OpenAI({
    baseURL: config.nonOllamaBaseURL,
    apiKey: config.inferenceAPIKey
});
const MODEL = 'llama-3.1-70b-versatile'

async function optimizeSearchQuery(query: string): Promise<string> {
    try {
        // Return the query in an optimized format by default
        const optimizedQuery = query.trim();
        return JSON.stringify({ 
            optimizedQuery,
            original: query 
        });
    } catch (error) {
        console.error('Error optimizing search query:', error);
        // Return original query in case of error
        return JSON.stringify({ 
            optimizedQuery: query,
            error: 'Failed to optimize search query' 
        });
    }
}

export async function functionCalling(query: string) {
    try {
        const messages = [
            { 
                role: "system", 
                content: `You are a search query optimizer. Your task is to convert user queries into optimized search terms.
                ALWAYS call the optimizeSearchQuery function with an improved version of the user's query.
                
                Examples:
                - "What movies should I watch on Netflix?" -> "best trending movies Netflix 2024"
                - "What are the implications of Groq's business model?" -> "Groq AI company business model analysis impact"
                
                Rules:
                1. Remove unnecessary words (like "please", "can you", etc.)
                2. Keep important technical terms intact
                3. Add relevant context terms if needed
                4. Include year for time-sensitive queries
                5. ALWAYS call the optimizeSearchQuery function`
            },
            { role: "user", content: query },
        ];

        const tools = [
            {
                type: "function",
                function: {
                    name: "optimizeSearchQuery",
                    description: "ALWAYS use this function to optimize the search query by converting it to search-friendly terms.",
                    parameters: {
                        type: "object",
                        properties: {
                            query: {
                                type: "string",
                                description: "The optimized search query focusing on key terms.",
                            },
                        },
                        required: ["query"],
                    },
                },
            },
        ];

        const response = await client.chat.completions.create({
            model: MODEL,
            messages: messages,
            tools: tools,
            tool_choice: { type: "function", function: { name: "optimizeSearchQuery" } }, // Force function call
            max_tokens: 4096,
        });

        const responseMessage = response.choices[0].message;
        const toolCalls = responseMessage.tool_calls;

        if (!toolCalls || toolCalls.length === 0) {
            // Return original query if function wasn't called
            return { optimizedQuery: query };
        }

        const availableFunctions = {
            optimizeSearchQuery,
        };

        const toolCall = toolCalls[0]; // Process only the first function call
        const functionName = toolCall.function.name;
        const functionToCall = availableFunctions[functionName];
        const functionArgs = JSON.parse(toolCall.function.arguments);

        try {
            const functionResponse = await functionToCall(functionArgs.query);
            const parsedResponse = JSON.parse(functionResponse);
            
            // Use original query if optimization failed
            return {
                optimizedQuery: parsedResponse.optimizedQuery || query,
                original: query
            };
        } catch (error) {
            console.error(`Error calling function ${functionName}:`, error);
            // Return original query on error
            return { optimizedQuery: query };
        }
    } catch (error) {
        console.error('Error in functionCalling:', error);
        // Return original query on top-level error
        return { optimizedQuery: query };
    }
}