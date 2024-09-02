// import { OpenAI } from 'openai';
// import { config } from './config';

// const openai = new OpenAI({
//   baseURL: config.nonOllamaBaseURL,
//   apiKey: config.inferenceAPIKey
// });

// interface FunctionCallResult {
//   needsWebSearch: boolean;
//   searchQuery?: string;
// }

// export async function functionCalling(userMessage: string): Promise<FunctionCallResult> {
//   try {
//     const response = await openai.chat.completions.create({
//       model: 'llama3-8b-8192', 
//       messages: [
//         {
//           role: "system",
//           content: `You are a helpful assistant that determines if a web search is necessary to answer the user's question and generates an effective search query if needed.
          
//           Determine if a web search is necessary based on these criteria:
//           1) The user's message requires up-to-date information
//           2) The user's message involves complex or specific requirements
//           3) The question cannot be answered immediately without additional research
          
//           If a web search is needed, also formulate a concise, relevant search query.`
//         },
//         { role: "user", content: userMessage }
//       ],
//       functions: [
//         {
//           name: "determine_search_need",
//           description: "Determines if a web search is needed and generates a search query if necessary",
//           parameters: {
//             type: "object",
//             properties: {
//               needsWebSearch: {
//                 type: "boolean",
//                 description: "Whether a web search is necessary to answer the user's question"
//               },
//               searchQuery: {
//                 type: "string",
//                 description: "The generated search query, if a web search is needed"
//               }
//             },
//             required: ["needsWebSearch"]
//           }
//         }
//       ],
//       function_call: { name: "determine_search_need" }
//     });

//     const functionCall = response.choices[0].message.function_call;
//     if (functionCall && functionCall.name === "determine_search_need") {
//       const result = JSON.parse(functionCall.arguments) as FunctionCallResult;
//       return result;
//     } else {
//       throw new Error("Failed to determine search need");
//     }
//   } catch (error) {
//     console.error("Error in function calling:", error);
//     return { needsWebSearch: false };
//   }
// }