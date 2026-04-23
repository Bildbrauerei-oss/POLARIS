import { supabase } from './supabase'

const CLAUDE_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

const SYSTEM_PROMPT = `Du bist ein politischer Medienanalyst für die CDU Deutschland. Analysiere Nachrichtenartikel.

Für jeden Artikel bestimme:
1. ist_politisch: Ist der Artikel politisch relevant für Deutschland? (true/false)
   false = Sport, Unterhaltung, Lifestyle, Reisen, Kochen, Kultur, Promi-News etc.
   true = Politik, Wirtschaftspolitik, Gesellschaft, Wahlen, Parteien, Regierung etc.
2. sentiment: allgemeiner Ton (positiv/negativ/neutral)
3. cdu_wirkung: Wie wirkt diese Nachricht auf die CDU? (positiv/negativ/neutral)
4. relevanz: CDU-Relevanz (hoch/mittel/niedrig)
5. handlungsbedarf: Braucht CDU eine Reaktion? (true/false)
6. zusammenfassung: Ein prägnanter Satz auf Deutsch

Antworte NUR als JSON-Array: [{"id":"...","ist_politisch":true,"sentiment":"...","cdu_wirkung":"...","relevanz":"...","handlungsbedarf":false,"zusammenfassung":"..."}]`

export async function analyzeUnprocessedArticles() {
  const { data: articles, error: fetchError } = await supabase
    .from('artikel')
    .select('id, titel, rohtext, quelle')
    .eq('analysiert', false)
    .limit(15)

  if (fetchError) throw new Error(`Supabase fetch: ${fetchError.message}`)
  if (!articles?.length) return 0

  const input = articles.map(a =>
    `ID:${a.id} TITEL:${a.titel} TEXT:${(a.rohtext || '').slice(0, 300)}`
  ).join('\n---\n')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: input }],
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Claude API ${res.status}: ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  const text = data.content?.[0]?.text
  if (!text) throw new Error('Claude: leere Antwort')

  const match = text.match(/\[[\s\S]*\]/)
  if (!match) throw new Error(`Claude: kein JSON gefunden. Antwort: ${text.slice(0, 100)}`)

  let analyses
  try {
    analyses = JSON.parse(match[0])
  } catch (e) {
    throw new Error(`JSON parse fehler: ${e.message}`)
  }

  // Nicht-politische Artikel löschen
  const nonPolitical = analyses.filter(a => !a.ist_politisch).map(a => a.id)
  if (nonPolitical.length > 0) {
    await supabase.from('artikel').delete().in('id', nonPolitical)
  }

  // Politische Artikel speichern
  const political = analyses.filter(a => a.ist_politisch)
  for (const a of political) {
    const { error: updateError } = await supabase.from('artikel').update({
      ist_politisch: true,
      sentiment: a.sentiment,
      cdu_wirkung: a.cdu_wirkung,
      relevanz: a.relevanz,
      handlungsbedarf: a.handlungsbedarf === 'ja' || a.handlungsbedarf === true,
      zusammenfassung: a.zusammenfassung,
      analysiert: true,
    }).eq('id', a.id)
    if (updateError) throw new Error(`Update fehler: ${updateError.message}`)
  }

  return political.length
}
