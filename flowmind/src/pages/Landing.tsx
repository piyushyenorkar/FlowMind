import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { User, LogOut, Crown, Search, Users } from 'lucide-react'
import TeamSwitcher from '../components/TeamSwitcher'
import flowmindLogo from '../assets/flowmind.png'
import styles from './Landing.module.css'

export default function Landing() {
  const { navigate, reset } = useApp()
  const { user, isAuthenticated, signout } = useAuth()
  const [hovered, setHovered] = useState<string | null>(null)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.navLeft}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isAuthenticated ? (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button className="btn-ghost" onClick={() => setShowMenu(!showMenu)} style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} /> {user?.name}
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
            <button className={styles.signInBtn} onClick={() => navigate('auth')}>
              Sign In
            </button>
          )}
        </div>
      </nav>

      <main className={styles.hero}>
        <div className={styles.brandSection}>
          <div className={styles.logoContainer}>
            <svg className={styles.waveSvg} viewBox="0 0 600 150" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="gapGradient" x1="0" y1="0" x2="600" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="31%" stopColor="white" />
                  <stop offset="33%" stopColor="black" />
                  <stop offset="67%" stopColor="black" />
                  <stop offset="69%" stopColor="white" />
                </linearGradient>
                <mask id="gapMask">
                  <rect x="-300" y="-100" width="1200" height="350" fill="url(#gapGradient)" />
                </mask>
              </defs>
              <g mask="url(#gapMask)">
                <path className={styles.wavePath1} d="M-150,75 C-50,0 50,150 150,75 C250,0 350,150 450,75 C550,0 650,150 750,75" fill="none" stroke="rgba(20, 184, 166, 0.9)" strokeWidth="4" />
                <path className={styles.wavePath2} d="M-150,75 C-50,150 50,0 150,75 C250,150 350,0 450,75 C550,150 650,0 750,75" fill="none" stroke="rgba(20, 184, 166, 0.7)" strokeWidth="3" />
                <path className={styles.wavePath3} d="M-150,75 C0,20 100,130 200,75 C300,20 400,130 500,75 C600,20 700,130 800,75" fill="none" stroke="rgba(20, 184, 166, 0.5)" strokeWidth="2" />
              </g>
            </svg>
            <img src={flowmindLogo} alt="FlowMind Logo" className={styles.animatedLogo} />
          </div>
          
          <p className={styles.tagline}>
            <i>Your Personal AI Group Project Manager</i>
          </p>
        </div>

        <div className={styles.actionsSection}>
          <div className={styles.actions}>
            <button
              className={styles.actionCard}
              onClick={() => {
                if (!isAuthenticated) { navigate('auth'); return }
                navigate('user-dashboard')
              }}
            >
              <div className={styles.actionIconWrapper}><Crown size={24} /></div>
              <div className={styles.actionTitle}>Create New Team</div>
            </button>

            <button
              className={styles.actionCard}
              onClick={() => {
                if (!isAuthenticated) { navigate('auth'); return }
                navigate('user-dashboard')
              }}
            >
              <div className={styles.actionIconWrapper}><Users size={24} /></div>
              <div className={styles.actionTitle}>Join team with code</div>
            </button>

            <button
              className={styles.actionCard}
              onClick={() => {
                if (!isAuthenticated) { navigate('auth'); return }
                navigate('find-teams')
              }}
            >
              <div className={styles.actionIconWrapper}><Search size={24} /></div>
              <div className={styles.actionTitle}>Explore universal teams</div>
            </button>
          </div>
        </div>
      </main>

      {showSwitcher && <TeamSwitcher onClose={() => setShowSwitcher(false)} />}
    </div>
  )
}
