
import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
import { AIResponse, TriageResponse, MCQStepResponse, IntakeStepResponse, IntakeData } from "../types";

/**
 * Enhanced schema for clinical triage.
 * We make some fields optional at the schema level to prevent API validation errors 
 * during the initial intake phase where full details aren't yet determined.
 */
const TRIAGE_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    screen: { type: Type.STRING, description: "One of: 'symptom_mcq', 'triage_report'" },
    symptom_summary: { 
      type: Type.STRING, 
      description: "A professional clinical summary of symptoms." 
    },
    clarifying_questions_needed: { 
      type: Type.STRING, 
      enum: ["YES", "NO"]
    },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          question: { type: Type.STRING },
          options: {
            type: Type.OBJECT,
            properties: {
              A: { type: Type.STRING },
              B: { type: Type.STRING },
              Z: { type: Type.STRING }
            },
            required: ["A", "B", "Z"]
          },
          allow_multiple: { type: Type.BOOLEAN }
        },
        required: ["id", "question", "options"]
      }
    },
    probable_conditions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          probability: { type: Type.STRING, enum: ["Low", "Moderate", "High"] },
          reason: { type: Type.STRING }
        }
      }
    },
    red_flags: { type: Type.ARRAY, items: { type: Type.STRING } },
    recommended_tests: { type: Type.ARRAY, items: { type: Type.STRING } },
    recommended_department: { type: Type.STRING },
    self_care_advice: { type: Type.STRING },
    ayurvedic_suggestions: { type: Type.STRING },
    internal_chatbot_trigger: { type: Type.STRING, enum: ["YES", "NO"] }
  },
  required: ["symptom_summary", "clarifying_questions_needed", "internal_chatbot_trigger"]
};

const GET_SYSTEM_INSTRUCTION = (language: string) => `
You are **Eli**, the Clinical Triage Assistant for **J.C. Juneja Hospital**.
User language: **${language}**. Respond entirely in **${language}**.

**CORE RULES:**
1. If initial intake is insufficient, set "clarifying_questions_needed" to "YES" and provide 3-6 MCQs.
2. Every MCQ must have a "None of the above" option with key "Z".
3. Even if you are asking clarifying questions, you MUST return a "symptom_summary" based on what you know so far.
4. If conditions aren't known yet, return an empty array [] for "probable_conditions".
`;

let chatSession: Chat | null = null;

export const initializeChat = (language: string = 'English'): Chat => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === 'undefined') {
    const errorMsg = "CRITICAL: Gemini API Key is missing! Check .env.local and ensure GEMINI_API_KEY is set. Restart your dev server.";
    console.error(errorMsg);
    // We throw to catch it in the UI and show the user
    throw new Error(errorMsg);
  }

  const ai = new GoogleGenAI({ apiKey });
  chatSession = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      responseMimeType: "application/json",
      responseSchema: TRIAGE_RESPONSE_SCHEMA,
      temperature: 0.1,
      systemInstruction: GET_SYSTEM_INSTRUCTION(language),
    },
  });
  return chatSession;
};

export const sendMessageToTriage = async (message: string, language: string = 'English'): Promise<AIResponse> => {
  try {
    if (!chatSession) {
      initializeChat(language);
    }

    const response: GenerateContentResponse = await chatSession!.sendMessage({ message });
    const text = response.text || "{}";
    
    // Safety check: remove potential markdown backticks if model hallucinates them
    const cleanJson = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(cleanJson) as AIResponse;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const resetSession = () => {
  chatSession = null;
};
