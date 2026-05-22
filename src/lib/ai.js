const MODEL = 'gemini-2.0-flash';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

async function callGemini(systemInstruction, messages, options = {}) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'AIza...your-key-here') {
    throw new Error('Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file.');
  }

  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const body = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.5,
      maxOutputTokens: options.maxOutputTokens ?? 600,
    },
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const res = await fetch(
    `${BASE_URL}/${MODEL}:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export async function chatWithAssistant(messages, { reports = [], announcements = [] } = {}) {
  const reportLines = reports
    .slice(0, 10)
    .map(r => `• [${r.type.toUpperCase()}] ${r.title} — ${r.location} (${r.priority})`)
    .join('\n');

  const annoLines = announcements
    .slice(0, 6)
    .map(a => `• [${a.priority.toUpperCase()}] ${a.title} — ${a.postedBy}`)
    .join('\n');

  const system = `You are DisasterLink AI, an emergency response assistant for Sorsogon Province, Philippines.

ACTIVE VERIFIED INCIDENTS:
${reportLines || 'None at this time.'}

OFFICIAL ANNOUNCEMENTS:
${annoLines || 'None at this time.'}

RULES:
- Be concise and use plain, simple language.
- Prioritize life safety. If someone is in immediate danger, tell them to call 911 or NDRRMC Hotline: 0918-912-2665.
- Reference active incidents or announcements when relevant.
- Give practical, actionable guidance.
- PDRRMO Sorsogon hotline: (056) 211-XXXX`;

  return callGemini(system, messages, { temperature: 0.7, maxOutputTokens: 450 });
}

export async function analyzeReport(type, title, description) {
  const prompt = `Analyze this disaster incident report from Sorsogon Province, Philippines.

Incident Type: ${type}
Title: "${title}"
Description: "${description}"

Respond with ONLY valid JSON — no extra text:
{
  "suggestedTitle": "clear improved title, max 85 chars",
  "suggestedPriority": "critical|high|medium|low",
  "analysis": "1-2 sentence situation assessment",
  "keyInfo": "most critical detail responders need to know"
}

Priority guide: critical = immediate life threat, high = urgent hazard, medium = developing situation, low = minor.`;

  const content = await callGemini(null, [{ role: 'user', content: prompt }], {
    temperature: 0.3,
    maxOutputTokens: 280,
  });

  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Unexpected AI response format.');
  return JSON.parse(match[0]);
}

export async function draftAnnouncement(situation, priority, affectedAreas) {
  const areas = affectedAreas.length ? affectedAreas.join(', ') : 'Sorsogon Province';

  const prompt = `You are a government official at PDRRMO/LGU writing a formal emergency announcement for Sorsogon Province, Philippines.

Situation: ${situation}
Priority: ${priority}
Affected Areas: ${areas}

Write a formal official announcement. Respond with ONLY valid JSON — no extra text:
{
  "title": "formal announcement title, max 100 chars",
  "content": "full announcement body, 200-400 chars, with specific instructions and resources for residents"
}`;

  const content = await callGemini(null, [{ role: 'user', content: prompt }], {
    temperature: 0.4,
    maxOutputTokens: 380,
  });

  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Unexpected AI response format.');
  return JSON.parse(match[0]);
}
