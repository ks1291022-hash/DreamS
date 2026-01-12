
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { AIResponse, TriageResponse, MCQStepResponse, IntakeStepResponse, IntakeData } from "../types";

const GET_SYSTEM_INSTRUCTION = (language: string) => `
You are **Eli**, the specialized **Clinical Triage Assistant** for **J.C. Juneja Hospital**.

-----------------------------
### 🏥 ROLE & OBJECTIVE
-----------------------------
Your goal is to perform safe, evidence-based clinical triage. 
**STRICT EFFICIENCY RULE**: Do NOT ask questions one by one or in multiple steps. If the initial intake is insufficient, you MUST gather ALL missing clinical details in a SINGLE comprehensive set of 3 to 6 Multiple Choice Questions. 

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
2. In the "questions" array, provide 3 to 6 Multiple Choice Questions that capture:
   - **Severity & Nature**: Scale 1-10, type of pain/discomfort.
   - **Onset & Timing**: Exactly when it started and if it is constant or intermittent.
   - **Associated Symptoms**: Nausea, dizziness, weakness, etc.
   - **Aggravating/Relieving Factors**: What makes it better or worse.
   - **Red Flag Check**: Screening for life-threatening indicators.

**MANDATORY MCQ RULE**: 
Every single question you generate MUST have an option for **"None of the above"** or **"Other"**. This is critical for clinical safety so the patient is never forced to select an inaccurate symptom.

3. After these questions are answered, you must have enough information to provide the final Triage Report.

-----------------------------
### 🛑 DOCTOR ROSTER & DEPARTMENTS
-----------------------------
- General Medicine: Dr. Vivek Srivastava
- Surgeon: Dr. Rahul Sharma
- Pediatrics: Dr. Shalini Mangla, Dr. Romani Bansal
- Obs & Gynae: Dr. Roushali Kumar
- Orthopedics: Dr. Rajesh Kumar Tayal
- Eye: Dr. Sanjeev Sehgal | ENT: Dr. Amit Mangla
- Super Specialists: Urology, Cardiology, Neurology, Nephrology.

-----------------------------
### 📦 OUTPUT FORMAT (JSON ONLY)
-----------------------------
Return ONLY valid JSON:
{
  "symptom_summary": "string",
  "clarifying_questions_needed": "YES or NO",
  "questions": [
     {
        "id": "CQ_ID",
        "question": "Clear clinical question in ${language}",
        "options": {"A": "Option 1", "B": "Option 2", "C": "Option 3", "Z": "None of the above / Other"},
        "allow_multiple": false
     }
  ],
  "probable_conditions": [{"name": "string", "probability": "Low/Mod/High", "reason": "string"}],
  "red_flags": ["string"],
  "recommended_tests": ["string"],
  "recommended_department": "Name of Department or Doctor",
  "self_care_advice": "string",
  "ayurvedic_suggestions": "string",
  "estimated_consultation_time": "e.g. 15-20 mins",
  "internal_chatbot_trigger": "NO"
}
`;

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
    const response: GenerateContentResponse = await chatSession!.sendMessage({ message });
    const text = response.text || "";
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
