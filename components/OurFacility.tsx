import React from 'react';
import { 
  Building2, 
  Ambulance, 
  Activity, 
  Microscope, 
  ScanLine, 
  Scissors,
  Baby, 
  BedDouble, 
  Syringe,
  Bone,
} from 'lucide-react';

const OurFacility: React.FC = () => {
  const facilities = [
    { name: "24/7 Emergency Services", icon: Ambulance, color: "text-red-600 bg-red-50" },
    { name: "Advanced ICU & Life Support", icon: Activity, color: "text-blue-600 bg-blue-50" },
    { name: "Modular Surgical Suites", icon: Scissors, color: "text-teal-600 bg-teal-50" },
    { name: "High-Resolution Diagnostic Imaging", icon: ScanLine, color: "text-indigo-600 bg-indigo-50" },
    { name: "Fully Computerized Lab", icon: Microscope, color: "text-cyan-600 bg-cyan-50" },
    { name: "Digital Hemodialysis Unit", icon: Activity, color: "text-sky-600 bg-sky-50" },
    { name: "Maternal & Child Health Wing", icon: Baby, color: "text-pink-600 bg-pink-50" },
    { name: "Comprehensive Orthopaedics", icon: Bone, color: "text-amber-600 bg-amber-50" },
    { name: "Advanced Physiotherapy & Rehab", icon: Activity, color: "text-green-600 bg-green-50" },
    { name: "24-Hour Pharmacy Services", icon: Syringe, color: "text-purple-600 bg-purple-50" },
    { name: "Comfortable Patient Suites", icon: BedDouble, color: "text-indigo-600 bg-indigo-50" },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            Our Facility
          </h2>
          <p className="text-slate-500">State-of-the-art Medical Infrastructure</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <h3 className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-wider">Clinical Facilities & Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {facilities.map((item, idx) => {
             const Icon = item.icon;
             return (
               <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-indigo-100 transition-all group">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.color}`}>
                     <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-slate-700 text-sm group-hover:text-indigo-700">{item.name}</h4>
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );
};

export default OurFacility;