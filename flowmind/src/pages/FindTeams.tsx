import React, { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { Search, Globe, Send, Inbox, ArrowLeft, MapPin, Users, CheckCircle, Clock, Hand, Crown, Zap, MessageCircle, User, Check, X, LogOut, Edit, Code, Server, PenTool, Database, Smartphone, Megaphone, Briefcase, Rocket, Aperture } from 'lucide-react'
import styles from './FindTeams.module.css'
import MemberProfile from '../components/MemberProfile'
import Avatar from '../components/Avatar'
import LeaderSetup from './LeaderSetup'

const PREDEFINED_ROLES = [
  { name: 'Frontend Developer', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg' },
  { name: 'Backend Developer', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg' },
  { name: 'Full Stack Developer', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg' },
  { name: 'UI/UX Designer', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg' },
  { name: 'Mobile Developer (Android)', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/android/android-original.svg' },
  { name: 'Mobile Developer (iOS)', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/apple/apple-original.svg' },
  { name: 'Data Scientist', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg' },
  { name: 'Machine Learning Engineer', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tensorflow/tensorflow-original.svg' },
  { name: 'DevOps Engineer', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg' },
  { name: 'Cloud Architect', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-original-wordmark.svg' },
  { name: 'QA Tester', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/selenium/selenium-original.svg' },
  { name: 'Database Administrator', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg' },
  { name: 'Game Developer', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/unity/unity-original.svg' },
  { name: 'Blockchain Developer', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/solidity/solidity-original.svg' },
  { name: 'Cybersecurity Analyst', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kali/kali-original.svg' },
]

const getRoleIcon = (role: string) => {
  const r = role.toLowerCase()
  let predefined = PREDEFINED_ROLES.find(pr => pr.name.toLowerCase() === r)

  if (!predefined) {
    if (r.includes('front')) predefined = PREDEFINED_ROLES.find(pr => pr.name === 'Frontend Developer')
    else if (r.includes('back')) predefined = PREDEFINED_ROLES.find(pr => pr.name === 'Backend Developer')
    else if (r.includes('design') || r.includes('ui') || r.includes('ux')) predefined = PREDEFINED_ROLES.find(pr => pr.name === 'UI/UX Designer')
    else if (r.includes('data')) predefined = PREDEFINED_ROLES.find(pr => pr.name === 'Data Scientist')
    else if (r.includes('app') || r.includes('mobile')) predefined = PREDEFINED_ROLES.find(pr => pr.name === 'Mobile Developer (Android)')
  }

  if (predefined && predefined.logo) {
    return <img src={predefined.logo} alt="" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
  }

  if (r.includes('market') || r.includes('sales')) return <Megaphone size={18} />
  return <Briefcase size={18} />
}

const getDynamicTeamLogo = (name: string) => {
  return <Aperture size={24} strokeWidth={1.5} color="var(--accent)" />
}

const TABS = [
  { id: 'explore', label: <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Search size={16} /> Explore</div> },
  { id: 'myteams', label: <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Globe size={16} /> My Teams</div> },
  { id: 'applied', label: <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Send size={16} /> Applied</div> },
  { id: 'received', label: <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Inbox size={16} /> Received</div> },
]

export default function FindTeams() {
  const { navigate, joinTeam, reset } = useApp()
  const {
    user, getUniversalTeams, getMyUniversalTeams,
    applyToTeam, getMyApplications, getReceivedApplications, getAcceptedRoles,
    updateApplication, addChatMessage, getMyTeams, saveTeam, signout
  } = useAuth()

  const [activeTab, setActiveTab] = useState('explore')
  const [search, setSearch] = useState('')
  const [chatOpen, setChatOpen] = useState(null) // appId
  const [chatText, setChatText] = useState('')
  const [applyTarget, setApplyTarget] = useState(null) // team object for apply form
  const [viewTeamTarget, setViewTeamTarget] = useState(null) // team object for viewing roles
  const [applyRole, setApplyRole] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [processingId, setProcessingId] = useState(null)
  const [enteringTeamId, setEnteringTeamId] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const [data, setData] = useState({
    allTeams: [],
    myCreated: [],
    myApps: [],
    received: [],
    myTeams: [],
    acceptedRoles: [],
    loading: true
  })

  const loadData = async () => {
    setData(prev => ({ ...prev, loading: true }))
    try {
      const [all, created, apps, rec, myT] = await Promise.all([
        getUniversalTeams(),
        getMyUniversalTeams(),
        getMyApplications(),
        getReceivedApplications(),
        getMyTeams()
      ])
      const accepted = all ? await getAcceptedRoles(all.map(t => t.code)) : []
      setData({
        allTeams: all || [],
        myCreated: created || [],
        myApps: apps || [],
        received: rec || [],
        myTeams: myT || [],
        acceptedRoles: accepted || [],
        loading: false
      })
    } catch (err) {
      console.error("Failed to load data", err)
      setData(prev => ({ ...prev, loading: false }))
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line
  }, [])

  const { allTeams, myCreated, myApps: rawMyApps, received: rawReceived, myTeams, acceptedRoles, loading } = data

  // Deduplicate apps to avoid showing multiples if someone double-clicked before the fix
  const myApps = rawMyApps.filter((app, index, self) => 
    index === self.findIndex((a) => a.teamCode === app.teamCode)
  )

  const received = rawReceived.filter((app, index, self) =>
    index === self.findIndex((a) => a.applicantEmail === app.applicantEmail && a.teamCode === app.teamCode)
  )

  // Filter explore teams
  const filteredTeams = allTeams.filter(t => {
    if (t.deadline && new Date(t.deadline).getTime() < Date.now()) {
      return false
    }
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.name?.toLowerCase().includes(q) ||
      t.purpose?.toLowerCase().includes(q) ||
      t.city?.toLowerCase().includes(q) ||
      t.state?.toLowerCase().includes(q) ||
      t.rolesNeeded?.toLowerCase().includes(q)
    )
  })

  const openApplyForm = (team) => {
    const roles = team.rolesNeeded?.split(',').map(r => r.trim()).filter(Boolean) || []
    const availableRoles = roles.filter(r => !acceptedRoles.some(ar => ar.team_code === team.code && ar.role?.toLowerCase() === r.toLowerCase()))
    setApplyTarget(team)
    setApplyRole('')
  }

  const submitApplication = async () => {
    if (!applyTarget || submitting) return
    setSubmitting(true)
    try {
      const result = await applyToTeam(applyTarget.code, applyTarget.name, applyRole)
      if (result.error) {
        alert(result.error)
      } else {
        setApplyTarget(null)
        setApplyRole('')
        setActiveTab('applied')
        loadData()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleAccept = async (app) => {
    setProcessingId(app.id)
    await updateApplication(app.id, 'accepted')
    setProcessingId(null)
    loadData()
  }

  const handleReject = async (app) => {
    setProcessingId(app.id)
    await updateApplication(app.id, 'rejected')
    setProcessingId(null)
    loadData()
  }

  const handleSendChat = async (appId) => {
    if (!chatText.trim()) return
    await addChatMessage(appId, chatText.trim())
    setChatText('')
    loadData()
  }

  const joinAcceptedTeam = async (app) => {
    setEnteringTeamId(app.id)
    joinTeam(app.teamCode, user?.name || '')
    await saveTeam(app.teamCode, app.teamName, 'member', 'universal')
    setEnteringTeamId(null)
  }

  const allMembers = JSON.parse(localStorage.getItem('flowmind_team_members') || '{}')
  const profilePic = user?.photoUrl || (user?.name ? allMembers[user.name]?.photoUrl : null)

  return (
    <div className={styles.page}>
      <nav className={styles.topNav} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className={styles.logo}>
          <img src={new URL('../assets/flowmind.png', import.meta.url).href} alt="FlowMind" style={{ height: '35px', width: 'auto' }} />
          <span className={styles.logoMark}>FM</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
        </div>
      </nav>

      {showProfileModal && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }} onClick={() => setShowProfileModal(false)} />
          <div style={{ position: 'fixed', top: '76px', right: '32px', zIndex: 1001, background: '#1a1a1a', borderRadius: '24px', border: '1px solid var(--border)', width: '420px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            <div style={{ maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', padding: '24px' }}>
              <MemberProfile />
            </div>
          </div>
        </>
      )}

      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.title}>Find Teams</div>
          <div className={styles.sub}>Discover universal teams, apply, and collaborate with people across cities</div>
        </div>

        {/* Tabs */}
        <div style={{ textAlign: 'center' }}>
          <div className={styles.segmentedControl}>
            <div
              className={styles.segmentIndicator}
              style={{
                transform: `translateX(${TABS.findIndex(t => t.id === activeTab) * 100}%)`
              }}
            />
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`${styles.segmentBtn} ${activeTab === tab.id ? styles.active : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {tab.id === 'applied' && myApps.length > 0 && (
                  <span className={styles.tabBadge}>{myApps.length}</span>
                )}
                {tab.id === 'received' && received.filter(a => a.status === 'pending').length > 0 && (
                  <span className={styles.tabBadge}>{received.filter(a => a.status === 'pending').length}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text3)' }}>
            <span className="spinner" style={{ display: 'inline-block', marginBottom: '16px' }} />
            <div>Loading universal teams...</div>
          </div>
        ) : (
          <>
            {/* EXPLORE TAB */}
            {activeTab === 'explore' && (
              <>
                <div className={styles.searchRow || ''} style={{ maxWidth: '500px', margin: '0 auto 24px auto', position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text2)', pointerEvents: 'none', zIndex: 2 }} />
                  <input
                    className="input"
                    placeholder="Search by name, role, city, or purpose"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ paddingLeft: '44px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '100px' }}
                  />
                </div>

                {filteredTeams.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}><Globe size={40} /></div>
                    <div className={styles.emptyTitle}>No universal teams found</div>
                    <div className={styles.emptySub}>
                      {search ? 'Try a different search term' : 'Be the first — create a Universal team!'}
                    </div>
                  </div>
                ) : (
                  <div className={styles.grid}>
                    {filteredTeams.map(team => {
                      const alreadyApplied = myApps.some(a => a.teamCode === team.code)
                      const alreadyMember = myTeams.some(t => t.code === team.code)
                      const isOwner = team.createdBy === user?.email

                      return (
                        <div key={team.code} className={styles.teamCard} onClick={() => (isOwner || alreadyMember || alreadyApplied) ? setViewTeamTarget(team) : null} style={{ cursor: (isOwner || alreadyMember || alreadyApplied) ? 'pointer' : 'default' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', width: '100%' }}>
                            <div className={styles.teamIcon}>{getDynamicTeamLogo(team.name)}</div>
                            <div className={styles.teamHeader} style={{ flex: 1, marginBottom: 0 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div className={styles.teamName}>{team.name}</div>
                              <div className={styles.teamLeader} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span>by {team.leaderName}</span>
                                <span style={{ color: 'var(--text3)' }}>•</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'inherit' }}>
                                  <Users size={12} /> {team.rolesNeeded ? team.rolesNeeded.split(',').filter(r => acceptedRoles.some(ar => ar.team_code === team.code && ar.role?.toLowerCase() === r.trim().toLowerCase())).length + 1 : 1} / {team.maxMembers}
                                </span>
                              </div>
                              <div className={styles.teamLeader} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12} /> {team.deadline ? new Date(team.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : team.createdAt ? new Date(team.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Active'}
                              </div>
                            </div>

                            </div>
                          </div>

                          <div className={styles.teamContent} style={{ width: '100%', marginTop: '11px' }}>
                            <div className={styles.teamPurpose} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.description || team.purpose}</div>

                            <div className={styles.teamMeta} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                              {team.rolesNeeded?.split(',').map((role, i) => {
                                const r = role.trim()
                                const isFilled = acceptedRoles.some(ar => ar.team_code === team.code && ar.role?.toLowerCase() === r.toLowerCase())
                                return (
                                  <div key={i} className={styles.roleBox} style={isFilled ? { opacity: 0.5, display: 'flex', alignItems: 'center', gap: '6px' } : {}}>
                                    <div className={styles.roleIcon}>{getRoleIcon(r)}</div>
                                    <div className={styles.roleName}>{r}</div>
                                    {isFilled && <CheckCircle size={14} color="var(--text3)" />}
                                  </div>
                                )
                              })}
                            </div>

                            {team.city || team.state ? (
                              <div className={styles.teamLocation} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <MapPin size={14} /> {[team.city, team.state].filter(Boolean).join(', ')}
                              </div>
                            ) : null}

                            <div className={styles.teamActions} style={{ marginTop: '12px' }}>
                              {isOwner ? (
                                <span style={{ fontSize: '13px', color: 'var(--text3)' }}>Your team</span>
                              ) : alreadyMember ? (
                                <span style={{ fontSize: '13px', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}><CheckCircle size={14} /> Already a member</span>
                              ) : alreadyApplied ? (
                                <span style={{ fontSize: '13px', color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}><Clock size={14} /> Applied</span>
                              ) : (team.deadline && new Date(team.deadline).getTime() < Date.now()) ? (
                                <span style={{ fontSize: '13px', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>Deadline Passed</span>
                              ) : (
                                <button className="btn-primary" onClick={() => openApplyForm(team)} style={{ fontSize: '13px', padding: '7px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Hand size={14} /> Apply to Join
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {/* MY TEAMS TAB */}
            {activeTab === 'myteams' && (
              <>
                {myCreated.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}><Globe size={40} /></div>
                    <div className={styles.emptyTitle}>No universal teams yet</div>
                    <div className={styles.emptySub}>Create a team with "Make Universal" to list it here</div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                      <button className="btn-primary" onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Crown size={16} /> Create Universal Team
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.grid}>
                    {myCreated.map(team => (
                      <div key={team.code} className={styles.teamCard} onClick={() => setViewTeamTarget(team)} style={{ cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', width: '100%' }}>
                          <div className={styles.teamIcon}>{getDynamicTeamLogo(team.name)}</div>
                          <div className={styles.teamHeader} style={{ flex: 1, marginBottom: 0 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div className={styles.teamName}>{team.name}</div>
                              <div className={styles.teamLeader} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span>by {team.leaderName}</span>
                                <span style={{ color: 'var(--text3)' }}>•</span>
                                <span style={{ fontFamily: 'monospace', padding: '2px 6px', borderRadius: '4px', letterSpacing: '1px' }}>{team.code}</span>
                                <span style={{ color: 'var(--text3)' }}>•</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'inherit' }}>
                                  <Users size={12} /> {team.rolesNeeded ? team.rolesNeeded.split(',').filter(r => acceptedRoles.some(ar => ar.team_code === team.code && ar.role?.toLowerCase() === r.trim().toLowerCase())).length + 1 : 1} / {team.maxMembers}
                                </span>
                              </div>
                              <div className={styles.teamLeader} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12} /> {team.deadline ? new Date(team.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : team.createdAt ? new Date(team.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Active'}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className={styles.teamContent} style={{ width: '100%', marginTop: '8px' }}>
                          <div className={styles.teamPurpose} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.description || team.purpose}</div>
                          <div className={styles.teamMeta} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                            {team.rolesNeeded?.split(',').map((role, i) => {
                              const r = role.trim()
                              const isFilled = acceptedRoles.some(ar => ar.team_code === team.code && ar.role?.toLowerCase() === r.toLowerCase())
                              return (
                                <div key={i} className={styles.roleBox} style={isFilled ? { opacity: 0.5, display: 'flex', alignItems: 'center', gap: '6px' } : {}}>
                                  <div className={styles.roleIcon}>{getRoleIcon(r)}</div>
                                  <div className={styles.roleName}>{r}</div>
                                  {isFilled && <CheckCircle size={14} color="var(--text3)" />}
                                </div>
                              )
                            })}
                          </div>
                          {team.city || team.state ? (
                            <div className={styles.teamLocation} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={14} /> {[team.city, team.state].filter(Boolean).join(', ')}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* APPLIED TAB */}
            {activeTab === 'applied' && (
              <>
                {myApps.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}><Send size={40} /></div>
                    <div className={styles.emptyTitle}>No applications yet</div>
                    <div className={styles.emptySub}>Browse Explore to find teams and apply</div>
                  </div>
                ) : (
                  myApps.map(app => {
                    return (
                      <div 
                        key={app.id} 
                        className={styles.appCard}
                        onClick={() => {
                          if (app.status === 'accepted' || app.status === 'pending') {
                            const fullTeam = allTeams.find(t => t.code === app.teamCode);
                            if (fullTeam) setViewTeamTarget(fullTeam);
                          }
                        }}
                        style={{ cursor: (app.status === 'accepted' || app.status === 'pending') ? 'pointer' : 'default' }}
                      >
                        <div className={styles.appHeader}>
                          <div>
                            <div className={styles.appTeam} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {allTeams.find(t => t.code === app.teamCode)?.name || app.teamName}
                              <span style={{ fontSize: '13px', color: 'var(--text3)', fontWeight: 'normal' }}>
                                by {allTeams.find(t => t.code === app.teamCode)?.leaderName || 'Leader'}
                              </span>
                            </div>
                            <div className={styles.appDate}>Applied {new Date(app.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                            {app.appliedRole && (
                              <div className={styles.roleBox} style={{ display: 'inline-flex', marginTop: '10px' }}>
                                <div className={styles.roleIcon}>{getRoleIcon(app.appliedRole)}</div>
                                <div className={styles.roleName}>{app.appliedRole}</div>
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span className={`tag ${app.status === 'accepted' ? 'tag-green' : app.status === 'rejected' ? 'tag-red' : 'tag-yellow'}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {app.status === 'accepted' ? <><CheckCircle size={12} /> Accepted</> : app.status === 'rejected' ? <><X size={12} /> Rejected</> : <><Clock size={12} /> Pending</>}
                            </span>
                            {app.status === 'accepted' && (
                              <button onClick={(e) => { e.stopPropagation(); joinAcceptedTeam(app); }} disabled={enteringTeamId === app.id} style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '100px', cursor: enteringTeamId === app.id ? 'wait' : 'pointer', fontWeight: 600, transition: 'opacity 0.2s', opacity: enteringTeamId === app.id ? 0.7 : 1 }} onMouseEnter={e => enteringTeamId !== app.id && (e.currentTarget.style.opacity = '0.9')} onMouseLeave={e => enteringTeamId !== app.id && (e.currentTarget.style.opacity = '1')}>
                                {enteringTeamId === app.id ? <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRightColor: '#000', borderBottomColor: '#000' }} /> : <Zap size={14} />} {enteringTeamId === app.id ? 'Entering...' : 'Enter Team Dashboard'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </>
            )}

            {/* RECEIVED TAB */}
            {activeTab === 'received' && (
              <>
                {received.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}><Inbox size={40} /></div>
                    <div className={styles.emptyTitle}>No applications received</div>
                    <div className={styles.emptySub}>Applications to your universal teams will appear here</div>
                  </div>
                ) : (
                  received.map(app => {
                    return (
                      <div key={app.id} className={styles.appCard}>
                        <div className={styles.appHeader}>
                          <div>
                            <div className={styles.appApplicant} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Avatar name={app.applicantName} photoUrl={app.applicantPhoto} size={28} style={{ borderRadius: '8px', background: 'var(--surface2)', border: '0.5px solid var(--border)' }} /> {app.applicantName}</div>
                            <div className={styles.appDate}>
                              Applied to <strong>{allTeams.find(t => t.code === app.teamCode)?.name || app.teamName}</strong> · {new Date(app.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                            {app.appliedRole && (
                              <div className={styles.roleBox} style={{ display: 'inline-flex', marginTop: '10px' }}>
                                <div className={styles.roleIcon}>{getRoleIcon(app.appliedRole)}</div>
                                <div className={styles.roleName}>{app.appliedRole}</div>
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <span className={`tag ${app.status === 'accepted' ? 'tag-green' : app.status === 'rejected' ? 'tag-red' : 'tag-yellow'}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {app.status === 'accepted' ? <><CheckCircle size={12} /> Accepted</> : app.status === 'rejected' ? <><X size={12} /> Rejected</> : <><Clock size={12} /> Pending</>}
                            </span>
                            {app.status === 'pending' && (
                              <>
                                <button className={styles.acceptBtn} onClick={() => handleAccept(app)} disabled={processingId === app.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: processingId === app.id ? 0.6 : 1, cursor: processingId === app.id ? 'not-allowed' : 'pointer', borderRadius: '100px', padding: '6px 14px' }}>
                                  {processingId === app.id ? <span className="spinner" style={{ width: '12px', height: '12px' }} /> : <Check size={14} />} Accept
                                </button>
                                <button onClick={() => handleReject(app)} disabled={processingId === app.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: processingId === app.id ? 0.6 : 1, cursor: processingId === app.id ? 'not-allowed' : 'pointer', borderRadius: '100px', padding: '6px 14px', background: 'var(--surface2)', border: 'none', color: 'var(--text2)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,80,80,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--surface2)'}>
                                  <X size={14} /> Reject
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Apply Form Modal */}
      {applyTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.15s ease' }} onClick={() => setApplyTarget(null)}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '24px', width: '100%', maxWidth: '480px', position: 'relative', boxShadow: '0 24px 48px rgba(0,0,0,0.5)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setApplyTarget(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text3)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', zIndex: 10 }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}>
              <X size={16} />
            </button>
            <div style={{ padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>{applyTarget.name}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div style={{ flex: 1, background: 'var(--surface)', padding: '20px', borderRadius: '24px', boxShadow: '20px 20px 20px rgba(0, 0, 0, 0.15)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text3)', letterSpacing: '1px', marginBottom: '8px' }}>DESCRIPTION</div>
                <div style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: '1.6' }}>{applyTarget.description || 'Not specified'}</div>
              </div>
              <div style={{ flex: 1, background: 'var(--surface)', padding: '20px', borderRadius: '24px', boxShadow: '20px 20px 20px rgba(0, 0, 0, 0.15)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text3)', letterSpacing: '1px', marginBottom: '8px' }}>PURPOSE</div>
                <div style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: '1.6' }}>{applyTarget.purpose || 'Not specified'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text2)', background: 'var(--surface)', padding: '16px', borderRadius: '24px', boxShadow: '20px 20px 20px rgba(0, 0, 0, 0.15)', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} color="var(--accent)" />
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                  {(() => {
                    const filledCount = acceptedRoles.filter(ar => ar.team_code === applyTarget.code).length
                    return `${filledCount + 1}/${applyTarget.maxMembers || 5}`
                  })()}
                </span>
              </div>
              {(applyTarget.city || applyTarget.state) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={16} color="var(--accent)" />
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                    {[applyTarget.city, applyTarget.state].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="var(--accent)" />
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                  {applyTarget.deadline ? new Date(applyTarget.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date(applyTarget.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text3)', letterSpacing: '1px', marginBottom: '12px', display: 'block' }}>SELECT ROLE</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '32px' }}>
              {(applyTarget.rolesNeeded?.split(',').map(r => r.trim()).filter(Boolean) || ['Member']).map((role, i) => {
                const isFilled = acceptedRoles.some(ar => ar.team_code === applyTarget.code && ar.role?.toLowerCase() === role.toLowerCase())
                const isSelected = applyRole === role
                return (
                  <button
                    key={i}
                    onClick={() => setApplyRole(role)}
                    disabled={isFilled}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: '100px',
                      border: 'none',
                      boxShadow: '20px 20px 20px rgba(0, 0, 0, 0.15)',
                      background: isFilled ? 'rgba(16, 185, 129, 0.1)' : isSelected ? 'rgba(255, 255, 255, 0.08)' : 'var(--surface)',
                      color: isFilled ? '#10b981' : isSelected ? '#fff' : 'var(--text2)',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: isFilled ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {isFilled ? <CheckCircle size={14} color="#10b981" /> : getRoleIcon(role)}
                    <span style={{ fontWeight: isSelected ? 600 : 500 }}>{role}</span>
                    {isSelected && <CheckCircle size={14} color="#10b981" />}
                  </button>
                )
              })}
            </div>

            <button className="btn-primary" onClick={submitApplication} disabled={!applyRole || submitting} style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px', padding: '14px', borderRadius: '24px', fontSize: '15px', opacity: submitting ? 0.6 : 1 }}>
              <Send size={16} /> {submitting ? 'Applying...' : 'Apply'}
            </button>
            </div>
          </div>
        </div>
      )}

      {viewTeamTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.15s ease' }} onClick={() => setViewTeamTarget(null)}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '24px', width: '100%', maxWidth: '480px', position: 'relative', boxShadow: '0 24px 48px rgba(0,0,0,0.5)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewTeamTarget(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text3)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', zIndex: 10 }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}>
              <X size={16} />
            </button>
            <div style={{ padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>{viewTeamTarget.name}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div style={{ flex: 1, background: 'var(--surface)', padding: '20px', borderRadius: '24px', boxShadow: '20px 20px 20px rgba(0, 0, 0, 0.15)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text3)', letterSpacing: '1px', marginBottom: '8px' }}>DESCRIPTION</div>
                <div style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: '1.6' }}>{viewTeamTarget.description || 'Not specified'}</div>
              </div>
              <div style={{ flex: 1, background: 'var(--surface)', padding: '20px', borderRadius: '24px', boxShadow: '20px 20px 20px rgba(0, 0, 0, 0.15)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text3)', letterSpacing: '1px', marginBottom: '8px' }}>PURPOSE</div>
                <div style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: '1.6' }}>{viewTeamTarget.purpose || 'Not specified'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text2)', background: 'var(--surface)', padding: '16px', borderRadius: '24px', boxShadow: '20px 20px 20px rgba(0, 0, 0, 0.15)', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} color="var(--accent)" />
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                  {(() => {
                    const filledCount = acceptedRoles.filter(ar => ar.team_code === viewTeamTarget.code).length
                    return `${filledCount + 1}/${viewTeamTarget.maxMembers || 5}`
                  })()}
                </span>
              </div>
              {(viewTeamTarget.city || viewTeamTarget.state) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={16} color="var(--accent)" />
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                    {[viewTeamTarget.city, viewTeamTarget.state].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="var(--accent)" />
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                  {viewTeamTarget.deadline ? new Date(viewTeamTarget.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date(viewTeamTarget.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text3)', letterSpacing: '1px', marginBottom: '12px' }}>REQUIRED ROLES</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '32px' }}>
              {(viewTeamTarget.rolesNeeded?.split(',').map(r => r.trim()).filter(Boolean) || ['Member']).map((role, i) => {
                const filledBy = acceptedRoles.find(ar => ar.team_code === viewTeamTarget.code && ar.role?.toLowerCase() === role.toLowerCase())
                const myPendingApp = myApps.find(a => a.teamCode === viewTeamTarget.code && a.status === 'pending' && a.appliedRole?.toLowerCase() === role.toLowerCase())

                let bg = 'var(--surface)'
                let border = '1px solid var(--border)'
                let textColor = 'var(--text2)'
                let statusIcon = null

                if (filledBy) {
                  bg = 'rgba(16, 185, 129, 0.1)'
                  border = '1px solid rgba(16, 185, 129, 0.2)'
                  textColor = '#10b981'
                  statusIcon = <CheckCircle size={14} color="#10b981" />
                } else if (myPendingApp) {
                  bg = 'rgba(255, 170, 0, 0.1)'
                  border = '1px solid rgba(255, 170, 0, 0.2)'
                  textColor = 'var(--yellow)'
                  statusIcon = <Clock size={14} color="var(--yellow)" />
                }

                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: bg, border: border, borderRadius: '100px' }}>
                    {statusIcon}
                    {getRoleIcon(role)}
                    <span style={{ fontSize: '13px', fontWeight: 500, color: textColor }}>{role}</span>
                  </div>
                )
              })}
            </div>

            {(() => {
              const members = acceptedRoles.filter(ar => ar.team_code === viewTeamTarget.code)
              const modalMembers = [
                { applicant_name: viewTeamTarget.leaderName || 'Creator', role: 'Creator', photo_url: viewTeamTarget.leaderPhoto || null },
                ...members
              ]
              return (
                <>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text3)', letterSpacing: '1px', marginBottom: '12px' }}>TEAM MEMBERS</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
                    {modalMembers.map((member, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--surface)', borderRadius: '24px', border: 'none', boxShadow: '20px 20px 20px rgba(0, 0, 0, 0.15)' }}>
                        <Avatar name={member.applicant_name} size={36} photoUrl={member.photo_url || undefined} />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{member.applicant_name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>{member.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )
            })()}



            {viewTeamTarget.createdBy === user?.email ? (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '100%', padding: '14px', background: 'rgba(16, 185, 129, 0.1)', border: 'none', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '20px 20px 20px rgba(0, 0, 0, 0.15)' }}>
                  <CheckCircle size={16} color="#10b981" />
                  <div style={{ fontSize: '15px', color: '#10b981', fontWeight: 600 }}>This is your team.</div>
                </div>
              </div>
            ) : myTeams.some(t => t.code === viewTeamTarget.code) ? (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '100%', padding: '14px', background: 'rgba(16, 185, 129, 0.1)', border: 'none', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '20px 20px 20px rgba(0, 0, 0, 0.15)' }}>
                  <CheckCircle size={16} color="#10b981" />
                  <div style={{ fontSize: '15px', color: '#10b981', fontWeight: 600 }}>You are already in the team</div>
                </div>
              </div>
            ) : myApps.some(a => a.teamCode === viewTeamTarget.code) ? (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '100%', padding: '14px', background: 'rgba(234, 179, 8, 0.1)', border: 'none', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '20px 20px 20px rgba(0, 0, 0, 0.15)' }}>
                  <Clock size={16} color="#eab308" />
                  <div style={{ fontSize: '15px', color: '#eab308', fontWeight: 600 }}>You have already applied</div>
                </div>
              </div>
            ) : null}

            </div>
          </div>
        </div>
      )}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.15s ease' }} onClick={() => setShowCreateModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg2)', borderRadius: '24px', border: '1px solid var(--border)', width: '100%', maxWidth: '450px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', position: 'relative' }}>
            <div style={{ maxHeight: 'calc(100vh - 80px)', overflowY: 'auto', padding: '24px' }}>
              <LeaderSetup onClose={() => { setShowCreateModal(false); loadData(); }} defaultUniversal={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Inline Chat Component ────────────────────────────────────────────────────
function ChatSection({ app, userEmail, chatOpen, onToggle, chatText, setChatText, onSend }) {
  const bottomRef = useRef(null)
  const hasMessages = app.chat && app.chat.length > 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [app.chat?.length, chatOpen])

  if (!hasMessages && !chatOpen) return null

  return (
    <div className={styles.chatSection}>
      {hasMessages && !chatOpen && (
        <button className={styles.chatBtn} onClick={onToggle} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MessageCircle size={14} /> {app.chat.length} message{app.chat.length !== 1 ? 's' : ''} — View Chat
        </button>
      )}

      {(chatOpen || hasMessages) && (
        <>
          {chatOpen && hasMessages && (
            <div className={styles.chatMessages}>
              {app.chat.map((msg, i) => (
                <div key={i} className={`${styles.chatMsg} ${msg.from === userEmail ? styles.chatMsgMine : styles.chatMsgOther}`}>
                  <div className={styles.chatSender}>{msg.fromName}</div>
                  {msg.text}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}

          {chatOpen && (
            <div className={styles.chatInput}>
              <input
                className="input"
                placeholder="Type a message..."
                value={chatText}
                onChange={e => setChatText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onSend()}
              />
              <button className="btn-primary" onClick={onSend} disabled={!chatText.trim()} style={{ padding: '8px 16px' }}>
                ↑
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
