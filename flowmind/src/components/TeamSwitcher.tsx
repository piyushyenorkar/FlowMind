import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import styles from './TeamSwitcher.module.css'

import { X, Search, Globe, Zap, Crown, Pin } from 'lucide-react'
import MemberJoin from '../pages/MemberJoin'

export default function TeamSwitcher({ onClose }: { onClose: () => void }) {
  const { loadTeamAsLeader, joinTeam, navigate, team } = useApp()
  const { user, getMyTeams, togglePinTeam } = useAuth()
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showJoinModal, setShowJoinModal] = useState(false)

  useEffect(() => {
    let mounted = true
    getMyTeams().then((data: any[]) => {
      if (mounted) {
        setTeams(data)
        setLoading(false)
      }
    })
    return () => { mounted = false }
  }, [getMyTeams])

  const ledTeams = teams.filter(t => t.role === 'leader').sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  })
  const joinedTeams = teams.filter(t => t.role === 'member').sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.joinedAt || 0).getTime() - new Date(a.joinedAt || 0).getTime();
  })

  const handlePinToggle = async (e: React.MouseEvent, teamCode: string, isPinned: boolean) => {
    e.stopPropagation()
    const res = await togglePinTeam(teamCode, isPinned)
    if (res.success) {
      setTeams(prev => prev.map(t => t.code === teamCode ? { ...t, isPinned: !isPinned } : t))
    }
  }

  const handleSelect = (team) => {
    if (team.role === 'leader') {
      loadTeamAsLeader(team.code, team.projectName, user.name)
    } else {
      joinTeam(team.code, user.name)
    }
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {showJoinModal && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }} onClick={() => setShowJoinModal(false)} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1001, background: 'var(--bg2)', borderRadius: '24px', border: '1px solid var(--border)', width: '380px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
              <div style={{ maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', padding: '24px' }}>
                <MemberJoin onClose={() => { setShowJoinModal(false); onClose(); }} />
              </div>
            </div>
          </>
        )}

        <button className={styles.close} onClick={onClose}><X size={16} /></button>

        <div className={styles.title}>My Teams</div>
        <div className={styles.sub}>Select a team to switch to its dashboard</div>

        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)' }}>
            <span className="spinner" /> Loading teams...
          </div>
        ) : (
          <>
            {/* Leading teams */}
            <div className={styles.group}>
              <div className={styles.groupTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Crown size={14}/> Teams You Lead</div>
          {ledTeams.length === 0 ? (
            <div className={styles.noTeams}>No teams created yet</div>
          ) : (
            ledTeams.map(t => (
              <div key={t.code} className={`${styles.teamItem} ${team?.code === t.code ? styles.active : ''}`} onClick={() => { loadTeamAsLeader(t.code, t.projectName, user?.name || ''); onClose() }}>
                <div className={styles.teamIcon} style={{ background: t.logoUrl ? 'var(--surface2)' : 'var(--accent-glow)', color: 'var(--accent)', padding: t.logoUrl ? 0 : '', overflow: 'hidden' }}>
                  {t.logoUrl ? <img src={t.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Crown size={16}/>}
                </div>
                <div className={styles.teamInfo}>
                  <div className={styles.teamName}>
                    {t.projectName}
                    {t.source === 'universal' && <span className={styles.universalBadge} title="Universal"><Globe size={14} /></span>}
                  </div>
                  <div className={styles.teamMeta}>Code: {t.code} · Leader</div>
                </div>
                <button 
                  onClick={(e) => handlePinToggle(e, t.code, t.isPinned)}
                  style={{ background: 'transparent', border: 'none', color: t.isPinned ? 'var(--accent)' : 'var(--text3)', opacity: t.isPinned ? 1 : 0.6, cursor: 'pointer', transition: 'all 0.2s', padding: '4px', display: 'flex', alignItems: 'center' }}
                  title={t.isPinned ? "Unpin team" : "Pin team"}
                >
                  <Pin size={14} fill={t.isPinned ? 'var(--accent)' : 'none'} style={{ transform: 'rotate(45deg)' }} />
                </button>
                <svg className={styles.teamArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            ))
          )}
        </div>

        {/* Joined teams */}
            <div className={styles.group}>
              <div className={styles.groupTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={14}/> Teams You Joined</div>
          {joinedTeams.length === 0 ? (
            <div className={styles.noTeams}>No teams joined yet</div>
          ) : (
            joinedTeams.map(t => (
              <div key={t.code} className={`${styles.teamItem} ${team?.code === t.code ? styles.active : ''}`} onClick={() => { joinTeam(t.code, user?.name || ''); onClose() }}>
                <div className={styles.teamIcon} style={{ background: t.logoUrl ? 'var(--surface2)' : t.source === 'universal' ? 'rgba(62, 207, 142, 0.1)' : 'rgba(255,255,255,0.05)', color: t.source === 'universal' ? 'var(--accent)' : 'var(--text)', padding: t.logoUrl ? 0 : '', overflow: 'hidden' }}>
                  {t.logoUrl ? <img src={t.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : t.source === 'universal' ? <Globe size={16} /> : <Zap size={16} />}
                </div>
                <div className={styles.teamInfo}>
                  <div className={styles.teamName}>
                    {t.projectName}
                    {t.source === 'universal' && <span className={styles.universalBadge} title="Universal"><Globe size={14} /></span>}
                  </div>
                  <div className={styles.teamMeta}>Code: {t.code} · Member</div>
                </div>
                <button 
                  onClick={(e) => handlePinToggle(e, t.code, t.isPinned)}
                  style={{ background: 'transparent', border: 'none', color: t.isPinned ? 'var(--accent)' : 'var(--text3)', opacity: t.isPinned ? 1 : 0.6, cursor: 'pointer', transition: 'all 0.2s', padding: '4px', display: 'flex', alignItems: 'center' }}
                  title={t.isPinned ? "Unpin team" : "Pin team"}
                >
                  <Pin size={14} fill={t.isPinned ? 'var(--accent)' : 'none'} style={{ transform: 'rotate(45deg)' }} />
                </button>
                <svg className={styles.teamArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            ))
          )}
        </div>
        </>
        )}

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button className="btn-secondary" onClick={() => setShowJoinModal(true)} style={{ flex: 1, padding: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: '16px' }}>
            <Zap size={14}/> Join with Code
          </button>
          <button className="btn-ghost" onClick={() => { navigate('find-teams'); onClose() }} style={{ flex: 1, padding: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: '16px' }}>
            <Search size={14}/> Find Teams
          </button>
        </div>
      </div>
    </div>
  )
}
