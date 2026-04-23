import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Dynamically import react-globe.gl to avoid SSR issues
let Globe = null

export default function SplashScreen({ onDone }) {
  const [globeLoaded, setGlobeLoaded] = useState(false)
  const [GlobeComponent, setGlobeComponent] = useState(null)
  const [phase, setPhase] = useState('in') // 'in' | 'out'
  const globeRef = useRef(null)

  // Skip splash if already shown this session
  useEffect(() => {
    const shown = sessionStorage.getItem('polaris_splash_shown')
    if (shown) { onDone(); return }

    // Load Globe dynamically
    import('react-globe.gl').then(mod => {
      setGlobeComponent(() => mod.default)
      setGlobeLoaded(true)
    }).catch(() => {
      // If globe fails, just show text splash
      setGlobeLoaded(true)
    })

    // Auto-proceed after 3s
    const timer = setTimeout(() => {
      setPhase('out')
      setTimeout(() => {
        sessionStorage.setItem('polaris_splash_shown', '1')
        onDone()
      }, 600)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  function handleSkip() {
    setPhase('out')
    setTimeout(() => {
      sessionStorage.setItem('polaris_splash_shown', '1')
      onDone()
    }, 400)
  }

  // Generate random dots for globe
  const globeData = Array.from({ length: 600 }, () => ({
    lat: (Math.random() - 0.5) * 180,
    lng: (Math.random() - 0.5) * 360,
    size: Math.random() * 0.4 + 0.15,
    color: Math.random() > 0.85 ? '#ffa600' : Math.random() > 0.6 ? '#a7d5dc' : '#52b7c1',
  }))

  return (
    <AnimatePresence>
      {phase === 'in' && (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: '#0a0f1a',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}
          onClick={handleSkip}
        >
          {/* Globe */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.7 }}>
            {GlobeComponent && (
              <GlobeComponent
                ref={globeRef}
                width={700}
                height={700}
                backgroundColor="rgba(0,0,0,0)"
                globeImageUrl={null}
                showGlobe={false}
                showAtmosphere={false}
                pointsData={globeData}
                pointLat="lat"
                pointLng="lng"
                pointAltitude={0.01}
                pointRadius="size"
                pointColor="color"
                rendererConfig={{ antialias: true, alpha: true }}
                animateIn={false}
              />
            )}
            {!GlobeComponent && (
              // Fallback: CSS globe rings
              <div style={{ position: 'relative', width: 400, height: 400 }}>
                {[1, 0.75, 0.5, 0.25].map((scale, i) => (
                  <div key={i} style={{
                    position: 'absolute', inset: 0,
                    border: '1px solid rgba(82,183,193,0.15)',
                    borderRadius: '50%',
                    transform: `scale(${scale})`,
                    margin: 'auto',
                  }} />
                ))}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'radial-gradient(circle, rgba(82,183,193,0.08) 0%, transparent 70%)',
                  borderRadius: '50%',
                }} />
              </div>
            )}
          </div>

          {/* Radial glow */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(82,183,193,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Content */}
          <div style={{ position: 'relative', textAlign: 'center', zIndex: 10 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <p style={{
                fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.3em',
                color: '#52b7c1', textTransform: 'uppercase', marginBottom: '1.25rem',
              }}>
                Bildbrauerei · Politik
              </p>
              <h1 style={{
                fontSize: '5rem', fontWeight: 900, color: '#ffffff',
                letterSpacing: '-0.04em', lineHeight: 1,
                fontFamily: 'Inter, sans-serif',
              }}>
                POLARIS
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              style={{
                fontFamily: '"IBM Plex Serif", Georgia, serif',
                fontWeight: 400, fontStyle: 'italic',
                fontSize: '1.125rem', color: 'rgba(255,255,255,0.55)',
                marginTop: '0.875rem',
              }}
            >
              Das politische Gehirn Deutschlands.
            </motion.p>

            {/* Loading bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              style={{ marginTop: '3rem' }}
            >
              <div style={{ width: 120, height: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 1, margin: '0 auto', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 1.4, duration: 1.4, ease: 'easeInOut' }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, #52b7c1, #ffa600)', borderRadius: 1 }}
                />
              </div>
              <p style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.2)', marginTop: '0.75rem', letterSpacing: '0.15em' }}>
                Klicken zum Überspringen
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
