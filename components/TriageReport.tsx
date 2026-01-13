import React, { useRef, useState } from 'react';
import { TriageResponse, IntakeData } from '../types';
import { 
  AlertOctagon, 
  Hospital, 
  Activity, 
  FlaskConical, 
  HeartHandshake, 
  ClipboardList,
  Leaf,
  Download,
  Loader2,
  User,
  Droplet,
  Hourglass,
  BrainCircuit
} from 'lucide-react';

interface Props {
  data: TriageResponse;
  intakeData?: IntakeData;
}

declare global {
  interface Window {
    html2pdf: any;
  }
}

const ProbabilityBadge: React.FC<{ level: string }> = ({ level }) => {
  const colors = {
    High: 'bg-rose-100 text-rose-700 border-rose-200',
    Moderate: 'bg-amber-100 text-amber-700 border-amber-200',
    Low: 'bg-emerald-100 text-emerald-700 border-emerald-200'
  };
  const colorClass = colors[level as keyof typeof colors] || colors.Low;
  return <span className={`text-xs font-bold px-2 py-0.5 rounded border ${colorClass} uppercase tracking-wide`}>{level}</span>;
};

const TriageReport: React.FC<Props> = ({ data, intakeData }) => {
  const hasRedFlags = data.red_flags && data.red_flags.length > 0;
  const reportRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    if (!reportRef.current || !window.html2pdf) return;
    setIsDownloading(true);
    const element = reportRef.current;
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Clinical_Report_${intakeData?.fullName || 'Patient'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    try {
      await window.html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("PDF failed", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
           <BrainCircuit className="w-5 h-5 text-indigo-600" />
           <h2 className="text-lg font-bold text-slate-800">Eli's Clinical Assessment</h2>
        </div>
        <button 
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md disabled:opacity-70"
        >
          {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {isDownloading ? 'Processing...' : 'Export Report'}
        </button>
      </div>

      <div ref={reportRef} className="space-y-6 bg-slate-50 md:bg-transparent">
        {intakeData && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
             <div className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">
               <User className="w-4 h-4" /> Patient Identity
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div><span className="block text-xs text-slate-500 uppercase">Name</span><span className="font-bold text-slate-800">{intakeData.fullName}</span></div>
               <div><span className="block text-xs text-slate-500 uppercase">Age/Sex</span><span className="font-medium">{intakeData.age}Y / {intakeData.sex}</span></div>
               <div><span className="block text-xs text-slate-500 uppercase">Blood Group</span><span className="font-medium">{intakeData.bloodGroup || 'N/A'}</span></div>
               <div><span className="block text-xs text-slate-500 uppercase">Date</span><span className="font-medium">{new Date().toLocaleDateString()}</span></div>
             </div>
          </div>
        )}

        {hasRedFlags && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-5 rounded-r-lg shadow-sm">
            <h3 className="font-bold text-rose-800 flex items-center gap-2"><AlertOctagon className="w-5 h-5" /> Urgent Red Flags</h3>
            <ul className="mt-2 space-y-1">
              {data.red_flags.map((flag, idx) => <li key={idx} className="text-sm text-rose-700 flex items-start gap-2"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />{flag}</li>)}
            </ul>
          </div>
        )}

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3"><ClipboardList className="w-4 h-4" /> Eli's Symptom Synthesis</h3>
          <p className="text-slate-700 leading-relaxed">{data.symptom_summary}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4"><Activity className="w-4 h-4" /> Differential Diagnosis</h3>
            <div className="space-y-4">
              {data.probable_conditions.map((condition, idx) => (
                <div key={idx} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="flex justify-between mb-1"><span className="font-semibold text-slate-800">{condition.name}</span><ProbabilityBadge level={condition.probability} /></div>
                  <p className="text-xs text-slate-500">{condition.reason}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-5 shadow-lg text-white">
                <h3 className="flex items-center gap-2 text-indigo-100 text-xs font-bold uppercase tracking-wider mb-2"><Hospital className="w-4 h-4" /> Recommended Department</h3>
                <div className="text-2xl font-bold mb-4">{data.recommended_department}</div>
                {data.estimated_consultation_time && <div className="text-sm bg-indigo-800/50 px-3 py-1.5 rounded-lg border border-indigo-500/30">Wait Time: {data.estimated_consultation_time}</div>}
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3"><FlaskConical className="w-4 h-4" /> Tests Required</h3>
              <div className="flex flex-wrap gap-2">{data.recommended_tests.map((test, idx) => <span key={idx} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium border border-slate-200">{test}</span>)}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-sky-50 rounded-xl p-5 border border-sky-100">
            <h3 className="flex items-center gap-2 text-sm font-bold text-sky-800 uppercase tracking-wider mb-2"><HeartHandshake className="w-4 h-4" /> Eli's Clinical Advice</h3>
            <p className="text-sm text-sky-900">{data.self_care_advice}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-5 border border-green-100">
            <h3 className="flex items-center gap-2 text-sm font-bold text-green-800 uppercase tracking-wider mb-2"><Leaf className="w-4 h-4" /> Ayurvedic Suggestions</h3>
            <p className="text-sm text-green-900 whitespace-pre-wrap">{data.ayurvedic_suggestions}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TriageReport;