import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
import { AIResponse, TriageResponse, MCQStepResponse, IntakeStepResponse, IntakeData } from "../types";

/**
 * Clinical Triage Assistant Service.
 * Persona: Eli
 * Powered by Google Gemini.
 */

const TRIAGE_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    symptom_summary: { type: Type.STRING },
    clarifying_questions_needed: { type: Type.STRING, enum: ["YES", "NO"] },
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
              C: { type: Type.STRING },
              D: { type: Type.STRING },
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
    internal_chatbot_trigger: { type: Type.STRING, enum: ["YES", "NO"] },
    estimated_consultation_time: { type: Type.STRING }
  },
  required: ["symptom_summary", "clarifying_questions_needed"]
};

const GET_SYSTEM_INSTRUCTION = (language: string) => `
You are **Eli**, the Clinical Triage Assistant at **JC Juneja Hospital**.
Your role is to perform preliminary clinical triage with high accuracy.

PROTOCOL:
1. If details are insufficient, ask clarifying questions (MCQs).
2. Option Z is always "None of the above".
3. Identify Red Flags for urgent/emergency scenarios.
4. Recommend clinical departments and tests.
5. Provide self-care and complementary Ayurvedic guidance for stable cases.
Language: ${language}.
`;

let chatSession: Chat | null = null;

export const initializeChat = (language: string = 'English'): Chat => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY_MISSING: Eli requires a Gemini API Key.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  chatSession = ai.chats.create({
    // FIX: Updated model to 'gemini-3-pro-preview' for the complex clinical triage task with JSON output.
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
    if (!chatSession) initializeChat(language);
    const response: GenerateContentResponse = await chatSession!.sendMessage({ message });
    const text = response.text;
    if (!text) throw new Error("Eli received an empty response.");
    return JSON.parse(text) as AIResponse;
  } catch (error: any) {
    console.error("Eli Service Error:", error);
    throw error;
  }
};

export const resetSession = () => {
  chatSession = null;
};