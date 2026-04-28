import { useState } from 'react'
import { motion } from 'framer-motion'
import { Crosshair, Zap, RefreshCw, Users } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'

const COLOR = '#ffa600'

const MILIEUS = [
  {
    key: 'konservativ_etablierte',
    label: 'Konservativ-Etablierte',
    anteil: '10%',
    alter: '50+',
    keywords: ['Tradition', 'Leistung', 'Sicherheit', 'Pflicht', 'Elite'],
    werte: 'Bewahren, Ordnung, Verantwortung, Qualität',
    trigger: 'Stabilität sichern, Ordnung wiederherstellen, Qualität erhalten',
    vermeiden: 'Disruption, Experiment, Kostenargument',
    cduAffinität: 'sehr hoch',
    color: '#3B82F6',
  },
  {
    key: 'liberal_intellektuelle',
    label: 'Liberal-Intellektuelle',
    anteil: '7%',
    alter: '35–60',
    keywords: ['Selbstentfaltung', 'Pluralismus', 'Weltoffenheit', 'Kritik'],
    werte: 'Bildung, Freiheit, Toleranz, Globalismus',
    trigger: 'Sachargumente, Differenzierung, Weltoffenheit',
    vermeiden: 'Populismus, Vereinfachung, Nationalismus',
    cduAffinität: 'mittel',
    color: '#8B5CF6',
  },
  {
    key: 'performer',
    label: 'Performer',
    anteil: '8%',
    alter: '25–45',
    keywords: ['Erfolg', 'Effizienz', 'Innovation', 'Status', 'Global'],
    werte: 'Karriere, Konsum, Flexibilität, Digitalisierung',
    trigger: 'Wirtschaftskompetenz, Digitalisierung, niedrige Steuern',
    vermeiden: 'Bürokratie, Langsamkeit, Gleichmacherei',
    cduAffinität: 'hoch',
    color: '#ffa600',
  },
  {
    key: 'buergerliche_mitte',
    label: 'Bürgerliche Mitte',
    anteil: '14%',
    alter: '30–60',
    keywords: ['Harmonie', 'Normalität', 'Familie', 'Sicherheit', 'Heimat'],
    werte: 'Familienorientierung, Absicherung, Gemeinschaft, Bodenständigkeit',
    trigger: 'Sicherheit, bezahlbare Mieten, gute Schulen, Ordnung',
    vermeiden: 'Verunsicherung, Ideologie, Experimente',
    cduAffinität: 'hoch',
    color: '#22C55E',
  },
  {
    key: 'adaptiv_pragmatische',
    label: 'Adaptiv-Pragmatische',
    anteil: '12%',
    alter: '20–40',
    keywords: ['Pragmatismus', 'Flexibilität', 'Work-Life-Balance', 'Modernes'],
    werte: 'Praktikabilität, Ausgleich, Machbarkeit, Bescheidenheit',
    trigger: 'Lösungsorientiertheit, keine Dogmen, konkrete Resultate',
    vermeiden: 'Ideologisierung, Versprechen ohne Umsetzung',
    cduAffinität: 'mittel',
    color: '#06B6D4',
  },
  {
    key: 'sozialökologische',
    label: 'Sozialökologische',
    anteil: '7%',
    alter: '25–55',
    keywords: ['Nachhaltigkeit', 'Solidarität', 'Gerechtigkeit', 'Klima'],
    werte: 'Ökologie, Fairness, Anti-Kommerz, Gemeinwohl',
    trigger: 'Klimaengagement, soziale Fairness, Transparenz',
    vermeiden: 'Wirtschaftslobby, Greenwashing, Marktradikalismus',
    cduAffinität: 'niedrig',
    color: '#10B981',
  },
  {
    key: 'traditionelle',
    label: 'Traditionelle',
    anteil: '11%',
    alter: '60+',
    keywords: ['Pflicht', 'Heimat', 'Bescheidenheit', 'Sparsamkeit', 'Geborgenheit'],
    werte: 'Ordnung, Heimat, Sparsamkeit, Verlässlichkeit',
    trigger: 'Vertrauen, Pflichterfüllung, Sicherheit im Alter',
    vermeiden: 'Verunsicherung, Modernismus, Tempo',
    cduAffinität: 'sehr hoch',
    color: '#F59E0B',
  },
  {
    key: 'prekäre',
    label: 'Prekäre',
    anteil: '9%',
    alter: '20–50',
    keywords: ['Absicherung', 'Anerkennung', 'Angst', 'Ausgrenzung'],
    werte: 'Zugehörigkeit, Sicherheit, Respekt, Abgrenzung nach unten',
    trigger: 'Fairness, Zugehörigkeit, Ordnung und Sicherheit',
    vermeiden: 'Belehrung, Abwertung, Fachsprache',
    cduAffinität: 'niedrig-mittel',
    color: '#EF4444',
  },
  {
    key: 'hedonisten',
    label: 'Hedonisten',
    anteil: '11%',
    alter: '15–30',
    keywords: ['Spaß', 'Spontaneität', 'Freiheit', 'Konsum', 'Augenblick'],
    werte: 'Genuss, Freiheit, Abwechslung, Entertainment',
    trigger: 'Persönliche Freiheit, keine Bevormundung, Zukunftschancen',
    vermeiden: 'Verbote, Moralismus, Bürokratie',
    cduAffinität: 'niedrig',
    color: '#F97316',
  },
  {
    key: 'expeditive',
    label: 'Expeditive',
    anteil: '9%',
    alter: '20–35',
    keywords: ['Eigenständigkeit', 'Netzwerke', 'Digital', 'Individualismus'],
    werte: 'Authentizität, Unabhängigkeit, Kreativität, Innovation',
    trigger: 'Konkrete Lösungen, ehrliche Kommunikation, Start-up-Mentalität',
    vermeiden: 'Establishment, Phrasen, Langweile',
    cduAffinität: 'niedrig-mittel',
    color: '#EC4899',
  },
]

export default function MicroTargeting() {
  const [selected, setSelected] = useState(null)
  const [thema, setThema] = useState('')
  const [botschaft, setBotschaft] = useState('')
  const [loading, setLoading] = useState(false)
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  const milieu = MILIEUS.find(m => m.key === selected)

  async function generateBotschaft() {
    if (!milieu || !thema.trim()) return
    setLoading(true)
    setBotschaft('')

    const prompt = `Du bist POLARIS Micro-Targeting-Spezialist für die CDU Kampagne Jürgen Roth, OB-Wahl Villingen-Schwenningen 2026.

Formuliere eine zielgruppengerechte Botschaft für das Milieu: ${milieu.label}

Milieu-Eigenschaften:
- Kernwerte: ${milieu.werte}
- Trigger-Worte: ${milieu.trigger}
- Vermeiden: ${milieu.vermeiden}

Kampagnenthema: ${thema}

Erstelle:
1. Eine kurze Kernbotschaft (1-2 Sätze, max. 40 Wörter) — geeignet für Social Media / Flyer
2. 3 milieuspezifische Formulierungsbeispiele für verschiedene Kanäle
3. Welche Bilder / Motive würden diesem Milieu ansprechen (1 Satz)
4. Welche Plattform / Kanal empfohlen (1 Satz)

Sprache des Milieus verwenden. Authentisch. Keine leeren Phrasen.`

    if (!apiKey) { setBotschaft('API-Key fehlt. Bitte VITE_ANTHROPIC_API_KEY in .env setzen.'); setLoading(false); return }
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: AbortSignal.timeout(30000),
        headers: {
          'x-api-key': apiKey, 'anthropic-version': '2023-06-01',
          'content-type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 900, messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await res.json()
      if (data.error) { setBotschaft(`⚠ API-Fehler: ${data.error.message || data.error.type || JSON.stringify(data.error)}`); setLoading(false); return }
      setBotschaft(data.content?.[0]?.text || 'Keine Antwort erhalten.')
    } catch (e) {
      setBotschaft(`Verbindungsfehler: ${e.message || 'Bitte erneut versuchen.'}`)
    }
    setLoading(false)
  }

  const affinitätColor = (a) => {
    if (a.includes('sehr hoch')) return '#22c55e'
    if (a.includes('hoch')) return '#86efac'
    if (a.includes('mittel')) return '#ffa600'
    return '#ef4444'
  }

  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Micro-Targeting"
        description="Zielgruppengerechte Ansprache nach Sinus-Milieus — jede Botschaft trifft den richtigen Nerv."
        icon={Crosshair}
        color={COLOR}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.25rem' }}>
        {/* Milieu List */}
        <div>
          <p style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: '#ffa600', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Sinus-Milieus — Milieu auswählen
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {MILIEUS.map((m) => (
              <motion.button
                key={m.key}
                onClick={() => { setSelected(m.key === selected ? null : m.key); setBotschaft('') }}
                whileHover={{ x: 2 }}
                style={{
                  background: selected === m.key ? `${m.color}15` : '#162230',
                  border: `1px solid ${selected === m.key ? m.color : 'rgba(255,255,255,0.07)'}`,
                  borderLeft: `3px solid ${m.color}`,
                  borderRadius: 10, padding: '0.625rem 1rem', cursor: 'pointer',
                  textAlign: 'left', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: selected === m.key ? 700 : 500, color: selected === m.key ? '#fff' : 'rgba(255,255,255,0.65)' }}>
                    {m.label}
                  </span>
                  <div style={{ display: 'flex', gap: '0.625rem', marginTop: 2 }}>
                    <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.7)' }}>{m.anteil}</span>
                    <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.4)' }}>·</span>
                    <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.7)' }}>Ø {m.alter}</span>
                  </div>
                </div>
                <span style={{ fontSize: '0.5625rem', fontWeight: 700, color: affinitätColor(m.cduAffinität), background: `${affinitätColor(m.cduAffinität)}15`, border: `1px solid ${affinitätColor(m.cduAffinität)}30`, borderRadius: 6, padding: '0.15rem 0.4rem', whiteSpace: 'nowrap' }}>
                  CDU {m.cduAffinität}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Detail & Generator */}
        <div>
          {!milieu ? (
            <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 14, padding: '3rem', textAlign: 'center', color: '#C8DCF0' }}>
              <Users size={32} style={{ opacity: 0.4, margin: '0 auto 1rem', color: '#ffa600' }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Milieu auswählen für Details und Botschaftsgenerator</p>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem' }}>10 Sinus-Milieus stehen zur Auswahl</p>
            </div>
          ) : (
            <motion.div key={milieu.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {/* Milieu Detail Card */}
              <div style={{ background: '#162230', border: `1px solid ${milieu.color}25`, borderTop: `3px solid ${milieu.color}`, borderRadius: 14, padding: '1.25rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>{milieu.label}</h3>
                    <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.75)' }}>{milieu.anteil} der Bevölkerung · Ø {milieu.alter} Jahre</span>
                  </div>
                  <span style={{ fontSize: '0.5625rem', fontWeight: 700, color: affinitätColor(milieu.cduAffinität) }}>CDU-Affinität: {milieu.cduAffinität}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <p style={sectionLabel}>Kernwerte</p>
                    <p style={sectionText}>{milieu.werte}</p>
                  </div>
                  <div>
                    <p style={sectionLabel}>Keywords</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                      {milieu.keywords.map(k => (
                        <span key={k} style={{ fontSize: '0.625rem', background: `${milieu.color}15`, color: milieu.color, border: `1px solid ${milieu.color}25`, padding: '0.15rem 0.4rem', borderRadius: 5 }}>{k}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p style={sectionLabel}>Trigger-Frames</p>
                    <p style={sectionText}>{milieu.trigger}</p>
                  </div>
                  <div>
                    <p style={sectionLabel}>Vermeiden</p>
                    <p style={{ ...sectionText, color: '#fca5a5' }}>{milieu.vermeiden}</p>
                  </div>
                </div>
              </div>

              {/* Botschafts-Generator */}
              <div style={{ background: '#162230', border: `1px solid ${COLOR}20`, borderRadius: 14, padding: '1.25rem' }}>
                <p style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: COLOR, textTransform: 'uppercase', marginBottom: '0.875rem' }}>
                  Botschafts-Generator
                </p>
                <div style={{ marginBottom: '0.875rem' }}>
                  <label style={labelStyle}>Kampagnenthema / Anlass</label>
                  <input
                    value={thema}
                    onChange={e => setThema(e.target.value)}
                    placeholder="z.B. Verkehrswende, neue Kita-Plätze, Innenstadtbelebung…"
                    style={inputStyle}
                    onKeyDown={e => e.key === 'Enter' && generateBotschaft()}
                  />
                </div>
                <button
                  onClick={generateBotschaft}
                  disabled={loading || !thema.trim() || !apiKey}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: thema.trim() && apiKey ? `${COLOR}18` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${thema.trim() && apiKey ? COLOR : 'rgba(255,255,255,0.5)'}`,
                    borderRadius: 8, padding: '0.5rem 1.125rem', cursor: thema.trim() && apiKey ? 'pointer' : 'not-allowed',
                    color: thema.trim() && apiKey ? COLOR : 'rgba(255,255,255,0.7)',
                    fontSize: '0.8125rem', fontWeight: 600, marginBottom: botschaft ? '1rem' : 0,
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={12} />}
                  {loading ? 'Generiere…' : 'Botschaft generieren'}
                </button>

                {botschaft && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: 'rgba(255,166,0,0.06)', border: '1px solid rgba(255,166,0,0.15)', borderRadius: 10, padding: '1rem' }}>
                    <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{botschaft}</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

const sectionLabel = { fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.12em', color: '#ffa600', textTransform: 'uppercase', marginBottom: '0.25rem' }
const sectionText = { fontSize: '0.75rem', color: '#E2E8F0', lineHeight: 1.5 }
const labelStyle = { display: 'block', fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: '0.375rem' }
const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 8, padding: '0.5rem 0.75rem', color: '#fff', fontSize: '0.8125rem', outline: 'none', boxSizing: 'border-box' }
