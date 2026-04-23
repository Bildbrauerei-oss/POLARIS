import { supabase } from './supabase'

const CLAUDE_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
const SYSTEM_PROMPT = `Du bist ein CDU-Kampagnenanalyst. Analysiere diese Nachrichtenartikel und bewerte für jeden:
1. Sentiment für CDU: positiv/negativ/neutral
2. Relevanz für CDU: hoch/mittel/niedrig
3. Handlungsbedarf: ja/nein
4. Zusammenfassung: ein Satz auf Deutsch
Antworte nur als JSON-Array mit Feldern: id, sentiment, relevanz, handlungsbedarf, zusammenfassung`

export async function analyzeUnprocessedArticles() {
  const { data: articles, error } = await supabase
    .from('artikel')
    .select('id, titel, rohtext, quelle')
    .eq('analysiert', false)
    .limit(20)

  if (error || !articles?.length) return 0

  const input = articles.map(a => `ID:${a.id} TITEL:${a.titel} TEXT:${(a.rohtext || '').slice(0, 200)}`).join('\n---\n')

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: input }],
      }),
    })

    if (!res.ok) return 0
    const data = await res.json()
    const text = data.content[0].text

    let analyses
    try {
      const match = text.match(/\[[\s\S]*\]/)
      analyses = JSON.parse(match ? match[0] : text)
    } catch { return 0 }

    for (const a of analyses) {
      await supabase.from('artikel').update({
        sentiment: a.sentiment,
        relevanz: a.relevanz,
        handlungsbedarf: a.handlungsbedarf === 'ja' || a.handlungsbedarf === true,
        zusammenfassung: a.zusammenfassung,
        analysiert: true,
      }).eq('id', a.id)
    }

    return analyses.length
  } catch { return 0 }
}
