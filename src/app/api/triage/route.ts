import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const { details } = await request.json();

    if (!details) {
      return NextResponse.json({ error: 'Detaylar eksik' }, { status: 400 });
    }

    const prompt = `
Sen bir AFAD acil durum triyaj uzmanı ve yapay zekasısın. Gelen acil durum bildirimini analiz edip aciliyet önceliğine karar vereceksin.
Aşağıdaki metni oku ve durumun önceliğini belirle.

Kategoriler:
P1 (Kritik): Hayati tehlike, aktif kanama, kalp krizi, bilinç kaybı, göçük altında sıkışma, nefes alamama.
P2 (Acil): Kırıklar, mahsur kalma ancak şimdilik güvende olma, kanaması durdurulmuş yaralanmalar.
P3 (Hafif/Normal): Kanama yok, hafif sıyrıklar, genel korku, yiyecek/su ihtiyacı, güvende olma durumu.

Analiz edeceğin metin: "${details}"

SADECE VE SADECE AŞAĞIDAKİ JSON FORMATINDA CEVAP VER, BAŞKA HİÇBİR AÇIKLAMA VEYA MARKDOWN (\`\`\`json) KULLANMA:
{
  "priority": "P1" | "P2" | "P3",
  "reason": "Neden bu önceliği seçtiğine dair kısa, profesyonel bir türkçe cümle"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    if (!response.text) {
      throw new Error("No response text from Gemini");
    }

    const data = JSON.parse(response.text);
    return NextResponse.json(data);

  } catch (error: unknown) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: 'Analiz yapılamadı', fallback: true }, { status: 500 });
  }
}
