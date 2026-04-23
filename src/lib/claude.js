const CLAUDE_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
const MODEL = 'claude-sonnet-4-20250514'

// Sendet eine Frage an Claude und gibt die Antwort zurück
export async function askClaude(prompt, maxTokens = 1000) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    throw new Error(`Claude Fehler: ${response.status}`)
  }

  const data = await response.json()
  return data.content[0].text
}

// POLARIS System-Kontext für alle KI-Anfragen
export const POLARIS_KONTEXT = `Du bist das KI-Gehirn von POLARIS,
dem intelligenten politischen Analyse-Werkzeug der Bildbrauerei Heidelberg.
Betreiber: Jan Schlegel, Head of Politics.
Aktuelles Projekt: Jürgen Roth, OB-Wahl Villingen-Schwenningen, September 2026.
Roth kandidiert parteilos, wird von der CDU unterstützt. Kampagne in Vorbereitung.
Antworte immer auf Deutsch, präzise und aus der Perspektive eines
erfahrenen politischen Campaigners. Fokus: lokale Kommunalpolitik VS.`
