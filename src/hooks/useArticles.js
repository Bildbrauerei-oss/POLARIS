import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useArticles({ kategorie, sentiment, cduWirkung, handlungsbedarf, monitoringListe, suchbegriff, limit = 100, search } = {}) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)

  const fetch = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('artikel').select('*', { count: 'exact' }).order('datum', { ascending: false }).limit(limit)

    if (kategorie) q = q.eq('kategorie', kategorie)
    if (sentiment) q = q.eq('sentiment', sentiment)
    if (cduWirkung) q = q.eq('cdu_wirkung', cduWirkung)
    if (handlungsbedarf) q = q.eq('handlungsbedarf', true)
    if (monitoringListe) q = q.eq('monitoring_liste', monitoringListe)
    if (suchbegriff) q = q.ilike('titel', `%${suchbegriff}%`)
    if (search) q = q.ilike('titel', `%${search}%`)

    const { data, count: total } = await q
    setArticles(data || [])
    setCount(total || 0)
    setLoading(false)
  }, [kategorie, sentiment, cduWirkung, handlungsbedarf, monitoringListe, suchbegriff, limit, search])

  useEffect(() => { fetch() }, [fetch])

  useEffect(() => {
    const handler = () => fetch()
    window.addEventListener('polaris-sync-complete', handler)
    return () => window.removeEventListener('polaris-sync-complete', handler)
  }, [fetch])

  return { articles, loading, count, refetch: fetch }
}
