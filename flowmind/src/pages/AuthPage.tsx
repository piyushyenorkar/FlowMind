import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { UserPlus, LogIn, X } from 'lucide-react'
import styles from './AuthPage.module.css'
import flowmindImg from '../assets/flowmind.png'

export default function AuthPage({ onClose }: { onClose?: () => void }) {
  const { signup, signin, signout, user } = useAuth()
  const { navigate } = useApp()
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError('') }

  const handleSubmit = async () => {
    if (mode === 'signup') {
      if (!form.name.trim() || !form.email.trim() || !form.password) {
        setError('Please fill in all fields.')
        return
      }
      if (form.password.length < 4) {
        setError('Password must be at least 4 characters.')
        return
      }
      setLoading(true)
      const result = await signup(form.name, form.email, form.password)
      setLoading(false)
      if (result.error) { setError(result.error) }
      // On success, component re-renders showing welcome screen
    } else {
      if (!form.email.trim() || !form.password) {
        setError('Please fill in all fields.')
        return
      }
      setLoading(true)
      const result = await signin(form.email, form.password)
      setLoading(false)
      if (result.error) { setError(result.error) }
    }
  }

  // ── Signed in: redirect to dashboard ─────────────────────────────────────
  useEffect(() => {
    if (user) {
      navigate('user-dashboard')
    }
  }, [user, navigate])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (user) return null

  // ── Not signed in: Sign in / Sign up form ─────────────────────────────
  return (
    <div 
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={() => onClose && onClose()}
    >
      <div className={styles.card} onClick={e => e.stopPropagation()}>
        {onClose && (
          <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        )}
        <div className={styles.logo}>
          <img src={flowmindImg} alt="FlowMind" style={{ width: '130px', height: '36px', borderRadius: '6px' }} />
          <span className={styles.logoMark}>FM</span>
        </div>

        <div className={styles.title}>{mode === 'signup' ? 'Create Account' : 'Welcome Back'}</div>
        <div className={styles.sub}>
          {mode === 'signup'
            ? 'Sign up to save your teams and access them from anywhere.'
            : 'Sign in to access your teams and projects.'
          }
        </div>

        <div className={styles.form}>
          {mode === 'signup' && (
            <div className={styles.field}>
              <label className="label">Your Name</label>
              <input className="input" placeholder="Piyush" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
          )}

          <div className={styles.field}>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="piyush@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>

          <div className={styles.field}>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            className={`btn-primary ${styles.submit}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <><span className="spinner" /> {mode === 'signup' ? 'Creating...' : 'Signing in...'}</>
              : mode === 'signup' ? <><UserPlus size={16} /> Create Account</> : <><LogIn size={16} /> Sign In</>
            }
          </button>
        </div>

        <div className={styles.toggle}>
          {mode === 'signup' ? (
            <>Already have an account? <button className={styles.toggleLink} onClick={() => { setMode('signin'); setError('') }}>Sign In</button></>
          ) : (
            <>Don't have an account? <button className={styles.toggleLink} onClick={() => { setMode('signup'); setError('') }}>Sign Up</button></>
          )}
        </div>
      </div>
    </div>
  )
}
