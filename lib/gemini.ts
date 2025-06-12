// lib/gemini.ts
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerationConfig } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not defined. AI features relying on it will be unavailable.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Export the model only if genAI is initialized
export const geminiProModel = genAI ? genAI.getGenerativeModel({ // <<< EXPORT
  model: "gemini-1.5-flash-latest",
}) : null;

export const defaultSafetySettings = [ // <<< EXPORT
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export const defaultGenerationConfig: GenerationConfig = { // <<< EXPORT
  temperature: 0.7,
  maxOutputTokens: 2048,
  responseMimeType: undefined, // Default to undefined for plain text, can be overridden
};

export async function generateGeminiResponse( // <<< EXPORT
  prompt: string,
  customSafetySettings?: typeof defaultSafetySettings,
  customGenerationConfig?: Partial<GenerationConfig>
): Promise<string> {
  if (!geminiProModel) {
    console.error("Gemini model not initialized. Check API key.");
    throw new Error("AI service is currently unavailable.");
  }
  try {
    const configToUse: GenerationConfig = { ...defaultGenerationConfig, ...customGenerationConfig };
    const expectingJsonOutput = configToUse.responseMimeType === "application/json";

    const result = await geminiProModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      safetySettings: customSafetySettings || defaultSafetySettings,
      generationConfig: configToUse,
    });

    const aiResponseText = result.response.text();

    if (!aiResponseText) {
        if (result.response.promptFeedback?.blockReason) {
            throw new Error(`Content blocked: ${result.response.promptFeedback.blockReason}`);
        }
        throw new Error("AI returned an empty response.");
    }

    if (expectingJsonOutput) {
        return aiResponseText; // Return raw JSON string if JSON was requested
    } else {
        // Attempt to parse if AI mistakenly wrapped plain text in {"response": "..."}
        try {
            const parsed = JSON.parse(aiResponseText);
            if (parsed && typeof parsed.response === 'string') {
                return parsed.response;
            }
            // If it parsed but not into the expected structure, return original text for now
            // Or you could throw an error if plain text was strictly expected here.
            return aiResponseText;
        } catch (e) {
            // Not JSON, so it's likely the plain text
            return aiResponseText;
        }
    }
  } catch (error) {
    console.error("Error calling Gemini API via generateGeminiResponse:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to get response from AI: ${error.message}`);
    }
    throw new Error("Failed to get response from AI due to an unknown error.");
  }
}

export const EduBotSystemPrompt = `You are EduBot, a friendly, patient, and encouraging school assistant.
Your primary goal is to help students understand concepts and assist teachers with educational tasks.

For students:
- Explain complex topics simply. If asked, 'Explain Like I'm 5', break down the concept into very basic terms.
- Do NOT provide direct answers to homework or assignment questions that are likely graded. Instead, guide them towards understanding the solution themselves.
- Offer hints, ask Socratic questions, and encourage critical thinking.

For teachers:
- Provide ideas for lesson plans, explain teaching methodologies, and help rephrase complex topics for different age groups.
- Assist with generating example questions (not for grading), content summaries, or creative learning activities.

General Guidelines:
- Always maintain a positive, supportive, and respectful tone.
- Be concise but thorough.
- If you don't know an answer or a request is outside your capabilities, admit it politely.
- Prioritize safety and avoid generating harmful, biased, or inappropriate content.
- Do not invent facts or information. If uncertain, state that you are uncertain.
- You can use markdown for formatting your responses (e.g., lists, bold text).`;


// Removed default export of genAI if it's not used elsewhere or causes issues.
// If you need it:
// export default genAI;