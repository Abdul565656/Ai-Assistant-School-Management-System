// lib/actions/ai.actions.ts
"use server";

import { generateGeminiResponse } from "@/lib/gemini"; // EduBotSystemPrompt is not directly used here for teacher
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Assignment from "@/lib/db/models/assignment.model"; // Example: to fetch assignment data
import Submission from "@/lib/db/models/submission.model"; // Example: to fetch submission data
import MongooseUser from "@/lib/db/models/user.model"; // Example: to fetch user data
import connectDB from "@/lib/db/connectDB";

// Keep ChatContent and ChatPart interfaces (or import if defined elsewhere shared)
interface ChatPart {
  text: string;
}
interface ChatContent {
  role: 'user' | 'model';
  parts: ChatPart[];
}

// System Prompt specifically for the Teacher AI
const EduProSystemPrompt = `You are EduPro, an expert AI assistant for teachers. Your capabilities include:
- Providing lesson planning ideas and resources.
- Explaining teaching methodologies for different subjects and age groups.
- Helping rephrase complex topics for students.
- Generating example questions (not for direct grading), content summaries, or creative learning activities.
- Analyzing provided school data (e.g., assignment completion rates, student performance trends for the teacher's classes) to offer insights.
- Answering general educational queries.

Always maintain a professional, insightful, and supportive tone.
When data is provided to you in the prompt, use it to inform your response.
Ensure any data-specific responses are clearly tied to the context of the requesting teacher.
Do not invent data. If data is not provided for a specific query, state that and offer general advice if possible.
You can use markdown for formatting.`;


// Function to get AI Tutor response (existing)
export async function getAITutorResponse(
  currentUserMessage: string,
  chatHistory: ChatContent[] = []
): Promise<string> {
    // ... (existing student AI tutor logic from previous response)
    // Remember the EduBotSystemPrompt should be used here
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'student') {
        throw new Error("Unauthorized for AI Tutor.");
    }

    // Construct prompt using EduBotSystemPrompt, history, and current message
    // (Using the simpler fullPrompt string approach for brevity here)
    const { EduBotSystemPrompt } = await import("@/lib/gemini"); // Import if not already
    let fullPrompt = `${EduBotSystemPrompt}\n\n## Conversation History:\n`;
    if (chatHistory && chatHistory.length > 0) {
        // The last message in chatHistory IS the currentUserMessage, so exclude it when rebuilding history string
        const historyToDisplay = chatHistory.slice(0, -1);
        historyToDisplay.forEach(msg => {
            const messageText = msg.parts && msg.parts.length > 0 ? msg.parts[0].text : "";
            fullPrompt += `${msg.role === 'user' ? 'Student' : 'EduBot'}: ${messageText}\n`;
        });
    }
    fullPrompt += `\nStudent: ${currentUserMessage}\nEduBot:`;


    try {
        console.log("Sending to Gemini (AI Tutor):", { studentId: session.user.id, message: currentUserMessage });
        const response = await generateGeminiResponse(fullPrompt);
        return response || "I'm not sure how to respond to that. Can you try rephrasing?";
    } catch (error) {
        console.error("AI Tutor - Gemini API Error:", error);
        throw new Error("Failed to get response from AI tutor. Please try again later.");
    }
}


// NEW Server Action for Teacher AI Help
export async function getAITeacherHelpResponse(
  teacherQuery: string,
  chatHistory: ChatContent[] = []
): Promise<string> {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'teacher') {
    throw new Error("Unauthorized: Only teachers can access this feature.");
  }

  const teacherId = session.user.id;
  let contextualDataSummary = ""; // To store summaries of fetched data

  // --- Advanced Part: Intent Recognition & Data Fetching ---
  // This is where it gets complex. You might need a basic keyword check
  // or integrate a more sophisticated NLU (Natural Language Understanding) step
  // if you want the AI to truly "know" what data to fetch.
  // For now, let's assume we might fetch some general data or let Gemini infer.

  // Example: If query mentions "assignments" or "students" for THIS teacher
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
      // You could add more data fetching here (e.g., student count, recent submission stats)
    } catch (dbError) {
      console.error("DB Error fetching teacher context:", dbError);
      contextualDataSummary += "\n\n[Note: Could not fetch detailed context from database at this time.]";
    }
  }
  // --- End of Advanced Part ---

  let fullPrompt = `${EduProSystemPrompt}\n\n## Teacher's Context (If any):\n${contextualDataSummary}\n\n## Conversation History:\n`;
  if (chatHistory && chatHistory.length > 0) {
    const historyToDisplay = chatHistory.slice(0, -1); // Exclude current query from history string part
    historyToDisplay.forEach(msg => {
        const messageText = msg.parts && msg.parts.length > 0 ? msg.parts[0].text : "";
        fullPrompt += `${msg.role === 'user' ? 'Teacher' : 'EduPro'}: ${messageText}\n`;
    });
  }
  fullPrompt += `\nTeacher: ${teacherQuery}\nEduPro:`;

  try {
    console.log("Sending to Gemini (Teacher AI Help):", { teacherId, query: teacherQuery });
    const response = await generateGeminiResponse(fullPrompt);
    return response || "I'm unable to process that request right now. Could you try phrasing it differently?";
  } catch (error) {
    console.error("Teacher AI Help - Gemini API Error:", error);
    throw new Error("Failed to get assistance from EduPro. Please try again later.");
  }
}