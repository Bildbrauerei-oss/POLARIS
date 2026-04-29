import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, X, RefreshCw, AlertTriangle, Check, ExternalLink, Newspaper, Users, Building2, FileText } from 'lucide-react'
import { useKampagne } from '../lib/kampagneContext'
import { dataAgeDays, runOnboarding, summarizeStatus } from '../lib/onboardingData'

const STATUS_COLOR = { green: '#22c55e', yellow: '#ffa600', red: '#ef4444' }

export default function DataSourcesPanel() {
  const { aktiveKampagne, aktiveDaten, setKampagneDaten } = useKampagne()
  const [open, setOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [progress, setProgress] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!aktiveKampagne) return null

  const age = aktiveDaten?.ts ? dataAgeDays(aktiveDaten.ts) : null
  const isStale = age !== null && age >= 7
  const summary = aktiveDaten ? summarizeStatus(aktiveDaten) : null
  const totalSources = aktiveDaten ? (
    (aktiveDaten.feeds?.length || 0) +
    (aktiveDaten.demografie?.quellen?.length || 0) +
    (aktiveDaten.gemeinderat?.filter(g => g.status === 'green').length || 0) +
    (aktiveDaten.gegenkandidaten ? 1 : 0)
  ) : 0

  async function refresh() {
    setRefreshing(true)
    setProgress('feeds')
    const result = await runOnboarding(aktiveKampagne, p => setProgress(p))
    setKampagneDaten(aktiveKampagne.id, { ...result, ts: Date.now() })
    setRefreshing(false)
    setProgress(null)
  }

  return (
    <div ref={ref} style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1200 }}>
      {/* Floating Trigger */}
      <button onClick={() => setOpen(o => !o)}
        title="Datenquellen dieser Kampagne"
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: open ? '#52b7c1' : '#162230',
          border: `1px solid ${open ? '#52b7c1' : 'rgba(82,183,193,0.3)'}`,
          borderRadius: 999,
          padding: '0.5rem 0.75rem',
          color: open ? '#0a0f1a' : '#52b7c1',
          fontSize: '0.6875rem', fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
          transition: 'all 0.15s',
        }}>
        <Database size={12} />
        {!aktiveDaten ? <span>Keine Daten</span> :
          isStale ? <><AlertTriangle size={11} color={open ? '#0a0f1a' : '#ffa600'} /> {totalSources} Quellen · {age}T alt</> :
          <><span>{totalSources} Quellen</span></>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'absolute', bottom: 'calc(100% + 8px)', right: 0,
              width: 'min(380px, calc(100vw - 32px))',
              background: '#0f1923',
              border: '1px solid rgba(82,183,193,0.3)',
              borderRadius: 14,
              boxShadow: '0 16px 50px rgba(0,0,0,0.55)',
              maxHeight: 'min(540px, 80vh)', display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}>
            {/* Header */}
            <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.5625rem', fontWeight: 800, letterSpacing: '0.16em', color: '#52b7c1', textTransform: 'uppercase' }}>
                  Datenquellen
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', marginTop: 2 }}>
                  {aktiveKampagne.kandidat}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)' }}>
                  {aktiveKampagne.ort} · {aktiveKampagne.wahltyp}
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 6, padding: 4, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex' }}>
                <X size={12} />
              </button>
            </div>

            {/* Status & Refresh */}
            <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1, minWidth: 0 }}>
                {!aktiveDaten ? (
                  <span style={{ fontSize: '0.75rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertTriangle size={11} /> Noch keine Daten gesammelt
                  </span>
                ) : (
                  <>
                    {isStale ? (
                      <span style={{ fontSize: '0.6875rem', color: '#ffa600', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertTriangle size={11} /> {age} Tage alt — Update empfohlen
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.6875rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Check size={11} /> aktuell · vor {age === 0 ? 'wenigen Stunden' : `${age} Tag${age === 1 ? '' : 'en'}`}
                      </span>
                    )}
                    {summary && (
                      <span style={{ display: 'flex', gap: 4, fontSize: '0.625rem' }}>
                        <span style={{ color: '#22c55e', fontWeight: 700 }}>{summary.green}✓</span>
                        <span style={{ color: '#ffa600', fontWeight: 700 }}>{summary.yellow}!</span>
                        <span style={{ color: '#ef4444', fontWeight: 700 }}>{summary.red}✗</span>
                      </span>
                    )}
                  </>
                )}
              </div>
              <button onClick={refresh} disabled={refreshing}
                style={{ background: 'rgba(82,183,193,0.1)', border: '1px solid rgba(82,183,193,0.3)', borderRadius: 6, padding: '0.3rem 0.5rem', color: '#52b7c1', fontSize: '0.625rem', fontWeight: 700, cursor: refreshing ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                <RefreshCw size={10} style={{ animation: refreshing ? 'spin 0.9s linear infinite' : 'none' }} />
                {refreshing ? (progress || 'lädt') : 'Aktualisieren'}
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
              {!aktiveDaten ? (
                <div style={{ padding: '1.5rem 1rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                  Lege diese Kampagne über das Onboarding an oder klick auf "Aktualisieren", um Datenquellen zu sammeln.
                </div>
              ) : (
                <>
                  <Group icon={Newspaper} label="Lokale Medien" color="#52b7c1">
                    {aktiveDaten.feeds?.map((f, i) => (
                      <Item key={i} status={f.status} label={f.name} sub={f.scope === 'fallback' ? 'Universal-Suche' : `${f.scope} · ${f.items >= 0 ? f.items + ' Beiträge' : 'On-Demand'}`} url={f.rss} />
                    ))}
                  </Group>
                  <Group icon={Users} label="Demografie" color="#A855F7">
                    <Item status={aktiveDaten.demografie?.status || 'red'} label={aktiveDaten.demografie?.daten?.titel || aktiveKampagne.ort}
                      sub={aktiveDaten.demografie?.daten?.einwohner ? `${Number(aktiveDaten.demografie.daten.einwohner).toLocaleString('de-DE')} Einwohner` : 'Wikipedia-Lookup'}
                      url={aktiveDaten.demografie?.daten?.wikiUrl} />
                    {aktiveDaten.demografie?.quellen?.map((q, i) => (
                      <Item key={i} status="yellow" label={q.name} sub={q.hint} url={q.url} sub2 />
                    ))}
                  </Group>
                  <Group icon={Building2} label="Gemeinderat" color="#F97316">
                    {aktiveDaten.gemeinderat?.filter(g => g.status === 'green').length === 0 ? (
                      <div style={{ padding: '0.5rem 1rem', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                        Keine Standardquelle gefunden — manuell ergänzen
                      </div>
                    ) : aktiveDaten.gemeinderat?.filter(g => g.status === 'green').map((g, i) => (
                      <Item key={i} status={g.status} label={g.url} url={g.url} />
                    ))}
                  </Group>
                  <Group icon={FileText} label="Gegenkandidaten" color="#EC4899">
                    {aktiveDaten.gegenkandidaten?.kandidaten?.length > 0 ? aktiveDaten.gegenkandidaten.kandidaten.map((g, i) => (
                      <Item key={i} status={aktiveDaten.gegenkandidaten.status} label={g.name || '(unbenannt)'} sub={`${g.partei || ''}${g.info ? ' · ' + g.info : ''}`} />
                    )) : (
                      <div style={{ padding: '0.5rem 1rem', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                        Keine Gegenkandidaten erfasst
                      </div>
                    )}
                  </Group>
                </>
              )}
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Group({ icon: Icon, label, color, children }) {
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div style={{ padding: '0.4rem 1rem 0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Icon size={10} color={color} />
        <span style={{ fontSize: '0.5rem', fontWeight: 800, letterSpacing: '0.14em', color, textTransform: 'uppercase' }}>{label}</span>
      </div>
      {children}
    </div>
  )
}

function Item({ status, label, sub, url, sub2 }) {
  const Wrapper = url ? 'a' : 'div'
  const wrapProps = url ? { href: url, target: '_blank', rel: 'noopener noreferrer' } : {}
  return (
    <Wrapper {...wrapProps}
      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: sub2 ? '0.3rem 1rem 0.3rem 1.5rem' : '0.4rem 1rem', textDecoration: 'none', color: 'inherit', cursor: url ? 'pointer' : 'default' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLOR[status] || '#666', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </div>
        {sub && <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.45)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>}
      </div>
      {url && <ExternalLink size={10} color="rgba(255,255,255,0.3)" />}
    </Wrapper>
  )
}
