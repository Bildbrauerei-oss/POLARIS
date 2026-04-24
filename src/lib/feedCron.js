import { fetchAllFeeds } from './rssAggregator'
import { monitorAll } from './newsMonitor'
import { saveArticles, deleteOldArticles } from './feedProcessor'
import { analyzeUnprocessedArticles } from './feedAnalyzer'
import { supabase } from './supabase'

const CACHE_KEY = 'polaris_feed_last_run'
const SIX_HOURS = 6 * 60 * 60 * 1000

export function shouldRun() {
  const last = localStorage.getItem(CACHE_KEY)
  if (!last) return true
  return Date.now() - parseInt(last) > SIX_HOURS
}

export async function runFeedSync(force = false) {
  if (!force && !shouldRun()) {
    return { skipped: true, reason: 'Letzter Sync vor weniger als 6 Stunden.' }
  }

  const log = []
  const errors = []

  try {
    // VIPs aus localStorage, Monitoring-Listen aus Supabase
    let extraPolitiker = []
    try {
      const stored = localStorage.getItem('polaris_vip_liste')
      extraPolitiker = stored ? JSON.parse(stored) : []
    } catch {}
    const { data: listen } = await supabase.from('monitoring_listen').select('*').eq('aktiv', true)
    const monitoringListen = listen || []

    log.push('RSS-Feeds werden abgerufen…')
    const rssArticles = await fetchAllFeeds()
    log.push(`${rssArticles.length} Artikel aus RSS-Feeds geladen.`)

    log.push('Google News wird abgerufen…')
    const newsArticles = await monitorAll(extraPolitiker, [], monitoringListen)
    log.push(`${newsArticles.length} Artikel aus Google News geladen.`)

    const all = [...rssArticles, ...newsArticles]

    log.push('Artikel werden gespeichert…')
    const { saved, skipped } = await saveArticles(all)
    log.push(`${saved} neue Artikel gespeichert, ${skipped} Duplikate übersprungen.`)

    log.push('Artikel älter als 7 Tage werden gelöscht…')
    await deleteOldArticles()

    log.push('Claude-Analyse wird gestartet…')
    // Alle unanalysierten IDs holen, in 4 Partitionen aufteilen, parallel analysieren
    const { data: unanalyzed } = await supabase
      .from('artikel').select('id').eq('analysiert', false).limit(400)
    const allIds = (unanalyzed || []).map(a => a.id)
    let totalAnalyzed = 0
    if (allIds.length > 0) {
      // In Gruppen à 20 aufteilen, dann 4 Gruppen gleichzeitig → ~4× schneller
      const chunkSize = 20
      const chunks = []
      for (let i = 0; i < allIds.length; i += chunkSize) chunks.push(allIds.slice(i, i + chunkSize))
      const parallelSize = 4
      for (let i = 0; i < chunks.length; i += parallelSize) {
        const batch = chunks.slice(i, i + parallelSize)
        const results = await Promise.allSettled(batch.map(ids => analyzeUnprocessedArticles(ids)))
        for (const r of results) {
          if (r.status === 'fulfilled') totalAnalyzed += r.value
          else errors.push(`Analyse Fehler: ${r.reason?.message || r.reason}`)
        }
      }
    }
    log.push(`${totalAnalyzed} politische Artikel analysiert (von ${allIds.length} unanalysiert).`)

    localStorage.setItem(CACHE_KEY, Date.now().toString())
    window.dispatchEvent(new CustomEvent('polaris-sync-complete'))
    log.push('Sync abgeschlossen.')

    return { success: true, log, errors }
  } catch (e) {
    errors.push(e.message)
    return { success: false, log, errors }
  }
}

export function getLastRun() {
  const ts = localStorage.getItem(CACHE_KEY)
  return ts ? new Date(parseInt(ts)) : null
}
