
import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
import { AIResponse, TriageResponse, MCQStepResponse, IntakeStepResponse, IntakeData } from "../types";

/**
 * Formal schema for clinical triage responses.
 * This ensures the Gemini API always returns valid JSON that matches our application's types.
 */
const TRIAGE_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    symptom_summary: { 
      type: Type.STRING, 
      description: "A professional clinical summary of the patient's current symptoms and history." 
    },
    clarifying_questions_needed: { 
      type: Type.STRING, 
      enum: ["YES", "NO"], 
      description: "Indicates if the model requires more information via MCQs." 
    },
    questions: {
      type: Type.ARRAY,
      description: "A set of 3-6 MCQs to gather clinical details in one go.",
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
              Z: { type: Type.STRING, description: "Must always be 'None of the above' or 'Other'." }
            },
            required: ["A", "B", "Z"]
          },
          allow_multiple: { type: Type.BOOLEAN }
        },
        required: ["id", "question", "options", "allow_multiple"]
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
        },
        required: ["name", "probability", "reason"]
      }
    },
    red_flags: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Life-threatening indicators identified."
    },
    recommended_tests: { type: Type.ARRAY, items: { type: Type.STRING } },
    recommended_department: { type: Type.STRING, description: "Specific doctor or department for consultation." },
    self_care_advice: { type: Type.STRING },
    ayurvedic_suggestions: { type: Type.STRING },
    estimated_consultation_time: { type: Type.STRING },
    internal_chatbot_trigger: { type: Type.STRING, enum: ["YES", "NO"] }
  },
  required: [
    "symptom_summary", 
    "clarifying_questions_needed", 
    "probable_conditions", 
    "red_flags", 
    "recommended_department", 
    "internal_chatbot_trigger"
  ]
};

const GET_SYSTEM_INSTRUCTION = (language: string) => `
You are **Eli**, the specialized **Clinical Triage Assistant** for **J.C. Juneja Hospital**.

-----------------------------
### 🏥 ROLE & OBJECTIVE
-----------------------------
Your goal is to perform safe, evidence-based clinical triage. 
**STRICT EFFICIENCY RULE**: Do NOT ask questions one by one. If the initial intake is insufficient, you MUST gather ALL missing clinical details in a SINGLE comprehensive set of 3 to 6 Multiple Choice Questions.

-----------------------------
### 🌐 LANGUAGE & COMMUNICATION
-----------------------------
User language: **${language}**.
- Respond entirely in **${language}**.
- JSON keys must remain in **ENGLISH**.
- Values must be in **${language}**.

-----------------------------
### 🏥 CLINICAL STRATEGY (ONE-SHOT COMPREHENSIVE GATHERING)
-----------------------------
If you need more information to provide a definitive recommendation:
1. Set "clarifying_questions_needed" to "YES".
2. In the "questions" array, provide 3 to 6 Multiple Choice Questions.
3. **MANDATORY MCQ RULE**: Every single question MUST have an option for **"None of the above"** or **"Other"**.

-----------------------------
### 🛑 DOCTOR ROSTER
-----------------------------
- Gen Med: Dr. Vivek Srivastava | Surgeon: Dr. Rahul Sharma | Ped: Dr. Shalini Mangla, Dr. Romani Bansal | Obs: Dr. Roushali Kumar | Ortho: Dr. Rajesh Kumar Tayal | Eye: Dr. Sanjeev Sehgal | ENT: Dr. Amit Mangla.
`;

let chatSession: Chat | null = null;

export const initializeChat = (language: string = 'English'): Chat => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
  if (!chatSession) {
    initializeChat(language);
  }

  try {
    const response: GenerateContentResponse = await chatSession!.sendMessage({ message });
    const text = response.text || "";
    // With responseSchema and application/json, the text is guaranteed to be raw JSON without markdown.
    return JSON.parse(text) as AIResponse;
  } catch (error) {
    console.error("Clinical Triage Error Details:", error);
    throw error;
  }
};

export const resetSession = () => {
  chatSession = null;
};

export const parsePatientVoiceInput = async (transcript: string): Promise<Partial<IntakeData>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Extract patient medical details from this voice transcript: "${transcript}". Format as JSON.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });
    return JSON.parse(response.text || "{}") as Partial<IntakeData>;
  } catch (error) {
    console.error("Voice Parse Error:", error);
    return {};
  }
};
