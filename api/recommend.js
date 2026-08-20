export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST 요청만 가능해요' });
    return;
  }

  const { system, query } = req.body || {};
  if (!query) {
    res.status(400).json({ error: 'query가 없어요' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: '서버에 GEMINI_API_KEY가 설정되어 있지 않아요' });
    return;
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: system || '' }]
          },
          contents: [
            { role: 'user', parts: [{ text: query }] }
          ],
          generationConfig: {
            temperature: 0.9
          }
        })
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      res.status(502).json({ error: 'Gemini 요청 실패: ' + errText });
      return;
    }

    const data = await geminiRes.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // 기존 프론트엔드가 기대하는 형식(Anthropic 스타일)에 맞춰서 응답
    res.status(200).json({
      content: [{ type: 'text', text }]
    });
  } catch (err) {
    res.status(500).json({ error: err.message || '알 수 없는 서버 오류' });
  }
}
