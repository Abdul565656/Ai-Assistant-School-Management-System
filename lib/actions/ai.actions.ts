// lib/actions/ai.actions.ts
"use server";

// Correctly import exported members from lib/gemini
import {
    generateGeminiResponse,
    EduBotSystemPrompt, // Now exported
    defaultSafetySettings,    // Now exported
    defaultGenerationConfig   // Now exported
} from "@/lib/gemini";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Assignment from "@/lib/db/models/assignment.model";
import Submission from "@/lib/db/models/submission.model"; // Unused in current functions, but keep if planned
import MongooseUser from "@/lib/db/models/user.model";   // Unused in current functions, but keep if planned
import connectDB from "@/lib/db/connectDB";
import { GoogleGenerativeAIError } from '@google/generative-ai';
import mongoose, { Types } from "mongoose"; // <<< IMPORT Types from mongoose

interface ChatPart {
  text: string;
}
interface ChatContent {
  role: 'user' | 'model';
  parts: ChatPart[];
}

// Helper function to attempt to extract plain text if AI wraps response
function extractActualText(responseText: string | null): string {
    if (!responseText) {
        return "I'm currently unable to respond. Please try again shortly.";
    }
    try {
        const parsed = JSON.parse(responseText);
        if (parsed && typeof parsed.response === 'string') {
            return parsed.response;
        }
        // console.warn("AI returned JSON, but not in the expected {response: 'text'} format:", responseText);
        return responseText;
    } catch (e) {
        return responseText;
    }
}

export async function getAITutorResponse(
  currentUserMessage: string,
  chatHistory: ChatContent[] = []
): Promise<string> {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== 'student') {
        throw new Error("Unauthorized for AI Tutor. This feature is for students.");
    }

    let fullPrompt = `${EduBotSystemPrompt}\n\n## Conversation History:\n`;
    if (chatHistory && chatHistory.length > 1) {
        const historyToDisplay = chatHistory.slice(0, -1);
        historyToDisplay.forEach(msg => {
            const messageText = msg.parts && msg.parts.length > 0 ? msg.parts[0].text : "";
            fullPrompt += `${msg.role === 'user' ? 'Student' : 'EduBot'}: ${messageText}\n`;
        });
    }
    fullPrompt += `\nStudent: ${currentUserMessage}\nEduBot:`;

    try {
        const rawAiResponse = await generateGeminiResponse(
            fullPrompt,
            defaultSafetySettings,
            // For chat, we usually want plain text, so ensure responseMimeType is not application/json
            // unless generateGeminiResponse handles parsing based on that config.
            { ...defaultGenerationConfig, responseMimeType: undefined }
        );
        
        const finalResponseText = extractActualText(rawAiResponse);
        return finalResponseText || "I'm not sure how to respond to that. Can you try rephrasing?";
    } catch (error: any) {
        console.error("AI Tutor - Error calling generateGeminiResponse:", error.message);
        let clientErrorMessage = "Failed to get response from AI tutor. Please try again later.";
        if (error.message.includes("blocked")) {
            clientErrorMessage = "Your message may have been blocked by safety filters. Please rephrase."
        } else if (error.message.includes("API key") || error.message.includes("unavailable")) {
            clientErrorMessage = "AI Tutor service is currently unavailable.";
        }
        throw new Error(clientErrorMessage);
    }
}

// System Prompt specifically for the Teacher AI
const EduProSystemPrompt = `You are EduPro, an expert AI assistant for teachers...`; // Your existing prompt

export async function getAITeacherHelpResponse(
  teacherQuery: string,
  chatHistory: ChatContent[] = []
): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== 'teacher') {
    throw new Error("Unauthorized: Only teachers can access this feature.");
  }
  const teacherIdString = session.user.id; // Assuming session.user.id is a string

  if (typeof teacherIdString !== 'string' || !mongoose.Types.ObjectId.isValid(teacherIdString)) {
      throw new Error("Invalid teacher ID in session.");
  }
  const teacherId = new Types.ObjectId(teacherIdString); // Convert to ObjectId

  let contextualDataSummary = "";

  if (teacherQuery.toLowerCase().includes("my assignments") || teacherQuery.toLowerCase().includes("my students")) {
    try {
      await connectDB();
      const assignments = await Assignment.find({ teacher: teacherId }).limit(5).sort({ createdAt: -1 }).lean();
      if (assignments.length > 0) {
        contextualDataSummary += `\n\n## Context from your recent assignments:\n`;
        assignments.forEach(asgn => {
          contextualDataSummary += `- Title: ${asgn.title}, Due: ${asgn.dueDate ? new Date(asgn.dueDate).toLocaleDateString() : 'N/A'}, Questions: ${asgn.questions.length}\n`;
        });
      }
    } catch (dbError: any) {
      console.error("DB Error fetching teacher context:", dbError.message);
      contextualDataSummary += "\n\n[Note: Could not fetch detailed context from database at this time.]";
    }
  }

  let fullPrompt = `${EduProSystemPrompt}\n\n## Teacher's Context (If any):\n${contextualDataSummary}\n\n## Conversation History:\n`;
  if (chatHistory && chatHistory.length > 1) {
    const historyToDisplay = chatHistory.slice(0, -1);
    historyToDisplay.forEach(msg => {
        const messageText = msg.parts && msg.parts.length > 0 ? msg.parts[0].text : "";
        fullPrompt += `${msg.role === 'user' ? 'Teacher' : 'EduPro'}: ${messageText}\n`;
    });
  }
  fullPrompt += `\nTeacher: ${teacherQuery}\nEduPro:`;

  try {
    const rawAiResponse = await generateGeminiResponse(
        fullPrompt,
        defaultSafetySettings,
        { ...defaultGenerationConfig, responseMimeType: undefined } // Prefer text for chat
    );
    const finalResponseText = extractActualText(rawAiResponse);
    return finalResponseText || "I'm unable to process that request right now. Could you try phrasing it differently?";
  } catch (error: any) {
    console.error("Teacher AI Help - Error calling generateGeminiResponse:", error.message);
    let clientErrorMessage = "Failed to get assistance from EduPro. Please try again later.";
    if (error.message.includes("blocked")) {
        clientErrorMessage = "Your query may have been blocked by safety filters. Please rephrase."
    } else if (error.message.includes("API key") || error.message.includes("unavailable")) {
        clientErrorMessage = "EduPro AI service is currently unavailable.";
    }
    throw new Error(clientErrorMessage);
  }
}