// Onboarding-Datenakquise: RSS-Feeds, Demografie, Wahlergebnisse, Gemeinderat, Gegenkandidaten
// Alles "Best Effort" — Status pro Datenpunkt: 'green' (gefunden), 'yellow' (unsicher), 'red' (nicht gefunden)

import { pickFeeds, googleNewsFeed } from './regionalpresse'

const PROXY = (url) => `/api/fetch-feed?url=${encodeURIComponent(url)}`
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

// ──────────────────────────────────────────────────────────────────────────
// 1) RSS-Feeds lokaler Medien
// ──────────────────────────────────────────────────────────────────────────
export async function discoverFeeds({ ort, bundesland }) {
  const candidates = pickFeeds(ort, bundesland)
  const checked = await Promise.all(candidates.slice(0, 8).map(async f => {
    try {
      const r = await fetch(PROXY(f.rss), { signal: AbortSignal.timeout(7000) })
      if (!r.ok) return { ...f, status: 'red', items: 0 }
      const xml = await r.text()
      const itemCount = (xml.match(/<item[\s>]/g) || []).length + (xml.match(/<entry[\s>]/g) || []).length
      return { ...f, status: itemCount > 0 ? 'green' : 'yellow', items: itemCount }
    } catch {
      return { ...f, status: 'red', items: 0 }
    }
  }))
  // Google News-Feed als universeller Fallback
  const gFeed = googleNewsFeed(`"${ort}"`)
  checked.push({ name: 'Google News (Lokalsuche)', rss: gFeed, scope: 'fallback', status: 'green', items: -1 })
  return checked
}

// ──────────────────────────────────────────────────────────────────────────
// 2) Demografie via Wikipedia REST API (zuverlässig für deutsche Gemeinden)
// ──────────────────────────────────────────────────────────────────────────
export async function fetchDemografie({ ort, bundesland }) {
  const result = { quellen: [], daten: {}, status: 'red' }

  // Wikipedia-Lookup
  try {
    const url = `https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(ort)}`
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (r.ok) {
      const data = await r.json()
      result.daten.beschreibung = data.extract || ''
      result.daten.wikiUrl = data.content_urls?.desktop?.page
      result.daten.titel = data.title
      // Versuche Einwohner-Info aus extract zu parsen
      const einwMatch = data.extract?.match(/(\d{1,3}(?:[.\s]\d{3})*|\d{4,})\s*Einwohner/i)
      if (einwMatch) result.daten.einwohner = einwMatch[1].replace(/[.\s]/g, '')
      result.quellen.push({ name: 'Wikipedia', url: data.content_urls?.desktop?.page, ts: Date.now() })
      result.status = 'green'
    }
  } catch { /* ignore */ }

  // Statistik-BW (nur Baden-Württemberg, optional)
  if (bundesland === 'Baden-Württemberg') {
    result.quellen.push({
      name: 'Statistisches Landesamt BW',
      url: `https://www.statistik-bw.de/SRDB/?R=GS${encodeURIComponent(ort)}`,
      ts: Date.now(),
      hint: 'manuelle Recherche möglich',
    })
  }

  // Zensus 2022 — keine offene API; Link für manuelle Abfrage
  result.quellen.push({
    name: 'Zensus 2022',
    url: `https://ergebnisse.zensus2022.de/datenbank/online/statistic/1000A/details`,
    ts: Date.now(),
    hint: 'manuelle Abfrage erforderlich',
  })

  if (result.status === 'red' && result.quellen.length > 0) result.status = 'yellow'
  return result
}

// ──────────────────────────────────────────────────────────────────────────
// 3) Gemeinderat / kommunale Quellen
// ──────────────────────────────────────────────────────────────────────────
export async function discoverGemeinderat({ ort }) {
  const slug = ort.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

  const candidates = [
    `https://www.${slug}.de/`,
    `https://www.${slug}.de/gemeinderat`,
    `https://www.${slug}.de/rathaus/gemeinderat`,
    `https://www.${slug}.de/buergerservice/ratsinformationssystem`,
    `https://${slug}.ratsinfomanagement.net/`,
    `https://sessionnet.krz.de/${slug}/bi/`,
    `https://buergerinfo.${slug}.de/`,
  ]

  const checked = []
  for (const url of candidates) {
    try {
      const r = await fetch(PROXY(url), { signal: AbortSignal.timeout(5000) })
      const reachable = r.ok
      checked.push({ url, status: reachable ? 'green' : 'red' })
      if (reachable && checked.filter(c => c.status === 'green').length >= 2) break
    } catch {
      checked.push({ url, status: 'red' })
    }
  }
  return checked
}

// ──────────────────────────────────────────────────────────────────────────
// 4) Gegenkandidaten + Wahlergebnisse via Claude (mit Web-Wissen)
// ──────────────────────────────────────────────────────────────────────────
export async function inferGegenkandidaten({ ort, bundesland, wahltyp, wahldatum, kandidat }) {
  if (!API_KEY) return { kandidaten: [], status: 'red', error: 'Kein API-Key' }

  const prompt = `Recherchiere die wahrscheinlichen Gegenkandidaten für die ${wahltyp} in ${ort} (${bundesland})${wahldatum ? `, Wahltag ${wahldatum}` : ''}.

Mein Kandidat: ${kandidat || '(noch nicht bekannt)'}.

Liefere:
1. Eine Liste der bekannten oder wahrscheinlich antretenden Gegenkandidaten (Name, Partei, Position/Hintergrund, falls bekannt).
2. Falls keine Kandidaten bekannt sind: schreibe "UNBEKANNT" und nenne den typischen Personenkreis (Amtsinhaber, lokale Parteivorsitzende, etc.).
3. Letzte vergleichbare Wahl: Datum und Ergebnis kurz.

Antwort als JSON, ausschließlich JSON, ohne Markdown:
{
  "kandidaten": [{"name": "...", "partei": "...", "info": "..."}],
  "letzte_wahl": {"datum": "...", "sieger": "...", "ergebnis": "..."},
  "konfidenz": "hoch" | "mittel" | "niedrig"
}`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: AbortSignal.timeout(30000),
      headers: {
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await res.json()
    const text = data.content?.[0]?.text || ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return { kandidaten: [], status: 'red', raw: text }
    const parsed = JSON.parse(match[0])
    return {
      ...parsed,
      status: parsed.konfidenz === 'hoch' ? 'green' : parsed.konfidenz === 'mittel' ? 'yellow' : 'red',
    }
  } catch (e) {
    return { kandidaten: [], status: 'red', error: e.message }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 5) Aggregierter Onboarding-Run
// ──────────────────────────────────────────────────────────────────────────
export async function runOnboarding(grunddaten, onProgress) {
  const result = { ts: Date.now(), grunddaten }

  onProgress?.('feeds')
  result.feeds = await discoverFeeds(grunddaten)

  onProgress?.('demografie')
  result.demografie = await fetchDemografie(grunddaten)

  onProgress?.('gemeinderat')
  result.gemeinderat = await discoverGemeinderat(grunddaten)

  onProgress?.('gegenkandidaten')
  result.gegenkandidaten = await inferGegenkandidaten(grunddaten)

  onProgress?.('done')
  return result
}

// Status-Aggregation: Wie viele grün/gelb/rot insgesamt
export function summarizeStatus(daten) {
  const counts = { green: 0, yellow: 0, red: 0 }
  if (!daten) return counts
  if (daten.feeds) {
    daten.feeds.forEach(f => { counts[f.status] = (counts[f.status] || 0) + 1 })
  }
  if (daten.demografie) counts[daten.demografie.status] = (counts[daten.demografie.status] || 0) + 1
  if (daten.gemeinderat) {
    const ok = daten.gemeinderat.some(g => g.status === 'green')
    counts[ok ? 'green' : 'red']++
  }
  if (daten.gegenkandidaten) counts[daten.gegenkandidaten.status] = (counts[daten.gegenkandidaten.status] || 0) + 1
  return counts
}

// Datenalter in Tagen
export function dataAgeDays(ts) {
  if (!ts) return null
  return Math.floor((Date.now() - ts) / 86400000)
}
