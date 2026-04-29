import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bookmark, Sparkles, Plus, Edit3, Trash2, Check, X, RefreshCw,
  Crown, Layers, MapPin, Users, Tag, Loader,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import { useKampagne } from '../lib/kampagneContext'
import {
  THEMENFELDER, MILIEUS, ALTERSGRUPPEN, STATUS,
  listNarrative, getDachNarrativ, getThemenNarrative,
  saveNarrativ, deleteNarrativ, createNarrativ, setDachNarrativAktiv,
} from '../lib/narrativeStore'

const COLOR = '#A855F7'
const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

// ──────────────────────────────────────────────────────────────────────────
// KI-Helper
// ──────────────────────────────────────────────────────────────────────────

async function generateDachVarianten({ kandidat, ort, themen }) {
  if (!apiKey) return mockDachVarianten({ kandidat, ort })
  const system = `Du bist Spitzen-Stratege für lokale Wahlkämpfe in Deutschland. Du formulierst Dach-Narrative — die zentrale Erzählung einer Kampagne. Sie müssen lokal verankert sein, emotional verständlich, klar positioniert. Liefere ausschließlich JSON.`
  const prompt = `Kandidat: ${kandidat || 'Kandidat'}
Ort: ${ort || 'Stadt'}
Top-Lokalthemen: ${themen || 'allgemein'}

Schlage 3 Dach-Narrative vor. Jedes ist:
- Ein griffiger Titel (kurz, einprägsam, max. 8 Wörter)
- Eine Kernbotschaft (1–2 Sätze, lokal verankert, konkret auf ${ort || 'die Gemeinde'} bezogen — kein Bundesthema)

Format (NUR JSON, kein Fließtext drumherum):
[{"titel":"…","kernbotschaft":"…"},{"titel":"…","kernbotschaft":"…"},{"titel":"…","kernbotschaft":"…"}]`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: AbortSignal.timeout(30000),
      headers: {
        'x-api-key': apiKey, 'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5', max_tokens: 800, system,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await res.json()
    const text = data.content?.[0]?.text || ''
    const m = text.match(/\[[\s\S]*\]/)
    if (m) return JSON.parse(m[0])
  } catch (e) { console.warn('Dach-KI fehler', e) }
  return mockDachVarianten({ kandidat, ort })
}

function mockDachVarianten({ kandidat, ort }) {
  const k = kandidat || 'Kandidat'
  const o = ort || 'unsere Stadt'
  return [
    { titel: `${k} für ${o} — Nah dran. Stark vor Ort.`, kernbotschaft: `${k} kennt jede Straße und jedes Anliegen in ${o}. Statt großer Versprechen: konkrete Lösungen für Wohnen, Verkehr und Familien — direkt aus der Stadt heraus.` },
    { titel: `Mit Klarheit. Für ${o}.`, kernbotschaft: `${o} braucht keine Show, sondern jemanden der zuhört, anpackt und entscheidet. ${k} verbindet Erfahrung mit dem Mut, Dinge zu verändern, die zu lange liegen geblieben sind.` },
    { titel: `${o} kann mehr — packen wir's an.`, kernbotschaft: `${k} sieht die Stärken von ${o} und weiß, wo es hakt. Ein neuer Stil: pragmatisch, bürgernah, parteiübergreifend — für eine Stadt, die selbstbewusst nach vorn geht.` },
  ]
}

async function generateThemenVarianten({ themenfeld, kandidat, ort, lokaler_bezug, daten }) {
  if (!apiKey) return mockThemenVarianten({ themenfeld, ort })
  const themaLabel = THEMENFELDER.find(t => t.id === themenfeld)?.label || themenfeld
  const system = `Du formulierst Themen-Narrative für lokale Wahlkämpfe. Sie müssen sich KONKRET auf die Gemeinde beziehen — keine allgemeinen Sätze, sondern lokal-spezifisch. Liefere nur JSON.`
  const prompt = `Themenfeld: ${themaLabel}
Kandidat: ${kandidat || 'Kandidat'}
Ort: ${ort || 'Stadt'}
${lokaler_bezug ? `Lokaler Bezug (Stadtteil/Ortskenntnis): ${lokaler_bezug}` : ''}
${daten ? `Bekannte Daten/Fakten: ${daten}` : ''}

Schlage 2 Kernbotschaften vor — jede konkret auf ${ort || 'den Ort'}${lokaler_bezug ? `, speziell ${lokaler_bezug}` : ''} bezogen, nicht allgemein.

Format (NUR JSON):
[{"titel":"…","kernbotschaft":"…","milieu":"…","alter":"…"},{"titel":"…","kernbotschaft":"…","milieu":"…","alter":"…"}]
"milieu" aus: ${MILIEUS.join(' / ')}
"alter" aus: ${ALTERSGRUPPEN.join(' / ')}`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: AbortSignal.timeout(30000),
      headers: {
        'x-api-key': apiKey, 'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5', max_tokens: 700, system,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await res.json()
    const text = data.content?.[0]?.text || ''
    const m = text.match(/\[[\s\S]*\]/)
    if (m) return JSON.parse(m[0])
  } catch (e) { console.warn('Themen-KI fehler', e) }
  return mockThemenVarianten({ themenfeld, ort })
}

function mockThemenVarianten({ themenfeld, ort }) {
  const o = ort || 'unsere Stadt'
  return [
    { titel: `Bezahlbar wohnen in ${o}`, kernbotschaft: `Junge Familien finden in ${o} kaum noch Wohnraum. Ich will Bauflächen aktivieren und kommunale Wohnbau-Genossenschaften stärken — schneller, transparenter, lokal.`, milieu: 'Bürgerliche Mitte', alter: '30–44' },
    { titel: `${o} bewegt sich`, kernbotschaft: `Verkehrsknoten und Radwege in ${o} brauchen ein Update — pragmatisch, nicht ideologisch. Bürgerbeteiligung statt Top-Down-Entscheidungen.`, milieu: 'Liberal-Intellektuelle', alter: '45–59' },
  ]
}

// ──────────────────────────────────────────────────────────────────────────
// Komponenten
// ──────────────────────────────────────────────────────────────────────────

function FieldLabel({ children }) {
  return <p style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', marginBottom: '0.375rem' }}>{children}</p>
}

const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '0.5rem 0.75rem', color: '#fff', fontSize: '0.8125rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }

function StatusBadge({ status }) {
  const s = STATUS.find(x => x.id === status) || STATUS[0]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.5625rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.2rem 0.5rem', background: `${s.color}22`, color: s.color, border: `1px solid ${s.color}55`, borderRadius: 5 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color }} />
      {s.label}
    </span>
  )
}

function ThemenfeldChip({ id }) {
  const t = THEMENFELDER.find(x => x.id === id)
  if (!t) return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.2rem 0.5rem', background: `${t.color}18`, color: t.color, border: `1px solid ${t.color}40`, borderRadius: 5 }}>
      <Tag size={9} /> {t.label}
    </span>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Dach-Narrativ Card
// ──────────────────────────────────────────────────────────────────────────

function DachCard({ kampagne, dach, onEdit, onCreate }) {
  if (!dach) {
    return (
      <div style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(168,85,247,0.02))', border: '1px dashed rgba(168,85,247,0.35)', borderRadius: 16, padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Crown size={20} color={COLOR} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.16em', color: COLOR, textTransform: 'uppercase' }}>Dach-Narrativ</p>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.25rem' }}>Noch kein Dach-Narrativ für {kampagne?.kandidat || 'diese Kampagne'} definiert.</p>
        </div>
        <button onClick={onCreate} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(135deg, #A855F7, #7c3aed)', color: '#fff', border: 'none', borderRadius: 10, padding: '0.625rem 1rem', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(168,85,247,0.3)' }}>
          <Sparkles size={13} /> KI-Generator starten
        </button>
      </div>
    )
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(168,85,247,0.03))', border: '1px solid rgba(168,85,247,0.4)', borderRadius: 16, padding: '1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Crown size={20} color={COLOR} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.4rem' }}>
          <p style={{ fontSize: '0.625rem', fontWeight: 800, letterSpacing: '0.16em', color: COLOR, textTransform: 'uppercase' }}>Dach-Narrativ</p>
          <StatusBadge status={dach.status} />
        </div>
        <h3 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: '0.5rem' }}>{dach.titel}</h3>
        <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.78)', lineHeight: 1.5 }}>{dach.kernbotschaft}</p>
      </div>
      <button onClick={onEdit} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(168,85,247,0.12)', color: COLOR, border: '1px solid rgba(168,85,247,0.35)', borderRadius: 8, padding: '0.4rem 0.75rem', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
        <Edit3 size={11} /> Bearbeiten
      </button>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Themen-Card
// ──────────────────────────────────────────────────────────────────────────

function ThemenCard({ narrativ, onEdit, onDelete, onToggleStatus }) {
  const tf = THEMENFELDER.find(x => x.id === narrativ.themenfeld)
  const accent = tf?.color || COLOR
  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
      style={{ background: '#162230', border: `1px solid ${accent}30`, borderRadius: 14, padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', minHeight: 180 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <ThemenfeldChip id={narrativ.themenfeld} />
        <StatusBadge status={narrativ.status} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.25rem' }}>
          <button onClick={onToggleStatus} title={narrativ.status === 'aktiv' ? 'Auf Entwurf setzen' : 'Aktivieren'}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '0.25rem 0.4rem', cursor: 'pointer', color: narrativ.status === 'aktiv' ? '#22c55e' : 'rgba(255,255,255,0.4)', display: 'flex' }}>
            <Check size={11} />
          </button>
          <button onClick={onEdit} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '0.25rem 0.4rem', cursor: 'pointer', color: 'rgba(255,255,255,0.55)', display: 'flex' }}>
            <Edit3 size={11} />
          </button>
          <button onClick={onDelete} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '0.25rem 0.4rem', cursor: 'pointer', color: 'rgba(239,68,68,0.7)', display: 'flex' }}>
            <Trash2 size={11} />
          </button>
        </div>
      </div>
      <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{narrativ.titel || '(ohne Titel)'}</h4>
      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, flex: 1 }}>{narrativ.kernbotschaft || '—'}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', fontSize: '0.625rem', color: 'rgba(255,255,255,0.55)', paddingTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {narrativ.zielgruppe_milieu && (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Users size={9} /> {narrativ.zielgruppe_milieu}</span>)}
        {narrativ.zielgruppe_alter && (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>· {narrativ.zielgruppe_alter}</span>)}
        {narrativ.lokaler_bezug && (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><MapPin size={9} /> {narrativ.lokaler_bezug}</span>)}
      </div>
    </motion.div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Modal — Dach-Narrativ Editor mit KI
// ──────────────────────────────────────────────────────────────────────────

function DachModal({ open, onClose, kampagne, existing, onSave }) {
  const [titel, setTitel] = useState(existing?.titel || '')
  const [kernbotschaft, setKernbotschaft] = useState(existing?.kernbotschaft || '')
  const [themen, setThemen] = useState('')
  const [loading, setLoading] = useState(false)
  const [varianten, setVarianten] = useState([])

  useEffect(() => {
    if (open) {
      setTitel(existing?.titel || '')
      setKernbotschaft(existing?.kernbotschaft || '')
      setThemen('')
      setVarianten([])
    }
  }, [open, existing])

  async function genKI() {
    setLoading(true)
    const v = await generateDachVarianten({ kandidat: kampagne?.kandidat, ort: kampagne?.ort, themen })
    setVarianten(v)
    setLoading(false)
  }

  function pick(v) {
    setTitel(v.titel)
    setKernbotschaft(v.kernbotschaft)
  }

  function save() {
    onSave({ titel, kernbotschaft })
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(10,15,26,0.7)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onClose}>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.18 }} onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 640, background: '#0f1923', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 16, padding: '1.5rem', boxShadow: '0 24px 64px rgba(0,0,0,0.55)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.5625rem', fontWeight: 800, letterSpacing: '0.16em', color: COLOR, textTransform: 'uppercase' }}>Dach-Narrativ</p>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>{existing ? 'Bearbeiten' : 'Erstellen'} · {kampagne?.kandidat}</h3>
              </div>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}><X size={14} /></button>
            </div>

            {/* KI-Generator */}
            <div style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 12, padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.5rem' }}>
                <Sparkles size={12} color={COLOR} />
                <p style={{ fontSize: '0.6875rem', fontWeight: 800, letterSpacing: '0.12em', color: COLOR, textTransform: 'uppercase' }}>KI-Generator</p>
              </div>
              <FieldLabel>Top-Lokalthemen (komma-getrennt)</FieldLabel>
              <input value={themen} onChange={e => setThemen(e.target.value)} placeholder="z.B. Wohnungsmarkt, Innenstadtbelebung, Schulsanierung"
                style={inputStyle} />
              <button onClick={genKI} disabled={loading}
                style={{ marginTop: '0.625rem', display: 'inline-flex', alignItems: 'center', gap: 6, background: loading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #A855F7, #7c3aed)', color: '#fff', border: 'none', borderRadius: 8, padding: '0.45rem 0.875rem', fontSize: '0.75rem', fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                {loading ? <><Loader size={11} style={{ animation: 'spin 0.9s linear infinite' }} /> Generiere…</> : <><Sparkles size={11} /> 3 Varianten generieren</>}
              </button>
              {varianten.length > 0 && (
                <div style={{ marginTop: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {varianten.map((v, i) => (
                    <button key={i} onClick={() => pick(v)} style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(168,85,247,0.18)', borderRadius: 10, padding: '0.65rem 0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fff', marginBottom: 3 }}>{v.titel}</p>
                      <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>{v.kernbotschaft}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <FieldLabel>Titel</FieldLabel>
                <input value={titel} onChange={e => setTitel(e.target.value)} style={inputStyle} placeholder="z.B. Schmidt für Eppelheim — Nah dran, stark für alle" />
              </div>
              <div>
                <FieldLabel>Kernbotschaft</FieldLabel>
                <textarea value={kernbotschaft} onChange={e => setKernbotschaft(e.target.value)} rows={4}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                  placeholder="1–2 Sätze: Wofür steht der/die Kandidat:in? Was ist die zentrale Erzählung?" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Abbrechen</button>
              <button onClick={save} disabled={!titel.trim() || !kernbotschaft.trim()}
                style={{ background: !titel.trim() || !kernbotschaft.trim() ? 'rgba(168,85,247,0.3)' : 'linear-gradient(135deg, #A855F7, #7c3aed)', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, cursor: !titel.trim() || !kernbotschaft.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                Aktivieren
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Modal — Themen-Narrativ Editor
// ──────────────────────────────────────────────────────────────────────────

function ThemaModal({ open, onClose, kampagne, existing, onSave }) {
  const [n, setN] = useState(() => existing || { titel: '', kernbotschaft: '', zielgruppe_milieu: '', zielgruppe_alter: '', themenfeld: 'wohnen', lokaler_bezug: '', status: 'entwurf' })
  const [loading, setLoading] = useState(false)
  const [varianten, setVarianten] = useState([])
  const [daten, setDaten] = useState('')

  useEffect(() => {
    if (open) {
      setN(existing || { titel: '', kernbotschaft: '', zielgruppe_milieu: '', zielgruppe_alter: '', themenfeld: 'wohnen', lokaler_bezug: '', status: 'entwurf' })
      setVarianten([])
      setDaten('')
    }
  }, [open, existing])

  async function genKI() {
    setLoading(true)
    const v = await generateThemenVarianten({ themenfeld: n.themenfeld, kandidat: kampagne?.kandidat, ort: kampagne?.ort, lokaler_bezug: n.lokaler_bezug, daten })
    setVarianten(v)
    setLoading(false)
  }

  function pick(v) {
    setN(prev => ({ ...prev, titel: v.titel, kernbotschaft: v.kernbotschaft, zielgruppe_milieu: v.milieu || prev.zielgruppe_milieu, zielgruppe_alter: v.alter || prev.zielgruppe_alter }))
  }

  function save() {
    onSave(n)
    onClose()
  }

  function field(k, v) { setN(prev => ({ ...prev, [k]: v })) }

  return (
    <AnimatePresence>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(10,15,26,0.7)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onClose}>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.18 }} onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 640, background: '#0f1923', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 16, padding: '1.5rem', boxShadow: '0 24px 64px rgba(0,0,0,0.55)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.5625rem', fontWeight: 800, letterSpacing: '0.16em', color: COLOR, textTransform: 'uppercase' }}>Themen-Narrativ</p>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>{existing ? 'Bearbeiten' : 'Neu'} · {kampagne?.ort}</h3>
              </div>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}><X size={14} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.875rem' }}>
              <div>
                <FieldLabel>Themenfeld</FieldLabel>
                <select value={n.themenfeld} onChange={e => field('themenfeld', e.target.value)} style={inputStyle}>
                  {THEMENFELDER.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Lokaler Bezug</FieldLabel>
                <input value={n.lokaler_bezug} onChange={e => field('lokaler_bezug', e.target.value)} style={inputStyle} placeholder="Stadtteil, Ortsteil…" />
              </div>
            </div>

            {/* KI */}
            <div style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 12, padding: '0.875rem 1rem', marginBottom: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.4rem' }}>
                <Sparkles size={12} color={COLOR} />
                <p style={{ fontSize: '0.6875rem', fontWeight: 800, letterSpacing: '0.12em', color: COLOR, textTransform: 'uppercase' }}>KI-Vorschläge</p>
              </div>
              <FieldLabel>Lokale Daten/Fakten (optional)</FieldLabel>
              <input value={daten} onChange={e => setDaten(e.target.value)} placeholder="z.B. 4.200 Wohnungen fehlen, Mieten +18% seit 2019…" style={inputStyle} />
              <button onClick={genKI} disabled={loading}
                style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: 6, background: loading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #A855F7, #7c3aed)', color: '#fff', border: 'none', borderRadius: 8, padding: '0.4rem 0.875rem', fontSize: '0.75rem', fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                {loading ? <><Loader size={11} style={{ animation: 'spin 0.9s linear infinite' }} /> Generiere…</> : <><Sparkles size={11} /> 2 Vorschläge</>}
              </button>
              {varianten.length > 0 && (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {varianten.map((v, i) => (
                    <button key={i} onClick={() => pick(v)} style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(168,85,247,0.18)', borderRadius: 10, padding: '0.55rem 0.75rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', marginBottom: 2 }}>{v.titel}</p>
                      <p style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>{v.kernbotschaft}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <FieldLabel>Titel</FieldLabel>
              <input value={n.titel} onChange={e => field('titel', e.target.value)} style={inputStyle} placeholder="z.B. Bezahlbar wohnen in der Innenstadt" />
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <FieldLabel>Kernbotschaft</FieldLabel>
              <textarea value={n.kernbotschaft} onChange={e => field('kernbotschaft', e.target.value)} rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                placeholder="Konkret. Lokal. Wofür steht der/die Kandidat:in bei diesem Thema?" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.625rem', marginTop: '0.75rem' }}>
              <div>
                <FieldLabel>Milieu</FieldLabel>
                <select value={n.zielgruppe_milieu} onChange={e => field('zielgruppe_milieu', e.target.value)} style={inputStyle}>
                  <option value="">—</option>
                  {MILIEUS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Altersgruppe</FieldLabel>
                <select value={n.zielgruppe_alter} onChange={e => field('zielgruppe_alter', e.target.value)} style={inputStyle}>
                  <option value="">—</option>
                  {ALTERSGRUPPEN.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Status</FieldLabel>
                <select value={n.status} onChange={e => field('status', e.target.value)} style={inputStyle}>
                  {STATUS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Abbrechen</button>
              <button onClick={save} disabled={!n.titel.trim() || !n.kernbotschaft.trim()}
                style={{ background: !n.titel.trim() || !n.kernbotschaft.trim() ? 'rgba(168,85,247,0.3)' : 'linear-gradient(135deg, #A855F7, #7c3aed)', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, cursor: !n.titel.trim() || !n.kernbotschaft.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                Speichern
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Hauptseite
// ──────────────────────────────────────────────────────────────────────────

export default function NarrativBoard() {
  const { aktiveKampagne } = useKampagne()
  const kampagneId = aktiveKampagne?.id
  const [, setTick] = useState(0)
  const refresh = () => setTick(t => t + 1)

  const [dachOpen, setDachOpen] = useState(false)
  const [themaOpen, setThemaOpen] = useState(false)
  const [editingThema, setEditingThema] = useState(null)
  const [filter, setFilter] = useState('alle')

  const dach = useMemo(() => kampagneId ? getDachNarrativ(kampagneId) : null, [kampagneId])
  const themen = useMemo(() => kampagneId ? getThemenNarrative(kampagneId) : [], [kampagneId])

  const themenGefiltert = useMemo(() => {
    if (filter === 'alle') return themen
    if (filter === 'aktiv') return themen.filter(t => t.status === 'aktiv')
    if (filter === 'entwurf') return themen.filter(t => t.status === 'entwurf')
    return themen.filter(t => t.themenfeld === filter)
  }, [themen, filter])

  const grouped = useMemo(() => {
    const m = new Map()
    for (const tf of THEMENFELDER) m.set(tf.id, [])
    for (const n of themenGefiltert) {
      if (!m.has(n.themenfeld)) m.set(n.themenfeld, [])
      m.get(n.themenfeld).push(n)
    }
    return Array.from(m.entries()).filter(([, arr]) => arr.length > 0)
  }, [themenGefiltert])

  function saveDach(values) {
    if (dach) {
      saveNarrativ({ ...dach, ...values, status: 'aktiv' })
      setDachNarrativAktiv(kampagneId, dach.id)
    } else {
      const created = createNarrativ({ kampagneId, typ: 'dach', ...values, status: 'aktiv' })
      setDachNarrativAktiv(kampagneId, created.id)
    }
    refresh()
  }

  function saveThema(values) {
    if (values.id) saveNarrativ({ ...values, kampagne_id: kampagneId, typ: 'thema' })
    else createNarrativ({ kampagneId, typ: 'thema', ...values })
    refresh()
  }

  function delThema(id) {
    if (confirm('Themen-Narrativ wirklich löschen?')) { deleteNarrativ(id); refresh() }
  }

  function toggleStatus(n) {
    saveNarrativ({ ...n, status: n.status === 'aktiv' ? 'entwurf' : 'aktiv' })
    refresh()
  }

  if (!aktiveKampagne) {
    return (
      <div style={{ width: '100%' }}>
        <PageHeader title="Narrativ-Board" description="Zentrales Rückgrat jeder Kampagne." icon={Bookmark} color={COLOR} />
        <div style={{ background: '#162230', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
          Wähle oben eine Kampagne aus, um deren Narrative zu verwalten.
        </div>
      </div>
    )
  }

  const aktiv = themen.filter(t => t.status === 'aktiv').length
  const entwurf = themen.filter(t => t.status === 'entwurf').length

  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Narrativ-Board"
        description={`Dach-Narrativ und Themen-Narrative — lokal verankert auf ${aktiveKampagne.ort}.`}
        icon={Bookmark}
        color={COLOR}
      >
        <button onClick={() => { setEditingThema(null); setThemaOpen(true) }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #A855F7, #7c3aed)', color: '#fff', border: 'none', borderRadius: 10, padding: '0.55rem 0.95rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(168,85,247,0.3)' }}>
          <Plus size={12} /> Themen-Narrativ
        </button>
      </PageHeader>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <Stat icon={Crown} label="Dach-Narrativ" value={dach ? '1' : '–'} sub={dach?.titel || 'noch nicht definiert'} color={COLOR} />
        <Stat icon={Layers} label="Themen-Narrative" value={themen.length} sub={`${aktiv} aktiv · ${entwurf} Entwurf`} color="#52b7c1" />
        <Stat icon={Tag} label="Themenfelder" value={new Set(themen.map(t => t.themenfeld)).size} sub="abgedeckt" color="#22c55e" />
        <Stat icon={MapPin} label="Lokaler Bezug" value={themen.filter(t => t.lokaler_bezug).length} sub="mit Stadtteil-Bezug" color="#ffa600" />
      </div>

      {/* Dach-Narrativ */}
      <div style={{ marginBottom: '1.5rem' }}>
        <DachCard kampagne={aktiveKampagne} dach={dach}
          onEdit={() => setDachOpen(true)}
          onCreate={() => setDachOpen(true)} />
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
        {[['alle', 'Alle'], ['aktiv', 'Aktiv'], ['entwurf', 'Entwurf']].map(([id, label]) => (
          <FilterChip key={id} active={filter === id} onClick={() => setFilter(id)} label={label} />
        ))}
        <span style={{ width: 1, background: 'rgba(255,255,255,0.08)', margin: '0 0.4rem' }} />
        {THEMENFELDER.map(t => (
          <FilterChip key={t.id} active={filter === t.id} onClick={() => setFilter(t.id)} label={t.label} color={t.color} />
        ))}
      </div>

      {/* Themen-Cards gruppiert */}
      {grouped.length === 0 ? (
        <div style={{ background: '#162230', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 14, padding: '2.5rem 1.5rem', textAlign: 'center' }}>
          <Layers size={28} color="rgba(168,85,247,0.4)" style={{ margin: '0 auto 0.5rem' }} />
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Noch keine Themen-Narrative.</p>
          <button onClick={() => { setEditingThema(null); setThemaOpen(true) }}
            style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(168,85,247,0.12)', color: COLOR, border: '1px solid rgba(168,85,247,0.3)', borderRadius: 8, padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Plus size={11} /> Erstes Narrativ anlegen
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {grouped.map(([feldId, items]) => {
            const tf = THEMENFELDER.find(x => x.id === feldId)
            return (
              <div key={feldId}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
                  <span style={{ width: 4, height: 16, background: tf?.color || COLOR, borderRadius: 2 }} />
                  <h4 style={{ fontSize: '0.6875rem', fontWeight: 800, letterSpacing: '0.16em', color: tf?.color || COLOR, textTransform: 'uppercase' }}>{tf?.label || feldId}</h4>
                  <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)' }}>· {items.length}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.875rem' }}>
                  <AnimatePresence>
                    {items.map(n => (
                      <ThemenCard key={n.id} narrativ={n}
                        onEdit={() => { setEditingThema(n); setThemaOpen(true) }}
                        onDelete={() => delThema(n.id)}
                        onToggleStatus={() => toggleStatus(n)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <DachModal open={dachOpen} onClose={() => setDachOpen(false)} kampagne={aktiveKampagne} existing={dach} onSave={saveDach} />
      <ThemaModal open={themaOpen} onClose={() => setThemaOpen(false)} kampagne={aktiveKampagne} existing={editingThema} onSave={saveThema} />

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function Stat({ icon: Icon, label, value, sub, color }) {
  return (
    <div style={{ background: '#162230', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={15} color={color} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: '0.5625rem', fontWeight: 800, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{label}</p>
        <p style={{ fontSize: '1.125rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{value}</p>
        <p style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</p>
      </div>
    </div>
  )
}

function FilterChip({ active, onClick, label, color }) {
  const c = color || COLOR
  return (
    <button onClick={onClick} style={{
      background: active ? `${c}20` : 'rgba(255,255,255,0.03)',
      color: active ? c : 'rgba(255,255,255,0.55)',
      border: `1px solid ${active ? `${c}55` : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 7, padding: '0.3rem 0.65rem', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
    }}>
      {label}
    </button>
  )
}
