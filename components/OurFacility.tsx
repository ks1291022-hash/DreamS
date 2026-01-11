
import React from 'react';
import { 
  Building2, 
  Ambulance, 
  Activity, 
  Microscope, 
  ScanLine, 
  Stethoscope, 
  Baby, 
  BedDouble, 
  Utensils, 
  ShieldCheck,
  Syringe,
  Eye,
  Bone,
  Scissors,
  Award,
  CheckCircle
} from 'lucide-react';

const OurFacility: React.FC = () => {
  const facilities = [
    { name: "Emergency 24 Hour Service (Casualty)", icon: Ambulance, color: "text-red-600 bg-red-50" },
    { name: "Ambulance 24 Hours", icon: Ambulance, color: "text-orange-600 bg-orange-50" },
    { name: "NICU, ICU with Ventilators", icon: Activity, color: "text-blue-600 bg-blue-50" },
    { name: "Operation Theater / Labour Room", icon: Scissors, color: "text-teal-600 bg-teal-50" },
    { name: "32 Slice CT Scan", icon: ScanLine, color: "text-indigo-600 bg-indigo-50" },
    { name: "X-Ray, ECG, Ultrasound", icon: Activity, color: "text-violet-600 bg-violet-50" },
    { name: "Fully Computerized Laboratory", icon: Microscope, color: "text-cyan-600 bg-cyan-50" },
    { name: "Dialysis Unit", icon: Activity, color: "text-sky-600 bg-sky-50" },
    { name: "General & Laparoscopic Surgery", icon: Scissors, color: "text-emerald-600 bg-emerald-50" },
    { name: "Obstetric & Gynaecology", icon: Baby, color: "text-pink-600 bg-pink-50" },
    { name: "Paediatrics", icon: Baby, color: "text-rose-600 bg-rose-50" },
    { name: "Medicine (MD Physician)", icon: Stethoscope, color: "text-blue-600 bg-blue-50" },
    { name: "Orthopaedics (Joint Replacement & Trauma)", icon: Bone, color: "text-amber-600 bg-amber-50" },
    { name: "ENT & Ophthalmology (Eye)", icon: Eye, color: "text-lime-600 bg-lime-50" },
    { name: "Dental", icon: Stethoscope, color: "text-teal-600 bg-teal-50" },
    { name: "Modern Physiotherapy Unit", icon: Activity, color: "text-green-600 bg-green-50" },
    { name: "Pharmacy", icon: Syringe, color: "text-purple-600 bg-purple-50" },
    { name: "AC Private Rooms", icon: BedDouble, color: "text-indigo-600 bg-indigo-50" },
    { name: "Canteen (Diet for Indoor Patients)", icon: Utensils, color: "text-orange-600 bg-orange-50" },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            Our Facilities
          </h2>
          <p className="text-slate-500">Comprehensive Care & Infrastructure at J.C. Juneja Hospital</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-indigo-100 shadow-sm shrink-0 self-start md:self-center">
            <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                <Award className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">NABH Accredited</span>
        </div>
      </div>

      {/* Empanelments Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <ShieldCheck className="w-8 h-8 text-emerald-200" />
             <h3 className="text-2xl font-bold">Cashless Treatment Available</h3>
          </div>
          <p className="text-emerald-100 mb-6 max-w-2xl">
            We are proud to be <strong>NABH Accredited</strong> and empaneled with major government schemes to provide accessible, high-quality healthcare to everyone.
          </p>
          <div className="flex flex-wrap gap-4">
             <div className="bg-white/20 backdrop-blur-md border border-white/30 px-6 py-3 rounded-xl font-bold text-lg flex items-center gap-2 shadow-sm">
                <span className="bg-white text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">✓</span>
                Ayushman Bharat
             </div>
             <div className="bg-white/20 backdrop-blur-md border border-white/30 px-6 py-3 rounded-xl font-bold text-lg flex items-center gap-2 shadow-sm">
                <span className="bg-white text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">✓</span>
                State Government Schemes
             </div>
             <div className="bg-indigo-600/40 backdrop-blur-md border border-indigo-400/30 px-6 py-3 rounded-xl font-bold text-lg flex items-center gap-2 shadow-sm">
                <Award className="w-5 h-5 text-indigo-200" />
                NABH Certified
             </div>
          </div>
        </div>
      </div>

      {/* Facilities Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6 uppercase tracking-wider border-b border-slate-100 pb-2">
          Medical Infrastructure & Services
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {facilities.map((item, idx) => {
             const Icon = item.icon;
             return (
               <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50 transition-all group">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.color} group-hover:scale-110 transition-transform`}>
                     <Icon className="w-5 h-5" />
                  </div>
                  <div>
                     <h4 className="font-semibold text-slate-700 text-sm md:text-base group-hover:text-indigo-700 transition-colors">
                        {item.name}
                     </h4>
                  </div>
               </div>
             );
           })}
        </div>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
             <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-indigo-900">Quality Assurance</h4>
             </div>
             <p className="text-indigo-800 text-sm mb-4">
               Our <strong>NABH Accreditation</strong> is a testament to our commitment to patient safety and quality of care. We follow rigorous national standards for healthcare delivery.
             </p>
             <div className="flex gap-2 text-indigo-700 font-semibold text-xs uppercase tracking-wide">
                <span className="bg-white px-3 py-1 rounded-md shadow-sm">Patient Safety</span>
                <span className="bg-white px-3 py-1 rounded-md shadow-sm">Quality Care</span>
             </div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
             <h4 className="font-bold text-amber-900 mb-2">Diagnostic Excellence</h4>
             <p className="text-amber-800 text-sm mb-4">
               Our diagnostic wing is equipped with advanced 32 Slice CT Scan, Ultrasound, Digital X-Ray, and a fully computerized pathology laboratory.
             </p>
             <div className="flex gap-2 text-amber-700 font-semibold text-xs uppercase tracking-wide">
                <span className="bg-white px-3 py-1 rounded-md shadow-sm">Advanced Imaging</span>
                <span className="bg-white px-3 py-1 rounded-md shadow-sm">24/7 Lab</span>
             </div>
          </div>
      </div>

    </div>
  );
};

export default OurFacility;
