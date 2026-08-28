import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function cleanHtml(html) {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<h[1-6][^>]*>/gi, '\n### ')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

async function fetchAllData() {
  console.log('🔄 เริ่มต้นดึงข้อมูล ER Goldbook ฉบับสมบูรณ์ (Posts + Pages)...');
  
  const allEntries = [];

  // 1. ดึง Blog Posts ทั้งหมด (ทยอยดึงทีละ 50 เพื่อไม่ให้โดนตัด)
  let startIndex = 1;
  const pageSize = 50;
  let totalPosts = 0;

  console.log('\n--- กำลังดาวน์โหลด Blog Posts (469 บทความ) ---');
  while (true) {
    const url = `https://ergoldbook.blogspot.com/feeds/posts/default?alt=json&max-results=${pageSize}&start-index=${startIndex}`;
    try {
      const res = await fetch(url);
      if (!res.ok) break;
      const data = await res.json();
      
      totalPosts = parseInt(data.feed.openSearch$totalResults.$t, 10);
      const entries = data.feed.entry || [];
      if (entries.length === 0) break;

      allEntries.push(...entries);
      console.log(`📥 โหลดแล้ว ${allEntries.length} / ${totalPosts} บทความ...`);

      startIndex += entries.length; // ขยับ index ตามจำนวนจริงที่ได้รับมา
      if (allEntries.length >= totalPosts) break;
    } catch (err) {
      console.error('Error fetching posts:', err.message);
      break;
    }
  }

  // 2. ดึง Static Pages ทั้งหมด (หมวด Ortho, Trauma, Procedures, etc.)
  console.log('\n--- กำลังดาวน์โหลด Static Pages (หมวดหมู่เฉพาะทาง) ---');
  try {
    const pagesUrl = `https://ergoldbook.blogspot.com/feeds/pages/default?alt=json&max-results=50`;
    const resPages = await fetch(pagesUrl);
    if (resPages.ok) {
      const dataPages = await resPages.json();
      const pageEntries = dataPages.feed.entry || [];
      console.log(`📄 พบหน้าเฉพาะทาง (Pages) ทั้งหมด ${pageEntries.length} หน้า`);
      allEntries.push(...pageEntries);
    }
  } catch (err) {
    console.error('Error fetching pages:', err.message);
  }

  console.log(`\n✅ รวมข้อมูลที่รวบรวมได้ทั้งหมด: ${allEntries.length} รายการ`);

  // แปลงข้อมูลเป็น JSON
  const structuredData = allEntries.map((entry, index) => {
    const title = entry.title?.$t || 'Untitled';
    const rawContent = entry.content?.$t || entry.summary?.$t || '';
    const cleanContent = cleanHtml(rawContent);
    const categories = entry.category ? entry.category.map((c) => c.term) : ['General Emergency'];
    const postUrl = entry.link?.find((l) => l.rel === 'alternate')?.href || '';

    return {
      id: `goldbook_item_${index + 1}`,
      title: title,
      category: categories.join(', '),
      keywords: categories,
      content: cleanContent,
      url: postUrl,
    };
  });

  const outputPath = path.join(__dirname, 'src', 'data', 'ergoldbook.json');
  fs.writeFileSync(outputPath, JSON.stringify(structuredData, null, 2), 'utf-8');

  const stats = fs.statSync(outputPath);
  console.log(`🎉 บันทึกข้อมูลลงใน ${outputPath} เรียบร้อย!`);
  console.log(`📊 ขนาดไฟล์ข้อมูลรวม: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
}

fetchAllData();