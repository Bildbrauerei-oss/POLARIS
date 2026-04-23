const CORS_PROXY = '/api/fetch-feed?url='

export const DEFAULT_POLITIKER = [
  'Friedrich Merz',
  'Olaf Scholz',
  'Robert Habeck',
  'Christian Lindner',
  'Alice Weidel',
  'Markus Söder',
  'Hendrik Wüst',
  'Daniel Günther',
]

export const DEFAULT_THEMEN = [
  'Migration',
  'Wirtschaft Deutschland',
  'CDU',
  'Bundesregierung',
  'Wahlkampf',
]

function googleNewsUrl(query) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=de&gl=DE&ceid=DE:de`
}

async function fetchGoogleNews(query, monitoringListe = null) {
  try {
    const url = CORS_PROXY + encodeURIComponent(googleNewsUrl(query))
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    return parseGoogleNews(text, query, monitoringListe)
  } catch {
    return []
  }
}

function parseGoogleNews(xml, query, monitoringListe = null) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  const items = doc.querySelectorAll('item')
  const results = []

  items.forEach(item => {
    const title = item.querySelector('title')?.textContent?.trim()
    const link = item.querySelector('link')?.textContent?.trim()
    const pubDate = item.querySelector('pubDate')?.textContent?.trim()
    const source = item.querySelector('source')?.textContent?.trim()

    if (!title || !link) return
    results.push({
      titel: title,
      quelle: source || 'Google News',
      url: link,
      datum: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      rohtext: '',
      kategorie: monitoringListe ? 'monitoring' : 'google_news',
      suchbegriff: query,
      monitoring_liste: monitoringListe || null,
    })
  })

  return results
}

export async function monitorAll(extraPolitiker = [], extraThemen = [], monitoringListen = []) {
  const politiker = [...DEFAULT_POLITIKER, ...extraPolitiker]
  const themen = [...DEFAULT_THEMEN, ...extraThemen]

  const promises = [
    ...politiker.map(p => fetchGoogleNews(p)),
    ...themen.map(t => fetchGoogleNews(t)),
    ...monitoringListen.map(l => fetchGoogleNews(l.beschreibung, l.name)),
  ]

  const results = await Promise.allSettled(promises)
  return results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
}
