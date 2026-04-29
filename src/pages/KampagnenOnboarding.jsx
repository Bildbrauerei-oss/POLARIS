import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ChevronRight, ChevronLeft, Check, AlertCircle, Loader, Search,
  Newspaper, Users, FileText, Building2, Plus, Trash2, ExternalLink, Sparkles,
} from 'lucide-react'
import { runOnboarding } from '../lib/onboardingData'
import { useKampagne } from '../lib/kampagneContext'

const WAHLTYPEN = ['OB-Wahl', 'Bürgermeisterwahl', 'Landtagswahl', 'Kommunalwahl', 'Bundestagswahl']
const BUNDESLAENDER = [
  'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg',
  'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen', 'Nordrhein-Westfalen',
  'Rheinland-Pfalz', 'Saarland', 'Sachsen', 'Sachsen-Anhalt',
  'Schleswig-Holstein', 'Thüringen',
]

const STATUS_COLOR = { green: '#22c55e', yellow: '#ffa600', red: '#ef4444' }
const STATUS_LABEL = { green: 'Gefunden', yellow: 'Unsicher', red: 'Nicht gefunden' }

const fStyle = { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '0.625rem 0.75rem', color: '#fff', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
const lblStyle = { fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: '#52b7c1', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }

function StatusDot({ status, size = 8 }) {
  return <span style={{ display: 'inline-block', width: size, height: size, borderRadius: '50%', background: STATUS_COLOR[status] || '#666', flexShrink: 0, boxShadow: `0 0 6px ${STATUS_COLOR[status] || '#666'}55` }} />
}

function StepIndicator({ step, total = 4 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 4, borderRadius: 2,
          background: i + 1 <= step ? '#52b7c1' : 'rgba(255,255,255,0.08)',
          transition: 'background 0.3s',
        }} />
      ))}
      <span style={{ marginLeft: '0.5rem', fontSize: '0.6875rem', fontWeight: 700, color: '#52b7c1', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
        Schritt {step} / {total}
      </span>
    </div>
  )
}

// ─── Step 1 ─────────────────────────────────────────────────────────
function Step1Grunddaten({ form, setForm, onNext }) {
  const valid = form.kandidat.trim() && form.ort.trim() && form.wahldatum
  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '0.4rem' }}>Neue Kampagne anlegen</h2>
      <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
        POLARIS startet danach automatisch eine Datenrecherche zu Ort, Medien und Gegenkandidaten.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={lblStyle}>Kandidat *</label>
          <input value={form.kandidat} onChange={e => setForm(f => ({ ...f, kandidat: e.target.value }))}
            placeholder="z.B. Jürgen Roth" style={fStyle} autoFocus />
        </div>
        <div>
          <label style={lblStyle}>Ort / Gemeinde *</label>
          <input value={form.ort} onChange={e => setForm(f => ({ ...f, ort: e.target.value }))}
            placeholder="z.B. Villingen-Schwenningen" style={fStyle} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={lblStyle}>Bundesland</label>
          <select value={form.bundesland} onChange={e => setForm(f => ({ ...f, bundesland: e.target.value }))} style={fStyle}>
            {BUNDESLAENDER.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label style={lblStyle}>Wahltyp</label>
          <select value={form.wahltyp} onChange={e => setForm(f => ({ ...f, wahltyp: e.target.value }))} style={fStyle}>
            {WAHLTYPEN.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <label style={lblStyle}>Wahldatum *</label>
          <input type="date" value={form.wahldatum} onChange={e => setForm(f => ({ ...f, wahldatum: e.target.value }))} style={fStyle} />
        </div>
        <div>
          <label style={lblStyle}>Partei / Unterstützung</label>
          <input value={form.partei} onChange={e => setForm(f => ({ ...f, partei: e.target.value }))}
            placeholder="z.B. CDU oder parteilos" style={fStyle} />
        </div>
      </div>

      <button onClick={onNext} disabled={!valid}
        style={{
          width: '100%', padding: '0.875rem', borderRadius: 10,
          background: valid ? 'linear-gradient(135deg, #52b7c1, #3a8d96)' : 'rgba(255,255,255,0.05)',
          border: 'none', color: valid ? '#0a0f1a' : 'rgba(255,255,255,0.3)',
          fontSize: '0.9375rem', fontWeight: 800, cursor: valid ? 'pointer' : 'not-allowed',
          fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          boxShadow: valid ? '0 6px 20px rgba(82,183,193,0.3)' : 'none',
        }}>
        <Sparkles size={14} /> Datenrecherche starten <ChevronRight size={14} />
      </button>
    </div>
  )
}

// ─── Step 2 ─────────────────────────────────────────────────────────
function Step2Recherche({ form, daten, progress, onNext, onBack }) {
  const PHASES = [
    { id: 'feeds', label: 'Lokale Medien & RSS-Feeds', icon: Newspaper },
    { id: 'demografie', label: 'Demografiedaten', icon: Users },
    { id: 'gemeinderat', label: 'Gemeinderat & Ratsinfosystem', icon: Building2 },
    { id: 'gegenkandidaten', label: 'Gegenkandidaten & letzte Wahlen', icon: FileText },
  ]
  const phaseIndex = PHASES.findIndex(p => p.id === progress)
  const isDone = progress === 'done'

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '0.4rem' }}>POLARIS recherchiert…</h2>
      <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>
        Wir sammeln öffentlich verfügbare Daten zu <strong style={{ color: '#52b7c1' }}>{form.ort}</strong>.
        Das dauert einen Moment.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {PHASES.map((p, i) => {
          const Icon = p.icon
          const done = isDone || (phaseIndex >= 0 && i < phaseIndex)
          const active = progress === p.id
          return (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1rem',
              background: active ? 'rgba(82,183,193,0.08)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${active ? 'rgba(82,183,193,0.3)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 10, transition: 'all 0.2s',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: done ? 'rgba(34,197,94,0.15)' : active ? 'rgba(82,183,193,0.15)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {done ? <Check size={14} color="#22c55e" /> :
                  active ? <Loader size={14} color="#52b7c1" style={{ animation: 'spin 0.9s linear infinite' }} /> :
                  <Icon size={14} color="rgba(255,255,255,0.3)" />}
              </div>
              <span style={{ flex: 1, fontSize: '0.875rem', color: done ? 'rgba(255,255,255,0.8)' : active ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: active ? 700 : 500 }}>
                {p.label}
              </span>
              {done && daten && (
                <span style={{ fontSize: '0.6875rem', color: '#22c55e', fontWeight: 700 }}>✓</span>
              )}
            </div>
          )
        })}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
        <button onClick={onBack} style={{ padding: '0.75rem 1.25rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ChevronLeft size={13} /> Zurück
        </button>
        <button onClick={onNext} disabled={!isDone}
          style={{
            flex: 1, padding: '0.75rem', borderRadius: 10,
            background: isDone ? 'linear-gradient(135deg, #52b7c1, #3a8d96)' : 'rgba(255,255,255,0.05)',
            border: 'none', color: isDone ? '#0a0f1a' : 'rgba(255,255,255,0.3)',
            fontSize: '0.875rem', fontWeight: 800, cursor: isDone ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
          }}>
          Ergebnisse ansehen <ChevronRight size={13} />
        </button>
      </div>
    </div>
  )
}

// ─── Step 3 ─────────────────────────────────────────────────────────
function Step3Ergebnisse({ daten, onNext, onBack, onUpdateFeeds }) {
  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '0.4rem' }}>Was POLARIS gefunden hat</h2>
      <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.25rem' }}>
        Transparent: was direkt nutzbar ist, was unsicher ist und wo manuelle Recherche nötig ist.
      </p>

      <div style={{ maxHeight: 460, overflowY: 'auto', paddingRight: '0.5rem' }}>
        {/* RSS-Feeds */}
        <Section icon={Newspaper} label="Lokale Medien (RSS-Feeds)" color="#52b7c1">
          {daten.feeds?.length === 0 ? (
            <Empty>Keine Feeds gefunden.</Empty>
          ) : daten.feeds?.map((f, i) => (
            <Row key={i}>
              <StatusDot status={f.status} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8125rem', color: '#fff', fontWeight: 600 }}>{f.name}</div>
                <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.scope === 'fallback' ? 'Universal-Suche' : f.scope} · {f.items >= 0 ? `${f.items} Beiträge` : 'On-Demand'}
                </div>
              </div>
              <a href={f.rss} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
                <ExternalLink size={11} />
              </a>
            </Row>
          ))}
        </Section>

        {/* Demografie */}
        <Section icon={Users} label="Demografiedaten" color="#A855F7">
          <Row>
            <StatusDot status={daten.demografie?.status || 'red'} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.8125rem', color: '#fff', fontWeight: 600 }}>
                {daten.demografie?.daten?.titel || 'Wikipedia-Lookup'}
              </div>
              {daten.demografie?.daten?.einwohner && (
                <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                  ca. {Number(daten.demografie.daten.einwohner).toLocaleString('de-DE')} Einwohner
                </div>
              )}
            </div>
          </Row>
          {daten.demografie?.quellen?.map((q, i) => (
            <Row key={i} sub>
              <span style={{ width: 8, height: 8 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>{q.name}</div>
                {q.hint && <div style={{ fontSize: '0.625rem', color: '#ffa600', marginTop: 1 }}>→ {q.hint}</div>}
              </div>
              {q.url && (
                <a href={q.url} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
                  <ExternalLink size={10} />
                </a>
              )}
            </Row>
          ))}
        </Section>

        {/* Gemeinderat */}
        <Section icon={Building2} label="Gemeinderat / Ratsinfosystem" color="#F97316">
          {daten.gemeinderat?.filter(g => g.status === 'green').length === 0 ? (
            <Row>
              <StatusDot status="red" />
              <div style={{ flex: 1, fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)' }}>
                Keine standardmäßige URL erreichbar — manuell ergänzen
              </div>
            </Row>
          ) : daten.gemeinderat?.filter(g => g.status === 'green').map((g, i) => (
            <Row key={i}>
              <StatusDot status={g.status} />
              <a href={g.url} target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, minWidth: 0, color: '#fff', textDecoration: 'none', fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {g.url}
              </a>
              <ExternalLink size={11} color="rgba(255,255,255,0.4)" />
            </Row>
          ))}
        </Section>

        {/* Wahlergebnisse */}
        <Section icon={FileText} label="Letzte Wahlergebnisse" color="#EC4899">
          {daten.gegenkandidaten?.letzte_wahl ? (
            <Row>
              <StatusDot status={daten.gegenkandidaten.status} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8125rem', color: '#fff', fontWeight: 600 }}>
                  {daten.gegenkandidaten.letzte_wahl.datum}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                  Sieger: {daten.gegenkandidaten.letzte_wahl.sieger} · {daten.gegenkandidaten.letzte_wahl.ergebnis}
                </div>
              </div>
            </Row>
          ) : (
            <Empty>Keine Vorgängerwahl gefunden — Schritt 4 prüft Gegenkandidaten.</Empty>
          )}
        </Section>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
        <button onClick={onBack} style={{ padding: '0.75rem 1.25rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ChevronLeft size={13} /> Zurück
        </button>
        <button onClick={onNext}
          style={{
            flex: 1, padding: '0.75rem', borderRadius: 10,
            background: 'linear-gradient(135deg, #52b7c1, #3a8d96)',
            border: 'none', color: '#0a0f1a', fontSize: '0.875rem', fontWeight: 800, cursor: 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
          }}>
          Weiter zu Gegenkandidaten <ChevronRight size={13} />
        </button>
      </div>
    </div>
  )
}

function Section({ icon: Icon, label, color, children }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <Icon size={11} color={color} />
        <span style={{ fontSize: '0.5625rem', fontWeight: 800, letterSpacing: '0.14em', color, textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '0.5rem' }}>
        {children}
      </div>
    </div>
  )
}
function Row({ children, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: sub ? '0.35rem 0.5rem 0.35rem 1.5rem' : '0.5rem 0.5rem' }}>
      {children}
    </div>
  )
}
function Empty({ children }) {
  return <div style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>{children}</div>
}

// ─── Step 4: Gegenkandidaten ────────────────────────────────────────
function Step4Gegenkandidaten({ daten, gegner, setGegner, onFinish, onBack, saving }) {
  function add() { setGegner([...gegner, { name: '', partei: '', info: '' }]) }
  function update(i, key, val) {
    setGegner(gegner.map((g, j) => j === i ? { ...g, [key]: val } : g))
  }
  function remove(i) { setGegner(gegner.filter((_, j) => j !== i)) }

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '0.4rem' }}>Gegenkandidaten</h2>
      <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1rem' }}>
        {daten.gegenkandidaten?.kandidaten?.length > 0
          ? `POLARIS hat ${daten.gegenkandidaten.kandidaten.length} mögliche Gegenkandidaten gefunden. Korrigiere oder ergänze:`
          : 'POLARIS konnte keine konkreten Gegenkandidaten ermitteln. Bitte manuell ergänzen:'}
      </p>

      {daten.gegenkandidaten?.konfidenz && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.625rem', background: 'rgba(255,166,0,0.1)', border: '1px solid rgba(255,166,0,0.25)', borderRadius: 6, fontSize: '0.6875rem', color: '#ffa600', marginBottom: '1rem' }}>
          <AlertCircle size={11} /> Konfidenz: {daten.gegenkandidaten.konfidenz}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 340, overflowY: 'auto' }}>
        {gegner.map((g, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'start' }}>
              <input value={g.name} onChange={e => update(i, 'name', e.target.value)} placeholder="Name" style={{ ...fStyle, fontSize: '0.8125rem', padding: '0.5rem 0.625rem' }} />
              <input value={g.partei} onChange={e => update(i, 'partei', e.target.value)} placeholder="Partei" style={{ ...fStyle, fontSize: '0.8125rem', padding: '0.5rem 0.625rem' }} />
              <button onClick={() => remove(i)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 7, padding: '0.5rem', color: '#ef4444', cursor: 'pointer', display: 'flex' }}>
                <Trash2 size={12} />
              </button>
            </div>
            <input value={g.info} onChange={e => update(i, 'info', e.target.value)}
              placeholder="Info / Hintergrund (optional)"
              style={{ ...fStyle, fontSize: '0.75rem', padding: '0.4rem 0.625rem', marginTop: '0.4rem' }} />
          </div>
        ))}
        <button onClick={add}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.625rem', background: 'rgba(82,183,193,0.07)', border: '1px dashed rgba(82,183,193,0.3)', borderRadius: 10, color: '#52b7c1', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
          <Plus size={12} /> Gegenkandidat hinzufügen
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
        <button onClick={onBack} disabled={saving} style={{ padding: '0.75rem 1.25rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.6)', cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ChevronLeft size={13} /> Zurück
        </button>
        <button onClick={onFinish} disabled={saving}
          style={{
            flex: 1, padding: '0.75rem', borderRadius: 10,
            background: 'linear-gradient(135deg, #ffa600, #d97706)',
            border: 'none', color: '#0a0f1a', fontSize: '0.875rem', fontWeight: 800,
            cursor: saving ? 'wait' : 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            opacity: saving ? 0.7 : 1,
          }}>
          {saving ? <><Loader size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Speichern…</> : <><Check size={13} /> Kampagne anlegen</>}
        </button>
      </div>
    </div>
  )
}

// ─── Hauptkomponente ────────────────────────────────────────────────
export default function KampagnenOnboarding({ open, onClose, initialForm }) {
  const { addKampagne, setKampagneDaten } = useKampagne()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initialForm || {
    kandidat: '', ort: '', bundesland: 'Baden-Württemberg',
    wahltyp: 'OB-Wahl', wahldatum: '', partei: '',
  })
  const [progress, setProgress] = useState(null)
  const [daten, setDaten] = useState(null)
  const [gegner, setGegner] = useState([])
  const [saving, setSaving] = useState(false)

  async function startRecherche() {
    setStep(2)
    setProgress('feeds')
    const result = await runOnboarding(form, p => setProgress(p))
    setDaten(result)
    setGegner(result.gegenkandidaten?.kandidaten || [])
  }

  function finish() {
    setSaving(true)
    const id = addKampagne(form)
    setKampagneDaten(id, {
      ...daten,
      gegenkandidaten: { ...daten?.gegenkandidaten, kandidaten: gegner },
      ts: Date.now(),
    })
    setTimeout(() => {
      setSaving(false)
      onClose?.()
      // Reset für ggf. nächste Anlage
      setStep(1)
      setForm({ kandidat: '', ort: '', bundesland: 'Baden-Württemberg', wahltyp: 'OB-Wahl', wahldatum: '', partei: '' })
      setDaten(null)
      setGegner([])
      setProgress(null)
    }, 300)
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 3000,
          background: 'rgba(2,8,16,0.78)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
        <motion.div
          initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 640,
            background: '#162230',
            border: '1px solid rgba(82,183,193,0.25)',
            borderRadius: 16,
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            overflow: 'hidden',
            maxHeight: 'calc(100vh - 2rem)', display: 'flex', flexDirection: 'column',
          }}>
          {/* Close */}
          <button onClick={onClose}
            style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex', zIndex: 10 }}>
            <X size={14} />
          </button>

          <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto' }}>
            <StepIndicator step={step} />
            {step === 1 && <Step1Grunddaten form={form} setForm={setForm} onNext={startRecherche} />}
            {step === 2 && <Step2Recherche form={form} daten={daten} progress={progress} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
            {step === 3 && daten && <Step3Ergebnisse daten={daten} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
            {step === 4 && daten && <Step4Gegenkandidaten daten={daten} gegner={gegner} setGegner={setGegner} onFinish={finish} onBack={() => setStep(3)} saving={saving} />}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
