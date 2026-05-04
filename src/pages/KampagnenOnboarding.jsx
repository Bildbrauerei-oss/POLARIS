// Mini-Onboarding für neue Kampagnen.
// Nur Pflichtfelder (Kandidat, Ort, Bundesland, Wahltyp, Datum, Partei).
// Alle weiteren Daten (Gegenkandidaten, Medien, Themen, Strategie etc.) werden
// nachträglich in /profil eingepflegt.
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Sparkles, X } from 'lucide-react'
import { useKampagne } from '../lib/kampagneContext'

const WAHLTYPES = ['OB-Wahl', 'Bürgermeister-Wahl', 'Landrat-Wahl', 'Landtagswahl', 'Bundestagswahl', 'Kommunalwahl', 'Sonstige']
const BUNDESLÄNDER = [
  'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hessen',
  'Mecklenburg-Vorpommern', 'Niedersachsen', 'Nordrhein-Westfalen', 'Rheinland-Pfalz',
  'Saarland', 'Sachsen', 'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen',
]
const PARTEIEN = ['CDU', 'CSU', 'SPD', 'Grüne', 'FDP', 'Die Linke', 'AfD', 'Freie Wähler', 'parteilos', 'Sonstige']

const inputStyle = {
  width: '100%', padding: '0.625rem', fontSize: '0.875rem',
  border: '1px solid rgba(82,183,193,0.3)', borderRadius: 8,
  background: 'rgba(82,183,193,0.05)', color: '#fff', fontFamily: 'inherit', outline: 'none',
}
const labelStyle = {
  display: 'block', fontSize: '0.6875rem', fontWeight: 700,
  letterSpacing: '0.1em', color: '#52b7c1', textTransform: 'uppercase', marginBottom: '0.5rem',
}

export default function KampagnenOnboarding({ open, onClose }) {
  const { addKampagne } = useKampagne()
  const navigate = useNavigate()
  const [data, setData] = useState({})

  const isValid = data.kandidat && data.ort && data.bundesland && data.wahltyp && data.wahldatum && data.partei

  function set(key, val) { setData(d => ({ ...d, [key]: val })) }

  function anlegen() {
    if (!isValid) return
    addKampagne(data)
    setData({})
    onClose()
    // direkt ins Profil, damit man weitere Felder befüllen kann
    setTimeout(() => navigate('/profil'), 100)
  }

  return (
    <AnimatePresence>
      {open && (
        <div onClick={onClose} style={{
          position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(10,15,26,0.7)',
          backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <motion.div onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              width: '100%', maxWidth: 540, background: '#0f1923',
              border: '1px solid rgba(82,183,193,0.25)', borderRadius: 16, padding: '2rem',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)', position: 'relative',
            }}>
            <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', padding: 4 }}>
              <X size={16} />
            </button>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Sparkles size={16} color="#52b7c1" />
                <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Neue Kampagne</h2>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                Nur das Nötigste. Alle weiteren Daten — Kandidat-Bio, Gegenkandidaten, Medien, Themen, Strategie —
                pflegst du jederzeit unter <strong style={{ color: '#52b7c1' }}>Kampagnen-Profil</strong> ein.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Kandidat*in</label>
                <input type="text" value={data.kandidat || ''} onChange={e => set('kandidat', e.target.value)} placeholder="Name eingeben" style={inputStyle} autoFocus />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Ort</label>
                  <input type="text" value={data.ort || ''} onChange={e => set('ort', e.target.value)} placeholder="Stadt / Gemeinde" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Bundesland</label>
                  <select value={data.bundesland || ''} onChange={e => set('bundesland', e.target.value)} style={inputStyle}>
                    <option value="">Wählen…</option>
                    {BUNDESLÄNDER.map(bl => <option key={bl} value={bl}>{bl}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Wahltyp</label>
                  <select value={data.wahltyp || ''} onChange={e => set('wahltyp', e.target.value)} style={inputStyle}>
                    <option value="">Wählen…</option>
                    {WAHLTYPES.map(wt => <option key={wt} value={wt}>{wt}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Wahldatum</label>
                  <input type="date" value={data.wahldatum || ''} onChange={e => set('wahldatum', e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Partei</label>
                <select value={data.partei || ''} onChange={e => set('partei', e.target.value)} style={inputStyle}>
                  <option value="">Wählen…</option>
                  {PARTEIEN.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <button onClick={anlegen} disabled={!isValid} style={{
                marginTop: '0.5rem', padding: '0.75rem 1rem',
                background: isValid ? '#52b7c1' : 'rgba(82,183,193,0.3)',
                color: isValid ? '#0a0f1a' : 'rgba(255,255,255,0.3)',
                border: 'none', borderRadius: 10, fontWeight: 800, fontSize: '0.875rem',
                cursor: isValid ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}>
                Kampagne anlegen <ChevronRight size={14} />
              </button>
              <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: '0.25rem' }}>
                Nach dem Anlegen wirst du direkt zum Profil weitergeleitet.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
