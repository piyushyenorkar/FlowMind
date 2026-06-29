import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import DirectChat from './DirectChat'
import MemberProfile from './MemberProfile'
import styles from './TeamMembers.module.css'
import { Users, User, Crown, Edit, Eye, MessageSquare, X, CheckCircle2, Clock, AlertCircle, Check } from 'lucide-react'
import Avatar from './Avatar'

const PREDEFINED_SKILLS = [
  // Web & Core Tech
  { name: 'HTML', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg' },
  { name: 'CSS', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg' },
  { name: 'JavaScript', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg' },
  { name: 'TypeScript', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg' },
  { name: 'React', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg' },
  { name: 'Next.js', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg' },
  { name: 'Node.js', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg' },
  { name: 'Python', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg' },
  { name: 'Java', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg' },
  { name: 'C++', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg' },
  { name: 'Go', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original.svg' },
  { name: 'Rust', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/rust/rust-plain.svg' },
  { name: 'PHP', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/php/php-original.svg' },
  
  // Database & DevOps
  { name: 'MongoDB', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg' },
  { name: 'PostgreSQL', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg' },
  { name: 'MySQL', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mysql/mysql-original.svg' },
  { name: 'Firebase', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/firebase/firebase-plain.svg' },
  { name: 'Docker', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg' },
  { name: 'AWS', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-original-wordmark.svg' },
  { name: 'Git', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg' },
  
  // Design & Others
  { name: 'Figma', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg' },
  { name: 'Tailwind CSS', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg' },
  
  // Non-tech / Soft skills
  { name: 'Content Creation', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/youtube/youtube-original.svg' },
  { name: 'Public Speaking', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/chrome/chrome-original.svg' },
  { name: 'Video Editing', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/premierepro/premierepro-original.svg' },
  { name: 'Copywriting', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/notion/notion-original.svg' },
  { name: 'Project Management', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/jira/jira-original.svg' },
  { name: 'SEO', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/google/google-original.svg' }
]

const TASK_TYPES = [
  { name: 'Frontend', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg' },
  { name: 'Backend', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg' },
  { name: 'Design', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg' },
  { name: 'Research', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/google/google-original.svg' },
  { name: 'Testing', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/jest/jest-plain.svg' },
  { name: 'Documentation', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/notion/notion-original.svg' }
]

// Read persisted members from localStorage as fallback
function getPersistedMembers(teamCode) {
  try {
    const all = JSON.parse(localStorage.getItem('flowmind_team_members') || '{}')
    return all[teamCode] || []
  } catch { return [] }
}

// Read-only profile viewer
function ViewProfile({ member, memberProfiles, onClose, onChat }) {
  const profile = memberProfiles?.[member.name] || {}
  const hasProfile = profile.title || profile.skills?.length || profile.pastWork

  return (
    <div className={styles.profileOverlay} onClick={onClose}>
      <div className={styles.profilePanel} onClick={e => e.stopPropagation()}>
        <div className={styles.profileHeader}>
          <div className={styles.profileTitle}>
            {member.name}'s Profile
          </div>
          <button className={styles.profileClose} onClick={onClose}><X size={16} /></button>
        </div>
        <div className={styles.profileBody}>
          {/* Avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <Avatar name={member.name} size={52} style={{ borderRadius: '14px' }} />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>
                {member.name}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
                {member.isLeader ? <><Crown size={14} style={{ display: 'inline', marginRight: '4px' }}/> Team Leader</> : <><User size={14} style={{ display: 'inline', marginRight: '4px' }}/> Member</>}
                {profile.title && ` · ${profile.title}`}
              </div>
            </div>
          </div>

          {!hasProfile ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text3)' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px', color: 'var(--accent)' }}><User size={32} /></div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{member.name} hasn't set up their profile yet</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>They can add skills, experience, and availability from Team Members</div>
            </div>
          ) : (
            <>
              {/* Skills */}
              {profile.skills?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Skills</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {profile.skills.map((s, i) => {
                      const predefined = PREDEFINED_SKILLS.find(ps => ps.name.toLowerCase() === s.toLowerCase())
                      return (
                        <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--surface2)', border: '1px solid transparent', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', color: 'var(--text)', padding: '8px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: 500 }}>
                          {predefined && <img src={predefined.logo} alt="" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />}
                          {s}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Past work */}
              {profile.pastWork && (
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Experience</label>
                  <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.5', marginTop: '6px', background: 'var(--surface2)', padding: '10px 14px', borderRadius: '16px', border: '1px solid transparent', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                    {profile.pastWork}
                  </div>
                </div>
              )}

              {/* Availability */}
              {profile.availability && (
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Availability</label>
                  <div style={{ marginTop: '6px', display: 'flex' }}>
                    {(() => {
                      let c = 'var(--text2)', Icon = null;
                      if (profile.availability === 'Full-time') { c = 'var(--green)'; Icon = CheckCircle2 }
                      else if (profile.availability === 'Part-time') { c = 'var(--yellow)'; Icon = Clock }
                      else if (profile.availability === 'Busy') { c = 'var(--red)'; Icon = AlertCircle }
                      return (
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 14px', background: 'var(--surface2)', borderRadius: '16px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', width: '100%'
                        }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{profile.availability}</span>
                          {Icon && <Icon size={16} color={c} />}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )}

              {/* Preferred types */}
              {profile.preferredTypes?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Preferred Task Types</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
                    {profile.preferredTypes.map((t, i) => {
                      const tt = TASK_TYPES.find(type => type.name === t)
                      return (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                          borderRadius: '16px', background: 'var(--surface2)', color: 'var(--text)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                        }}>
                          <CheckCircle2 size={16} color="var(--green)" style={{ flexShrink: 0 }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {tt && <img src={tt.logo} alt="" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />}
                            <span style={{ fontSize: '13px', fontWeight: 500 }}>{t}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Chat button */}
          <div className={styles.profileFooter} style={{ paddingTop: '16px' }}>
            <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', borderRadius: '16px', border: '1px solid transparent', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', padding: '12px' }} onClick={() => { onClose(); onChat(member) }}>
              <MessageSquare size={16} style={{ marginRight: '6px' }}/> Message {member.name}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TeamMembers() {
  const { members, team, role, currentUser, memberProfiles, dmTarget, update } = useApp()
  const setDmTarget = (target: any) => update({ dmTarget: target })
  const [showProfile, setShowProfile] = useState(false)
  const [viewTarget, setViewTarget] = useState(null)

  const teamCode = team?.code
  const effectiveMembers = (members && members.length > 0) ? members : getPersistedMembers(teamCode)

  const myName = currentUser?.name?.toLowerCase()

  const sortedMembers = [...effectiveMembers].sort((a, b) => {
    const isMeA = a.name?.toLowerCase() === myName
    const isMeB = b.name?.toLowerCase() === myName
    if (isMeA) return -1
    if (isMeB) return 1
    if (a.isLeader && !b.isLeader) return -1
    if (!a.isLeader && b.isLeader) return 1
    return 0
  })

  const handleMemberClick = (member) => {
    if (member.name?.toLowerCase() === myName) {
      setShowProfile(true)
    } else {
      setViewTarget(member)
    }
  }

  return (
    <div className={styles.wrap}>
      <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={20}/> Team Members</div>
      <div className={styles.count}>
        {effectiveMembers.length} member{effectiveMembers.length !== 1 ? 's' : ''}
        <span style={{ color: 'var(--text3)', fontSize: '12px', marginLeft: '8px' }}>
          Click to view profile or chat
        </span>
      </div>

      <div className={styles.list}>
        {sortedMembers.map((m, i) => {
          const isMe = myName && m.name?.toLowerCase() === myName
          const isLeader = m.isLeader
          return (
            <div key={m.id || m.name || i} className={`${styles.member} ${isLeader ? styles.leaderCard : ''}`} onClick={() => handleMemberClick(m)} style={{ cursor: 'pointer' }}>
              <div className={styles.avatar}>
                <Avatar name={m.name} size={40} />
              </div>
              <div className={styles.info}>
                <div className={styles.name}>{m.name} {isMe && '(You)'}</div>
                <div className={styles.role}>
                  {isLeader ? (
                    <><span className={styles.crown}><Crown size={14}/></span> Team Leader</>
                  ) : (
                    <><User size={14} style={{ display: 'inline', marginRight: '4px' }}/> Member</>
                  )}
                </div>
              </div>
              <div className={styles.actions} style={{ display: 'flex', gap: '8px' }}>
                {isMe ? (
                  <>
                    <span className={styles.editBadge}><Edit size={12} style={{ display: 'inline', marginRight: '4px' }}/> Edit Profile</span>
                    <span className={`${styles.viewBadge} ${styles.chatBadge}`} onClick={(e) => { e.stopPropagation(); setDmTarget(m); }}><MessageSquare size={12} style={{ display: 'inline', marginRight: '4px' }}/> Self Chat</span>
                  </>
                ) : (
                  <>
                    <span className={styles.viewBadge}><Eye size={12} style={{ display: 'inline', marginRight: '4px' }}/> View Profile</span>
                    <span className={`${styles.viewBadge} ${styles.chatBadge}`} onClick={(e) => { e.stopPropagation(); setDmTarget(m); }}><MessageSquare size={12} style={{ display: 'inline', marginRight: '4px' }}/> Chat</span>
                  </>
                )}
              </div>
            </div>
          )
        })}

        {sortedMembers.length === 0 && (
          <div className={styles.empty}>No members have joined yet. Share the team code!</div>
        )}
      </div>

      {showProfile && (
        <div className={styles.profileOverlay} onClick={() => setShowProfile(false)}>
          <div className={styles.profilePanel} onClick={e => e.stopPropagation()}>
            <div className={styles.profileHeader}>
              <div className={styles.profileTitle}>{currentUser?.name}</div>
              <button className={styles.profileClose} onClick={() => setShowProfile(false)}><X size={16} /></button>
            </div>
            <div className={styles.profileBody}><MemberProfile /></div>
          </div>
        </div>
      )}

      {viewTarget && (
        <ViewProfile
          member={viewTarget}
          memberProfiles={memberProfiles}
          onClose={() => setViewTarget(null)}
          onChat={(m) => { setViewTarget(null); setDmTarget(m) }}
        />
      )}
    </div>
  )
}
