import React, { useState, useRef, useEffect } from 'react';
import { 
  ImageIcon, Send, Stethoscope, Activity, FileText, 
  AlertTriangle, CheckCircle2, X, Loader2, Sparkles, BookOpen,
  ZoomIn, ZoomOut
} from 'lucide-react';
import { processMedicalQuery } from './services/aiService';

// =========================================================================
// ⭐ ตารางขนาดตัวอักษร 4 ระดับ (ปกติ, ปานกลาง, ใหญ่, ใหญ่พิเศษ)
// =========================================================================
const FONT_LEVELS = [
  { name: 'ปกติ', body: 'text-xs', title: 'text-sm', desc: 'text-xs', badge: 'text-[10px]' },
  { name: 'ปานกลาง', body: 'text-sm', title: 'text-base', desc: 'text-sm', badge: 'text-xs' },
  { name: 'ใหญ่', body: 'text-base', title: 'text-lg', desc: 'text-base', badge: 'text-xs' },
  { name: 'ใหญ่พิเศษ', body: 'text-lg', title: 'text-xl', desc: 'text-lg', badge: 'text-sm' },
];

// =========================================================================
// ⭐ คอมโพเนนต์ DisclaimerModal
// =========================================================================
function DisclaimerModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
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

// =========================================================================
// ⭐ หน้าจอหลักของแอปพลิเคชัน (App)
// =========================================================================
export default function App() {
  // ค่าเริ่มต้นตั้งไว้ที่ระดับ 1 (ปานกลาง) เพื่อให้อ่านง่ายขึ้นตั้งแต่แรก
  const [fontIndex, setFontIndex] = useState(() => {
    const saved = localStorage.getItem('er_goldbook_font_index');
    return saved !== null ? Number(saved) : 1;
  });

  const font = FONT_LEVELS[fontIndex] || FONT_LEVELS[1];

  const handleDecreaseFont = () => {
    if (fontIndex > 0) {
      const next = fontIndex - 1;
      setFontIndex(next);
      localStorage.setItem('er_goldbook_font_index', next.toString());
    }
  };

  const handleIncreaseFont = () => {
    if (fontIndex < FONT_LEVELS.length - 1) {
      const next = fontIndex + 1;
      setFontIndex(next);
      localStorage.setItem('er_goldbook_font_index', next.toString());
    }
  };

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'system',
      title: 'ER Clinical Assistant (Hybrid Mode)',
      findings: null,
      sourceType: 'goldbook',
      protocolTitle: 'ระบบพร้อมทำงานแบบครอบคลุมทุกโรคฉุกเฉิน',
      actions: [
        'โหมด Goldbook: อ้างอิง Protocol ตามชุดข้อมูล ER Goldbook ในเครื่อง',
        'โหมด Standard AI: รองรับ Ortho กระดูกหัก, แผลฉุกเฉิน, ระบบภูมิคุ้มกัน และโรคทั่วไปตามมาตรฐาน ER',
        'แนบภาพ EKG, X-ray ปอด หรือ X-ray กระดูก เพื่อแปลผลและรับแนวทางได้ทันที'
      ],
      type: 'info'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!inputText && !selectedImage) || loading) return;

    const queryText = inputText.trim();
    const queryImage = selectedImage;

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: 'user', text: queryText, image: queryImage }
    ]);
    
    setInputText('');
    setSelectedImage(null);
    setLoading(true);

    const result = await processMedicalQuery(queryText, queryImage);

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + 1,
        sender: 'system',
        title: result.protocolTitle || 'ผลการประมวลผล',
        findings: result.findings,
        sourceType: result.sourceType || 'standard',
        protocolTitle: result.protocolTitle,
        actions: result.actions || [],
        type: 'warning'
      }
    ]);

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between max-w-md mx-auto border-x border-slate-800 font-sans">
      
      <DisclaimerModal />

      {/* Header พร้อมปุ่มปรับขนาดตัวอักษร A- / A+ */}
      <header className="p-3.5 bg-slate-900/95 backdrop-blur sticky top-0 z-10 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-rose-600/20 text-rose-500 rounded-lg">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-100 leading-tight">ER Assistant</h1>
            <p className="text-[11px] text-slate-400">Goldbook + Guidelines</p>
          </div>
        </div>

        {/* ปุ่มปรับขนาด Font Size */}
        <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={handleDecreaseFont}
            disabled={fontIndex === 0}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 rounded-lg text-slate-200 text-xs font-bold transition active:scale-95"
            title="ลดขนาดตัวอักษร"
          >
            A-
          </button>
          <span className="text-[11px] px-1.5 font-medium text-amber-400 min-w-[40px] text-center">
            {font.name}
          </span>
          <button
            onClick={handleIncreaseFont}
            disabled={fontIndex === FONT_LEVELS.length - 1}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 rounded-lg text-slate-200 text-xs font-bold transition active:scale-95"
            title="เพิ่มขนาดตัวอักษร"
          >
            A+
          </button>
        </div>
      </header>

      {/* Main Messages */}
      <main className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            {msg.sender === 'user' ? (
              <div className="bg-blue-600 text-white p-3.5 rounded-2xl rounded-tr-none max-w-[85%] space-y-2">
                {msg.image && (
                  <img src={msg.image} alt="Upload" className="rounded-lg max-h-56 w-full object-cover border border-blue-400" />
                )}
                {msg.text && <p className={`${font.body} leading-relaxed font-medium`}>{msg.text}</p>}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 w-full space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    {msg.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}
                    <h2 className={`font-bold ${font.title} text-slate-100`}>{msg.title}</h2>
                  </div>

                  {msg.sourceType && (
                    <span className={`${font.badge} px-2 py-0.5 rounded border shrink-0 flex items-center space-x-1 ${
                      msg.sourceType === 'goldbook' 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                        : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                    }`}>
                      {msg.sourceType === 'goldbook' ? <BookOpen className="w-3 h-3 inline mr-1" /> : <Sparkles className="w-3 h-3 inline mr-1" />}
                      {msg.sourceType === 'goldbook' ? 'Goldbook' : 'Standard ER'}
                    </span>
                  )}
                </div>

                {/* Stage 1: ผลแปลภาพ */}
                {msg.findings && (
                  <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-blue-400 font-semibold text-xs">
                      <Activity className="w-4 h-4 shrink-0" />
                      <span>Stage 1: ผลการแปลผลภาพ (Interpretation)</span>
                    </div>
                    <p className={`${font.desc} text-slate-200 leading-relaxed whitespace-pre-line font-normal`}>
                      {msg.findings}
                    </p>
                  </div>
                )}

                {/* Stage 2: แนวทางการรักษา */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-2.5">
                    <div className="flex items-center space-x-1.5 text-amber-400 font-semibold text-xs">
                      <FileText className="w-4 h-4 shrink-0" />
                      <span>{msg.protocolTitle || 'แนวทางปฏิบัติทางการแพทย์'}</span>
                    </div>
                    <ul className="space-y-2">
                      {msg.actions.map((act, idx) => (
                        <li key={idx} className={`${font.desc} text-slate-200 flex items-start space-x-2.5 leading-relaxed`}>
                          <span className="text-rose-400 font-bold leading-none mt-1 shrink-0">•</span>
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3 text-slate-300">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500 shrink-0" />
            <span className={`${font.body}`}>กำลังวิเคราะห์ข้อมูลและดึงแนวทางรักษาฉุกเฉิน...</span>
          </div>
        )}
      </main>

      {/* Image Preview */}
      {selectedImage && (
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src={selectedImage} alt="Preview" className="w-12 h-12 object-cover rounded-md border border-slate-700" />
            <span className="text-xs text-slate-300">แนบภาพตรวจแล้ว</span>
          </div>
          <button onClick={() => setSelectedImage(null)} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Control Footer */}
      <footer className="p-3 bg-slate-900 border-t border-slate-800">
        <div className="flex items-center space-x-2">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition shrink-0 disabled:opacity-50"
            title="เลือกภาพ EKG / X-ray"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputText}
            disabled={loading}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="พิมพ์โรค, กระดูกหัก, หรืออาการฉุกเฉิน..."
            className={`flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 ${font.body} text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50`}
          />

          <button
            onClick={handleSend}
            disabled={(!inputText && !selectedImage) || loading}
            className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
}