import React, { useState, useRef } from 'react';
import { ImageIcon, Send, Stethoscope, Activity, FileText, AlertTriangle, CheckCircle2, X, Loader2, Sparkles, BookOpen } from 'lucide-react';
import { processMedicalQuery } from './services/aiService';

export default function App() {
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
      {/* Header */}
      <header className="p-4 bg-slate-900/90 backdrop-blur sticky top-0 z-10 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-rose-600/20 text-rose-500 rounded-lg">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-base leading-tight">ER Assistant</h1>
            <p className="text-xs text-slate-400">Goldbook + Emergency Guidelines</p>
          </div>
        </div>
        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-500/20 font-medium">
          Hybrid Ready
        </span>
      </header>

      {/* Main Messages */}
      <main className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            {msg.sender === 'user' ? (
              <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none max-w-[85%] space-y-2">
                {msg.image && (
                  <img src={msg.image} alt="Upload" className="rounded-lg max-h-56 w-full object-cover border border-blue-400" />
                )}
                {msg.text && <p className="text-sm">{msg.text}</p>}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 w-full space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {msg.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}
                    <h2 className="font-semibold text-sm text-slate-200">{msg.title}</h2>
                  </div>

                  {/* Badge แหล่งที่มาของ Protocol */}
                  {msg.sourceType && (
                    <span className={`text-[10px] px-2 py-0.5 rounded border flex items-center space-x-1 ${
                      msg.sourceType === 'goldbook' 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                        : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                    }`}>
                      {msg.sourceType === 'goldbook' ? <BookOpen className="w-3 h-3 inline mr-1" /> : <Sparkles className="w-3 h-3 inline mr-1" />}
                      {msg.sourceType === 'goldbook' ? 'ER Goldbook' : 'Standard ER'}
                    </span>
                  )}
                </div>

                {/* Stage 1: ผลแปลภาพ */}
                {msg.findings && (
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center space-x-1.5 text-blue-400 text-xs font-medium">
                      <Activity className="w-3.5 h-3.5" />
                      <span>Stage 1: ผลการแปลผลภาพ (Interpretation)</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{msg.findings}</p>
                  </div>
                )}

                {/* Stage 2: แนวทางการรักษา */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center space-x-1.5 text-amber-400 text-xs font-medium">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{msg.protocolTitle || 'แนวทางปฏิบัติทางการแพทย์'}</span>
                    </div>
                    <ul className="space-y-1.5">
                      {msg.actions.map((act, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start space-x-2">
                          <span className="text-rose-400 font-bold leading-none mt-0.5">•</span>
                          <span className="leading-snug">{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-xs">กำลังวิเคราะห์ข้อมูลและดึงแนวทางรักษาฉุกเฉิน...</span>
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
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
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