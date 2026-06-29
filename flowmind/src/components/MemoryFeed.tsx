import React from 'react'
import { useApp } from '../context/AppContext'
import Avatar from './Avatar'
import { LogOut, Crown, User, Rocket, UserPlus, Pin, CheckCircle, Zap, ClipboardList, FileText, Scale, Mic, Link } from 'lucide-react'
import styles from './MemoryFeed.module.css'

function formatFeedDate(ts) {
  const date = new Date(ts);
  const now = new Date();
  
  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `Today, ${timeStr}`;
  if (isYesterday) return `Yesterday, ${timeStr}`;
  
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}, ${timeStr}`;
}


function getIcon(name) {
  switch (name) {
    case 'Rocket': return <Rocket size={16} />
    case 'UserPlus': return <UserPlus size={16} />
    case 'Pin': return <Pin size={16} />
    case 'CheckCircle': return <CheckCircle size={16} />
    case 'Zap': return <Zap size={16} />
    case 'ClipboardList': return <ClipboardList size={16} />
    case 'FileText': return <FileText size={16} />
    case 'Scale': return <Scale size={16} />
    case 'Mic': return <Mic size={16} />
    case 'User': return <User size={16} />
    case 'LinkIcon': return <Link size={16} />
    default: return <Zap size={16} />
  }
}

export default function MemoryFeed() {
  const { memoryFeed, currentUser, role, navigate, memberProfiles } = useApp()

  return (
    <div className={styles.feed}>
      <div className={styles.header}>
        <span className={styles.dot} />
        <span className={styles.title}>Team Activity</span>
        <span className={styles.count}>{memoryFeed.length}</span>
      </div>
      <div className={styles.list}>
        {memoryFeed.length === 0 && (
          <div className={styles.empty}>Memory events will appear here as your team works</div>
        )}
        {memoryFeed.map((entry, i) => (
          <div key={entry.id} className={styles.entry} style={{ animationDelay: `${i * 0.04}s` }}>
            <span className={styles.icon}>{typeof entry.icon === 'string' ? getIcon(entry.icon) : entry.icon}</span>
            <div className={styles.content}>
              <div className={styles.text}>{entry.text}</div>
              <div className={styles.time}>{formatFeedDate(entry.timestamp)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.bottom}>
        <div className={styles.user}>
          <Avatar name={currentUser?.name} size={36} />
          <div className={styles.userInfo}>
            <div className={styles.userName}>{currentUser?.name}</div>
            <div className={styles.userRole}>
              {role === 'leader' ? <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Crown size={12} /> Leader</div> : <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} /> Member</div>}
            </div>
          </div>
        </div>
        <button className={styles.exitBtn} onClick={() => navigate('user-dashboard')} title="Back to Home">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  )
}
