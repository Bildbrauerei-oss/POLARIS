import { pickFeeds, googleNewsFeed } from './regionalpresse'

export async function discoverFeeds({ ort, bundesland }) {
  const feeds = pickFeeds(ort, bundesland)
  const results = []

  for (const feed of feeds) {
    try {
      const response = await fetch(feed.rss, { method: 'HEAD', mode: 'no-cors' })
      results.push({
        ...feed,
        status: response.ok ? 'green' : 'yellow',
        items: feed.items,
      })
    } catch {
      results.push({ ...feed, status: 'yellow', items: -1 })
    }
  }

  return results
}

export async function fetchDemografie({ ort, bundesland }) {
  try {
    const wikiResponse = await fetch(
      `https://de.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(ort)}&prop=extracts&exintro&format=json&origin=*`
    )
    const wikiData = await wikiResponse.json()
    const pages = wikiData.query.pages
    const page = Object.values(pages)[0]

    if (page && !page.missing) {
      return {
        status: 'green',
        daten: {
          titel: page.title,
          extract: page.extract?.slice(0, 300),
          wikiUrl: `https://de.wikipedia.org/wiki/${encodeURIComponent(ort)}`,
          einwohner: extractEinwohner(page.extract),
        },
        quellen: [
          { name: 'Statistisches Bundesamt', url: 'https://www.destatis.de', hint: 'Amtliche Statistiken' },
          { name: 'Wikipedia', url: page.extract ? `https://de.wikipedia.org/wiki/${encodeURIComponent(ort)}` : '', hint: 'Überblick' },
        ],
      }
    }
  } catch (e) {
    console.warn('Wikipedia lookup failed:', e)
  }

  return {
    status: 'red',
    daten: null,
    quellen: [],
  }
}

export async function discoverGemeinderat({ ort }) {
  const urls = [
    `https://${ort.toLowerCase().replace(/\s+/g, '')}.de/gemeinderat`,
    `https://${ort.toLowerCase().replace(/\s+/g, '')}.de/stadt/gemeinderat`,
    `https://${ort.toLowerCase().replace(/\s+/g, '')}.de/ratsinformation`,
  ]

  const results = []
  for (const url of urls) {
    try {
      const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' })
      if (response.ok || response.status === 405) {
        results.push({ url, status: 'green' })
      }
    } catch {
      // Silent fail
    }
  }

  return results.length > 0
    ? results
    : [{ url: `https://${ort.toLowerCase()}.de/ratsinformation`, status: 'red' }]
}

export async function inferGegenkandidaten({ ort, bundesland, wahltyp, wahldatum, kandidat }) {
  try {
    const response = await fetch('/api/claude-infer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ort,
        bundesland,
        wahltyp,
        wahldatum,
        kandidat,
      }),
    })

    const data = await response.json()
    return {
      status: data.gegenkandidaten?.length > 0 ? 'green' : 'yellow',
      kandidaten: data.gegenkandidaten || [],
    }
  } catch (e) {
    console.warn('Gegenkandidaten inference failed:', e)
    return { status: 'yellow', kandidaten: [] }
  }
}

export async function runOnboarding(kampagne, onProgress) {
  onProgress('feeds')
  const feeds = await discoverFeeds({ ort: kampagne.ort, bundesland: kampagne.bundesland })

  onProgress('demografie')
  const demografie = await fetchDemografie({ ort: kampagne.ort, bundesland: kampagne.bundesland })

  onProgress('gemeinderat')
  const gemeinderat = await discoverGemeinderat({ ort: kampagne.ort })

  onProgress('gegenkandidaten')
  const gegenkandidaten = await inferGegenkandidaten({
    ort: kampagne.ort,
    bundesland: kampagne.bundesland,
    wahltyp: kampagne.wahltyp,
    wahldatum: kampagne.wahldatum,
    kandidat: kampagne.kandidat,
  })

  return {
    feeds,
    demografie,
    gemeinderat,
    gegenkandidaten,
  }
}

export function dataAgeDays(timestamp) {
  const now = Date.now()
  const days = Math.floor((now - timestamp) / (1000 * 60 * 60 * 24))
  return days
}

export function summarizeStatus(daten) {
  const statuses = [
    ...(daten.feeds || []).map(f => f.status),
    daten.demografie?.status,
    ...(daten.gemeinderat || []).map(g => g.status),
    daten.gegenkandidaten?.status,
  ].filter(Boolean)

  return {
    green: statuses.filter(s => s === 'green').length,
    yellow: statuses.filter(s => s === 'yellow').length,
    red: statuses.filter(s => s === 'red').length,
  }
}

function extractEinwohner(text) {
  if (!text) return null
  const match = text.match(/(\d+(?:\.\d+)?)\s*(?:Mio\.|Millionen|Einwohner)/)
  return match ? match[1] : null
}
