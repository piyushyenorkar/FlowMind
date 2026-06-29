import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { User, Zap, Search } from 'lucide-react'
import styles from './Setup.module.css'

export default function MemberJoin({ onClose }: { onClose?: () => void }) {
  const { joinTeam, navigate } = useApp()
  const { saveTeam, isTeamMember, user } = useAuth()
  const [form, setForm] = useState({ name: user?.name || '', code: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError('') }

  const handleJoin = async () => {
    if (!form.name || !form.code) return
    const code = form.code.toUpperCase()

    // Check if user is already in this team
    setLoading(true)
    const isMember = await isTeamMember(code)
    if (isMember) {
      setError('You are already a member of this team. You cannot join the same team twice.')
      setLoading(false)
      return
    }

    joinTeam(code, form.name)
    // Get actual project name from persisted team data
    let projectName = 'Team Project'
    try {
      const teamData = JSON.parse(localStorage.getItem('flowmind_team_data') || '{}')
      if (teamData[code]?.projectName) projectName = teamData[code].projectName
    } catch { }
    await saveTeam(code, projectName, 'member', 'code')
    setLoading(false)
  }

  const content = (
    <div style={{ maxWidth: '380px', width: '100%', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-10px', position: 'relative', zIndex: 10 }}>
        <button className="btn-ghost" onClick={onClose} style={{ padding: '4px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>

      <div className={styles.header}>
        <div className={styles.iconWrap}><User size={24} /></div>
        <h2 className={styles.title}>Join Your Team</h2>
        <p className={styles.sub}>Enter the 6-digit team code</p>
      </div>

      <div className={styles.form}>
        <div className={styles.field}>
          <label className="label">Your Name</label>
          <input className="input" placeholder="e.g. Rahul" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>

        <div className={styles.field}>
          <label className="label">Team Code</label>
          <input
            className="input"
            placeholder="e.g. XK92PL"
            value={form.code}
            onChange={e => set('code', e.target.value.toUpperCase())}
            maxLength={6}
            style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '18px', fontFamily: 'var(--font-display)', fontWeight: '700', textAlign: 'center' }}
          />
        </div>


        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: 'var(--red)',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            textAlign: 'center',
          }}>{error}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            className={`btn-primary ${styles.submit}`}
            onClick={handleJoin}
            disabled={loading || !form.name || form.code.length < 4}
          >
            {loading ? <><span className="spinner" /> Joining...</> : 'Join Team'}
          </button>

          <p className={styles.hint} style={{ textAlign: 'center', margin: '3px 0', fontSize: '12px' }}>Don't have a code? Ask your team leader.</p>

          <div style={{ textAlign: 'center', margin: '2px 0' }}>
            <span style={{ fontSize: '13px', color: 'var(--text3)' }}>or</span>
          </div>

          <button
            className={`btn-secondary ${styles.submit}`}
            onClick={() => {
              if (onClose) onClose();
              navigate('find-teams');
            }}
            style={{ background: 'var(--surface)' }}
          >
            Find Universal Teams
          </button>
        </div>
      </div>
    </div>
  )

  return content
}
