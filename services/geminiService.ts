import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
import { AIResponse, TriageResponse, MCQStepResponse, IntakeStepResponse, IntakeData } from "../types";

/**
 * Gemini-based clinical triage service.
 * Follows @google/genai Coding Guidelines.
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
You are **Eli**, the Clinical Triage Assistant for **J.C. Juneja Hospital**.
Your intelligence is medically aligned and utilizes HIPAA-compliant reasoning protocols.
You are built to assist in clinical triage, providing high-accuracy assessment based on the MedLM framework.
Response Language: **${language}**.

**STRICT CLINICAL PROTOCOL:**
1. If the symptoms provided are vague or insufficient for a safe triage, you MUST set "clarifying_questions_needed" to "YES" and provide 3-5 high-quality MCQs.
2. Every MCQ must have option "Z" as "None of the above / Other".
3. If red flags are detected (chest pain, stroke signs, severe trauma), list them clearly in "red_flags" and recommend "Emergency" department.
4. Return ONLY valid JSON. No conversational filler.
`;

let chatSession: Chat | null = null;

/**
 * Initializes a Gemini chat session for clinical triage.
 */
export const initializeChat = (language: string = 'English'): Chat => {
  // Fix: Ensure process.env.API_KEY is accessed directly for GoogleGenAI initialization
  if (!process.env.API_KEY) {
    throw new Error("API_KEY_MISSING: No Gemini API Key found. Ensure the environment variable is set.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Fix: Upgrade to gemini-3-pro-preview for complex reasoning tasks like medical triage and diagnostics
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

/**
 * Sends patient data to Gemini for triage analysis.
 */
export const sendMessageToTriage = async (message: string, language: string = 'English'): Promise<AIResponse> => {
  try {
    if (!chatSession) {
      initializeChat(language);
    }

    // Fix: response.text is a property, ensuring we don't call it as a method
    const response: GenerateContentResponse = await chatSession!.sendMessage({ message });
    const text = response.text;
    
    if (!text) {
      throw new Error("EMPTY_RESPONSE: The clinical engine returned no data.");
    }

    try {
      return JSON.parse(text) as AIResponse;
    } catch (e) {
      console.error("Malformed JSON:", text);
      throw new Error("PARSING_ERROR: Received invalid data format from clinical engine.");
    }
  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    throw error;
  }
};

export const resetSession = () => {
  chatSession = null;
};
