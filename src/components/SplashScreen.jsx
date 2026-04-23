import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'

export default function SplashScreen({ onDone }) {
  const [tick, setTick] = useState(0)
  const [dismissing, setDismissing] = useState(false)
  const doneRef = useRef(false)

  function dismiss() {
    if (doneRef.current) return
    doneRef.current = true
    setDismissing(true)
    setTimeout(onDone, 400)
  }

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 100)
    const timer = setTimeout(dismiss, 8000)
    return () => { clearTimeout(timer); clearInterval(interval) }
  }, [])

  const progress = Math.min(tick / 80, 1)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: dismissing ? 0 : 1 }}
      transition={{ duration: dismissing ? 0.4 : 0.6 }}
      onClick={dismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#020810',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', cursor: 'pointer',
      }}
    >
      {/* Deep space background */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 120% 80% at 50% 60%, rgba(82,183,193,0.08) 0%, rgba(45,60,75,0.08) 40%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Star field */}
      <StarField />

      {/* CSS Globe - rotating rings */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ position: 'relative', width: 700, height: 700 }}>
          {[700, 560, 420, 300, 180].map((size, i) => (
            <motion.div key={size}
              animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
              transition={{ duration: 30 + i * 6, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                top: '50%', left: '50%',
                width: size, height: size,
                marginLeft: -size / 2, marginTop: -size / 2,
                border: `1px solid rgba(82,183,193,${0.25 - i * 0.04})`,
                borderRadius: '50%',
                boxShadow: i === 0 ? '0 0 80px rgba(82,183,193,0.15) inset' : 'none',
              }} />
          ))}
          {/* Orbital dots */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * Math.PI * 2
            const r = 260
            return (
              <motion.div key={`dot-${i}`}
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute', top: '50%', left: '50%',
                  width: 0, height: 0,
                  transformOrigin: '0 0',
                }}>
                <div style={{
                  position: 'absolute',
                  left: Math.cos(angle) * r - 2,
                  top: Math.sin(angle) * r - 2,
                  width: 4, height: 4,
                  borderRadius: '50%',
                  background: i % 4 === 0 ? '#ffa600' : '#52b7c1',
                  boxShadow: `0 0 12px ${i % 4 === 0 ? '#ffa600' : '#52b7c1'}`,
                }} />
              </motion.div>
            )
          })}
          {/* Center glow */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 180, height: 180, marginLeft: -90, marginTop: -90,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(82,183,193,0.25) 0%, transparent 70%)',
          }} />
        </div>
      </div>

      {/* Edge darkening */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 50%, transparent 30%, rgba(2,8,16,0.6) 80%, rgba(2,8,16,0.9) 100%)', pointerEvents: 'none' }} />

      {/* Center content */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
        <motion.p initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }}
          style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.45em', color: '#52b7c1', textTransform: 'uppercase', marginBottom: '1.5rem', textShadow: '0 0 20px rgba(82,183,193,0.8)' }}>
          Bildbrauerei · Politik Intelligence
        </motion.p>

        <motion.h1 initial={{ opacity: 0, scale: 0.85, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.2, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 'clamp(5rem, 15vw, 11rem)', color: '#ffffff', letterSpacing: '-0.05em', lineHeight: 0.9, textShadow: '0 0 80px rgba(82,183,193,0.4), 0 0 160px rgba(82,183,193,0.15)', userSelect: 'none' }}>
          POLARIS
        </motion.h1>

        <motion.div initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ delay: 0.8, duration: 0.8 }}
          style={{ width: 120, height: 2, background: 'linear-gradient(90deg, transparent, #ffa600, #52b7c1, transparent)', margin: '1.5rem auto', boxShadow: '0 0 16px rgba(255,166,0,0.5)' }} />

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 1 }}
          style={{ fontFamily: '"IBM Plex Serif", Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(1rem, 2.5vw, 1.375rem)', color: 'rgba(255,255,255,0.55)', textShadow: '0 0 30px rgba(82,183,193,0.3)' }}>
          Das politische Gehirn Deutschlands.
        </motion.p>

        {/* Live counters */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8, duration: 0.6 }}
          style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
          {[
            { label: 'Quellen', value: Math.floor(progress * 34) },
            { label: 'Artikel', value: Math.floor(progress * 1284) },
            { label: 'Signale', value: Math.floor(progress * 47) },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '1.75rem', color: '#52b7c1', letterSpacing: '-0.04em', lineHeight: 1, textShadow: '0 0 20px rgba(82,183,193,0.6)' }}>{value}</div>
              <div style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </motion.div>

        {/* Progress bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }} style={{ marginTop: '2.5rem' }}>
          <div style={{ width: 200, height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 auto', borderRadius: 1, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress * 100}%`, background: 'linear-gradient(90deg, #52b7c1, #ffa600)', borderRadius: 1, boxShadow: '0 0 8px rgba(255,166,0,0.6)', transition: 'width 0.1s linear' }} />
          </div>
          <p style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.15)', marginTop: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Initialisierung läuft · Klicken zum Überspringen
          </p>
        </motion.div>
      </div>

      {/* Scan line */}
      <motion.div animate={{ y: ['-100vh', '100vh'] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear', delay: 1.5 }}
        style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(82,183,193,0.15), rgba(82,183,193,0.4), rgba(82,183,193,0.15), transparent)', pointerEvents: 'none', zIndex: 5 }} />
    </motion.div>
  )
}

function StarField() {
  const stars = Array.from({ length: 150 }, () => ({
    x: Math.random() * 100, y: Math.random() * 100,
    size: Math.random() * 1.5 + 0.3,
    delay: Math.random() * 4, duration: Math.random() * 3 + 2,
  }))
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {stars.map((s, i) => (
        <motion.div key={i} animate={{ opacity: [0.1, 0.8, 0.1] }} transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, borderRadius: '50%', background: '#ffffff' }} />
      ))}
    </div>
  )
}
