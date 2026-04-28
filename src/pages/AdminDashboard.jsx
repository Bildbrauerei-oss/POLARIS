import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { Settings, Database, Rss, Trash2, RefreshCw, CheckCircle, AlertCircle, Zap } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'

const COLOR = '#94A3B8'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cleaning, setCleaning] = useState(false)
  const [cleanMsg, setCleanMsg] = useState('')

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    setLoading(true)
    const results = await Promise.allSettled([
      supabase.from('artikel').select('*', { count: 'exact', head: true }),
      supabase.from('artikel').select('*', { count: 'exact', head: true }).eq('analysiert', true),
      supabase.from('artikel').select('*', { count: 'exact', head: true }).eq('handlungsbedarf', true),
      supabase.from('artikel').select('datum').order('datum', { ascending: false }).limit(1),
      supabase.from('kontakte').select('*', { count: 'exact', head: true }),
      supabase.from('zitate').select('*', { count: 'exact', head: true }),
      supabase.from('projekte').select('*', { count: 'exact', head: true }),
    ])

    setStats({
      artikel: results[0].value?.count ?? 0,
      analysiert: results[1].value?.count ?? 0,
      handlungsbedarf: results[2].value?.count ?? 0,
      letzterArtikel: results[3].value?.data?.[0]?.datum ?? null,
      kontakte: results[4].value?.count ?? '—',
      zitate: results[5].value?.count ?? '—',
      projekte: results[6].value?.count ?? '—',
    })
    setLoading(false)
  }

  async function cleanDone() {
    setCleaning(true)
    setCleanMsg('')
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    const { error, count } = await supabase
      .from('artikel')
      .delete({ count: 'exact' })
      .lt('datum', cutoff.toISOString())
      .eq('handlungsbedarf', false)
    if (error) {
      setCleanMsg(`Fehler: ${error.message}`)
    } else {
      setCleanMsg(`${count ?? 0} alte Artikel gelöscht (> 30 Tage, kein Handlungsbedarf).`)
      loadStats()
    }
    setCleaning(false)
  }

  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

  const envStatus = [
    { label: 'VITE_ANTHROPIC_API_KEY', ok: !!apiKey, value: apiKey ? `...${apiKey.slice(-6)}` : 'Nicht gesetzt' },
    { label: 'VITE_SUPABASE_URL', ok: !!supabaseUrl, value: supabaseUrl ? supabaseUrl.replace('https://', '').split('.')[0] + '.supabase.co' : 'Nicht gesetzt' },
    { label: 'VITE_SUPABASE_ANON_KEY', ok: !!import.meta.env.VITE_SUPABASE_ANON_KEY, value: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Gesetzt ✓' : 'Nicht gesetzt' },
  ]

  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Admin-Dashboard"
        description="Systemstatus, Datenbank-Übersicht und Wartungsfunktionen."
        icon={Settings}
        color={COLOR}
      >
        <button onClick={loadStats} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 10, padding: '0.625rem 1.125rem', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem', fontWeight: 600 }}>
          <RefreshCw size={13} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Aktualisieren
        </button>
      </PageHeader>

      {/* DB Stats */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={sectionLabel}>Datenbank</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
          {[
            { label: 'Artikel gesamt', value: stats?.artikel ?? '…', color: '#52b7c1', icon: Database },
            { label: 'Analysiert', value: stats?.analysiert ?? '…', color: '#22c55e' },
            { label: 'Handlungsbedarf', value: stats?.handlungsbedarf ?? '…', color: '#ef4444' },
          ].map(s => (
            <div key={s.label} style={{ background: '#162230', border: '1px solid rgba(148,163,184,0.1)', borderTop: `3px solid ${s.color}`, borderRadius: 12, padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', marginBottom: '0.375rem' }}>{s.label}</div>
              <div style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: '1.75rem', color: '#fff', letterSpacing: '-0.04em' }}>{loading ? '…' : s.value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          {[
            { label: 'Kontakte', value: stats?.kontakte ?? '—', color: '#A855F7' },
            { label: 'Zitate', value: stats?.zitate ?? '—', color: '#3B82F6' },
            { label: 'Projekte', value: stats?.projekte ?? '—', color: '#22C55E' },
          ].map(s => (
            <div key={s.label} style={{ background: '#162230', border: '1px solid rgba(148,163,184,0.08)', borderRadius: 12, padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>{s.label}</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#fff' }}>{loading ? '…' : s.value}</div>
              </div>
            </div>
          ))}
        </div>
        {stats?.letzterArtikel && (
          <p style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.625rem' }}>
            Letzter Artikel: {new Date(stats.letzterArtikel).toLocaleString('de-DE')}
          </p>
        )}
      </div>

      {/* Environment Variables */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={sectionLabel}>Environment</p>
        <div style={{ background: '#162230', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 14, overflow: 'hidden' }}>
          {envStatus.map((env, i) => (
            <div key={env.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.25rem', borderBottom: i < envStatus.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              {env.ok ? <CheckCircle size={14} color="#22c55e" /> : <AlertCircle size={14} color="#ef4444" />}
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', flex: 1 }}>{env.label}</span>
              <span style={{ fontSize: '0.75rem', color: env.ok ? '#22c55e' : '#ef4444', fontFamily: 'monospace' }}>{env.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Maintenance */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={sectionLabel}>Wartung</p>
        <div style={{ background: '#162230', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 14, padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>Alte Artikel löschen</p>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Entfernt alle Artikel älter als 30 Tage ohne Handlungsbedarf-Flag.</p>
            </div>
            <button
              onClick={cleanDone}
              disabled={cleaning}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 9, padding: '0.5rem 1rem', cursor: cleaning ? 'wait' : 'pointer', color: '#ef4444', fontSize: '0.8125rem', fontWeight: 600, flexShrink: 0, opacity: cleaning ? 0.6 : 1 }}
            >
              {cleaning ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={12} />}
              Bereinigen
            </button>
          </div>
          {cleanMsg && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: '0.75rem', color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
              {cleanMsg}
            </motion.p>
          )}
        </div>
      </div>

      {/* Tables SQL Reference */}
      <div>
        <p style={sectionLabel}>Tabellen-Übersicht</p>
        <div style={{ background: '#162230', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 14, overflow: 'hidden' }}>
          {[
            { table: 'artikel', desc: 'Medienartikel aus RSS-Feeds', required: true },
            { table: 'kontakte', desc: 'Geburtstags-Radar Kontakte', required: false },
            { table: 'zitate', desc: 'Zitat-Datenbank', required: false },
            { table: 'projekte', desc: 'Kampagnenprojekte', required: false },
            { table: 'projekt_aufgaben', desc: 'Aufgaben innerhalb von Projekten', required: false },
          ].map((t, i, arr) => (
            <div key={t.table} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.25rem', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <code style={{ fontSize: '0.75rem', color: '#52b7c1', background: 'rgba(82,183,193,0.08)', padding: '0.15rem 0.4rem', borderRadius: 5, minWidth: 150 }}>{t.table}</code>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', flex: 1 }}>{t.desc}</span>
              <span style={{ fontSize: '0.5625rem', fontWeight: 700, color: t.required ? '#ffa600' : '#94A3B8' }}>
                {t.required ? 'Pflicht' : 'Optional'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const sectionLabel = { fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '0.75rem' }
