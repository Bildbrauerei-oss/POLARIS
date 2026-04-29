import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Crosshair, Zap, RefreshCw, Users, ChevronRight, Target, AlertTriangle, CheckCircle, Bookmark, Send, MapPin, Calendar } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import { useKampagne, loadKampagneDaten } from '../lib/kampagneContext'
import { getDachNarrativ, getThemenNarrative } from '../lib/narrativeStore'
import { setHandoff } from '../lib/handoff'

const COLOR = '#ffa600'

const ALTERSGRUPPEN = [
  { key: '18-30', label: '18–30', sub: 'Junge Erwachsene' },
  { key: '31-45', label: '31–45', sub: 'Etablierte' },
  { key: '46-60', label: '46–60', sub: 'Mittleres Alter' },
  { key: '60+',   label: '60+',   sub: 'Senioren' },
]

const MILIEUS = [
  {
    key: 'konservativ_etablierte',
    label: 'Konservativ-Etablierte',
    anteil: '10%', alter: '50+',
    beschreibung: 'Erfolgreiche, gebildete Führungskräfte mit konservativ-bürgerlichen Wertvorstellungen. Pflegen Traditionen, schätzen Qualität und gesellschaftlichen Status.',
    keywords: ['Tradition', 'Leistung', 'Sicherheit', 'Pflicht', 'Elite'],
    kernthemen: ['Innere Sicherheit', 'Wirtschaftskompetenz', 'Bildungsqualität', 'Rechtsstaatlichkeit'],
    werte: 'Bewahren, Ordnung, Verantwortung, Qualität',
    trigger: 'Stabilität sichern, Ordnung wiederherstellen, Qualität erhalten',
    ansprache: 'Sachlich, respektvoll, mit Fakten unterlegt. Appell an Verantwortung und Erbe. Keine Experimente.',
    vermeiden: 'Disruption, Experiment, Kostenargument',
    cduAffinität: 'sehr hoch', color: '#3B82F6',
  },
  {
    key: 'liberal_intellektuelle',
    label: 'Liberal-Intellektuelle',
    anteil: '7%', alter: '35–60',
    beschreibung: 'Offene, kritische Köpfe mit hohem Bildungsgrad. Hinterfragen Autoritäten, schätzen Pluralismus und weltoffenen Diskurs.',
    keywords: ['Selbstentfaltung', 'Pluralismus', 'Weltoffenheit', 'Kritik'],
    kernthemen: ['Bildungspolitik', 'Digitalisierung', 'Europa', 'Pressefreiheit'],
    werte: 'Bildung, Freiheit, Toleranz, Globalismus',
    trigger: 'Sachargumente, Differenzierung, Weltoffenheit',
    ansprache: 'Argumentativ, differenziert, offen für Widerspruch. Keine einfachen Antworten, echte Sachkenntnis zeigen.',
    vermeiden: 'Populismus, Vereinfachung, Nationalismus',
    cduAffinität: 'mittel', color: '#8B5CF6',
  },
  {
    key: 'performer',
    label: 'Performer',
    anteil: '8%', alter: '25–45',
    beschreibung: 'Leistungsorientierte Karriere-Menschen mit globaler Perspektive. Streben nach Erfolg, Effizienz und modernem Lifestyle.',
    keywords: ['Erfolg', 'Effizienz', 'Innovation', 'Status', 'Global'],
    kernthemen: ['Wirtschaft', 'Steuern', 'Digitalisierung', 'Start-ups'],
    werte: 'Karriere, Konsum, Flexibilität, Digitalisierung',
    trigger: 'Wirtschaftskompetenz, Digitalisierung, niedrige Steuern',
    ansprache: 'Knapp, dynamisch, ergebnisorientiert. Zahlen und Fakten. Kein Weichzeichnen.',
    vermeiden: 'Bürokratie, Langsamkeit, Gleichmacherei',
    cduAffinität: 'hoch', color: '#ffa600',
  },
  {
    key: 'buergerliche_mitte',
    label: 'Bürgerliche Mitte',
    anteil: '14%', alter: '30–60',
    beschreibung: 'Das Herzstück der deutschen Gesellschaft. Familienorientiert, sicherheitsbewusst, streben nach Normalität und Anerkennung.',
    keywords: ['Harmonie', 'Normalität', 'Familie', 'Sicherheit', 'Heimat'],
    kernthemen: ['Sicherheit', 'Wohnen', 'Bildung', 'Familie', 'Rente'],
    werte: 'Familienorientierung, Absicherung, Gemeinschaft, Bodenständigkeit',
    trigger: 'Sicherheit, bezahlbare Mieten, gute Schulen, Ordnung',
    ansprache: 'Warm, verständlich, nahbar. Familienbilder, lokale Bezüge, Alltagssprache.',
    vermeiden: 'Verunsicherung, Ideologie, Experimente',
    cduAffinität: 'hoch', color: '#22C55E',
  },
  {
    key: 'adaptiv_pragmatische',
    label: 'Adaptiv-Pragmatische',
    anteil: '12%', alter: '20–40',
    beschreibung: 'Junge, flexible Mitte. Weder ideologisch noch apolitisch — suchen pragmatische Lösungen, die funktionieren.',
    keywords: ['Pragmatismus', 'Flexibilität', 'Work-Life-Balance', 'Modernes'],
    kernthemen: ['Wohnen', 'Mobilität', 'Digitales', 'Klimapolitik'],
    werte: 'Praktikabilität, Ausgleich, Machbarkeit, Bescheidenheit',
    trigger: 'Lösungsorientiertheit, keine Dogmen, konkrete Resultate',
    ansprache: 'Lösungsorientiert, ohne Parteikampf. "Was bringt das wirklich?" ist die Kernfrage.',
    vermeiden: 'Ideologisierung, Versprechen ohne Umsetzung',
    cduAffinität: 'mittel', color: '#06B6D4',
  },
  {
    key: 'sozialökologische',
    label: 'Sozialökologische',
    anteil: '7%', alter: '25–55',
    beschreibung: 'Engagierte Weltverbesserer mit starkem Nachhaltigkeitsanspruch. Kritisch gegenüber Kommerz, offen für solidarische Modelle.',
    keywords: ['Nachhaltigkeit', 'Solidarität', 'Gerechtigkeit', 'Klima'],
    kernthemen: ['Klimaschutz', 'Soziale Gerechtigkeit', 'ÖPNV', 'Transparenz'],
    werte: 'Ökologie, Fairness, Anti-Kommerz, Gemeinwohl',
    trigger: 'Klimaengagement, soziale Fairness, Transparenz',
    ansprache: 'Ehrlich, substanziell, keine Versprechen ohne Belege. Lokale Klimamaßnahmen konkret benennen.',
    vermeiden: 'Wirtschaftslobby, Greenwashing, Marktradikalismus',
    cduAffinität: 'niedrig', color: '#10B981',
  },
  {
    key: 'traditionelle',
    label: 'Traditionelle',
    anteil: '11%', alter: '60+',
    beschreibung: 'Ältere Generation mit ausgeprägtem Pflichtbewusstsein. Verwurzelt, sparsam, heimatverbunden — schätzen Verlässlichkeit über alles.',
    keywords: ['Pflicht', 'Heimat', 'Bescheidenheit', 'Sparsamkeit', 'Geborgenheit'],
    kernthemen: ['Rente', 'Sicherheit', 'Gesundheit', 'Ordnung', 'Gemeinschaft'],
    werte: 'Ordnung, Heimat, Sparsamkeit, Verlässlichkeit',
    trigger: 'Vertrauen, Pflichterfüllung, Sicherheit im Alter',
    ansprache: 'Ruhig, respektvoll, persönlich. Kein Tempo, keine Modernismen. Vertrauen durch Kontinuität.',
    vermeiden: 'Verunsicherung, Modernismus, Tempo',
    cduAffinität: 'sehr hoch', color: '#F59E0B',
  },
  {
    key: 'prekäre',
    label: 'Prekäre',
    anteil: '9%', alter: '20–50',
    beschreibung: 'Menschen am gesellschaftlichen Rand, die Anerkennung und Zugehörigkeit suchen. Oft abgehängt, misstrauisch gegenüber Establishment.',
    keywords: ['Absicherung', 'Anerkennung', 'Angst', 'Ausgrenzung'],
    kernthemen: ['Soziale Absicherung', 'Gerechtigkeit', 'Mieten', 'Arbeit'],
    werte: 'Zugehörigkeit, Sicherheit, Respekt, Abgrenzung nach unten',
    trigger: 'Fairness, Zugehörigkeit, Ordnung und Sicherheit',
    ansprache: 'Respektvoll, auf Augenhöhe. Nie belehrend. Konkrete Hilfe zeigen, kein abstraktes Programm.',
    vermeiden: 'Belehrung, Abwertung, Fachsprache',
    cduAffinität: 'niedrig-mittel', color: '#EF4444',
  },
  {
    key: 'hedonisten',
    label: 'Hedonisten',
    anteil: '11%', alter: '15–30',
    beschreibung: 'Spaßorientierte Junge, die den Moment leben. Allergisch gegen Bevormundung und Moralismus. Politisch schwer erreichbar.',
    keywords: ['Spaß', 'Spontaneität', 'Freiheit', 'Konsum', 'Augenblick'],
    kernthemen: ['Freiheiten', 'Zukunftschancen', 'Ausbildung', 'Mobilität'],
    werte: 'Genuss, Freiheit, Abwechslung, Entertainment',
    trigger: 'Persönliche Freiheit, keine Bevormundung, Zukunftschancen',
    ansprache: 'Locker, authentisch, kurz. Humor erlaubt. Muss auf Social Media funktionieren.',
    vermeiden: 'Verbote, Moralismus, Bürokratie',
    cduAffinität: 'niedrig', color: '#F97316',
  },
  {
    key: 'expeditive',
    label: 'Expeditive',
    anteil: '9%', alter: '20–35',
    beschreibung: 'Kreative Avantgarde, vernetzt und eigenständig. Suchen Authentizität, lehnen Establishment-Phrasen ab.',
    keywords: ['Eigenständigkeit', 'Netzwerke', 'Digital', 'Individualismus'],
    kernthemen: ['Start-ups', 'Digitalpolitik', 'Kreativwirtschaft', 'Stadtentwicklung'],
    werte: 'Authentizität, Unabhängigkeit, Kreativität, Innovation',
    trigger: 'Konkrete Lösungen, ehrliche Kommunikation, Start-up-Mentalität',
    ansprache: 'Ehrlich und direkt, keine Politsprache. Echte Visionen statt Wahlversprechen.',
    vermeiden: 'Establishment, Phrasen, Langweile',
    cduAffinität: 'niedrig-mittel', color: '#EC4899',
  },
]

const affinitätColor = (a) => {
  if (a.includes('sehr hoch')) return '#22c55e'
  if (a.includes('hoch')) return '#86efac'
  if (a.includes('mittel')) return '#ffa600'
  return '#ef4444'
}

export default function MicroTargeting() {
  const navigate = useNavigate()
  const { aktiveKampagne } = useKampagne()
  const [selected, setSelected] = useState(null)
  const [selectedAlter, setSelectedAlter] = useState(null)
  const [kandidat, setKandidat] = useState(() => aktiveKampagne?.kandidat || 'Jürgen Roth')
  const [ort, setOrt] = useState(() => aktiveKampagne?.ort || 'Villingen-Schwenningen')
  const [thema, setThema] = useState('')
  // Gewichtung: 0–100 für Milieu↔Alter (50 = ausgeglichen), separat lokales-Thema-Gewicht 0–100
  const [milieuVsAlter, setMilieuVsAlter] = useState(50)
  const [lokalGewicht, setLokalGewicht] = useState(50)
  const [botschaft, setBotschaft] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  const dachNarrativ = aktiveKampagne ? getDachNarrativ(aktiveKampagne.id) : null
  const themenNarrative = aktiveKampagne ? getThemenNarrative(aktiveKampagne.id) : []
  const kampagneDaten = aktiveKampagne ? loadKampagneDaten()[aktiveKampagne.id] : null

  const milieu = MILIEUS.find(m => m.key === selected)
  const alter = ALTERSGRUPPEN.find(a => a.key === selectedAlter)

  function selectMilieu(key) {
    setSelected(prev => prev === key ? null : key)
    setBotschaft('')
    setError('')
  }

  function selectAlter(key) {
    setSelectedAlter(prev => prev === key ? null : key)
    setBotschaft('')
    setError('')
  }

  function gewichtLabel(v) {
    if (v < 25) return 'stark Milieu'
    if (v < 45) return 'eher Milieu'
    if (v <= 55) return 'ausgeglichen'
    if (v <= 75) return 'eher Alter'
    return 'stark Alter'
  }

  function lokalLabel(v) {
    if (v < 25) return 'gering'
    if (v < 50) return 'mittel'
    if (v < 75) return 'hoch'
    return 'sehr hoch (Lokal-Fokus)'
  }

  function sendToSMF() {
    if (!botschaft) return
    const segmentParts = []
    if (milieu) segmentParts.push(milieu.label)
    if (alter) segmentParts.push(`${alter.label} (${alter.sub})`)
    const segmentLabel = segmentParts.join(' · ')
    const kontext = `Segment: ${segmentLabel}\nGewichtung: ${gewichtLabel(milieuVsAlter)} | Lokal-Bezug: ${lokalLabel(lokalGewicht)}\nOrt: ${ort}\n\n--- Generierte Botschaft ---\n${botschaft}`
    setHandoff('social-media-fabrik', {
      thema: thema.trim() || `Botschaft für ${segmentLabel}`,
      kontext,
      tone: milieu?.ansprache?.split('.')[0] || '',
      sourceLabel: 'Micro-Targeting',
    })
    navigate('/social-media-fabrik')
  }

  async function generateBotschaft() {
    if (!milieu) return
    setGenerating(true)
    setBotschaft('')
    setError('')

    const milieuNarrative = themenNarrative.filter(n => n.zielgruppe_milieu === milieu.label && n.status !== 'archiv')
    const narrativBlock = (dachNarrativ || milieuNarrative.length > 0)
      ? `\nNARRATIV-RAHMEN DER KAMPAGNE:${dachNarrativ ? `\n- Dach-Narrativ: "${dachNarrativ.titel}" — ${dachNarrativ.kernbotschaft}` : ''}${milieuNarrative.map(n => `\n- Themen-Narrativ (${n.themenfeld || 'allgemein'}): "${n.titel}" — ${n.kernbotschaft}${n.lokaler_bezug ? ` [Bezug: ${n.lokaler_bezug}]` : ''}`).join('')}\nDie Botschaften MÜSSEN auf diesen Narrativen aufbauen — nicht widersprechen, sondern sie in der Sprache des Milieus übersetzen.\n`
      : ''

    // Demografie / Stadtteile aus Kampagnen-Daten
    const stadtteile = kampagneDaten?.demografie?.stadtteile || kampagneDaten?.stadtteile || null
    const demoBlock = stadtteile
      ? `\nLOKALE GEOGRAFIE / DEMOGRAFIE für ${ort}:\n${(Array.isArray(stadtteile) ? stadtteile : Object.entries(stadtteile)).slice(0, 12).map(s => typeof s === 'string' ? `- ${s}` : `- ${s[0]}: ${typeof s[1] === 'object' ? JSON.stringify(s[1]) : s[1]}`).join('\n')}\nNutze diese Stadtteile/Gebiete konkret bei der Empfehlung "Wo finde ich das Segment?".\n`
      : `\nKein detailliertes Stadtteil-Profil hinterlegt — empfehle Stadtteile/Quartiere von ${ort} nach allgemeinem Wissen über die Stadt (Sozialstruktur, Wohnformen, typische Lebenswelten).\n`

    const segmentBlock = alter
      ? `\nSEGMENT (kombiniert Milieu + Alter):
- Sinus-Milieu: ${milieu.label} (${milieu.anteil}, Ø ${milieu.alter})
- Altersgruppe: ${alter.label} — ${alter.sub}
- Gewichtung Milieu↔Alter: ${gewichtLabel(milieuVsAlter)} (${milieuVsAlter}/100 — 0=nur Milieu, 100=nur Alter)
- Gewichtung Lokales Thema: ${lokalLabel(lokalGewicht)} (${lokalGewicht}/100)
WICHTIG: Wenn das Alter sich vom Milieu-Durchschnitt (${milieu.alter}) unterscheidet, formuliere altersgerecht (Mediennutzung, Lebenslage, Sprache) — aber bleibe in der Werte-Welt des Milieus, sofern die Gewichtung nicht stark zu "Alter" tendiert.\n`
      : `\nSEGMENT: nur Milieu (Altersgruppe nicht eingegrenzt)\n`

    const prompt = `Du bist POLARIS Micro-Targeting-Spezialist für die CDU Kampagne.

Kandidat: ${kandidat}
Ort: ${ort}
Milieu: ${milieu.label} (${milieu.anteil} der Bevölkerung, Ø ${milieu.alter} Jahre)

Milieu-Profil:
- Kernwerte: ${milieu.werte}
- Kernthemen: ${milieu.kernthemen.join(', ')}
- Trigger-Frames: ${milieu.trigger}
- Ansprache-Stil: ${milieu.ansprache}
- VERMEIDEN: ${milieu.vermeiden}
${segmentBlock}${narrativBlock}${demoBlock}
Kampagnenthema: ${thema.trim() || 'Allgemein – überzeugenden Wahlkampfauftritt'}

Erstelle folgendes — strukturiert mit den genannten Überschriften:

**1. KERNBOTSCHAFT** (1–2 Sätze, max. 35 Wörter, Social-Media-tauglich)

**2. DREI KANAL-VARIANTEN**
- Flyer/Plakat (max. 15 Wörter)
- Facebook/Instagram-Post (2–3 Sätze)
- Haustür-Ansprache (3–4 Sätze, persönlich)

**3. BILD-EMPFEHLUNG** (1 Satz: welche Motive, Farben, Atmosphäre)

**4. KANAL-EMPFEHLUNG** (1 Satz: wo dieses Segment am besten erreichbar ist — konkrete Plattform/Format je nach Alter)

**5. WO FINDE ICH DIESES SEGMENT IN ${ort.toUpperCase()}?**
Nenne 2–4 konkrete Stadtteile/Quartiere/Orte (Wohngebiete, Treffpunkte, Vereine, Cafés, Märkte) — erkläre kurz warum jeweils.

**6. LOKALE THEMEN, DIE DIESES SEGMENT BEWEGEN**
3 konkrete lokale Themen aus ${ort} (Verkehr, Wohnen, Vereine, Schulen, Freizeit, etc.) — keine Abstrakta.

**7. EMPFOHLENE AKTIONSFORM**
1 konkrete Aktionsform (z.B. Haustürwahlkampf in Stadtteil X, Infostand am Markt Y, Nachtaktion an Plakatwand Z, Vereinsabend, Hausbesuche bei Senioren-Treffpunkten, Social-Media-Reels) — mit kurzer Begründung warum genau diese für dieses Segment trifft.

Milieu-Sprache verwenden. Authentisch. Keine leeren Phrasen. Lokal konkret.`

    if (!apiKey) {
      setError('API-Key fehlt (VITE_ANTHROPIC_API_KEY)')
      setGenerating(false)
      return
    }

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: AbortSignal.timeout(35000),
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(`API-Fehler: ${data.error.message || data.error.type}`)
      } else {
        setBotschaft(data.content?.[0]?.text || 'Keine Antwort erhalten.')
      }
    } catch (e) {
      setError(`Verbindungsfehler: ${e.message}`)
    }
    setGenerating(false)
  }

  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Micro-Targeting"
        description="Zielgruppengerechte Ansprache nach Sinus-Milieus — jede Botschaft trifft den richtigen Nerv."
        icon={Crosshair}
        color={COLOR}
      />

      {/* Kandidat / Ort Config */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div>
          <label style={labelStyle}>Kandidat</label>
          <input value={kandidat} onChange={e => setKandidat(e.target.value)} placeholder="z.B. Jürgen Roth" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Ort / Wahlkreis</label>
          <input value={ort} onChange={e => setOrt(e.target.value)} placeholder="z.B. Villingen-Schwenningen" style={inputStyle} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 320px) 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* Milieu List */}
        <div>
          <p style={sectionLabel}>Sinus-Milieu auswählen</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {MILIEUS.map((m) => (
              <motion.button
                key={m.key}
                onClick={() => selectMilieu(m.key)}
                whileHover={{ x: 2 }}
                style={{
                  background: selected === m.key ? `${m.color}18` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selected === m.key ? m.color : 'rgba(255,255,255,0.07)'}`,
                  borderLeft: `3px solid ${m.color}`,
                  borderRadius: 10, padding: '0.6rem 0.875rem', cursor: 'pointer',
                  textAlign: 'left', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: selected === m.key ? 700 : 500, color: selected === m.key ? '#fff' : 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
                    {m.anteil} · Ø {m.alter}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.5rem', fontWeight: 700, color: affinitätColor(m.cduAffinität), background: `${affinitätColor(m.cduAffinität)}15`, border: `1px solid ${affinitätColor(m.cduAffinität)}30`, borderRadius: 5, padding: '0.1rem 0.35rem', whiteSpace: 'nowrap' }}>
                    {m.cduAffinität}
                  </span>
                  <ChevronRight size={12} color={selected === m.key ? m.color : 'rgba(255,255,255,0.25)'} />
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Detail + Generator */}
        <div style={{ minWidth: 0 }}>
          <AnimatePresence mode="wait">
            {!milieu ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ background: '#162230', border: '1px solid rgba(255,166,0,0.1)', borderRadius: 14, padding: '3rem 2rem', textAlign: 'center' }}>
                <Target size={36} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.3, color: COLOR }} />
                <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>Milieu auswählen</p>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.375rem' }}>Klick auf ein Sinus-Milieu für Details &amp; Botschaftsgenerator</p>
              </motion.div>
            ) : (
              <motion.div key={milieu.key} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>

                {/* Narrative für dieses Milieu */}
                {(() => {
                  const matches = themenNarrative.filter(n => n.zielgruppe_milieu === milieu.label && n.status !== 'archiv')
                  if (matches.length === 0) return null
                  return (
                    <div style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.22)', borderRadius: 12, padding: '0.875rem 1rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Bookmark size={11} color="#A855F7" />
                        <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: '#A855F7', textTransform: 'uppercase' }}>{matches.length} Narrativ{matches.length !== 1 ? 'e' : ''} für dieses Milieu</span>
                      </div>
                      {matches.map(n => (
                        <div key={n.id} style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.25rem', lineHeight: 1.5 }}>
                          <strong style={{ color: '#A855F7' }}>{n.titel}</strong> — {n.kernbotschaft}
                        </div>
                      ))}
                    </div>
                  )
                })()}

                {/* Milieu Detail Card */}
                <div style={{ background: '#162230', border: `1px solid ${milieu.color}30`, borderTop: `3px solid ${milieu.color}`, borderRadius: 14, padding: '1.25rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.875rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#fff', marginBottom: '0.2rem' }}>{milieu.label}</h3>
                      <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.55)' }}>{milieu.anteil} der Bevölkerung · Ø {milieu.alter} Jahre</span>
                    </div>
                    <span style={{ fontSize: '0.5625rem', fontWeight: 700, color: affinitätColor(milieu.cduAffinität), background: `${affinitätColor(milieu.cduAffinität)}15`, border: `1px solid ${affinitätColor(milieu.cduAffinität)}30`, borderRadius: 7, padding: '0.2rem 0.5rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      CDU-Affinität: {milieu.cduAffinität}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.55, marginBottom: '1rem' }}>{milieu.beschreibung}</p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                    <div>
                      <p style={sectionLabel}>Kernthemen</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                        {milieu.kernthemen.map(k => (
                          <span key={k} style={{ fontSize: '0.625rem', background: `${milieu.color}15`, color: milieu.color, border: `1px solid ${milieu.color}25`, padding: '0.15rem 0.4rem', borderRadius: 5 }}>{k}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p style={sectionLabel}>Keywords</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                        {milieu.keywords.map(k => (
                          <span key={k} style={{ fontSize: '0.625rem', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.15rem 0.4rem', borderRadius: 5 }}>{k}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p style={sectionLabel}>Ansprache-Stil</p>
                      <p style={sectionText}>{milieu.ansprache}</p>
                    </div>
                    <div>
                      <p style={sectionLabel} style={{ ...sectionLabel, color: '#fca5a5' }}>Vermeiden</p>
                      <p style={{ ...sectionText, color: '#fca5a5' }}>{milieu.vermeiden}</p>
                    </div>
                  </div>
                </div>

                {/* Stadtteil-Demografie-Tabelle (wenn Daten hinterlegt) */}
                {(() => {
                  const stadtteile = kampagneDaten?.demografie?.stadtteile || kampagneDaten?.stadtteile
                  if (!stadtteile) return null
                  const rows = Array.isArray(stadtteile) ? stadtteile.map(s => typeof s === 'string' ? { name: s } : s) : Object.entries(stadtteile).map(([k, v]) => typeof v === 'object' ? { name: k, ...v } : { name: k, info: v })
                  if (rows.length === 0) return null
                  // Spalten dynamisch ermitteln (alles außer "name")
                  const cols = [...new Set(rows.flatMap(r => Object.keys(r).filter(k => k !== 'name')))].slice(0, 5)
                  return (
                    <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.18)', borderTop: '3px solid #52b7c1', borderRadius: 14, padding: '1.25rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <MapPin size={11} color="#52b7c1" />
                        <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: '#52b7c1', textTransform: 'uppercase' }}>Stadtteil-Demografie · {ort}</span>
                      </div>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', fontSize: '0.75rem', color: '#E2E8F0', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(82,183,193,0.2)' }}>
                              <th style={{ textAlign: 'left', padding: '0.35rem 0.5rem', color: '#52b7c1', fontWeight: 700, fontSize: '0.625rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Stadtteil</th>
                              {cols.map(c => <th key={c} style={{ textAlign: 'left', padding: '0.35rem 0.5rem', color: '#52b7c1', fontWeight: 700, fontSize: '0.625rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{c}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.slice(0, 12).map((r, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '0.35rem 0.5rem', fontWeight: 600 }}>{r.name}</td>
                                {cols.map(c => <td key={c} style={{ padding: '0.35rem 0.5rem', color: 'rgba(255,255,255,0.75)' }}>{typeof r[c] === 'object' ? JSON.stringify(r[c]) : (r[c] ?? '—')}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {rows.length > 12 && <p style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>+ {rows.length - 12} weitere Stadtteile (Daten gehen vollständig in die KI-Empfehlung)</p>}
                    </div>
                  )
                })()}

                {/* Botschafts-Generator */}
                <div style={{ background: '#162230', border: `1px solid ${COLOR}20`, borderRadius: 14, padding: '1.25rem' }}>
                  <p style={{ ...sectionLabel, marginBottom: '0.875rem' }}>KI-Botschaftsgenerator</p>

                  {/* Altersgruppe */}
                  <div style={{ marginBottom: '0.875rem' }}>
                    <label style={labelStyle}>Altersgruppe verfeinern <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>(optional)</span></label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.375rem' }}>
                      {ALTERSGRUPPEN.map(a => (
                        <button
                          key={a.key}
                          onClick={() => selectAlter(a.key)}
                          style={{
                            background: selectedAlter === a.key ? `${COLOR}18` : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${selectedAlter === a.key ? COLOR : 'rgba(255,255,255,0.08)'}`,
                            borderRadius: 8, padding: '0.5rem 0.5rem', cursor: 'pointer',
                            fontFamily: 'inherit', textAlign: 'center', transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: selectedAlter === a.key ? COLOR : 'rgba(255,255,255,0.85)' }}>{a.label}</div>
                          <div style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>{a.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Gewichtung */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '0.875rem' }}>
                    <div>
                      <label style={labelStyle}>Gewichtung Milieu ↔ Alter</label>
                      <input
                        type="range" min={0} max={100} value={milieuVsAlter}
                        onChange={e => setMilieuVsAlter(Number(e.target.value))}
                        disabled={!selectedAlter}
                        style={{ width: '100%', accentColor: COLOR, opacity: selectedAlter ? 1 : 0.4 }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.5625rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                        <span>Milieu</span>
                        <span style={{ color: COLOR, fontWeight: 700 }}>{gewichtLabel(milieuVsAlter)}</span>
                        <span>Alter</span>
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Lokal-Bezug</label>
                      <input
                        type="range" min={0} max={100} value={lokalGewicht}
                        onChange={e => setLokalGewicht(Number(e.target.value))}
                        style={{ width: '100%', accentColor: COLOR }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.5625rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                        <span>gering</span>
                        <span style={{ color: COLOR, fontWeight: 700 }}>{lokalLabel(lokalGewicht)}</span>
                        <span>sehr hoch</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '0.875rem' }}>
                    <label style={labelStyle}>Kampagnenthema / Anlass <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>(optional)</span></label>
                    <input
                      value={thema}
                      onChange={e => setThema(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !generating && generateBotschaft()}
                      placeholder="z.B. neue Kita-Plätze, Verkehrswende, Innenstadtbelebung…"
                      style={inputStyle}
                    />
                  </div>

                  <button
                    onClick={generateBotschaft}
                    disabled={generating || !apiKey}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      background: !generating && apiKey ? `${COLOR}18` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${!generating && apiKey ? COLOR : 'rgba(255,255,255,0.12)'}`,
                      borderRadius: 8, padding: '0.575rem 1.125rem',
                      cursor: generating || !apiKey ? 'not-allowed' : 'pointer',
                      color: !generating && apiKey ? COLOR : 'rgba(255,255,255,0.4)',
                      fontSize: '0.8125rem', fontWeight: 700,
                      fontFamily: 'inherit', transition: 'all 0.15s',
                      marginBottom: botschaft || generating || error ? '1rem' : 0,
                    }}
                  >
                    {generating
                      ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><RefreshCw size={13} /></motion.div>
                      : <Zap size={13} />}
                    {generating ? `Generiere für ${milieu.label}…` : `Botschaft für ${milieu.label} generieren`}
                  </button>

                  {/* Spinner / Loading */}
                  {generating && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', background: 'rgba(255,166,0,0.06)', border: '1px solid rgba(255,166,0,0.15)', borderRadius: 10 }}>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
                        <RefreshCw size={14} color={COLOR} />
                      </motion.div>
                      <span style={{ fontSize: '0.8125rem', color: COLOR }}>KI analysiert Milieu und formuliert zielgruppengerechte Botschaft…</span>
                    </motion.div>
                  )}

                  {/* Error */}
                  {error && !generating && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', padding: '0.875rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10 }}>
                      <AlertTriangle size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                      <p style={{ fontSize: '0.8125rem', color: '#fca5a5' }}>{error}</p>
                    </motion.div>
                  )}

                  {/* Result */}
                  {botschaft && !generating && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.625rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CheckCircle size={13} color="#22c55e" />
                          <span style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', color: '#22c55e', textTransform: 'uppercase' }}>
                            Botschaft generiert — {milieu.label}{alter ? ` · ${alter.label}` : ''}
                          </span>
                        </div>
                        <button
                          onClick={sendToSMF}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            background: 'rgba(82,183,193,0.12)',
                            border: '1px solid rgba(82,183,193,0.4)',
                            color: '#52b7c1', fontSize: '0.6875rem', fontWeight: 700,
                            borderRadius: 7, padding: '0.35rem 0.7rem', cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                          title="In Social-Media-Fabrik öffnen"
                        >
                          <Send size={11} />
                          → Social-Media-Fabrik
                        </button>
                      </div>
                      <div style={{ background: 'rgba(255,166,0,0.05)', border: '1px solid rgba(255,166,0,0.15)', borderRadius: 10, padding: '1rem' }}>
                        <p style={{ fontSize: '0.8125rem', color: '#E2E8F0', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{botschaft}</p>
                      </div>
                    </motion.div>
                  )}
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

const sectionLabel = { fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.12em', color: '#ffa600', textTransform: 'uppercase', marginBottom: '0.25rem' }
const sectionText = { fontSize: '0.75rem', color: '#E2E8F0', lineHeight: 1.55, margin: 0 }
const labelStyle = { display: 'block', fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', marginBottom: '0.375rem' }
const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '0.5rem 0.75rem', color: '#fff', fontSize: '0.8125rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
