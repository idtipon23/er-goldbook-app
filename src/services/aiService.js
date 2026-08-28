import { GoogleGenAI } from '@google/genai';
import MiniSearch from 'minisearch';
import goldbookData from '../data/ergoldbook.json';

// สร้าง Search Index ใน Memory ครั้งเดียวเมื่อแอปโหลด (ความเร็วระดับ 0.005 วินาที)
const miniSearch = new MiniSearch({
  fields: ['title', 'category', 'content'], // ฟิลด์ที่ใช้ค้นหา
  storeFields: ['id', 'title', 'category', 'content', 'url'], // ฟิลด์ที่ส่งกลับ
  searchOptions: {
    boost: { title: 4, category: 2, content: 1 }, // ให้น้ำหนักชื่อหัวข้อมากที่สุด
    fuzzy: 0.2, // รองรับการพิมพ์ผิดเล็กน้อย
    prefix: true, // ค้นหาแบบคำขึ้นต้นอัตโนมัติ
  },
});

// ทำการ Index ข้อมูลทั้งหมด 497 บทความทันที
miniSearch.addAll(goldbookData);

// ฟังก์ชันดึงบทความที่เกี่ยวข้องที่สุดอย่างแม่นยำ
function searchGoldbook(queryText, limit = 3) {
  if (!queryText || queryText.trim() === '') {
    return goldbookData.slice(0, limit).map((item) => ({
      title: item.title,
      category: item.category,
      content: item.content ? item.content.substring(0, 3500) : '',
      url: item.url,
    }));
  }

  const results = miniSearch.search(queryText);

  if (results.length > 0) {
    return results.slice(0, limit).map((res) => ({
      title: res.title,
      category: res.category,
      content: res.content ? res.content.substring(0, 3500) : '',
      url: res.url,
    }));
  }

  // กรณีคำค้นหายังไม่ตรงเป๊ะ ให้ดึงรายการเริ่มต้น
  return goldbookData.slice(0, limit).map((item) => ({
    title: item.title,
    category: item.category,
    content: item.content ? item.content.substring(0, 3500) : '',
    url: item.url,
  }));
}

export async function processMedicalQuery(inputText, imageBase64) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return {
      findings: null,
      protocolTitle: 'ยังไม่ได้ตั้งค่า API Key',
      sourceType: 'standard',
      actions: ['กรุณาตรวจสอบการตั้งค่า VITE_GEMINI_API_KEY ใน Environment Variables ของ Vercel หรือไฟล์ .env'],
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  // 1. ค้นหาบทความที่ตรงเป๊ะที่สุดผ่าน MiniSearch (ใช้เวลาไม่ถึง 5 มิลลิวินาที)
  const matchedProtocols = searchGoldbook(inputText, 3);
  const contextData = JSON.stringify(matchedProtocols);

  const hasImage = Boolean(imageBase64);

  // 2. Dynamic Model Routing:
  // - มีรูปภาพ (EKG, CXR, Ortho X-ray): ใช้ gemini-3.6-flash เพื่อความแม่นยำทางภาพสูงสุด
  // - ข้อความล้วน: ใช้ gemini-3.5-flash-lite เพื่อความเร็วสูงสุด (Ultra-fast latency)
  const selectedModel = hasImage ? 'gemini-3.6-flash' : 'gemini-3.5-flash-lite';

  const systemInstruction = `
คุณเป็นผู้ช่วยแพทย์และพยาบาลเวชศาสตร์ฉุกเฉิน (ER Clinical Assistant) ประจำห้องฉุกเฉิน
ตอบคำถามอย่างกระชับ รวดเร็ว ตรงประเด็น ปลอดภัย และอ้างอิงข้อมูลที่ให้มาเป็นหลัก

ลำดับการทำงาน:
1. Stage 1 (Image): 
   - หากมีรูปภาพ (EKG, CXR, Orthopedic X-ray): วิเคราะห์และระบุ Primary Impression ใน findings
   - หากไม่มีภาพ: กำหนดให้ findings เป็น null

2. Stage 2 (Protocol & Management):
   - ตรวจสอบและสังเคราะห์เนื้อหาจาก [RELEVANT_ER_GOLDBOOK_DATA] เป็นอันดับแรก สรุปขั้นตอนปฏิบัติ ขนาดยา และการจัดการตาม Goldbook และระบุ "sourceType": "goldbook"
   - หากคำถามไม่อยู่ในข้อมูลที่ให้: ให้ใช้แนวทางมาตรฐาน EM (Standard Emergency Medicine Guidelines) และระบุ "sourceType": "standard"

3. ส่งกลับโครงสร้าง JSON เท่านั้น:
{
  "findings": "ผลการอ่านภาพรังสี/EKG อย่างละเอียด (ถ้าไม่มีภาพให้เป็น null)",
  "protocolTitle": "ชื่อโรค/ภาวะฉุกเฉิน/หัตถการ",
  "sourceType": "goldbook" หรือ "standard",
  "actions": [
    "การประเมินเบื้องต้นและการจัดการฉุกเฉิน (Initial Assessment & Resuscitation)",
    "ขนาดยาและการให้สารน้ำ (Medications, Dosages & Route)",
    "ข้อควรระวัง / ภาวะแทรกซ้อนที่ต้องระวัง / Red flags"
  ]
}

[RELEVANT_ER_GOLDBOOK_DATA]:
${contextData}
`;

  try {
    const contents = [];

    if (hasImage) {
      const base64Data = imageBase64.split(',')[1] || imageBase64;
      contents.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data,
        },
      });
    }

    if (inputText) {
      contents.push(inputText);
    } else {
      contents.push('กรุณาวิเคราะห์ภาพตรวจนี้และแนะนำแนวทางการจัดการฉุกเฉิน');
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error('API Error:', error);
    return {
      findings: null,
      protocolTitle: 'เกิดข้อผิดพลาดในการประมวลผล',
      sourceType: 'standard',
      actions: ['ไม่สามารถประมวลผลได้ กรุณาลองใหม่อีกครั้ง'],
    };
  }
}