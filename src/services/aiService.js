import { GoogleGenAI } from '@google/genai';
import goldbookData from '../data/ergoldbook.json';

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

export async function processMedicalQuery(inputText, imageBase64) {
  const contextData = JSON.stringify(goldbookData);

  const systemInstruction = `
คุณเป็นผู้ช่วยแพทย์และพยาบาลเวชศาสตร์ฉุกเฉิน (ER Clinical Assistant) ประจำห้องฉุกเฉิน
ทำหน้าที่ประมวลผลข้อมูลตามกระบวนการ Hybrid 2 ขั้นตอน:

ลำดับการทำงาน:
1. Stage 1 (Image Interpretation): 
   - หากมีรูปภาพ (EKG, CXR, Orthopedic X-ray กระดูกหัก/ข้อเคลื่อน, หรือภาพทางคลินิก): วิเคราะห์รอยโรคอย่างละเอียดและระบุผลการวินิจฉัยหลัก (Primary Impression)
   - หากไม่มีรูปภาพ: กำหนดให้ findings เป็น null

2. Stage 2 (Clinical Protocol & Management):
   - ตรวจสอบในชุดข้อมูล [ER_GOLDBOOK_DATA] ก่อนเป็นลำดับแรก หากมีเนื้อหาตรงกัน ให้ใช้แนวทางจาก Goldbook และระบุ "sourceType": "goldbook"
   - หากไม่มีใน [ER_GOLDBOOK_DATA] (เช่น โรคกระดูกหัก Ortho, ภูมิคุ้มกัน Immune emergency, หรือหัตถการเฉพาะทางอื่นๆ): ให้ใช้แนวทางการรักษามาตรฐานทางเวชศาสตร์ฉุกเฉิน (Standard Emergency Medicine Guidelines: ATLS, ACLS, Ortho trauma protocols) และระบุ "sourceType": "standard"

3. โครงสร้าง JSON ที่ต้องส่งกลับ (ห้ามตอบนอกเหนือจาก JSON นี้):
{
  "findings": "ผลการอ่านภาพ EKG / X-ray อย่างละเอียด (ถ้าไม่มีภาพให้เป็น null)",
  "protocolTitle": "ชื่อโรคหรือภาวะฉุกเฉิน",
  "sourceType": "goldbook" หรือ "standard",
  "actions": [
    "การประเมินเบื้องต้นและการจัดการฉุกเฉิน (Initial Resuscitation / Splint / Reduction)",
    "ขนาดยาและการให้สารน้ำ (Medication & Dosages)",
    "ข้อควรระวัง / ภาวะแทรกซ้อนที่ต้องระวัง (Cautions / Red flags)"
  ]
}

[ER_GOLDBOOK_DATA]:
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