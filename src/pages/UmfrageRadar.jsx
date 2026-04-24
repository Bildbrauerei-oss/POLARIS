import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart2, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'

// Aktuelle Umfragedaten (Sonntagsfrage, Stand April 2026)
// Quellen: Forsa, INSA, Infratest dimap
const UMFRAGEN = [
  {
    institut: 'Forsa', datum: '22.04.2026', quelle: 'RTL/ntv',
    werte: { CDU: 30, SPD: 16, Grüne: 11, AfD: 20, FDP: 5, BSW: 4, Sonstige: 14 },
  },
  {
    institut: 'INSA', datum: '18.04.2026', quelle: 'Bild',
    werte: { CDU: 29, SPD: 15, Grüne: 12, AfD: 21, FDP: 5, BSW: 4, Sonstige: 14 },
  },
  {
    institut: 'Infratest dimap', datum: '10.04.2026', quelle: 'ARD',
    werte: { CDU: 31, SPD: 17, Grüne: 10, AfD: 19, FDP: 5, BSW: 5, Sonstige: 13 },
  },
  {
    institut: 'Allensbach', datum: '05.04.2026', quelle: 'FAZ',
    werte: { CDU: 33, SPD: 16, Grüne: 11, AfD: 18, FDP: 6, BSW: 4, Sonstige: 12 },
  },
]

// Historischer Trend CDU (letzte 12 Monate)
const CDU_TREND = [
  { monat: 'Mai 25', wert: 28 }, { monat: 'Jun 25', wert: 29 }, { monat: 'Jul 25', wert: 27 },
  { monat: 'Aug 25', wert: 28 }, { monat: 'Sep 25', wert: 30 }, { monat: 'Okt 25', wert: 31 },
  { monat: 'Nov 25', wert: 32 }, { monat: 'Dez 25', wert: 30 }, { monat: 'Jan 26', wert: 29 },
  { monat: 'Feb 26', wert: 30 }, { monat: 'Mär 26', wert: 31 }, { monat: 'Apr 26', wert: 30 },
]

const PARTEI_COLORS = {
  CDU: '#bf111b', SPD: '#E3000F', Grüne: '#46962B',
  AfD: '#009EE0', FDP: '#FFED00', BSW: '#7B2D8B', Sonstige: '#64748B',
}

function TrendSparkline({ data }) {
  const max = Math.max(...data.map(d => d.wert))
  const min = Math.min(...data.map(d => d.wert)) - 2
  const range = max - min || 1
  const W = 300, H = 60
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - ((d.wert - min) / range) * H
    return `${x},${y}`
  }).join(' ')
  const last = data[data.length - 1].wert
  const prev = data[data.length - 2].wert
  const diff = last - prev
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <svg width={W} height={H} style={{ flexShrink: 0 }}>
        <polyline points={points} fill="none" stroke="#bf111b" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * W
          const y = H - ((d.wert - min) / range) * H
          return <circle key={i} cx={x} cy={y} r={i === data.length - 1 ? 4 : 2} fill={i === data.length - 1 ? '#bf111b' : 'rgba(191,17,27,0.4)'} />
        })}
      </svg>
      <div>
        <div style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: '2.25rem', color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>{last}%</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
          {diff >= 0 ? <TrendingUp size={11} color="#22c55e" /> : <TrendingDown size={11} color="#ff4040" />}
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: diff >= 0 ? '#22c55e' : '#ff4040' }}>{diff >= 0 ? '+' : ''}{diff}% ggü. Vormonat</span>
        </div>
      </div>
    </div>
  )
}

function BalkenDiagramm({ werte }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {Object.entries(werte).sort((a, b) => b[1] - a[1]).map(([partei, wert]) => (
        <div key={partei}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: partei === 'CDU' ? 800 : 600, color: partei === 'CDU' ? '#fff' : 'rgba(255,255,255,0.6)' }}>{partei}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: PARTEI_COLORS[partei] || '#94a3b8' }}>{wert}%</span>
          </div>
          <div style={{ height: partei === 'CDU' ? 10 : 6, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${wert}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              style={{ height: '100%', background: PARTEI_COLORS[partei] || '#94a3b8', borderRadius: 4, opacity: partei === 'CDU' ? 1 : 0.7 }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function UmfrageRadar() {
  const [aktiv, setAktiv] = useState(0)
  const aktuell = UMFRAGEN[aktiv]

  const durchschnitt = Math.round(
    UMFRAGEN.reduce((s, u) => s + u.werte.CDU, 0) / UMFRAGEN.length * 10
  ) / 10

  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Umfrage-Radar"
        description="Aktuelle Sonntagsfragen, CDU-Trend und Wahlprognosen."
        icon={BarChart2}
        color="#52b7c1"
      />

      {/* CDU Trend */}
      <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderTop: '3px solid #bf111b', borderRadius: 16, padding: '1.5rem', marginBottom: '1.25rem' }}>
        <p style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '1.25rem' }}>CDU/CSU · 12-Monats-Trend</p>
        <TrendSparkline data={CDU_TREND} />
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          {CDU_TREND.map((d, i) => (
            <span key={i} style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)', flex: 1, textAlign: 'center', overflow: 'hidden' }}>{d.monat}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.875rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.5625rem', background: 'rgba(191,17,27,0.1)', color: '#bf111b', border: '1px solid rgba(191,17,27,0.2)', padding: '0.2rem 0.5rem', borderRadius: 4, fontWeight: 700 }}>
            Ø {durchschnitt}% (4 Institute)
          </span>
          <span style={{ fontSize: '0.5625rem', background: 'rgba(82,183,193,0.08)', color: '#52b7c1', border: '1px solid rgba(82,183,193,0.2)', padding: '0.2rem 0.5rem', borderRadius: 4, fontWeight: 700 }}>
            Stand: April 2026
          </span>
        </div>
      </div>

      {/* Aktuelle Umfrage */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', marginBottom: '1.25rem' }}>

        {/* Institut-Auswahl */}
        <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Institut</span>
          </div>
          {UMFRAGEN.map((u, i) => (
            <div key={i} onClick={() => setAktiv(i)}
              style={{ padding: '0.75rem 1rem', cursor: 'pointer', background: aktiv === i ? 'rgba(82,183,193,0.08)' : 'transparent', borderLeft: `2px solid ${aktiv === i ? '#52b7c1' : 'transparent'}`, transition: 'all 0.12s' }}
              onMouseEnter={e => { if (aktiv !== i) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={e => { if (aktiv !== i) e.currentTarget.style.background = 'transparent' }}
            >
              <p style={{ fontSize: '0.8125rem', fontWeight: aktiv === i ? 700 : 400, color: aktiv === i ? '#fff' : 'rgba(255,255,255,0.55)' }}>{u.institut}</p>
              <p style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.25)', marginTop: '0.125rem' }}>{u.datum} · {u.quelle}</p>
              <p style={{ fontSize: '0.875rem', fontWeight: 800, color: '#bf111b', marginTop: '0.25rem' }}>CDU: {u.werte.CDU}%</p>
            </div>
          ))}
        </div>

        {/* Balkendiagramm */}
        <div style={{ background: '#162230', border: '1px solid rgba(82,183,193,0.12)', borderRadius: 14, padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <p style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Sonntagsfrage</p>
              <p style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{aktuell.institut} · {aktuell.datum}</p>
              <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)' }}>Quelle: {aktuell.quelle}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: '2.5rem', color: '#bf111b', letterSpacing: '-0.05em', lineHeight: 1 }}>{aktuell.werte.CDU}%</p>
              <p style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.3)' }}>CDU/CSU</p>
            </div>
          </div>
          <BalkenDiagramm werte={aktuell.werte} />
        </div>
      </div>

      {/* Hinweis */}
      <div style={{ background: 'rgba(255,166,0,0.05)', border: '1px solid rgba(255,166,0,0.15)', borderRadius: 10, padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <Minus size={14} color="#ffa600" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
          Die dargestellten Umfragewerte sind Richtwerte (Stand April 2026) und werden manuell aktualisiert. Für Echtzeit-Daten bitte Anbindung an Wahlrecht.de oder Politbarometer konfigurieren.
        </p>
      </div>
    </div>
  )
}
