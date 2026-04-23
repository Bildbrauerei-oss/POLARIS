import { useState } from 'react'
import { motion } from 'framer-motion'

const MASTER_PASSWORD = 'Polaris2025'

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    // Tiny delay for UX
    await new Promise(r => setTimeout(r, 400))
    if (password === MASTER_PASSWORD) {
      sessionStorage.setItem('polaris_auth', '1')
      onLogin()
    } else {
      setError(true)
      setPassword('')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#0a0f1a',
      backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(82,183,193,0.12) 0%, transparent 60%)',
      padding: '1.5rem',
    }}>
      {/* Background decoration */}
      <div style={{ position: 'fixed', top: '10%', right: '10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(82,183,193,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '10%', left: '10%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(191,17,27,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 400 }}
      >
        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: 52, height: 52, background: '#52b7c1', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 8px 24px rgba(82,183,193,0.3)' }}>
            <svg width="22" height="22" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="2.5" fill="white"/>
              <path d="M7 1L7 4M7 10L7 13M1 7L4 7M10 7L13 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M2.93 2.93L4.93 4.93M9.07 9.07L11.07 11.07M11.07 2.93L9.07 4.93M4.93 9.07L2.93 11.07" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
            </svg>
          </div>
          <p style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.3em', color: '#52b7c1', textTransform: 'uppercase', marginBottom: '0.625rem' }}>
            Bildbrauerei · Politik
          </p>
          <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '3.5rem', color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>
            POLARIS
          </h1>
          <div style={{ width: 48, height: 2, background: 'linear-gradient(90deg, #bf111b, #52b7c1)', margin: '1rem auto' }} />
          <p style={{ fontFamily: '"IBM Plex Serif", Georgia, serif', fontSize: '0.9375rem', color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>
            Das politische Gehirn Deutschlands.
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#1e2d3a',
          border: '1px solid rgba(82,183,193,0.2)',
          borderRadius: 20, padding: '2rem',
          boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
        }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                Zugangspasswort
              </label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(false) }}
                required
                autoFocus
                placeholder="••••••••••"
                style={{
                  width: '100%', padding: '0.875rem 1rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${error ? 'rgba(191,17,27,0.6)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 10, color: '#fff', fontSize: '1rem',
                  outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s',
                  letterSpacing: '0.1em',
                }}
                onFocus={e => e.target.style.borderColor = error ? 'rgba(191,17,27,0.8)' : 'rgba(82,183,193,0.5)'}
                onBlur={e => e.target.style.borderColor = error ? 'rgba(191,17,27,0.6)' : 'rgba(255,255,255,0.1)'}
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '0.75rem 1rem', borderRadius: 8,
                  background: 'rgba(191,17,27,0.08)',
                  border: '1px solid rgba(191,17,27,0.25)',
                  fontSize: '0.8125rem', color: '#ff9999',
                }}
              >
                Falsches Passwort. Bitte erneut versuchen.
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ translateY: -1 }}
              whileTap={{ scale: 0.99 }}
              style={{
                padding: '0.9375rem',
                background: loading ? 'rgba(82,183,193,0.4)' : 'linear-gradient(135deg, #52b7c1, #2d9aa5)',
                color: '#fff', fontWeight: 800, fontSize: '0.875rem',
                letterSpacing: '0.08em', border: 'none', cursor: loading ? 'wait' : 'pointer',
                textTransform: 'uppercase', borderRadius: 10,
                boxShadow: loading ? 'none' : '0 4px 20px rgba(82,183,193,0.3)',
                transition: 'background 0.15s, box-shadow 0.15s',
              }}
            >
              {loading ? 'Wird geprüft…' : 'Einloggen →'}
            </motion.button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.625rem', color: 'rgba(255,255,255,0.15)', marginTop: '1.5rem', letterSpacing: '0.1em' }}>
          POLARIS · Nur für autorisierte Nutzer · Bildbrauerei Heidelberg
        </p>
      </motion.div>
    </div>
  )
}
