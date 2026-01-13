import React, { useState, useRef } from 'react';
import { PatientRecord } from '../types';
import TriageReport from './TriageReport';
import { LayoutDashboard, Search, Clock, Eye, X, DownloadCloud, Loader2, FileText, BrainCircuit } from 'lucide-react';

interface Props {
  records: PatientRecord[];
}

declare global {
  interface Window {
    html2pdf: any;
  }
}

const DoctorPortal: React.FC<Props> = ({ records }) => {
  const [selectedRecord, setSelectedRecord] = useState<PatientRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const filteredRecords = records.filter(r => 
    r.intake.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.intake.phoneNumber.includes(searchTerm)
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Critical': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Urgent': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  const handleExportData = async () => {
    if (!window.html2pdf) return;
    setIsExporting(true);
    
    const originalTable = document.getElementById('patient-records-table');
    if (!originalTable) {
        setIsExporting(false);
        return;
    }

    const clone = originalTable.cloneNode(true) as HTMLElement;
    clone.style.width = '100%';
    clone.style.background = 'white';
    
    const titleDiv = document.createElement('div');
    titleDiv.innerHTML = `
      <div style="padding: 20px; text-align: center; border-bottom: 2px solid #eee; margin-bottom: 20px;">
        <h1 style="font-size: 24px; font-weight: bold; color: #4f46e5;">Clinical Dashboard Report</h1>
        <p style="color: #64748b;">Consolidated Triage Analytics Report</p>
        <p style="font-size: 10px; color: #94a3b8;">Generated: ${new Date().toLocaleString()}</p>
      </div>
    `;
    clone.insertBefore(titleDiv, clone.firstChild);

    const opt = {
      margin: 10,
      filename: `Clinical_Analytics_Report_${new Date().toISOString().slice(0,10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    try {
        await window.html2pdf().set(opt).from(clone).save();
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col animate-fade-in relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-indigo-600" />
            Doctor Portal
          </h2>
          <p className="text-slate-500">Clinical Triage Dashboard</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
             <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search clinical records..." 
               className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <button 
            onClick={handleExportData}
            disabled={isExporting || records.length === 0}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-70"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
            <span className="hidden md:inline">Export Analytics</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col relative">
        <div className="overflow-x-auto flex-1">
          <div id="patient-records-table" className="min-w-full">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="p-4 font-bold text-slate-700">Triage ID</th>
                    <th className="p-4 font-bold text-slate-700">Clinical Identity</th>
                    <th className="p-4 font-bold text-slate-700">Demographics</th>
                    <th className="p-4 font-bold text-slate-700">Acuity</th>
                    <th className="p-4 font-bold text-slate-700">Pathology/Dept</th>
                    <th className="p-4 font-bold text-slate-700">Timestamp</th>
                    <th className="p-4 font-bold text-slate-700 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400">
                        <FileText className="w-8 h-8 mx-auto opacity-20 mb-2" />
                        No clinical records available.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-mono text-xs text-slate-500">{record.id}</td>
                        <td className="p-4">
                           <div className="font-bold text-slate-800">{record.intake.fullName}</div>
                           <div className="text-[10px] text-slate-400">{record.intake.phoneNumber}</div>
                        </td>
                        <td className="p-4 text-slate-600">{record.intake.age}Y / {record.intake.sex}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border ${getStatusColor(record.status)}`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-700 font-medium">
                            {record.triage.recommended_department}
                        </td>
                        <td className="p-4 text-slate-500 text-xs">
                            {new Date(record.timestamp).toLocaleString()}
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={() => setSelectedRecord(record)} className="bg-indigo-50 text-indigo-600 p-2 rounded-lg"><Eye className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
          </div>
        </div>
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
             <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <BrainCircuit className="w-6 h-6 text-indigo-600" />
                   <div>
                      <h3 className="font-bold text-slate-800">Clinical Record: {selectedRecord.intake.fullName}</h3>
                      <p className="text-xs text-slate-500">Clinical Synthesis by Eli</p>
                   </div>
                </div>
                <button onClick={() => setSelectedRecord(null)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                 <TriageReport data={selectedRecord.triage} intakeData={selectedRecord.intake} />
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPortal;