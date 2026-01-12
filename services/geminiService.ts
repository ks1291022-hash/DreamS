
import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
import { AIResponse, TriageResponse, MCQStepResponse, IntakeStepResponse, IntakeData } from "../types";

// Enhanced API Key retrieval for local dev and AI Studio environments
const getApiKey = (): string | undefined => {
  if (typeof process !== 'undefined' && process.env?.API_KEY && process.env.API_KEY !== 'undefined') {
    return process.env.API_KEY;
  }
  // @ts-ignore
  if (typeof window !== 'undefined' && window.process?.env?.API_KEY) {
    // @ts-ignore
    return window.process.env.API_KEY;
  }
  return undefined;
};

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
You are **Eli**, the Clinical Triage Assistant for **J.C. Juneja Hospital**.
Response Language: **${language}**.

**STRICT RULES:**
1. Return ONLY raw JSON. No markdown code blocks.
2. If "clarifying_questions_needed" is "YES", provide 3-6 MCQs in "questions".
3. Every question MUST have option "Z": "None of the above / Other".
4. If "clarifying_questions_needed" is "NO", provide "probable_conditions" and "recommended_department".
`;

let chatSession: Chat | null = null;

export const initializeChat = (language: string = 'English'): Chat => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error("API_KEY_MISSING: The Gemini API key is not defined. Please check your environment variables or .env.local file.");
  }

  const ai = new GoogleGenAI({ apiKey });
  chatSession = ai.chats.create({
    model: 'gemini-3-flash-preview',
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
    const text = response.text?.trim() || "{}";
    
    // Clean up response if markdown backticks are present
    const cleanJson = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    
    try {
      return JSON.parse(cleanJson) as AIResponse;
    } catch (e) {
      console.error("JSON Parse Error. Content:", text);
      throw new Error("INVALID_JSON_RESPONSE: The clinical engine returned malformed data.");
    }
  } catch (error: any) {
    console.error("Triage Service Error:", error);
    throw error;
  }
};

export const resetSession = () => {
  chatSession = null;
};
