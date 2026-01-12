
import React, { useState, useEffect, useRef } from 'react';
import PatientIntakeForm from './PatientIntakeForm';
import PatientIdentification from './PatientIdentification';
import ProfileSelection from './ProfileSelection';
import LanguageSelection from './LanguageSelection';
import MCQQuestionnaire from './MCQQuestionnaire';
import TriageReport from './TriageReport';
import SymptomInput from './SymptomInput';
import DisclaimerModal from './DisclaimerModal';
import ClarificationRequest from './ClarificationRequest';
import { sendMessageToTriage, resetSession } from '../services/geminiService';
import { TriageResponse, AppState, IntakeData, AIResponse, MCQStepResponse, PatientRecord } from '../types';
import { RefreshCw, ClipboardCheck, UserCog, MessageSquare, Save, Edit, HelpCircle, AlertCircle } from 'lucide-react';

interface Props {
  onSaveRecord: (intake: IntakeData, triage: TriageResponse) => void;
  onNavigateToDigitalTwin: () => void;
  records: PatientRecord[];
  onLogin: (phone: string) => void;
}

const PatientTriageView: React.FC<Props> = ({ onSaveRecord, onNavigateToDigitalTwin, records, onLogin }) => {
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);
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
    resetSession();
  }, [appState]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [appState, mcqData, finalReport]);

  const triggerSave = (intake: IntakeData, report: TriageResponse) => {
    if (!isSaved) {
       onSaveRecord(intake, report);
       setIsSaved(true);
    }
  };

  const processAIResponse = (response: AIResponse) => {
    setIsFollowUpLoading(false);
    
    // Fix: Use any-casting or property checks to handle the AIResponse union type correctly
    const res = response as any;
    
    // Logic to handle MCQ steps
    if (res.clarifying_questions_needed === 'YES' && res.questions) {
      setMcqData(res as MCQStepResponse);
      setAppState(AppState.MCQ_ENTRY);
      return;
    }
    
    // Logic to handle final report
    if (res.symptom_summary) {
      const report = res as TriageResponse;
      setFinalReport(report);
      setAppState(AppState.RESULTS);
      
      if (report.clarifying_questions_needed === 'NO' && intakeData) {
        const finalIntake = { ...intakeData, phoneNumber: currentPhone };
        triggerSave(finalIntake, report);
      }
      return;
    }
  };

  const processIntake = async (data: IntakeData) => {
    setErrorMessage(null);
    setIntakeData(data);
    setAppState(AppState.ANALYZING_INTAKE);
    
    const prompt = `
      NEW PATIENT: ${data.fullName} (${data.age}/${data.sex}).
      SYMPTOMS: ${data.currentSymptoms}.
      HISTORY: ${data.conditions}.
    `;

    try {
      const response = await sendMessageToTriage(prompt, selectedLanguage);
      processAIResponse(response);
    } catch (error: any) {
      setErrorMessage(error?.message || "An unknown clinical analysis error occurred.");
      setAppState(AppState.ERROR);
    }
  };

  const handleDisclaimerAccept = () => {
    setHasAcceptedDisclaimer(true);
    setShowDisclaimer(false);
    setAppState(AppState.PATIENT_ID);
  };

  const handlePhoneSubmit = (phone: string) => {
    const cleanPhone = phone.trim();
    setCurrentPhone(cleanPhone);
    onLogin(cleanPhone);
    setAppState(AppState.SELECT_LANGUAGE);
  };

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setAppState(AppState.SELECT_PROFILE);
  };

  const handleProfileSelect = (profile: IntakeData | null, relationship?: string) => {
      if (profile) {
          setIntakeData({ ...profile, phoneNumber: currentPhone, currentSymptoms: '' });
          setAppState(AppState.QUICK_INTAKE);
      } else {
          setFormInitialRelationship(relationship || '');
          setIntakeData(null);
          setAppState(AppState.INTAKE);
      }
  };

  const handleIntakeSubmit = async (data: IntakeData) => {
    const consistentData = { ...data, phoneNumber: currentPhone };
    processIntake(consistentData);
  };

  const handleQuickIntakeSubmit = async (symptoms: string) => {
    if (!intakeData) return;
    const updatedIntake = { ...intakeData, phoneNumber: currentPhone, currentSymptoms: symptoms };
    processIntake(updatedIntake);
  };

  const handleMCQSubmit = async (answers: Record<string, string[]>) => {
    setErrorMessage(null);
    setIsFollowUpLoading(true);
    setAppState(AppState.ANALYZING_MCQ);
    
    let answerString = "FOLLOW-UP ANSWERS:\n";
    const questionsToMap = finalReport?.questions || mcqData?.questions || [];

    questionsToMap.forEach(q => {
        const selectedIds = answers[q.id] || [];
        const selectedTexts = selectedIds.map(id => (q.options as any)[id]).join(", ");
        answerString += `Q: ${q.question} -> A: ${selectedTexts}\n`;
    });

    try {
      const response = await sendMessageToTriage(answerString, selectedLanguage);
      processAIResponse(response);
    } catch (error: any) {
      setErrorMessage(error?.message || "An error occurred during follow-up analysis.");
      setAppState(AppState.ERROR);
    }
  };

  const handleManualSave = () => {
    if (finalReport && intakeData) {
        const finalIntake = { ...intakeData, phoneNumber: currentPhone };
        onSaveRecord(finalIntake, finalReport);
        setIsSaved(true);
    }
  };

  const handleReset = () => {
    setErrorMessage(null);
    resetSession();
    setIntakeData(null);
    setMcqData(null);
    setFinalReport(null);
    setHasAcceptedDisclaimer(false);
    setShowDisclaimer(true);
    setCurrentPhone('');
    setSelectedLanguage('English');
    setIsSaved(false);
    setAppState(AppState.IDLE);
    onLogin('');
  };

  const existingUserRecords = records.filter(r => r.intake.phoneNumber === currentPhone);
  const uniqueProfilesMap = new Map<string, IntakeData>();
  existingUserRecords.forEach(r => {
      if (!uniqueProfilesMap.has(r.intake.fullName.toLowerCase())) {
          uniqueProfilesMap.set(r.intake.fullName.toLowerCase(), r.intake);
      }
  });
  const uniqueProfiles = Array.from(uniqueProfilesMap.values());

  return (
    <div className="pb-32 relative">
        {showDisclaimer && (
          <DisclaimerModal onAccept={handleDisclaimerAccept} />
        )}

        <div className="flex justify-center mb-8">
           <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${[AppState.INTAKE, AppState.SELECT_PROFILE, AppState.SELECT_LANGUAGE, AppState.QUICK_INTAKE, AppState.PATIENT_ID].includes(appState) ? 'bg-teal-600 w-8' : 'bg-slate-300'} transition-all duration-300`}/>
              <span className={`h-2 w-2 rounded-full ${appState === AppState.MCQ_ENTRY ? 'bg-teal-600 w-8' : 'bg-slate-300'} transition-all duration-300`}/>
              <span className={`h-2 w-2 rounded-full ${appState === AppState.RESULTS ? 'bg-teal-600 w-8' : 'bg-slate-300'} transition-all duration-300`}/>
           </div>
        </div>

        {appState === AppState.PATIENT_ID && (
          <PatientIdentification onSubmit={handlePhoneSubmit} />
        )}

        {appState === AppState.SELECT_LANGUAGE && (
          <LanguageSelection onSelect={handleLanguageSelect} />
        )}

        {appState === AppState.SELECT_PROFILE && (
            <ProfileSelection 
                phoneNumber={currentPhone}
                existingProfiles={uniqueProfiles}
                onSelectProfile={handleProfileSelect}
            />
        )}

        {appState === AppState.QUICK_INTAKE && intakeData && (
           <div className="max-w-3xl mx-auto animate-fade-in-up">
              <div className="bg-teal-700 rounded-2xl p-8 text-white shadow-xl mb-8">
                 <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4 mb-4">
                        <div>
                        <h2 className="text-2xl font-bold">Welcome, {intakeData.fullName.split(' ')[0]}</h2>
                        <p className="text-teal-100 italic">Eli is initializing your clinical intake...</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setAppState(AppState.INTAKE)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-teal-600/50 hover:bg-teal-600 rounded-lg text-xs font-medium border border-teal-500 transition-colors"
                    >
                        <Edit className="w-3 h-3" />
                        Edit Profile
                    </button>
                 </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
                 <h3 className="text-lg font-bold text-slate-800 mb-4">What medical concerns do you have today?</h3>
                 <SymptomInput 
                    onSubmit={handleQuickIntakeSubmit} 
                    isLoading={false} 
                    isFollowUp={false} 
                 />
              </div>
           </div>
        )}

        {appState === AppState.INTAKE && (
          <PatientIntakeForm 
            onSubmit={handleIntakeSubmit} 
            isLoading={false} 
            initialPhone={currentPhone}
            initialRelationship={formInitialRelationship}
            initialData={intakeData}
            selectedLanguage={selectedLanguage}
          />
        )}
        
        {appState === AppState.ANALYZING_INTAKE && (
          <div className="text-center py-20 animate-pulse">
            <ClipboardCheck className="w-12 h-12 text-teal-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700">Eli is Assessing History...</h3>
          </div>
        )}

        {appState === AppState.MCQ_ENTRY && (mcqData || finalReport?.questions) && (
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-slate-800 mb-6 px-2">Clinical Follow-up Assessment</h3>
            <MCQQuestionnaire 
                questions={mcqData?.questions || finalReport?.questions || []} 
                onSubmit={handleMCQSubmit} 
                isLoading={false} 
            />
          </div>
        )}

        {appState === AppState.ANALYZING_MCQ && (
          <div className="text-center py-20 animate-pulse">
            <div className="flex gap-2 justify-center mb-4">
                <div className="w-4 h-4 bg-teal-600 rounded-full animate-bounce delay-0"></div>
                <div className="w-4 h-4 bg-teal-600 rounded-full animate-bounce delay-150"></div>
                <div className="w-4 h-4 bg-teal-600 rounded-full animate-bounce delay-300"></div>
             </div>
            <h3 className="text-xl font-semibold text-slate-700">Finalizing Triage Recommendation...</h3>
          </div>
        )}

        {appState === AppState.RESULTS && finalReport && (
          <div className="space-y-8 relative">
            {finalReport.clarifying_questions_needed === 'NO' ? (
              <TriageReport data={finalReport} intakeData={intakeData || undefined} />
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 overflow-hidden animate-fade-in-up">
                  <div className="bg-indigo-600 p-6 text-white flex items-center gap-4">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <HelpCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Comprehensive Assessment</h3>
                      <p className="text-indigo-100 text-sm">To provide a final hospital recommendation, please answer these critical follow-up questions.</p>
                    </div>
                  </div>
                  
                  <div className="p-8">
                    <MCQQuestionnaire 
                      questions={finalReport.questions} 
                      onSubmit={handleMCQSubmit} 
                      isLoading={isFollowUpLoading} 
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center pt-8">
               <button 
                 onClick={handleReset}
                 className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-medium"
               >
                 <RefreshCw className="w-4 h-4" />
                 Start New Assessment
               </button>
            </div>
          </div>
        )}

        {appState === AppState.ERROR && (
           <div className="text-center py-20">
              <div className="bg-red-50 text-red-600 p-8 rounded-2xl border border-red-100 max-w-md mx-auto shadow-xl">
                 <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-6 h-6" />
                 </div>
                 <h3 className="font-bold text-lg mb-2">Assessment Failed</h3>
                 <p className="text-sm text-red-800 mb-4">Eli encountered an error while processing your data.</p>
                 
                 {errorMessage && (
                    <div className="bg-white/50 p-3 rounded-lg border border-red-200 text-left mb-6 overflow-hidden">
                       <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Error Detail:</p>
                       <p className="text-xs font-mono break-words">{errorMessage}</p>
                    </div>
                 )}
                 
                 <button 
                    onClick={handleReset}
                    className="w-full bg-red-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                 >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                 </button>
              </div>
           </div>
        )}
        
        <div ref={scrollRef} />
    </div>
  );
};

export default PatientTriageView;
