// app/api/ai/suggest-questions/route.ts
import { NextResponse } from 'next/server';
import { generateGeminiResponse, defaultSafetySettings, defaultGenerationConfig } from '@/lib/gemini'; // Using defaults
import { GenerationConfig } from '@google/generative-ai';

// Define the expected structure of a single AI suggestion (internal to this API route)
interface RawAISuggestion {
  questionText: string;
  questionType: 'multiple_choice' | 'short_answer' | 'essay' | 'file_upload';
  points?: number; // AI might suggest points
  options?: { text: string; isCorrect: boolean }[]; // Only for multiple_choice
}

// Define the expected structure of the entire AI JSON response
interface AIJsonResponse {
    suggestions: RawAISuggestion[];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      assignmentTitle,
      assignmentDescription,
      currentQuestionText,
      questionType,
      numSuggestions = 3, // Default to 3 suggestions
    } = body;

    if (!assignmentTitle && !currentQuestionText && !assignmentDescription) {
      return NextResponse.json({ error: 'Please provide sufficient context (e.g., title, description, or current question).' }, { status: 400 });
    }

    let prompt = `You are an AI assistant specializing in educational content creation. Your task is to generate question suggestions for a school assignment.

Strictly adhere to the following JSON output format. The entire response MUST be a single JSON object with a root key "suggestions".
The "suggestions" key must contain an array of question objects. Each question object must have:
1.  "questionText": A string for the question itself.
2.  "questionType": A string, one of "multiple_choice", "short_answer", "essay", "file_upload".
3.  "points": An optional number (e.g., 10). If omitted, a default will be used.
4.  "options": An array of option objects, ONLY if "questionType" is "multiple_choice". Each option object must have "text" (string) and "isCorrect" (boolean). For multiple choice, provide 3 to 4 options, and ensure exactly one option has "isCorrect": true. For other question types, "options" should be omitted or be an empty array.

Generate ${numSuggestions} question suggestions based on the following context:`;

    if (assignmentTitle) prompt += `\n- Assignment Title: "${assignmentTitle}"`;
    if (assignmentDescription) prompt += `\n- Assignment Description: "${assignmentDescription}"`;
    if (currentQuestionText) {
      prompt += `\n- Context of current question being worked on: "${currentQuestionText}"`;
      if (questionType) prompt += `\n- Try to make suggestions for the question type: ${questionType.replace("_", " ")}`;
    } else if (questionType) {
      prompt += `\n- Generate questions specifically of type: ${questionType.replace("_", " ")}`;
    }

    prompt += `

Example of the required JSON output:
{
  "suggestions": [
    {
      "questionText": "Explain the main causes of World War I.",
      "questionType": "essay",
      "points": 20
    },
    {
      "questionText": "Which planet is known as the Red Planet?",
      "questionType": "multiple_choice",
      "points": 5,
      "options": [
        { "text": "Earth", "isCorrect": false },
        { "text": "Mars", "isCorrect": true },
        { "text": "Jupiter", "isCorrect": false },
        { "text": "Venus", "isCorrect": false }
      ]
    }
  ]
}

Provide ONLY the JSON object as your response.`;

    console.log("[AI Suggest API] Sending prompt to Gemini...");
    // console.log(prompt); // Uncomment for debugging the full prompt

    // Generation config for this specific task, ensuring JSON output
    const specificGenerationConfig: Partial<GenerationConfig> = {
        ...defaultGenerationConfig, // Start with defaults from gemini.ts
        responseMimeType: "application/json", // Crucial for Gemini to output valid JSON
    };

    const aiResponseText = await generateGeminiResponse(
        prompt,
        defaultSafetySettings, // Use default safety settings
        specificGenerationConfig
    );

    console.log("[AI Suggest API] Raw AI Response from Gemini:", aiResponseText);

    if (!aiResponseText) {
      return NextResponse.json({ error: 'AI returned an empty response.' }, { status: 500 });
    }

    let parsedResponse: AIJsonResponse;
    try {
      // With responseMimeType: "application/json", Gemini should return a clean JSON string
      parsedResponse = JSON.parse(aiResponseText);
    } catch (parseError: any) {
      console.error("[AI Suggest API] Error parsing AI JSON response:", parseError, "\nRaw content was:", aiResponseText);
      return NextResponse.json({ error: 'AI response was not valid JSON. Please check server logs for the raw AI output.', rawAIReponse: aiResponseText }, { status: 500 });
    }

    if (!parsedResponse || !Array.isArray(parsedResponse.suggestions)) {
        console.error("[AI Suggest API] AI response JSON structure mismatch. Expected an object with a 'suggestions' array. Received:", parsedResponse);
        return NextResponse.json({ error: 'AI response JSON structure incorrect. Expected { "suggestions": [...] }.', rawAIReponse: aiResponseText }, { status: 500 });
    }

    return NextResponse.json({ suggestions: parsedResponse.suggestions });

  } catch (error: any) {
    console.error("[AI Suggest API] Overall error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch AI suggestions." }, { status: 500 });
  }
}