import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, X } from 'lucide-react'
import Avatar from './Avatar'
import { useApp } from '../context/AppContext'
import styles from './FacepileChat.module.css'

export default function FacepileChat({ members }: { members: any[] }) {
  const { update, currentUser } = useApp()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const handleChatClick = (member: any) => {
    update({ dmTarget: member })
    setMenuOpen(false)
  }

  // Filter out the current user so they don't DM themselves
  const otherMembers = members.filter(m => m.id !== currentUser?.id)

  return (
    <div className={styles.container} ref={menuRef}>
      <div className={styles.facepile}>
        {members.map((m, i) => (
          <Avatar
            key={i}
            name={m.name}
            size={32}
            style={{
              marginLeft: i > 0 ? '-8px' : '0',
              zIndex: members.length - i
            }}
          />
        ))}
        <button 
          className={styles.chatButton} 
          onClick={() => setMenuOpen(!menuOpen)}
          title="Start personal chat"
        >
          <MessageSquare size={16} />
        </button>
      </div>

      {menuOpen && (
        <div className={styles.menu}>
          <div className={styles.menuHeader}>
            <span className={styles.menuTitle}>Direct Message</span>
            <button className={styles.closeBtn} onClick={() => setMenuOpen(false)}>
              <X size={14} />
            </button>
          </div>
          <div className={styles.memberList}>
            {otherMembers.length === 0 ? (
              <div className={styles.emptyState}>No other members in team.</div>
            ) : (
              otherMembers.map((m, i) => (
                <div key={i} className={styles.memberItem} onClick={() => handleChatClick(m)}>
                  <Avatar name={m.name} size={32} />
                  <span className={styles.memberName}>{m.name}</span>
                  <MessageSquare size={16} className={styles.itemIcon} />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
