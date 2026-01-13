import React, { useState, useEffect } from 'react';
import { X, Printer, BrainCircuit, Link as LinkIcon, RefreshCw, QrCode } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const AccessQRModal: React.FC<Props> = ({ onClose }) => {
  const [url, setUrl] = useState('');
  const uniqueCode = "TRIAGE-PORTAL";
  
  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
        <div className="bg-indigo-600 p-6 text-center relative shrink-0">
           <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-8 h-8 text-white" />
           </div>
           <h2 className="text-xl font-bold text-white mb-1">Patient Triage</h2>
           <p className="text-indigo-100 text-xs">Self-Assessment Portal Access</p>
           <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-8 flex flex-col items-center text-center space-y-6 overflow-y-auto">
           <div className="space-y-2">
             <h3 className="text-lg font-bold text-slate-800">Scan to Start Triage</h3>
             <p className="text-slate-500 text-sm">Patients scan this code to begin their AI-powered clinical assessment.</p>
           </div>

           <div className="p-4 bg-white border-2 border-slate-900 rounded-xl shadow-sm">
             {url ? (
                <img src={qrUrl} alt="App QR Code" className="w-48 h-48 object-contain" />
             ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-slate-100"><RefreshCw className="animate-spin" /></div>
             )}
           </div>

           <div className="bg-slate-50 rounded-lg p-4 w-full border border-slate-200">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Clinic Portal ID</p>
              <code className="text-2xl font-mono font-bold text-indigo-600">{uniqueCode}</code>
           </div>

           <button onClick={() => window.print()} className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-200">
              <Printer className="w-5 h-5" />
              Print Hospital Signage
           </button>
        </div>
      </div>
    </div>
  );
};

export default AccessQRModal;