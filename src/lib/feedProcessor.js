import { supabase } from './supabase'

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000
const MAX_ARTICLES = 800

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

  // Die 300 neuesten pro Sync-Runde speichern
  const toSave = newArticles
    .sort((a, b) => new Date(b.datum) - new Date(a.datum))
    .slice(0, 300)

  const rows = toSave.map(a => ({
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

  return { saved, skipped: deduped.length - toSave.length }
}

export async function deleteOldArticles() {
  // Artikel älter als 7 Tage löschen
  const cutoff = new Date(Date.now() - SEVEN_DAYS)
  await supabase.from('artikel').delete().lt('datum', cutoff.toISOString())

  // Auf max. 150 Artikel trimmen — älteste zuerst löschen
  const { data: all } = await supabase
    .from('artikel')
    .select('id')
    .order('datum', { ascending: false })

  if (all && all.length > MAX_ARTICLES) {
    const toDelete = all.slice(MAX_ARTICLES).map(a => a.id)
    await supabase.from('artikel').delete().in('id', toDelete)
  }
}

function deduplicateByUrl(articles) {
  const seen = new Set()
  const titlesSeen = new Set()
  return articles.filter(a => {
    if (!a.url || seen.has(a.url)) return false
    // Titel normalisieren für Duplikat-Check
    const normalTitle = a.titel?.toLowerCase().replace(/[^a-zäöüß0-9]/g, '').slice(0, 60)
    if (normalTitle && titlesSeen.has(normalTitle)) return false
    seen.add(a.url)
    if (normalTitle) titlesSeen.add(normalTitle)
    return true
  })
}
