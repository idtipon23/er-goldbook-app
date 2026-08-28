import { GoogleGenAI } from '@google/genai';
import goldbookData from '../data/ergoldbook.json';

// ฟังก์ชันค้นหาบทความที่เกี่ยวข้องที่สุดจาก 497 บทความ เพื่อควบคุมขนาด Token
function getRelevantProtocols(queryText, maxResults = 6) {
  if (!queryText || queryText.trim() === '') {
    return goldbookData.slice(0, 6);
  }

  const terms = queryText
    .toLowerCase()
    .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);

  if (terms.length === 0) {
    return goldbookData.slice(0, maxResults);
  }

  const scored = goldbookData.map((item) => {
    let score = 0;
    const title = (item.title || '').toLowerCase();
    const category = (item.category || '').toLowerCase();
    const content = (item.content || '').toLowerCase();

    for (const term of terms) {
      if (title.includes(term)) score += 15;
      if (category.includes(term)) score += 8;
      
      const count = (content.match(new RegExp(term, 'g')) || []).length;
      score += Math.min(count, 5);
    }

    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const matched = scored.filter((s) => s.score > 0);
  if (matched.length > 0) {
    return matched.slice(0, maxResults).map((s) => s.item);
  }

  return goldbookData.slice(0, maxResults);
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

  // คัดเลือกเฉพาะเนื้อหา Goldbook ที่ตรงกับคำถาม/เคส
  const relevantProtocols = getRelevantProtocols(inputText, 6);
  const contextData = JSON.stringify(relevantProtocols);

  const systemInstruction = `
คุณเป็นผู้ช่วยแพทย์และพยาบาลเวชศาสตร์ฉุกเฉิน (ER Clinical Assistant) ประจำห้องฉุกเฉิน
ทำหน้าที่ประมวลผลข้อมูลตามกระบวนการ 2 ขั้นตอน:

ลำดับการทำงาน:
1. Stage 1 (Image Interpretation): 
   - หากมีรูปภาพ (EKG, CXR, Orthopedic X-ray กระดูกหัก/ข้อเคลื่อน, หรือภาพรอยโรคทางคลินิก): วิเคราะห์รอยโรคอย่างละเอียดและระบุผลการวินิจฉัยหลัก (Primary Impression)
   - หากไม่มีรูปภาพ: กำหนดให้ findings เป็น null

2. Stage 2 (Clinical Protocol & Management):
   - ตรวจสอบแนวทางการรักษาจาก [RELEVANT_ER_GOLDBOOK_DATA] เป็นอันดับแรก หากพบแนวทางที่ตรงกัน ให้สรุปขั้นตอนปฏิบัติ ขนาดยา และการจัดการตาม Goldbook และระบุ "sourceType": "goldbook"
   - หากไม่พบในข้อมูลที่ให้มา: ให้ใช้แนวทางการรักษามาตรฐานทางเวชศาสตร์ฉุกเฉิน (Standard Emergency Medicine Guidelines) และระบุ "sourceType": "standard"

3. โครงสร้าง JSON ที่ต้องส่งกลับ (ห้ามตอบนอกเหนือจากรูปแบบ JSON นี้):
{
  "findings": "ผลการอ่านภาพ EKG / X-ray / รอยโรคอย่างละเอียด (ถ้าไม่มีภาพให้เป็น null)",
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

    if (imageBase64) {
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
      model: 'gemini-3.6-flash',
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
      actions: ['ไม่สามารถประมวลผลได้ กรุณาตรวจสอบ API Key หรือการเชื่อมต่อเครือข่าย'],
    };
  }
}