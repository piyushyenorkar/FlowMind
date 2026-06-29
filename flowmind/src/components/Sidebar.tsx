import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import TeamSwitcher from './TeamSwitcher'
import styles from './Sidebar.module.css'
import { 
  LayoutDashboard, 
  CheckSquare, 
  Mic, 
  Scale, 
  Sparkles, 
  MessageSquare, 
  Users, 
  MessagesSquare, 
  Github, 
  Globe, 
  LogOut,
  ChevronRight,
  Crown,
  User,
  Edit2,
  X,
  Save
} from 'lucide-react'

const LEADER_ITEMS = [
  { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
  { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
  { id: 'meetings', icon: Mic, label: 'Meetings' },
  { id: 'decisions', icon: Scale, label: 'Decisions' },
  { id: 'chat', icon: MessageSquare, label: 'AI Assistant' },
  { id: 'members', icon: Users, label: 'Team Members' },
  { id: 'groupchat', icon: MessagesSquare, label: 'Group Chat' },
]

const MEMBER_ITEMS = [
  { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
  { id: 'mytasks', icon: CheckSquare, label: 'My Tasks' },
  { id: 'meetings', icon: Mic, label: 'Meetings' },
  { id: 'decisions', icon: Scale, label: 'Decisions' },
  { id: 'chat', icon: MessageSquare, label: 'AI Assistant' },
  { id: 'members', icon: Users, label: 'Team Members' },
  { id: 'groupchat', icon: MessagesSquare, label: 'Group Chat' },
]

export default function Sidebar({ activeTab, setActiveTab }) {
  const { team, currentUser, role, navigate, updateTeamLinks } = useApp()
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [showLinksModal, setShowLinksModal] = useState(false)
  const [editingLinks, setEditingLinks] = useState(false)
  const [linksForm, setLinksForm] = useState({ github: '', deploy: '' })

  const handleEditLinks = () => {
    setLinksForm({ github: team?.githubLink || '', deploy: team?.deployLink || '' })
    setEditingLinks(true)
  }

  const handleSaveLinks = () => {
    updateTeamLinks({ githubLink: linksForm.github, deployLink: linksForm.deploy })
    setEditingLinks(false)
  }

  const items = role === 'leader' ? LEADER_ITEMS : MEMBER_ITEMS

  return (
    <>
      <aside className={styles.sidebar}>
        {/* Clickable logo → team switcher */}
        <div className={styles.logo} onClick={() => setShowSwitcher(true)} style={{ cursor: 'pointer' }} title="Switch team">
          <img src={new URL('../assets/flowmind.png', import.meta.url).href} alt="FlowMind" style={{ height: '35px', width: 'auto' }} />
          <span className={styles.logoMark}>FM</span>
        </div>

        <div className={styles.project}>
          <div className={styles.projectName}>{team?.projectName || 'Project'}</div>
          <div className={styles.projectCode}>
            {role === 'leader' ? `Code: ${team?.code}` : `Team: ${team?.code}`}
          </div>
        </div>

        <nav className={styles.nav}>
          <div className={styles.iconBgLine} />
          {items.map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={`${styles.navItem} ${activeTab === item.id ? styles.active : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <div className={styles.iconWrapper}>
                  <Icon size={18} className={styles.navIcon} strokeWidth={2} />
                </div>
                <div className={styles.nameBox}>
                  <span className={styles.navLabel}>{item.label}</span>
                  {activeTab === item.id && <span className={styles.activePill} />}
                </div>
              </button>
            )
          })}
          <button 
            className={styles.navItem} 
            style={{ marginTop: 'auto' }} 
            onClick={() => setShowLinksModal(true)}
          >
            <div className={styles.iconWrapper}>
              <Globe size={18} className={styles.navIcon} strokeWidth={2} />
            </div>
            <div className={styles.nameBox} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <span className={styles.navLabel} style={{ fontWeight: 600 }}>Project Links</span>
              </div>
              <Edit2 size={14} style={{ color: 'var(--text3)', opacity: 0.7 }} />
            </div>
          </button>
        </nav>

      </aside>

      {showLinksModal && (
        <div className={styles.modalOverlay} onClick={() => { setShowLinksModal(false); setEditingLinks(false); }}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>Project Links</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {role === 'leader' && (
                  editingLinks ? (
                    <button className="btn-ghost" style={{ padding: '6px' }} onClick={handleSaveLinks} title="Save Changes">
                      <Save size={18} />
                    </button>
                  ) : (
                    <button className="btn-ghost" style={{ padding: '6px' }} onClick={handleEditLinks} title="Edit Links">
                      <Edit2 size={18} />
                    </button>
                  )
                )}
                <button className="btn-ghost" style={{ padding: '6px' }} onClick={() => { setShowLinksModal(false); setEditingLinks(false); }}>
                  <X size={18} />
                </button>
              </div>
            </div>
            
            {editingLinks ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '4px', display: 'block' }}>GitHub URL</label>
                  <input
                    className="input"
                    placeholder="Input Github URL"
                    value={linksForm.github}
                    onChange={e => setLinksForm(prev => ({ ...prev, github: e.target.value }))}
                    style={{ borderRadius: '16px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '4px', display: 'block' }}>Deployment URL</label>
                  <input
                    className="input"
                    placeholder="Input Deployment URL"
                    value={linksForm.deploy}
                    onChange={e => setLinksForm(prev => ({ ...prev, deploy: e.target.value }))}
                    style={{ borderRadius: '16px' }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className={styles.linkRow} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                  <Github size={18} className={styles.linkIcon} />
                  {team?.githubLink ? (
                    <a href={team.githubLink} target="_blank" rel="noreferrer" className={styles.linkAnchor}>
                      View GitHub Repository
                    </a>
                  ) : (
                    <span className={styles.linkEmpty}>No GitHub link added</span>
                  )}
                </div>
                <div className={styles.linkRow} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                  <Globe size={18} className={styles.linkIcon} />
                  {team?.deployLink ? (
                    <a href={team.deployLink} target="_blank" rel="noreferrer" className={styles.linkAnchor}>
                      View Live Deployment
                    </a>
                  ) : (
                    <span className={styles.linkEmpty}>No deployment link added</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showSwitcher && <TeamSwitcher onClose={() => setShowSwitcher(false)} />}
    </>
  )
}
