import React, { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { supabase } from '../services/supabase'
import TeamSwitcher from './TeamSwitcher'
import styles from './Sidebar.module.css'
import { 
  LayoutDashboard, 
  CheckSquare, 
  Mic, 
  Scale, 
  Sparkles, 
  MessageSquare, 
  Bot,
  Users, 
  MessagesSquare, 
  FolderGit2, 
  LogOut,
  ChevronRight,
  Crown,
  User,
  Plus
} from 'lucide-react'

const LEADER_ITEMS = [
  { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
  { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
  { id: 'meetings', icon: Mic, label: 'Meetings' },
  { id: 'decisions', icon: Scale, label: 'Decisions' },
  { id: 'chat', icon: Bot, label: 'AI Assistant' },
  { id: 'members', icon: Users, label: 'Team Members' },
  { id: 'groupchat', icon: MessagesSquare, label: 'Group Chat' },
  { id: 'project', icon: FolderGit2, label: 'Project' },
]

const MEMBER_ITEMS = [
  { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
  { id: 'mytasks', icon: CheckSquare, label: 'My Tasks' },
  { id: 'meetings', icon: Mic, label: 'Meetings' },
  { id: 'decisions', icon: Scale, label: 'Decisions' },
  { id: 'chat', icon: Bot, label: 'AI Assistant' },
  { id: 'members', icon: Users, label: 'Team Members' },
  { id: 'groupchat', icon: MessagesSquare, label: 'Group Chat' },
  { id: 'project', icon: FolderGit2, label: 'Project' },
]

export default function Sidebar({ activeTab, setActiveTab }) {
  const { team, currentUser, role, navigate, updateTeamLogo } = useApp()
  const [showSwitcher, setShowSwitcher] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !team) return

    try {
      setUploadingLogo(true)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        updateTeamLogo(base64String)
        setUploadingLogo(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
      reader.onerror = () => {
        alert('Failed to read file')
        setUploadingLogo(false)
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      console.error('Error uploading logo:', err.message)
      alert('Failed to upload logo: ' + err.message)
      setUploadingLogo(false)
    }
  }

  const items = role === 'leader' ? LEADER_ITEMS : MEMBER_ITEMS

  return (
    <>
      <aside className={styles.sidebar}>
        {/* Clickable logo → team switcher */}
        <div className={styles.logo} onClick={() => setShowSwitcher(true)} style={{ cursor: 'pointer' }} title="Switch team">
          <img src={new URL('../assets/flowmind.png', import.meta.url).href} alt="FlowMind" style={{ height: '35px', width: 'auto' }} />

        </div>

        <div className={styles.project}>
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleLogoUpload}
          />
          <div className={styles.projectInfo}>
            <div className={styles.projectName}>{team?.projectName || 'Project'}</div>
            <div className={styles.projectCode}>
              {role === 'leader' ? `Code: ${team?.code}` : `Team: ${team?.code}`}
            </div>
          </div>
          <div 
            className={styles.projectLogoBox} 
            title={team?.logoUrl ? "Click to change logo" : "Click to add logo"}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadingLogo ? (
              <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid var(--text3)', borderTopColor: 'transparent', borderRadius: '50%' }} />
            ) : team?.logoUrl ? (
              <img src={team.logoUrl} alt="Logo" />
            ) : (
              <Plus size={16} strokeWidth={2.7} style={{ opacity: 0.8 }} />
            )}
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
                  <Icon size={item.id === 'chat' ? 20 : 18} className={styles.navIcon} strokeWidth={2} />
                </div>
                <div className={styles.nameBox}>
                  <span className={styles.navLabel}>{item.label}</span>
                  {activeTab === item.id && <span className={styles.activePill} />}
                </div>
              </button>
            )
          })}
        </nav>

      </aside>

      {showSwitcher && <TeamSwitcher onClose={() => setShowSwitcher(false)} />}
    </>
  )
}
