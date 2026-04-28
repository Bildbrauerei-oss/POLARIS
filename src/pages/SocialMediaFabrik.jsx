import { useState } from 'react'
import { motion } from 'framer-motion'
import { Megaphone, Send, Copy, RefreshCw, Check, Clock, ChevronRight } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'

const CAPTION_HISTORY_KEY = 'polaris_caption_history'
function loadCaptionHistory() { try { return JSON.parse(localStorage.getItem(CAPTION_HISTORY_KEY)) || [] } catch { return [] } }
function saveCaptionHistory(entry) {
  const h = loadCaptionHistory()
  localStorage.setItem(CAPTION_HISTORY_KEY, JSON.stringify([entry, ...h].slice(0, 5)))
}

const PLATTFORMEN = [
  { id: 'instagram', label: 'Instagram', maxChars: 2200, icon: '📸', hint: 'Emotional, visuell, Hashtags, persönlich' },
  { id: 'twitter', label: 'X / Twitter', maxChars: 280, icon: '𝕏', hint: 'Prägnant, pointiert, max. 280 Zeichen' },
  { id: 'facebook', label: 'Facebook', maxChars: 63206, icon: '📘', hint: 'Ausführlicher, Community-orientiert, mit Link' },
  { id: 'linkedin', label: 'LinkedIn', maxChars: 3000, icon: '💼', hint: 'Professionell, strategisch, Führungspersönlichkeit' },
  { id: 'pressemitteilung', label: 'Pressemitteilung', maxChars: 5000, icon: '📄', hint: 'Formell, journalistisch, 5-W-Prinzip' },
]

const TONE = [
  { id: 'souveraen', label: 'Souverän', desc: 'Staatsmännisch, führungsstark' },
  { id: 'nahbar', label: 'Nahbar', desc: 'Menschlich, authentisch' },
  { id: 'angriffig', label: 'Offensiv', desc: 'Klar positioniert, kritisch' },
  { id: 'informierend', label: 'Informierend', desc: 'Sachlich, überzeugend' },
]

export default function SocialMediaFabrik() {
  const [plattform, setPlattform] = useState('instagram')
  const [tone, setTone] = useState('souveraen')
  const [thema, setThema] = useState('')
  const [kontext, setKontext] = useState('')
  const [ergebnis, setErgebnis] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [captionHistory, setCaptionHistory] = useState(loadCaptionHistory)
  const [showHistory, setShowHistory] = useState(false)
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  const plattformInfo = PLATTFORMEN.find(p => p.id === plattform)
  const toneInfo = TONE.find(t => t.id === tone)

  async function generate() {
    if (!thema.trim()) return
    setLoading(true)
    setErgebnis('')

    const system = `Du bist ein erfahrener politischer Social-Media-Stratege für die CDU. Dein Mandant ist Jürgen Roth, Kandidat für die OB-Wahl in Villingen-Schwenningen (September 2026), parteilos mit CDU-Unterstützung.

Deine Aufgabe: Schreibe exzellente Social-Media-Posts und Pressemitteilungen, die Menschen bewegen.

Stil: ${toneInfo?.label} — ${toneInfo?.desc}
Plattform: ${plattformInfo?.label} (${plattformInfo?.hint})
Max. Zeichen: ${plattformInfo?.maxChars}

Wichtig:
- Keine leeren Politikfloskeln
- Authentisch und klar
- Für ${plattformInfo?.label} passend formatiert
- Nur den fertigen Post ausgeben, keine Erklärungen`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: AbortSignal.timeout(30000),
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1200,
          system,
          messages: [{
            role: 'user',
            content: `Thema: ${thema}${kontext ? `\n\nZusätzlicher Kontext: ${kontext}` : ''}`,
          }],
        }),
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || 'Fehler beim Generieren.'
      setErgebnis(text)
      if (text && !text.startsWith('Fehler')) {
        const entry = { id: Date.now(), ts: new Date().toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }), plattform, thema: thema.slice(0, 50), text }
        saveCaptionHistory(entry)
        setCaptionHistory(loadCaptionHistory())
      }
    } catch {
      setErgebnis('Verbindungsfehler. Bitte erneut versuchen.')
    }
    setLoading(false)
  }

  async function copy() {
    await navigator.clipboard.writeText(ergebnis)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Social Media Fabrik"
        description="KI-gestützte Erstellung von Posts, Pressemitteilungen und Texten für jeden Kanal."
        icon={Megaphone}
        color="#F97316"
      >
        {captionHistory.length > 0 && (
          <button onClick={() => setShowHistory(s => !s)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: showHistory ? 'rgba(249,115,22,0.15)' : 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 8, padding: '0.5rem 0.875rem', color: '#F97316', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Clock size={11} /> Verlauf ({captionHistory.length})
          </button>
        )}
      </PageHeader>

      {/* Caption History */}
      {showHistory && captionHistory.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: '#162230', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 14, padding: '1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', overflowX: 'auto' }}>
          {captionHistory.map(h => (
            <div key={h.id} onClick={() => { setErgebnis(h.text); setShowHistory(false) }}
              style={{ flexShrink: 0, width: 200, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(249,115,22,0.15)', borderRadius: 10, padding: '0.75rem', cursor: 'pointer', transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.07)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
                <span style={{ fontSize: '0.5625rem', color: '#F97316', fontWeight: 700 }}>{PLATTFORMEN.find(p => p.id === h.plattform)?.icon} {h.plattform}</span>
                <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.7)', marginLeft: 'auto' }}>{h.ts}</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }}>{h.thema}</p>
              <p style={{ fontSize: '0.5625rem', color: 'rgba(255,166,0,0.6)', marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><ChevronRight size={8} /> Wiederherstellen</p>
            </div>
          ))}
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

        {/* Eingabe */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Plattform */}
          <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 14, padding: '1.25rem' }}>
            <p style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: '#ffa600', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Kanal</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {PLATTFORMEN.map(p => (
                <button key={p.id} onClick={() => setPlattform(p.id)} style={{
                  padding: '0.5rem 0.875rem', background: plattform === p.id ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${plattform === p.id ? 'rgba(249,115,22,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 8, color: plattform === p.id ? '#F97316' : 'rgba(255,255,255,0.5)',
                  fontSize: '0.8125rem', fontWeight: plattform === p.id ? 700 : 400,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s',
                }}>
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
            {plattformInfo && (
              <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.65)', marginTop: '0.625rem', fontStyle: 'italic' }}>
                {plattformInfo.hint}
              </p>
            )}
          </div>

          {/* Tonalität */}
          <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 14, padding: '1.25rem' }}>
            <p style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: '#ffa600', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Ton</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {TONE.map(t => (
                <button key={t.id} onClick={() => setTone(t.id)} style={{
                  padding: '0.625rem 0.875rem', textAlign: 'left',
                  background: tone === t.id ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${tone === t.id ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s',
                }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: tone === t.id ? '#F97316' : '#fff' }}>{t.label}</p>
                  <p style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.125rem' }}>{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Thema */}
          <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 14, padding: '1.25rem' }}>
            <p style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: '#ffa600', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Thema / Anlass *</p>
            <textarea
              value={thema}
              onChange={e => setThema(e.target.value)}
              placeholder="z.B. Besuch der Feuerwehr Villingen, neue Wirtschaftsförderung, Reaktion auf Kritik…"
              rows={3}
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '0.625rem 0.75rem', color: '#fff', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.5, boxSizing: 'border-box', transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
            <p style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: '#ffa600', textTransform: 'uppercase', margin: '0.75rem 0' }}>Zusätzlicher Kontext (optional)</p>
            <textarea
              value={kontext}
              onChange={e => setKontext(e.target.value)}
              placeholder="Zahlen, Fakten, Zitate, die eingeflossen werden sollen…"
              rows={2}
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '0.625rem 0.75rem', color: '#fff', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.5, boxSizing: 'border-box', transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
            <button
              onClick={generate}
              disabled={!thema.trim() || loading}
              style={{ marginTop: '0.875rem', width: '100%', padding: '0.75rem', background: !thema.trim() || loading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #F97316, #ea6800)', border: 'none', borderRadius: 10, color: !thema.trim() || loading ? 'rgba(255,255,255,0.7)' : '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: !thema.trim() || loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.15s', boxShadow: !thema.trim() || loading ? 'none' : '0 4px 16px rgba(249,115,22,0.3)' }}
            >
              {loading
                ? <><RefreshCw size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Generiere…</>
                : <><Send size={14} /> Post generieren</>}
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        </div>

        {/* Ergebnis */}
        <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 400 }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: '#F97316', textTransform: 'uppercase' }}>
              {plattformInfo?.icon} {plattformInfo?.label} · Entwurf
            </span>
            {ergebnis && (
              <button onClick={copy} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: copied ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.5)'}`, borderRadius: 6, padding: '0.25rem 0.625rem', color: copied ? '#22c55e' : 'rgba(255,255,255,0.5)', fontSize: '0.6875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                {copied ? <><Check size={11} /> Kopiert!</> : <><Copy size={11} /> Kopieren</>}
              </button>
            )}
          </div>

          <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#F97316', animation: `pulse-dot 1.2s ease ${i * 0.2}s infinite` }} />)}
                </div>
                Schreibe {plattformInfo?.label}-Post…
              </div>
            ) : ergebnis ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ fontSize: '0.9375rem', color: '#fff', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: '"IBM Plex Serif", Georgia, serif' }}
              >
                {ergebnis}
              </motion.div>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: '4rem', color: 'rgba(255,255,255,0.55)' }}>
                <Megaphone size={36} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.3 }} />
                <p style={{ fontSize: '0.875rem' }}>Thema eingeben und Post generieren.</p>
              </div>
            )}
          </div>

          {ergebnis && plattformInfo && (
            <div style={{ padding: '0.625rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.625rem', color: ergebnis.length > plattformInfo.maxChars ? '#ff4040' : 'rgba(255,255,255,0.65)' }}>
                {ergebnis.length} / {plattformInfo.maxChars} Zeichen
              </span>
              <button onClick={generate} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '0.6875rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.25rem', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#F97316'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
                <RefreshCw size={10} /> Neu generieren
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
