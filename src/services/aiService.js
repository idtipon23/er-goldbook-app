import { GoogleGenAI } from '@google/genai';
import goldbookData from '../data/ergoldbook.json';

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
  const contextData = JSON.stringify(goldbookData);

  const systemInstruction = `
คุณเป็นผู้ช่วยแพทย์และพยาบาลเวชศาสตร์ฉุกเฉิน (ER Clinical Assistant) ประจำห้องฉุกเฉิน
ทำหน้าที่ประมวลผลข้อมูลตามกระบวนการ 2 ขั้นตอน:

ลำดับการทำงาน:
1. Stage 1 (Image Interpretation): 
   - หากมีรูปภาพ (EKG, CXR, Orthopedic X-ray กระดูกหัก/ข้อเคลื่อน, หรือภาพรอยโรคทางคลินิก): วิเคราะห์รอยโรคอย่างละเอียดและระบุผลการวินิจฉัยหลัก (Primary Impression)
   - หากไม่มีรูปภาพ: กำหนดให้ findings เป็น null

2. Stage 2 (Clinical Protocol & Management):
   - ค้นหาและจับคู่หัวข้อที่ตรงกันในชุดข้อมูล [ER_GOLDBOOK_DATABASE] เป็นอันดับแรก สรุปขั้นตอนปฏิบัติ ขนาดยา หัตถการ และข้อควรระวังตามที่ระบุไว้ในเนื้อหาของ ER Goldbook และระบุ "sourceType": "goldbook"
   - หากไม่พบใน [ER_GOLDBOOK_DATABASE]: ให้ใช้แนวทางการรักษามาตรฐานทางเวชศาสตร์ฉุกเฉิน (Standard Emergency Medicine Guidelines) และระบุ "sourceType": "standard"

3. โครงสร้าง JSON ที่ต้องส่งกลับ (ห้ามตอบนอกเหนือจากรูปแบบ JSON นี้):
{
  "findings": "ผลการอ่านภาพ EKG / X-ray / รอยโรคอย่างละเอียด (ถ้าไม่มีภาพให้เป็น null)",
  "protocolTitle": "ชื่อโรค/ภาวะฉุกเฉิน/หัตถการ",
  "sourceType": "goldbook" หรือ "standard",
  "actions": [
    "การประเมินเบื้องต้นและการจัดการฉุกเฉิน (Initial Resuscitation / Splint / Reduction / Assessment)",
    "ขนาดยาและการให้สารน้ำ (Medications, Dosages & Route)",
    "ข้อควรระวัง / ภาวะแทรกซ้อน / Red flags"
  ]
}

[ER_GOLDBOOK_DATABASE]:
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