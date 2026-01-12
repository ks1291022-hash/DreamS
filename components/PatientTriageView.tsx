
import React, { useState, useEffect, useRef } from 'react';
import PatientIntakeForm from './PatientIntakeForm';
import PatientIdentification from './PatientIdentification';
import ProfileSelection from './ProfileSelection';
import LanguageSelection from './LanguageSelection';
import MCQQuestionnaire from './MCQQuestionnaire';
import TriageReport from './TriageReport';
import SymptomInput from './SymptomInput';
import DisclaimerModal from './DisclaimerModal';
import { sendMessageToTriage, resetSession } from '../services/geminiService';
import { TriageResponse, AppState, IntakeData, AIResponse, MCQStepResponse, PatientRecord } from '../types';
import { RefreshCw, ClipboardCheck, MessageSquare, AlertCircle } from 'lucide-react';

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
    
    if (res.clarifying_questions_needed === 'YES' && res.questions?.length > 0) {
      setMcqData({
        screen: "symptom_mcq",
        questions: res.questions,
        next_action: "Wait for input"
      });
      setAppState(AppState.MCQ_ENTRY);
      return;
    }
    
    if (res.symptom_summary) {
      const report = res as TriageResponse;
      setFinalReport(report);
      setAppState(AppState.RESULTS);
      
      if (intakeData) {
        const finalIntake = { ...intakeData, phoneNumber: currentPhone };
        triggerSave(finalIntake, report);
      }
      return;
    }

    throw new Error("The clinical engine returned an incomplete assessment.");
  };

  const processIntake = async (data: IntakeData) => {
    setErrorMessage(null);
    setIntakeData(data);
    setAppState(AppState.ANALYZING_INTAKE);
    
    const prompt = `Patient: ${data.fullName}, ${data.age}/${data.sex}. Symptoms: ${data.currentSymptoms}. History: ${data.conditions || 'None'}.`;

    try {
      const response = await sendMessageToTriage(prompt, selectedLanguage);
      processAIResponse(response);
    } catch (error: any) {
      console.error("Analysis Error:", error);
      setErrorMessage(error?.message || "An unexpected clinical error occurred.");
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
    
    const answerSummary = Object.entries(answers)
      .map(([qId, selected]) => {
        const question = mcqData?.questions.find(q => q.id === qId);
        const optionTexts = selected.map(optId => question?.options[optId]);
        return `Q: ${question?.question} A: ${optionTexts.join(', ')}`;
      })
      .join('\n');

    try {
      const response = await sendMessageToTriage(`Follow-up answers:\n${answerSummary}`, selectedLanguage);
      processAIResponse(response);
    } catch (error: any) {
      setErrorMessage(error?.message || "Analysis failed.");
      setAppState(AppState.ERROR);
    }
  };

  const handleRestart = () => {
    resetSession();
    setIntakeData(null);
    setMcqData(null);
    setFinalReport(null);
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
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
           <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
           <p className="text-slate-600 font-medium">Eli is analyzing your clinical data...</p>
        </div>
      )}

      {appState === AppState.MCQ_ENTRY && mcqData && (
        <MCQQuestionnaire 
          questions={mcqData.questions} 
          onSubmit={handleMcqSubmit} 
          isLoading={isFollowUpLoading} 
        />
      )}

      {appState === AppState.RESULTS && finalReport && (
        <div className="space-y-8 pb-20">
          <TriageReport data={finalReport} intakeData={intakeData!} />
          
          <div className="bg-white p-8 rounded-2xl border border-indigo-100 shadow-xl text-center">
            <h3 className="text-xl font-bold text-slate-800 mb-2">How can we help you further?</h3>
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <button 
                onClick={onNavigateToDigitalTwin}
                className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-6 py-3 rounded-xl font-bold hover:bg-indigo-100 transition-all border border-indigo-100"
              >
                View Digital Twin History
              </button>
              <button 
                onClick={handleRestart}
                className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-900 transition-all"
              >
                New Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {appState === AppState.ERROR && (
        <div className="bg-rose-50 border border-rose-100 p-8 rounded-2xl text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-rose-800">Assessment Paused</h3>
          <p className="text-rose-700 mt-2 mb-6">{errorMessage}</p>
          <button 
            onClick={() => setAppState(AppState.SELECT_PROFILE)}
            className="bg-rose-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-rose-700"
          >
            Try Again
          </button>
        </div>
      )}

      <div ref={scrollRef} />
    </div>
  );
};

export default PatientTriageView;
