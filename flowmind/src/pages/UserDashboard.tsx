import React, { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { User, LogOut, Crown, Search, Zap, Globe, Edit, Clock, Info, X, Pin } from 'lucide-react'
import styles from './UserDashboard.module.css'
import MemberProfile from '../components/MemberProfile'
import LeaderSetup from './LeaderSetup'
import MemberJoin from './MemberJoin'

export default function UserDashboard() {
  const { navigate, loadTeamAsLeader, joinTeam, reset } = useApp()
  const { user, getMyTeams, signout, togglePinTeam } = useAuth()

  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false)
  const [showJoinTeamModal, setShowJoinTeamModal] = useState(false)
  const [activeTab, setActiveTab] = useState('lead')
  const menuRef = useRef<HTMLDivElement>(null)
  const elevatorRef = useRef<HTMLDivElement>(null)

  const updateElevatorEffect = () => {
    if (!elevatorRef.current) return;
    const container = elevatorRef.current;
    const cards = container.querySelectorAll(`.${styles.teamCardPremium}`);
    const containerRect = container.getBoundingClientRect();
    if (containerRect.height === 0) return;
    const containerCenter = containerRect.top + containerRect.height / 2;

    cards.forEach((card) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.top + cardRect.height / 2;
      const distance = cardCenter - containerCenter;

      const rotation = Math.max(-30, Math.min(30, (distance / containerRect.height) * 45));
      const scale = 1 - Math.abs(distance / containerRect.height) * 0.15;

      (card as HTMLElement).style.transform = `perspective(1000px) rotateX(${-rotation}deg) scale(${scale})`;
    });
  };

  useEffect(() => {
    updateElevatorEffect();
    const timeout = setTimeout(updateElevatorEffect, 100);
    return () => clearTimeout(timeout);
  }, [activeTab, loading]);

  useEffect(() => {
    if (showProfileModal || showCreateTeamModal || showJoinTeamModal) return;

    const handleGlobalWheel = (e: WheelEvent) => {
      if (elevatorRef.current) {
        const isInsideElevator = elevatorRef.current.contains(e.target as Node);
        if (!isInsideElevator) {
          e.preventDefault();
          // Directly pass the raw native scroll delta. 
          // CSS scroll-snap will handle the smooth snapping natively when scrolling stops.
          elevatorRef.current.scrollBy({
            top: e.deltaY
          });
        }
      }
    };

    window.addEventListener('wheel', handleGlobalWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleGlobalWheel);
  }, [showProfileModal, showCreateTeamModal, showJoinTeamModal]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    let mounted = true
    const fetchTeams = async () => {
      setLoading(true)
      const fetchedTeams = await getMyTeams()
      if (mounted) {
        setTeams(fetchedTeams)
        setLoading(false)
      }
    }
    fetchTeams()
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

  const handleSelect = (team: any) => {
    if (team.role === 'leader') {
      loadTeamAsLeader(team.code, team.projectName, user?.name || '')
    } else {
      joinTeam(team.code, user?.name || '')
    }
  }

  const allMembers = JSON.parse(localStorage.getItem('flowmind_team_members') || '{}')
  const profilePic = user?.photoUrl || (user?.name ? allMembers[user.name]?.photoUrl : null)

  return (
    <div className={styles.page}>
      <nav className={styles.topNav}>
        <div className={styles.logo}>
          <img id="main-nav-logo" src={new URL('../assets/flowmind.png', import.meta.url).href} alt="FlowMind" style={{ height: '35px', width: 'auto' }} />
        </div>

        <div ref={menuRef} style={{ position: 'relative' }}>
          <button className="btn-ghost" onClick={() => setShowMenu(!showMenu)} style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 8px' }}>
            {user?.name || 'User'}
            {profilePic ? (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden' }}>
                <img src={profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={18} />
              </div>
            )}
          </button>
          {showMenu && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '6px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '6px', minWidth: '160px', zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              <button
                onClick={() => { setShowProfileModal(true); setShowMenu(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 14px', background: 'none', border: 'none', color: 'var(--text)', fontSize: '13px', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <Edit size={14} /> Edit Profile
              </button>
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
      </nav>

      {showProfileModal && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }} onClick={() => setShowProfileModal(false)} />
          <div style={{ position: 'fixed', top: '76px', right: '32px', zIndex: 1001, background: '#1a1a1a', borderRadius: '24px', border: '1px solid var(--border)', width: '420px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            <button onClick={() => setShowProfileModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'var(--text3)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', zIndex: 10 }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--surface)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'transparent'; }}>
              <X size={16} />
            </button>
            <div style={{ maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', padding: '24px' }}>
              <MemberProfile />
            </div>
          </div>
        </>
      )}

      <div className={styles.content}>
        <div className={styles.leftColumn} style={{ position: 'relative' }}>
          {showCreateTeamModal && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }} onClick={() => setShowCreateTeamModal(false)} />
              <div style={{ position: 'absolute', top: '45%', transform: 'translateY(-50%)', right: 'calc(100% + 24px)', zIndex: 1001, background: 'var(--bg2)', borderRadius: '24px', border: '1px solid var(--border)', width: '450px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
                <div style={{ maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', padding: '24px' }}>
                  <LeaderSetup onClose={() => setShowCreateTeamModal(false)} />
                </div>
              </div>
            </>
          )}
          {showJoinTeamModal && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }} onClick={() => setShowJoinTeamModal(false)} />
              <div style={{ position: 'absolute', top: '45%', transform: 'translateY(-50%)', right: 'calc(100% + 24px)', zIndex: 1001, background: 'var(--bg2)', borderRadius: '24px', border: '1px solid var(--border)', width: '380px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
                <div style={{ maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', padding: '24px' }}>
                  <MemberJoin onClose={() => setShowJoinTeamModal(false)} />
                </div>
              </div>
            </>
          )}
          <div className={styles.actionGrid}>
            <button className={styles.actionCard} onClick={() => setShowCreateTeamModal(true)}>
              <div className={styles.actionIconWrapper}><Crown size={20} /></div>
              <div className={styles.actionText}>
                <h3>Create New Team</h3>
              </div>
            </button>

            <button className={styles.actionCard} onClick={() => setShowJoinTeamModal(true)}>
              <div className={styles.actionIconWrapper}><User size={20} /></div>
              <div className={styles.actionText}>
                <h3>Join team with code</h3>
              </div>
            </button>

            <button className={styles.actionCard} onClick={() => navigate('find-teams')}>
              <div className={styles.actionIconWrapper}><Search size={20} /></div>
              <div className={styles.actionText}>
                <h3>Explore universal teams</h3>
              </div>
            </button>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.heroSection}>
            <h1 className={styles.greeting} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
              Welcome to <img src={new URL('../assets/flowmind.png', import.meta.url).href} alt="FlowMind" style={{ height: '1.2em', width: 'auto' }} /> <span className={styles.nameHighlight}>{user?.name || 'User'}</span>!
            </h1>
            <p className={styles.sub}>Select a team to continue your work or discover new ones.</p>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)' }}>
              <span className="spinner" style={{ display: 'inline-block', marginBottom: '16px' }} />
              <div>Loading your teams...</div>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center' }}>
                <div className={styles.segmentedControl}>
                  <button
                    className={`${styles.segmentBtn} ${activeTab === 'lead' ? styles.active : ''}`}
                    onClick={() => setActiveTab('lead')}
                  >
                    <Crown size={16} /> Teams You Lead
                  </button>
                  <button
                    className={`${styles.segmentBtn} ${activeTab === 'join' ? styles.active : ''}`}
                    onClick={() => setActiveTab('join')}
                  >
                    <User size={16} /> Teams You Joined
                  </button>
                </div>
              </div>

              {activeTab === 'lead' && (
                <div className={styles.section}>
                  {ledTeams.length === 0 ? (
                    <div className={styles.noTeams}>You haven't created any teams yet.</div>
                  ) : (
                    <div className={styles.elevatorContainer} ref={elevatorRef} onScroll={updateElevatorEffect}>
                      <div className={styles.grid}>
                        {ledTeams.map((t, i) => (
                          <div key={i} className={styles.teamCardPremium} onClick={() => handleSelect(t)} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                              <div className={styles.teamIcon} style={{ background: t.logoUrl ? 'var(--surface2)' : 'rgba(255,255,255,0.05)', color: 'var(--text)', padding: t.logoUrl ? 0 : '', overflow: 'hidden' }}>
                                {t.logoUrl ? <img src={t.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Crown size={20} />}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className={styles.teamName} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.projectName}</div>
                                <div className={styles.teamCodeBadge}>
                                  Code: {t.code}
                                </div>
                              </div>
                            </div>
                            <div className={styles.teamInfo} style={{ width: '100%' }}>
                              {t.source === 'universal' && (
                                <div style={{ marginBottom: '12px' }}>
                                  <span className={styles.universalBadge}><Globe size={12} /> Universal</span>
                                </div>
                              )}
                              {t.description && (
                                <div className={styles.teamDescription} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '12px' }}>
                                  {t.description}
                                </div>
                              )}
                              {t.source === 'universal' && t.deadline && (
                                <div className={styles.teamDeadline}>
                                  <Clock size={14} /> {new Date(t.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  {new Date(t.deadline).getTime() < new Date().getTime() && (
                                    <div className={styles.tooltipContainer} style={{ cursor: 'pointer' }}>
                                      <Info size={14} />
                                      <div className={styles.tooltipText}>
                                        Deadline is over but member can join using team code
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <button 
                              className={`${styles.pinBtn} ${t.isPinned ? styles.pinned : ''}`}
                              onClick={(e) => handlePinToggle(e, t.code, t.isPinned)}
                              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: t.isPinned ? 'var(--accent)' : 'var(--text3)', cursor: 'pointer', transition: 'all 0.2s', zIndex: 10 }}
                              title={t.isPinned ? "Unpin team" : "Pin team"}
                            >
                              <Pin size={16} fill={t.isPinned ? 'var(--accent)' : 'none'} style={{ transform: 'rotate(45deg)' }} />
                            </button>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" style={{ position: 'absolute', bottom: '16px', right: '16px', opacity: 0.6 }}>
                              <path d="M9 18l6-6-6-6" />
                            </svg>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'join' && (
                <div className={styles.section}>
                  {joinedTeams.length === 0 ? (
                    <div className={styles.noTeams}>You haven't joined any teams yet.</div>
                  ) : (
                    <div className={styles.elevatorContainer} ref={elevatorRef} onScroll={updateElevatorEffect}>
                      <div className={styles.grid}>
                        {joinedTeams.map((t, i) => (
                          <div key={i} className={styles.teamCardPremium} onClick={() => handleSelect(t)} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                              <div className={styles.teamIcon} style={{ background: t.logoUrl ? 'var(--surface2)' : 'rgba(255,255,255,0.05)', color: 'var(--text)', padding: t.logoUrl ? 0 : '', overflow: 'hidden' }}>
                                {t.logoUrl ? <img src={t.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : t.source === 'universal' ? <Globe size={20} /> : <Zap size={20} />}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className={styles.teamName} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.projectName}</div>
                                <div className={styles.teamCodeBadge}>
                                  Code: {t.code}
                                </div>
                              </div>
                            </div>
                            <div className={styles.teamInfo} style={{ width: '100%' }}>
                              {t.source === 'universal' && (
                                <div style={{ marginBottom: '12px' }}>
                                  <span className={styles.universalBadge}><Globe size={12} /> Universal</span>
                                </div>
                              )}
                              {t.description && (
                                <div className={styles.teamDescription} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '12px' }}>
                                  {t.description}
                                </div>
                              )}
                              {t.source === 'universal' && t.deadline && (
                                <div className={styles.teamDeadline}>
                                  <Clock size={14} /> {new Date(t.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  {new Date(t.deadline).getTime() < new Date().getTime() && (
                                    <div className={styles.tooltipContainer} style={{ cursor: 'pointer' }}>
                                      <Info size={14} />
                                      <div className={styles.tooltipText}>
                                        Deadline is over but member can join using team code
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <button 
                              className={`${styles.pinBtn} ${t.isPinned ? styles.pinned : ''}`}
                              onClick={(e) => handlePinToggle(e, t.code, t.isPinned)}
                              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: t.isPinned ? 'var(--accent)' : 'var(--text3)', cursor: 'pointer', transition: 'all 0.2s', zIndex: 10 }}
                              title={t.isPinned ? "Unpin team" : "Pin team"}
                            >
                              <Pin size={16} fill={t.isPinned ? 'var(--accent)' : 'none'} style={{ transform: 'rotate(45deg)' }} />
                            </button>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" style={{ position: 'absolute', bottom: '16px', right: '16px', opacity: 0.6 }}>
                              <path d="M9 18l6-6-6-6" />
                            </svg>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
