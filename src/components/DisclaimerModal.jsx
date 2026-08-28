import React, { useState, useEffect } from 'react';

export default function DisclaimerModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // ตรวจสอบว่าเคยยินยอมไปแล้วหรือยังในเครื่องนี้
    const hasAccepted = localStorage.getItem('er_goldbook_disclaimer_accepted');
    if (!hasAccepted) {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('er_goldbook_disclaimer_accepted', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-200">
        
        {/* Header Icon & Title */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xl font-bold">
            ⚠️
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              ข้อตกลงและข้อสงวนสิทธิ์ทางการแพทย์
            </h2>
            <p className="text-xs text-slate-400">ER Goldbook AI Clinical Decision Support</p>
          </div>
        </div>

        {/* Medical Disclaimer Body */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 text-xs leading-relaxed text-slate-300 space-y-3 mb-5 max-h-60 overflow-y-auto">
          <p>
            <strong className="text-amber-400">คำเตือนด้านการรักษา (Medical Disclaimer):</strong><br />
            แอปพลิเคชันนี้จัดทำขึ้นเพื่อเป็น <em>เครื่องมือช่วยสนับสนุนการตัดสินใจทางคลินิก (Clinical Decision Support) และทบทวนแนวทางการดูแลผู้ป่วยฉุกเฉินเบื้องต้นเท่านั้น</em>
          </p>
          <p>
            • <strong>มิใช่เครื่องมือแพทย์</strong> สำหรับการวินิจฉัยโรคขั้นเด็ดขาด<br />
            • <strong>ไม่สามารถนำมาใช้ทดแทน</strong> ดุลยพินิจ การตรวจประเมินทางคลินิก หรือการตัดสินใจรักษาของแพทย์และบุคลากรทางการแพทย์ผู้ดูแลผู้ป่วยได้<br />
            • ผู้ใช้งานโปรดใช้วิจารณญาณทางวิชาชีพและยึดถือความปลอดภัยของผู้ป่วยเป็นสำคัญสูงสุด
          </p>
        </div>

        {/* Attribution & Credits */}
        <div className="border-t border-slate-800 pt-3 pb-4 text-xs space-y-1.5 text-slate-400">
          <div className="flex items-center justify-between">
            <span>📖 เนื้อหาอ้างอิง:</span>
            <a 
              href="https://ergoldbook.blogspot.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-amber-400 hover:underline font-medium"
            >
              นพ. รังสฤษฎ์ รังสรรค์ (ER Goldbook)
            </a>
          </div>
          <div className="flex items-center justify-between">
            <span>💻 ผู้พัฒนาระบบ:</span>
            <span className="text-emerald-400 font-medium">พว. ไชยพศ เหลาชำนิ (Developer)</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleAccept}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-semibold text-sm rounded-xl transition duration-150 shadow-lg shadow-emerald-900/40 flex items-center justify-center space-x-2"
        >
          <span>รับทราบและเข้าสู่ระบบ</span>
          <span>➔</span>
        </button>

      </div>
    </div>
  );
}