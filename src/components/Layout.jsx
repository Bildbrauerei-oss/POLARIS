import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Topbar from './Topbar'
import MorningBriefingModal from './MorningBriefingModal'

export default function Layout({ onLogout }) {
  const { pathname } = useLocation()
  const [showBriefing, setShowBriefing] = useState(false)

  // Show briefing once per day
  useEffect(() => {
    const today = new Date().toDateString()
    const last = localStorage.getItem('polaris_briefing_date')
    if (last !== today) {
      const timer = setTimeout(() => setShowBriefing(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
      <Topbar onLogout={onLogout} />

      {showBriefing && (
        <MorningBriefingModal onClose={() => {
          setShowBriefing(false)
          localStorage.setItem('polaris_briefing_date', new Date().toDateString())
        }} />
      )}

      <main style={{ paddingTop: 56, minHeight: '100vh' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ padding: 'clamp(1rem, 3vw, 2rem) clamp(1rem, 3vw, 2.5rem)', maxWidth: '100%', width: '100%' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
