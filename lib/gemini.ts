import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerationConfig } from "@google/generative-ai"; 

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not defined. AI features relying on it will be unavailable.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const geminiProModel = genAI ? genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest", 
}) : null;

export const defaultSafetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Default generation config, can be overridden
export const defaultGenerationConfig: GenerationConfig = {
  temperature: 0.7,
  maxOutputTokens: 2048, // Adjust as needed
  responseMimeType: "application/json",
};

export async function generateGeminiResponse(
  prompt: string,
  customSafetySettings?: typeof defaultSafetySettings, 
  customGenerationConfig?: Partial<GenerationConfig> 
) {
  if (!geminiProModel) {
    console.error("Gemini model not initialized. Check API key or if Gemini service is enabled.");
    throw new Error("AI Suggestion service is currently unavailable.");
  }
  try {
    const result = await geminiProModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      safetySettings: customSafetySettings || defaultSafetySettings,
      generationConfig: { ...defaultGenerationConfig, ...customGenerationConfig }, 
    });
    return result.response.text();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to get response from AI: ${error.message}`);
    }
    throw new Error("Failed to get response from AI due to an unknown error.");
  }
}

export const EduBotSystemPrompt = `You are EduBot, a friendly, patient, and encouraging school assistant...`;

export default genAI; 