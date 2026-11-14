import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { UserPlus, LogIn, X } from 'lucide-react'
import styles from './AuthPage.module.css'
import flowmindImg from '../assets/flowmind.png'

export default function AuthPage({ onClose }: { onClose?: () => void }) {
  const { signup, signin, signInWithGoogle, user } = useAuth()
  const { navigate } = useApp()
  const [isSignUp, setIsSignUp] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string) => { setForm(p => ({ ...p, [k]: v })); setError('') }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)
    const result = await signInWithGoogle()
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

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

              <div className={styles.divider}>
                <span>or</span>
              </div>

              <button
                type="button"
                className={styles.googleBtn}
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className={styles.googleIcon} viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Continue with Google
              </button>

              <div className={styles.legalNote}>
                By signing in, you agree to our{' '}
                <button type="button" className={styles.legalLink} onClick={() => { onClose && onClose(); navigate('terms'); }}>Terms</button>
                {' & '}
                <button type="button" className={styles.legalLink} onClick={() => { onClose && onClose(); navigate('privacy'); }}>Privacy Policy</button>
              </div>
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

              <div className={styles.divider}>
                <span>or</span>
              </div>

              <button
                type="button"
                className={styles.googleBtn}
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className={styles.googleIcon} viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Continue with Google
              </button>

              <div className={styles.legalNote}>
                By signing in, you agree to our{' '}
                <button type="button" className={styles.legalLink} onClick={() => { onClose && onClose(); navigate('terms'); }}>Terms</button>
                {' & '}
                <button type="button" className={styles.legalLink} onClick={() => { onClose && onClose(); navigate('privacy'); }}>Privacy Policy</button>
              </div>
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
