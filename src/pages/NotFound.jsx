import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard } from 'lucide-react'

export default function NotFound() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center' }}
      >
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '7rem', color: 'rgba(82,183,193,0.08)', letterSpacing: '-0.05em', lineHeight: 1 }}>404</p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: '#fff', marginTop: '-1rem', marginBottom: '0.5rem' }}>Seite nicht gefunden</p>
        <p style={{ fontFamily: '"IBM Plex Serif", Georgia, serif', fontSize: '0.9375rem', color: 'rgba(255,255,255,0.4)', marginBottom: '2rem', fontStyle: 'italic' }}>
          Diese URL existiert in POLARIS nicht.
        </p>
        <NavLink to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.75rem 1.5rem',
          background: 'linear-gradient(135deg, #52b7c1, #2d9aa5)',
          borderRadius: 10, color: '#fff', fontSize: '0.875rem', fontWeight: 700,
          boxShadow: '0 4px 20px rgba(82,183,193,0.3)',
        }}>
          <LayoutDashboard size={15} /> Zum Command Center
        </NavLink>
      </motion.div>
    </div>
  )
}
