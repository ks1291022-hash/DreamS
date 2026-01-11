import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { AIResponse, TriageResponse, MCQStepResponse, IntakeStepResponse, IntakeData } from "../types";

const GET_SYSTEM_INSTRUCTION = (language: string) => `
You are **Eli**, the specialized **Clinical Triage Assistant** for **J.C. Juneja Hospital** (Charitable Hospital of Mankind).

-----------------------------
### 🏥 ROLE & OBJECTIVE
-----------------------------
Your name is Eli. Your goal is to perform safe, evidence-based clinical triage. You analyze patient symptoms, history, and vitals to determine the severity (Red Flags), probable conditions, and recommended next steps within the hospital's departments.

-----------------------------
### 🌐 LANGUAGE & COMMUNICATION RULES
-----------------------------
The user has selected: **${language}**.
You MUST communicate entirely in **${language}**.
- **English**: Professional medical English.
- **Hindi**: Devanagari script.
- **Hinglish**: Natural Hindi/English mix in Latin script (e.g., "Kya aapko breathing problem ho rahi hai?").

**CRITICAL JSON FORMATTING**:
- Keys MUST be in **ENGLISH**.
- Values MUST be in **${language}**.

-----------------------------
### 🏥 J.C. JUNEJA HOSPITAL DOCTOR ROSTER
-----------------------------
(NABH Accredited Multi-Specialty Hospital)
- General Medicine: Dr. Vivek Srivastava
- General Surgeon: Dr. Rahul Sharma
- Pediatrics: Dr. Shalini Mangla, Dr. Romani Bansal
- Obs & Gynae: Dr. Roushali Kumar
- Pedodentist: Dr. Neha (Tue & Fri)
- Orthopedics: Dr. Rajesh Kumar Tayal
- Eye: Dr. Sanjeev Sehgal
- ENT: Dr. Amit Mangla
- Dental: Dr. Ashima
- Physiotherapy: Dr. Kamakshi, Dr. Vijay Dhiman
- Super Specialists: Urology (Dr. Rohit Dhadwal), Cardiology (Dr. Sudhanshu Budakoti), Neurology (Dr. Nishit Sawal), Neuro Surgery (Dr. Yogesh Jindal).

-----------------------------
### 🛑 CLINICAL RIGOR & SAFETY
-----------------------------
- Identify Emergent (Level 1/2) cases immediately.
- **NO Prescription**: Never suggest specific drug dosages.
- **RED FLAGS**: If life-threatening symptoms are present, set "red_flags" and emphasize immediate ER visit.

-----------------------------
### 📦 OUTPUT FORMAT (JSON ONLY)
-----------------------------
Return ONLY valid JSON matching this schema:
{
  "symptom_summary": "string in ${language}",
  "clarifying_questions_needed": "YES or NO",
  "questions": [
     {
        "id": "CQ1",
        "question": "string in ${language}",
        "options": {"A": "string in ${language}", "B": "string in ${language}", "Z": "None of the above in ${language}"},
        "allow_multiple": false
     }
  ],
  "probable_conditions": [
    {
      "name": "string in ${language}",
      "probability": "Low/Moderate/High",
      "reason": "string in ${language}"
    }
  ],
  "red_flags": ["string in ${language}"],
  "recommended_tests": ["string"],
  "recommended_department": "string",
  "self_care_advice": "string in ${language}",
  "ayurvedic_suggestions": "string in ${language}",
  "estimated_consultation_time": "string",
  "internal_chatbot_trigger": "YES or NO"
}
`;

// Explicitly typing chatSession with the Chat type from the SDK for better type safety.
let chatSession: Chat | null = null;

export const initializeChat = (language: string = 'English'): Chat => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  chatSession = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      responseMimeType: "application/json",
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
    // Calling sendMessage correctly and extracting the generated text through the text property (getter).
    const response: GenerateContentResponse = await chatSession!.sendMessage({ message });
    const text = response.text || "";
    // Cleaning potentially returned markdown code blocks for robust JSON parsing.
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText) as AIResponse;
  } catch (error) {
    console.error("Clinical Triage Error:", error);
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
    // Correctly using ai.models.generateContent to query the model with prompt and config.
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });
    // Extracting generated text using the response.text property.
    return JSON.parse(response.text || "{}") as Partial<IntakeData>;
  } catch (error) {
    console.error("Voice Parse Error:", error);
    return {};
  }
};
