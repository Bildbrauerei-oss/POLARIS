import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState('in')
  const [GlobeComponent, setGlobeComponent] = useState(null)
  const [tick, setTick] = useState(0)
  const globeRef = useRef(null)

  useEffect(() => {
    import('react-globe.gl').then(mod => setGlobeComponent(() => mod.default))

    // Tick for live counter / progress
    const interval = setInterval(() => setTick(t => t + 1), 100)

    // 10s total, then fade out
    const timer = setTimeout(() => {
      setPhase('out')
      setTimeout(() => {
        onDone()
      }, 800)
    }, 10000)

    return () => { clearTimeout(timer); clearInterval(interval) }
  }, [])

  function skip() {
    setPhase('out')
    setTimeout(() => {
      onDone()
    }, 600)
  }

  // Globe data — dense teal dots + gold highlights + red signals
  const dots = Array.from({ length: 1200 }, (_, i) => ({
    lat: (Math.random() - 0.5) * 180,
    lng: (Math.random() - 0.5) * 360,
    size: Math.random() * 0.5 + 0.15,
    color: i % 40 === 0 ? '#ffa600'
         : i % 15 === 0 ? '#ffffff'
         : i % 8  === 0 ? '#a7d5dc'
         : '#52b7c1',
  }))

  // Arcs — random connections across the globe
  const arcs = Array.from({ length: 20 }, () => ({
    startLat: (Math.random() - 0.5) * 140,
    startLng: (Math.random() - 0.5) * 360,
    endLat: (Math.random() - 0.5) * 140,
    endLng: (Math.random() - 0.5) * 360,
    color: Math.random() > 0.7 ? '#ffa600' : '#52b7c1',
  }))

  const progress = Math.min(tick / 100, 1) // 0→1 over 10s

  if (phase === 'done') return null

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'out' ? 0 : 1 }}
          transition={{ duration: phase === 'out' ? 0.8 : 0.6 }}
          onClick={skip}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: '#020810',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', cursor: 'pointer',
          }}
        >
          {/* Deep space background gradient */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 120% 80% at 50% 60%, rgba(82,183,193,0.06) 0%, rgba(45,60,75,0.08) 40%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Star field */}
          <StarField />

          {/* Globe — full background */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {GlobeComponent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 0.85, scale: 1 }}
                transition={{ duration: 2, ease: 'easeOut' }}
              >
                <GlobeComponent
                  ref={globeRef}
                  width={typeof window !== 'undefined' ? Math.max(window.innerWidth, window.innerHeight) * 1.1 : 1200}
                  height={typeof window !== 'undefined' ? Math.max(window.innerWidth, window.innerHeight) * 1.1 : 1200}
                  backgroundColor="rgba(0,0,0,0)"
                  globeImageUrl={null}
                  showGlobe={true}
                  globeMaterial={{ color: '#0a1628', opacity: 0.9, transparent: true }}
                  showAtmosphere={true}
                  atmosphereColor="#52b7c1"
                  atmosphereAltitude={0.18}
                  pointsData={dots}
                  pointLat="lat"
                  pointLng="lng"
                  pointAltitude={0.01}
                  pointRadius="size"
                  pointColor="color"
                  arcsData={arcs}
                  arcStartLat="startLat"
                  arcStartLng="startLng"
                  arcEndLat="endLat"
                  arcEndLng="endLng"
                  arcColor="color"
                  arcAltitude={0.3}
                  arcStroke={0.4}
                  arcDashLength={0.4}
                  arcDashGap={0.6}
                  arcDashAnimateTime={3000}
                  autoRotate={true}
                  autoRotateSpeed={0.6}
                  rendererConfig={{ antialias: true, alpha: true }}
                />
              </motion.div>
            ) : (
              <FallbackGlobe />
            )}
          </div>

          {/* Radial overlay — darkens edges, keeps center readable */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 50% 50% at 50% 50%, transparent 20%, rgba(2,8,16,0.7) 70%, rgba(2,8,16,0.95) 100%)',
            pointerEvents: 'none',
          }} />

          {/* Center content */}
          <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>

            {/* Top label */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <p style={{
                fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.45em',
                color: '#52b7c1', textTransform: 'uppercase', marginBottom: '1.5rem',
                textShadow: '0 0 20px rgba(82,183,193,0.8)',
              }}>
                Bildbrauerei · Politik Intelligence
              </p>
            </motion.div>

            {/* POLARIS — the hero */}
            <motion.h1
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 900,
                fontSize: 'clamp(5rem, 15vw, 11rem)',
                color: '#ffffff',
                letterSpacing: '-0.05em',
                lineHeight: 0.9,
                textShadow: '0 0 80px rgba(82,183,193,0.4), 0 0 160px rgba(82,183,193,0.15)',
                userSelect: 'none',
              }}
            >
              POLARIS
            </motion.h1>

            {/* Divider line with glow */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              style={{
                width: 120, height: 2,
                background: 'linear-gradient(90deg, transparent, #ffa600, #52b7c1, transparent)',
                margin: '1.5rem auto',
                boxShadow: '0 0 16px rgba(255,166,0,0.5)',
              }}
            />

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6, duration: 1 }}
              style={{
                fontFamily: '"IBM Plex Serif", Georgia, serif',
                fontStyle: 'italic',
                fontSize: 'clamp(1rem, 2.5vw, 1.375rem)',
                color: 'rgba(255,255,255,0.55)',
                letterSpacing: '0.02em',
                textShadow: '0 0 30px rgba(82,183,193,0.3)',
              }}
            >
              Das politische Gehirn Deutschlands.
            </motion.p>

            {/* Live data counter effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5, duration: 0.6 }}
              style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}
            >
              {[
                { label: 'Quellen', value: Math.floor(progress * 34) },
                { label: 'Artikel', value: Math.floor(progress * 1284) },
                { label: 'Signale', value: Math.floor(progress * 47) },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{
                    fontFamily: 'Inter, sans-serif', fontWeight: 900,
                    fontSize: '1.75rem', color: '#52b7c1',
                    letterSpacing: '-0.04em', lineHeight: 1,
                    textShadow: '0 0 20px rgba(82,183,193,0.6)',
                  }}>
                    {value}
                  </div>
                  <div style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginTop: 4 }}>
                    {label}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3 }}
              style={{ marginTop: '2.5rem' }}
            >
              <div style={{ width: 200, height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 auto', borderRadius: 1, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress * 100}%` }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, #52b7c1, #ffa600)', borderRadius: 1, boxShadow: '0 0 8px rgba(255,166,0,0.6)' }}
                />
              </div>
              <p style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.15)', marginTop: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                Initialisierung läuft · Klicken zum Überspringen
              </p>
            </motion.div>
          </div>

          {/* Scan line effect */}
          <motion.div
            animate={{ y: ['-100vh', '100vh'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear', delay: 2 }}
            style={{
              position: 'absolute', left: 0, right: 0, height: 2,
              background: 'linear-gradient(90deg, transparent, rgba(82,183,193,0.15), rgba(82,183,193,0.4), rgba(82,183,193,0.15), transparent)',
              pointerEvents: 'none', zIndex: 5,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// CSS star field
function StarField() {
  const stars = Array.from({ length: 120 }, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 1.5 + 0.3,
    delay: Math.random() * 4,
    duration: Math.random() * 3 + 2,
  }))
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {stars.map((s, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.1, 0.8, 0.1] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            left: `${s.x}%`, top: `${s.y}%`,
            width: s.size, height: s.size,
            borderRadius: '50%',
            background: '#ffffff',
          }}
        />
      ))}
    </div>
  )
}

// Fallback if globe fails to load
function FallbackGlobe() {
  return (
    <div style={{ position: 'relative', width: 700, height: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {[700, 500, 350, 200].map((size, i) => (
        <motion.div
          key={size}
          animate={{ rotate: i % 2 === 0 ? 360 : -360, opacity: [0.03, 0.08, 0.03] }}
          transition={{ duration: 20 + i * 8, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            width: size, height: size,
            border: `1px solid rgba(82,183,193,${0.15 - i * 0.03})`,
            borderRadius: '50%',
          }}
        />
      ))}
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.06, 0.12, 0.06] }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{ width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(82,183,193,0.12) 0%, transparent 70%)' }}
      />
    </div>
  )
}
