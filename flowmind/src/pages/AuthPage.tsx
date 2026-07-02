import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { UserPlus, LogIn, X } from 'lucide-react'
import styles from './AuthPage.module.css'
import flowmindImg from '../assets/flowmind.png'

export default function AuthPage({ onClose }: { onClose?: () => void }) {
  const { signup, signin, user } = useAuth()
  const { navigate } = useApp()
  const [isSignUp, setIsSignUp] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string) => { setForm(p => ({ ...p, [k]: v })); setError('') }

  const handleSubmit = async (mode: 'signin' | 'signup') => {
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
    <div className={styles.overlay} onClick={() => onClose && onClose()}>
      <div className={styles.glow} />
      
      <div className={`${styles.card} ${isSignUp ? styles.signUpMode : ''}`} onClick={e => e.stopPropagation()}>
        {onClose && (
          <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', zIndex: 100 }}>
            <X size={20} />
          </button>
        )}

        {/* SIGN IN FORM (LEFT) */}
        <div className={`${styles.formContainer} ${styles.signInContainer}`}>
          <div className={styles.formContent}>
            <div className={styles.title}>Sign In</div>
            
            <div className={styles.form}>
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
                  onKeyDown={e => e.key === 'Enter' && handleSubmit('signin')}
                />
              </div>
              {error && !isSignUp && <div className={styles.error}>{error}</div>}
              <button
                className={`btn-primary ${styles.submit}`}
                onClick={() => handleSubmit('signin')}
                disabled={loading}
              >
                {loading && !isSignUp ? <><span className="spinner" /> Signing in...</> : <><LogIn size={16} /> Sign In</>}
              </button>
            </div>
            
            <div className={styles.mobileToggle}>
              Don't have an account? <button className={styles.toggleLink} onClick={() => { setIsSignUp(true); setError(''); }}>Sign Up</button>
            </div>
          </div>
        </div>

        {/* SIGN UP FORM (RIGHT) */}
        <div className={`${styles.formContainer} ${styles.signUpContainer}`}>
          <div className={styles.formContent}>
            <div className={styles.title}>Sign Up</div>
            
            <div className={styles.form}>
              <div className={styles.field}>
                <label className="label">Your Name</label>
                <input className="input" placeholder="Piyush" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
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
                  onKeyDown={e => e.key === 'Enter' && handleSubmit('signup')}
                />
              </div>
              {error && isSignUp && <div className={styles.error}>{error}</div>}
              <button
                className={`btn-primary ${styles.submit}`}
                onClick={() => handleSubmit('signup')}
                disabled={loading}
              >
                {loading && isSignUp ? <><span className="spinner" /> Creating...</> : <><UserPlus size={16} /> Create Account</>}
              </button>
            </div>

            <div className={styles.mobileToggle}>
              Already have an account? <button className={styles.toggleLink} onClick={() => { setIsSignUp(false); setError(''); }}>Sign In</button>
            </div>
          </div>
        </div>

        {/* SLIDING PANEL */}
        <div className={styles.slidingPanel}>
          <div className={styles.panelContent}>
            <div className={styles.panelTitle} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span>{isSignUp ? 'Create New Account' : 'Welcome Back'}</span>
                {!isSignUp && <span style={{ fontSize: '18px', fontWeight: 'normal', opacity: 0.8 }}>to</span>}
              </div>
              <img src={flowmindImg} alt="FlowMind" className={styles.animatedLogo} style={{ width: 'auto', height: '36px' }} />
            </div>
            <div className={styles.panelSub}>
              {isSignUp
                ? 'Sign up to save your teams and access them from anywhere.'
                : 'Sign in to access your teams and projects.'}
            </div>
            <button
              className={styles.ghostBtn}
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
