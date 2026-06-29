import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { User, LogOut, Crown, Search, Brain, AlertTriangle, MessageCircle } from 'lucide-react'
import TeamSwitcher from '../components/TeamSwitcher'
import styles from './Landing.module.css'

export default function Landing() {
  const { navigate, reset } = useApp()
  const { user, isAuthenticated, signout } = useAuth()
  const [hovered, setHovered] = useState(null)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.grid} />
      <div className={styles.glow1} />
      <div className={styles.glow2} />

      <nav className={styles.nav}>
        <div className={styles.logo} onClick={() => isAuthenticated && setShowSwitcher(true)} style={isAuthenticated ? { cursor: 'pointer' } : {}}>

          <span className={styles.logoText}>FlowMind</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className={styles.navTag}>AI Group Project Manager</span>
          {isAuthenticated ? (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button className="btn-ghost" onClick={() => setShowMenu(!showMenu)} style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} /> {user.name}
              </button>
              {showMenu && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '6px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '6px', minWidth: '160px', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                  <button
                    onClick={() => { signout(); reset(); setShowMenu(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 14px', background: 'none', border: 'none', color: 'var(--red)', fontSize: '13px', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,80,80,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <LogOut size={14} /> Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="btn-primary" onClick={() => navigate('auth')} style={{ padding: '7px 16px', fontSize: '13px' }}>
              Sign In
            </button>
          )}
        </div>
      </nav>

      <main className={styles.hero}>
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          Powered by Hindsight Memory
        </div>

        <h1 className={styles.headline}>
          The PM that<br />
          <span className={styles.accent}>never forgets.</span>
        </h1>

        <p className={styles.sub}>
          FlowMind builds a living memory of your team — every task, every decision, every pattern — and uses it to predict problems before they happen.
        </p>

        <div className={styles.actions}>
          <button
            className={`${styles.actionCard} ${hovered === 'leader' ? styles.activeCard : ''}`}
            onMouseEnter={() => setHovered('leader')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => {
              if (!isAuthenticated) { navigate('auth'); return }
              navigate('user-dashboard')
            }}
          >
            <div className={styles.actionIcon}><Crown size={24} /></div>
            <div className={styles.actionContent}>
              <div className={styles.actionTitle}>Create a Team</div>
              <div className={styles.actionDesc}>I'm the project leader</div>
            </div>
            <svg className={styles.actionArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>

          <button
            className={`${styles.actionCard} ${hovered === 'member' ? styles.activeCard : ''}`}
            onMouseEnter={() => setHovered('member')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => {
              if (!isAuthenticated) { navigate('auth'); return }
              navigate('user-dashboard')
            }}
          >
            <div className={styles.actionIcon}><User size={24} /></div>
            <div className={styles.actionContent}>
              <div className={styles.actionTitle}>Join a Team</div>
              <div className={styles.actionDesc}>I have a team code</div>
            </div>
            <svg className={styles.actionArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>

          <button
            className={`${styles.actionCard} ${hovered === 'find' ? styles.activeCard : ''}`}
            onMouseEnter={() => setHovered('find')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => {
              if (!isAuthenticated) { navigate('auth'); return }
              navigate('find-teams')
            }}
          >
            <div className={styles.actionIcon}><Search size={24} /></div>
            <div className={styles.actionContent}>
              <div className={styles.actionTitle}>Find a Team</div>
              <div className={styles.actionDesc}>Browse universal teams</div>
            </div>
            <svg className={styles.actionArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </main>

      <div className={styles.features}>
        {[
          { icon: <Brain size={24} />, title: 'Persistent Memory', desc: 'Every action, decision, and outcome is stored and recalled by AI' },
          { icon: <AlertTriangle size={24} />, title: 'Conflict Predictor', desc: 'AI warns you before delays happen, based on past patterns' },
          { icon: <MessageCircle size={24} />, title: 'Memory-Backed Chat', desc: "Ask anything. Get answers grounded in your team's actual history" },
        ].map((f, i) => (
          <div key={i} className={styles.featureCard} style={{ animationDelay: `${i * 0.1}s` }}>
            <div className={styles.featureIcon}>{f.icon}</div>
            <div className={styles.featureTitle}>{f.title}</div>
            <div className={styles.featureDesc}>{f.desc}</div>
          </div>
        ))}
      </div>

      {showSwitcher && <TeamSwitcher onClose={() => setShowSwitcher(false)} />}
    </div>
  )
}
