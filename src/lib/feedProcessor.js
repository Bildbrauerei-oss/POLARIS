import { supabase } from './supabase'

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000

export async function saveArticles(articles) {
  if (!articles.length) return { saved: 0, skipped: 0 }

  const cutoff = new Date(Date.now() - SEVEN_DAYS)

  const filtered = articles.filter(a => {
    try { return new Date(a.datum) > cutoff } catch { return false }
  })

  const deduped = deduplicateByUrl(filtered)

  const { data: existing } = await supabase
    .from('artikel')
    .select('url')
    .in('url', deduped.map(a => a.url))

  const existingUrls = new Set((existing || []).map(e => e.url))
  const newArticles = deduped.filter(a => !existingUrls.has(a.url))

  if (!newArticles.length) return { saved: 0, skipped: deduped.length }

  const rows = newArticles.map(a => ({
    titel: a.titel?.slice(0, 500) || '',
    quelle: a.quelle?.slice(0, 200) || '',
    url: a.url?.slice(0, 1000) || '',
    datum: a.datum,
    rohtext: a.rohtext?.slice(0, 2000) || '',
    kategorie: a.kategorie || 'news',
    suchbegriff: a.suchbegriff || null,
    monitoring_liste: a.monitoring_liste || null,
    analysiert: false,
  }))

  const BATCH = 50
  let saved = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await supabase.from('artikel').insert(rows.slice(i, i + BATCH))
    if (!error) saved += Math.min(BATCH, rows.length - i)
  }

  return { saved, skipped: deduped.length - newArticles.length }
}

export async function deleteOldArticles() {
  const cutoff = new Date(Date.now() - SEVEN_DAYS)
  await supabase.from('artikel').delete().lt('datum', cutoff.toISOString())
}

function deduplicateByUrl(articles) {
  const seen = new Set()
  return articles.filter(a => {
    if (!a.url || seen.has(a.url)) return false
    seen.add(a.url)
    return true
  })
}
