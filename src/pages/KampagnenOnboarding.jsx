import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Check, ExternalLink, Newspaper, Users, Building2, FileText, Loader } from 'lucide-react'
import { useKampagne } from '../lib/kampagneContext'
import { runOnboarding } from '../lib/onboardingData'

const WAHLTYPES = ['OB-Wahl', 'Bürgermeister-Wahl', 'Landrat-Wahl', 'Landtag', 'Bundestag']
const BUNDESLÄNDER = [
  'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hessen',
  'Mecklenburg-Vorpommern', 'Niedersachsen', 'Nordrhein-Westfalen', 'Rheinland-Pfalz',
  'Saarland', 'Sachsen', 'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen',
]
const PARTEIEN = ['SPD', 'CDU', 'Grüne', 'FDP', 'Die Linke', 'AfD', 'Piraten', 'Freie Wähler', 'Sonstige']

function Step1Grunddaten({ data, onChange, onNext }) {
  const handleChange = (key, value) => onChange({ ...data, [key]: value })
  const isValid = data.kandidat && data.ort && data.bundesland && data.wahltyp && data.wahldatum && data.partei

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#52b7c1', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Kandidat*in</label>
        <input type="text" value={data.kandidat || ''} onChange={e => handleChange('kandidat', e.target.value)} placeholder="Name eingeben" style={{ width: '100%', padding: '0.625rem', fontSize: '0.875rem', border: '1px solid rgba(82,183,193,0.3)', borderRadius: 8, background: 'rgba(82,183,193,0.05)', color: '#fff', fontFamily: 'inherit' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#52b7c1', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Ort</label>
          <input type="text" value={data.ort || ''} onChange={e => handleChange('ort', e.target.value)} placeholder="Stadt/Gemeinde" style={{ width: '100%', padding: '0.625rem', fontSize: '0.875rem', border: '1px solid rgba(82,183,193,0.3)', borderRadius: 8, background: 'rgba(82,183,193,0.05)', color: '#fff', fontFamily: 'inherit' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#52b7c1', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Bundesland</label>
          <select value={data.bundesland || ''} onChange={e => handleChange('bundesland', e.target.value)} style={{ width: '100%', padding: '0.625rem', fontSize: '0.875rem', border: '1px solid rgba(82,183,193,0.3)', borderRadius: 8, background: 'rgba(82,183,193,0.05)', color: '#fff', fontFamily: 'inherit' }}>
            <option value="">Wählen…</option>
            {BUNDESLÄNDER.map(bl => <option key={bl} value={bl}>{bl}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#52b7c1', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Wahltyp</label>
          <select value={data.wahltyp || ''} onChange={e => handleChange('wahltyp', e.target.value)} style={{ width: '100%', padding: '0.625rem', fontSize: '0.875rem', border: '1px solid rgba(82,183,193,0.3)', borderRadius: 8, background: 'rgba(82,183,193,0.05)', color: '#fff', fontFamily: 'inherit' }}>
            <option value="">Wählen…</option>
            {WAHLTYPES.map(wt => <option key={wt} value={wt}>{wt}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#52b7c1', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Wahldatum</label>
          <input type="date" value={data.wahldatum || ''} onChange={e => handleChange('wahldatum', e.target.value)} style={{ width: '100%', padding: '0.625rem', fontSize: '0.875rem', border: '1px solid rgba(82,183,193,0.3)', borderRadius: 8, background: 'rgba(82,183,193,0.05)', color: '#fff', fontFamily: 'inherit' }} />
        </div>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#52b7c1', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Partei</label>
        <select value={data.partei || ''} onChange={e => handleChange('partei', e.target.value)} style={{ width: '100%', padding: '0.625rem', fontSize: '0.875rem', border: '1px solid rgba(82,183,193,0.3)', borderRadius: 8, background: 'rgba(82,183,193,0.05)', color: '#fff', fontFamily: 'inherit' }}>
          <option value="">Wählen…</option>
          {PARTEIEN.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <button onClick={onNext} disabled={!isValid} style={{ marginTop: '1rem', padding: '0.75rem', background: isValid ? '#52b7c1' : 'rgba(82,183,193,0.3)', color: isValid ? '#0a0f1a' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: 8, fontWeight: 700, cursor: isValid ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        Weiter <ChevronRight size={14} />
      </button>
    </div>
  )
}

function Step2Recherche({ kampagne, onDataCollected }) {
  const [progress, setProgress] = useState('feeds')
  const [isRunning, setIsRunning] = useState(true)

  useEffect(() => {
    if (!isRunning) return
    runOnboarding(kampagne, setProgress).then(onDataCollected).catch(e => {
      console.error('Onboarding failed:', e)
      setIsRunning(false)
    })
  }, [isRunning, kampagne, onDataCollected])

  const phases = [
    { key: 'feeds', label: 'Lokale Medien' },
    { key: 'demografie', label: 'Demografie' },
    { key: 'gemeinderat', label: 'Gemeinderat' },
    { key: 'gegenkandidaten', label: 'Gegenkandidaten' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center' }}>
      <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>Wir sammeln Datenquellen für <strong>{kampagne.kandidat}</strong> in <strong>{kampagne.ort}</strong></p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {phases.map((phase, i) => {
          const isActive = progress === phase.key
          const isDone = phases.findIndex(p => p.key === progress) > i
          return (
            <div key={phase.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: isDone ? '#22c55e' : isActive ? 'rgba(82,183,193,0.3)' : 'rgba(255,255,255,0.1)', border: `1px solid ${isDone ? '#22c55e' : isActive ? '#52b7c1' : 'rgba(255,255,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: isActive ? 'spin 0.9s linear infinite' : 'none' }}>
                {isDone ? <Check size={12} color="#0a0f1a" /> : isActive ? <Loader size={12} /> : ''}
              </div>
              <span style={{ flex: 1, textAlign: 'left', fontSize: '0.875rem', color: isActive ? '#52b7c1' : 'rgba(255,255,255,0.6)' }}>{phase.label}</span>
            </div>
          )
        })}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function Step3Ergebnisse({ daten, onNext, onPrev }) {
  const groups = [
    { key: 'feeds', label: 'Lokale Medien', icon: Newspaper, color: '#52b7c1', data: daten?.feeds },
    { key: 'demografie', label: 'Demografie', icon: Users, color: '#A855F7', data: daten?.demografie },
    { key: 'gemeinderat', label: 'Gemeinderat', icon: Building2, color: '#F97316', data: daten?.gemeinderat },
    { key: 'gegenkandidaten', label: 'Gegenkandidaten', icon: FileText, color: '#EC4899', data: daten?.gegenkandidaten },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '500px', overflowY: 'auto' }}>
      {groups.map(group => {
        const Icon = group.icon
        const items = group.key === 'demografie' ? (daten?.demografie?.daten ? [daten.demografie.daten] : []) :
                     group.key === 'gegenkandidaten' ? daten?.gegenkandidaten?.kandidaten || [] :
                     group.data || []
        return (
          <div key={group.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Icon size={13} color={group.color} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: group.color, textTransform: 'uppercase' }}>{group.label}</span>
              <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>{items.length} {items.length === 1 ? 'Eintrag' : 'Einträge'}</span>
            </div>
            {items.length === 0 ? (
              <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>Keine Einträge gefunden</div>
            ) : items.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 6, marginBottom: '0.5rem' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.status === 'green' ? '#22c55e' : item.status === 'yellow' ? '#ffa600' : '#ef4444' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name || item.title || item.kandidat || 'Unbenannt'}</div>
                  {item.ort && <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.45)' }}>{item.ort}</div>}
                </div>
                {(item.rss || item.url) && <a href={item.rss || item.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}><ExternalLink size={10} /></a>}
              </div>
            ))}
          </div>
        )
      })}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
        <button onClick={onPrev} style={{ flex: 1, padding: '0.75rem', background: 'rgba(82,183,193,0.1)', color: '#52b7c1', border: '1px solid rgba(82,183,193,0.3)', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><ChevronLeft size={14} /> Zurück</button>
        <button onClick={onNext} style={{ flex: 1, padding: '0.75rem', background: '#52b7c1', color: '#0a0f1a', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>Weiter <ChevronRight size={14} /></button>
      </div>
    </div>
  )
}

function Step4Gegenkandidaten({ gegenkandidaten, onChange, onPrev, onComplete }) {
  const [kandidaten, setKandidaten] = useState(gegenkandidaten?.kandidaten || [])
  const [newName, setNewName] = useState('')

  const handleAdd = () => {
    if (newName.trim()) {
      setKandidaten([...kandidaten, { name: newName.trim(), partei: '', info: '' }])
      setNewName('')
    }
  }

  const handleRemove = (index) => {
    setKandidaten(kandidaten.filter((_, i) => i !== index))
  }

  const handleComplete = () => {
    onChange({ ...gegenkandidaten, kandidaten })
    onComplete()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Gegenkandidaten können jederzeit bearbeitet oder hinzugefügt werden.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
        {kandidaten.map((k, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(82,183,193,0.2)', borderRadius: 8, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input type="text" value={k.name} onChange={e => { const u = [...kandidaten]; u[i] = { ...u[i], name: e.target.value }; setKandidaten(u) }} placeholder="Name" style={{ padding: '0.5rem', fontSize: '0.875rem', border: '1px solid rgba(82,183,193,0.2)', borderRadius: 6, background: 'rgba(82,183,193,0.05)', color: '#fff', fontFamily: 'inherit' }} />
            <button onClick={() => handleRemove(i)} style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.75rem' }}>Löschen</button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <input type="text" value={newName} onChange={e => setNewName(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAdd()} placeholder="Neuer Gegenkand." style={{ flex: 1, padding: '0.5rem', fontSize: '0.875rem', border: '1px solid rgba(82,183,193,0.3)', borderRadius: 6, background: 'rgba(82,183,193,0.05)', color: '#fff', fontFamily: 'inherit' }} />
        <button onClick={handleAdd} style={{ padding: '0.5rem 1rem', background: 'rgba(82,183,193,0.2)', color: '#52b7c1', border: '1px solid rgba(82,183,193,0.3)', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>+</button>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button onClick={onPrev} style={{ flex: 1, padding: '0.75rem', background: 'rgba(82,183,193,0.1)', color: '#52b7c1', border: '1px solid rgba(82,183,193,0.3)', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><ChevronLeft size={14} /> Zurück</button>
        <button onClick={handleComplete} style={{ flex: 1, padding: '0.75rem', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Kampagne starten</button>
      </div>
    </div>
  )
}

export default function KampagnenOnboarding({ open, onClose }) {
  const { addKampagne, setKampagneDaten } = useKampagne()
  const [step, setStep] = useState(1)
  const [grunddaten, setGrunddaten] = useState({})
  const [daten, setDaten] = useState(null)
  const [gegenkandidaten, setGegenkandidaten] = useState({ status: 'yellow', kandidaten: [] })

  const handleStep1Next = () => {
    if (grunddaten.kandidat && grunddaten.ort && grunddaten.bundesland && grunddaten.wahltyp && grunddaten.wahldatum) {
      setStep(2)
    }
  }

  const handleStep2Done = (discoveredData) => {
    setDaten(discoveredData)
    setGegenkandidaten(discoveredData.gegenkandidaten)
    setStep(3)
  }

  const handleStep4Complete = () => {
    const id = addKampagne(grunddaten)
    setKampagneDaten(id, {
      ...daten,
      gegenkandidaten,
      ts: Date.now(),
    })
    onClose()
    setStep(1)
    setGrunddaten({})
    setDaten(null)
    setGegenkandidaten({ status: 'yellow', kandidaten: [] })
  }

  return (
    <AnimatePresence>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(10,15,26,0.7)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onClose}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, background: '#0f1923', border: '1px solid rgba(82,183,193,0.25)', borderRadius: 16, padding: '2rem', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>{step === 1 ? 'Neue Kampagne' : step === 2 ? 'Datenrecherche' : step === 3 ? 'Gefundene Quellen' : 'Gegenkandidaten'}</h2>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {[1, 2, 3, 4].map(s => (
                  <div key={s} style={{ height: 3, flex: 1, background: s <= step ? '#52b7c1' : 'rgba(82,183,193,0.2)', borderRadius: 2 }} />
                ))}
              </div>
            </div>
            <div style={{ minHeight: '300px' }}>
              {step === 1 && <Step1Grunddaten data={grunddaten} onChange={setGrunddaten} onNext={handleStep1Next} />}
              {step === 2 && <Step2Recherche kampagne={grunddaten} onDataCollected={handleStep2Done} />}
              {step === 3 && <Step3Ergebnisse daten={daten} onNext={() => setStep(4)} onPrev={() => setStep(1)} />}
              {step === 4 && <Step4Gegenkandidaten gegenkandidaten={gegenkandidaten} onChange={setGegenkandidaten} onPrev={() => setStep(3)} onComplete={handleStep4Complete} />}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
