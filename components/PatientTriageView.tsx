import React, { useState, useEffect, useRef } from 'react';
import PatientIntakeForm from './PatientIntakeForm';
import PatientIdentification from './PatientIdentification';
import ProfileSelection from './ProfileSelection';
import LanguageSelection from './LanguageSelection';
import MCQQuestionnaire from './MCQQuestionnaire';
import TriageReport from './TriageReport';
import DisclaimerModal from './DisclaimerModal';
import { sendMessageToTriage, resetSession } from '../services/geminiService';
import { TriageResponse, AppState, IntakeData, AIResponse, MCQStepResponse, PatientRecord } from '../types';
import { RefreshCw, AlertCircle, HelpCircle } from 'lucide-react';

interface Props {
  onSaveRecord: (intake: IntakeData, triage: TriageResponse) => void;
  onNavigateToDigitalTwin: () => void;
  records: PatientRecord[];
  onLogin: (phone: string) => void;
}

const PatientTriageView: React.FC<Props> = ({ onSaveRecord, onNavigateToDigitalTwin, records, onLogin }) => {
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [currentPhone, setCurrentPhone] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [formInitialRelationship, setFormInitialRelationship] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [intakeData, setIntakeData] = useState<IntakeData | null>(null);
  const [mcqData, setMcqData] = useState<MCQStepResponse | null>(null);
  const [finalReport, setFinalReport] = useState<TriageResponse | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [appState]);

  const triggerSave = (intake: IntakeData, report: TriageResponse) => {
    if (!isSaved) {
       onSaveRecord(intake, report);
       setIsSaved(true);
    }
  };

  const processAIResponse = (response: AIResponse) => {
    setIsFollowUpLoading(false);
    const res = response as any;
    
    // Check for MCQs first
    if (res.clarifying_questions_needed === 'YES' && res.questions && Array.isArray(res.questions) && res.questions.length > 0) {
      setMcqData({
        screen: "symptom_mcq",
        questions: res.questions,
        next_action: "Wait for input"
      });
      setAppState(AppState.MCQ_ENTRY);
      return;
    }
    
    // Check for Final Report
    if (res.symptom_summary && res.recommended_department) {
      const report = res as TriageResponse;
      setFinalReport(report);
      setAppState(AppState.RESULTS);
      
      if (intakeData) {
        const finalIntake = { ...intakeData, phoneNumber: currentPhone };
        triggerSave(finalIntake, report);
      }
      return;
    }

    // Fallback error
    throw new Error("INCOMPLETE_ASSESSMENT: Eli requires more specific symptom details to categorize your case.");
  };

  const processIntake = async (data: IntakeData) => {
    setErrorMessage(null);
    setIntakeData(data);
    setAppState(AppState.ANALYZING_INTAKE);
    
    const prompt = `Clinical Intake for ${data.fullName}. Symptoms: ${data.currentSymptoms}. Age: ${data.age}. Sex: ${data.sex}. History: ${data.conditions || 'None'}.`;

    try {
      const response = await sendMessageToTriage(prompt, selectedLanguage);
      processAIResponse(response);
    } catch (error: any) {
      setErrorMessage(error?.message || "An unknown clinical analysis error occurred.");
      setAppState(AppState.ERROR);
    }
  };

  const handleDisclaimerAccept = () => {
    setShowDisclaimer(false);
    setAppState(AppState.PATIENT_ID);
  };

  const handlePhoneSubmit = (phone: string) => {
    setCurrentPhone(phone);
    onLogin(phone);
    setAppState(AppState.SELECT_LANGUAGE);
  };

  const handleLanguageSelect = (lang: string) => {
    setSelectedLanguage(lang);
    setAppState(AppState.SELECT_PROFILE);
  };

  const handleProfileSelect = (profile: IntakeData | null, relationship?: string) => {
    if (profile) {
      setIntakeData(profile);
    } else if (relationship !== undefined) {
      setFormInitialRelationship(relationship);
    }
    setAppState(AppState.INTAKE);
  };

  const handleMcqSubmit = async (answers: Record<string, string[]>) => {
    setIsFollowUpLoading(true);
    setAppState(AppState.ANALYZING_MCQ);
    
    let summary = "Follow-up responses for context:\n";
    const currentQuestions = mcqData?.questions || [];
    
    Object.entries(answers).forEach(([qId, selectedOptIds]) => {
      const q = currentQuestions.find(item => item.id === qId);
      const optTexts = selectedOptIds.map(id => q?.options[id]).filter(Boolean);
      summary += `Question: ${q?.question} -> Answer: ${optTexts.join(', ')}\n`;
    });

    try {
      const response = await sendMessageToTriage(summary, selectedLanguage);
      processAIResponse(response);
    } catch (error: any) {
      setErrorMessage(error?.message || "Follow-up assessment failed.");
      setAppState(AppState.ERROR);
    }
  };

  const handleRestart = () => {
    resetSession();
    setFinalReport(null);
    setMcqData(null);
    setIsSaved(false);
    setAppState(AppState.SELECT_PROFILE);
  };

  return (
    <div className="space-y-6">
      {showDisclaimer && <DisclaimerModal onAccept={handleDisclaimerAccept} />}
      
      {appState === AppState.PATIENT_ID && <PatientIdentification onSubmit={handlePhoneSubmit} />}
      
      {appState === AppState.SELECT_LANGUAGE && <LanguageSelection onSelect={handleLanguageSelect} />}
      
      {appState === AppState.SELECT_PROFILE && (
        <ProfileSelection 
          phoneNumber={currentPhone} 
          existingProfiles={records.filter(r => r.intake.phoneNumber === currentPhone).map(r => r.intake)}
          onSelectProfile={handleProfileSelect}
        />
      )}
      
      {appState === AppState.INTAKE && (
        <PatientIntakeForm 
          onSubmit={processIntake} 
          isLoading={false}
          initialPhone={currentPhone}
          initialRelationship={formInitialRelationship}
          initialData={intakeData}
          selectedLanguage={selectedLanguage}
        />
      )}

      {(appState === AppState.ANALYZING_INTAKE || appState === AppState.ANALYZING_MCQ) && (
        <div className="flex flex-col items-center justify-center py-24 animate-pulse">
           <RefreshCw className="w-14 h-14 text-indigo-600 animate-spin mb-6" />
           <p className="text-slate-600 text-lg font-bold">Eli is analyzing clinical data...</p>
           <p className="text-slate-400 text-sm mt-2">Checking history and triage protocols</p>
        </div>
      )}

      {appState === AppState.MCQ_ENTRY && mcqData && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg flex items-center gap-4 animate-fade-in">
             <div className="bg-white/20 p-3 rounded-xl">
                <HelpCircle className="w-6 h-6" />
             </div>
             <div>
                <h3 className="font-bold text-lg">Additional Details Needed</h3>
                <p className="text-indigo-100 text-sm">Please answer these follow-up questions to finalize your triage.</p>
             </div>
          </div>
          <MCQQuestionnaire 
            questions={mcqData.questions} 
            onSubmit={handleMcqSubmit} 
            isLoading={isFollowUpLoading} 
          />
        </div>
      )}

      {appState === AppState.RESULTS && finalReport && (
        <div className="space-y-8 pb-20">
          <TriageReport data={finalReport} intakeData={intakeData!} />
          
          <div className="bg-white p-8 rounded-2xl border border-indigo-100 shadow-xl text-center">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Next Steps</h3>
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <button 
                onClick={onNavigateToDigitalTwin}
                className="bg-indigo-50 text-indigo-700 px-8 py-3 rounded-xl font-bold hover:bg-indigo-100 transition-all"
              >
                View History
              </button>
              <button 
                onClick={handleRestart}
                className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-900 transition-all"
              >
                New Triage
              </button>
            </div>
          </div>
        </div>
      )}

      {appState === AppState.ERROR && (
        <div className="max-w-xl mx-auto bg-rose-50 border-2 border-rose-100 p-10 rounded-3xl text-center shadow-xl shadow-rose-100/50">
          <div className="bg-rose-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-rose-600" />
          </div>
          <h3 className="text-2xl font-bold text-rose-800 mb-4">Assessment Paused</h3>
          <div className="bg-white/80 p-5 rounded-2xl text-rose-900 text-sm font-medium mb-8 border border-rose-200">
             {errorMessage}
          </div>
          
          {errorMessage?.includes('API_KEY_MISSING') && (
            <div className="mb-8 text-xs text-rose-700 bg-rose-100/50 p-4 rounded-xl text-left leading-relaxed">
               <strong>Troubleshooting steps:</strong>
               <ul className="list-decimal pl-4 mt-2 space-y-1">
                 <li>{"Go to Vercel Project Settings \u2192 Environment Variables."}</li>
                 <li>{"Add a key named API_KEY with your Gemini key as value."}</li>
                 <li>{"Crucial: Go to 'Deployments' and click 'Redeploy' on your latest build."}</li>
               </ul>
            </div>
          )}

          <button 
            onClick={() => setAppState(AppState.PATIENT_ID)}
            className="w-full bg-rose-600 text-white py-4 rounded-2xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-300 transition-all text-lg"
          >
            Retry Connection
          </button>
        </div>
      )}

      <div ref={scrollRef} />
    </div>
  );
};

export default PatientTriageView;