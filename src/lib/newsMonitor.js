const CORS_PROXY = '/api/fetch-feed?url='

// Nur Themen — Politiker kommen über VIP-Liste gebatcht
export const DEFAULT_THEMEN = [
  'CDU Deutschland',
  'Bundesregierung Politik',
  'Wahlkampf Deutschland',
  'Migration Deutschland',
  'Wirtschaftspolitik Deutschland',
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

// VIPs in Batches von 6 zusammenfassen → "Name1" OR "Name2" OR ...
function chunkArray(arr, size) {
  const chunks = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

export async function monitorAll(vipNamen = [], extraThemen = [], monitoringListen = []) {
  const themen = [...DEFAULT_THEMEN, ...extraThemen]

  // VIPs gebatcht (6 pro Query)
  const vipBatches = chunkArray(vipNamen, 6).map(batch =>
    fetchGoogleNews(batch.map(n => `"${n}"`).join(' OR '))
  )

  const promises = [
    ...themen.map(t => fetchGoogleNews(t)),
    ...vipBatches,
    ...monitoringListen.map(l => fetchGoogleNews(l.beschreibung, l.name)),
  ]

  const results = await Promise.allSettled(promises)
  return results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
}
