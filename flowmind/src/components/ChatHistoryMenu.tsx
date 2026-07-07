import React, { useState, useRef, useEffect } from 'react'
import { History, X, Edit2, Trash2, Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { renameAiChatSession, deleteAiChatSession } from '../services/api'
import styles from './ChatHistoryMenu.module.css'

export default function ChatHistoryMenu() {
  const { aiChatSessions, activeAiSessionId, update } = useApp()
  const [menuOpen, setMenuOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<any>(null)
  const [deletingSession, setDeletingSession] = useState<any>(null)
  const [editName, setEditName] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setEditingSession(null)
        setDeletingSession(null)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const handleCreateNewChat = () => {
    update({ activeAiSessionId: null })
    setMenuOpen(false)
  }

  const handleRename = async () => {
    if (!editingSession || !editName.trim()) return
    await renameAiChatSession(editingSession.id, editName)
    update({
      aiChatSessions: aiChatSessions.map((s: any) => s.id === editingSession.id ? { ...s, name: editName } : s)
    })
    setEditingSession(null)
  }

  const handleDelete = (e: React.MouseEvent, session: any) => {
    e.stopPropagation()
    setDeletingSession(session)
  }

  const confirmDelete = async () => {
    if (!deletingSession) return
    const sessionId = deletingSession.id
    await deleteAiChatSession(sessionId)
    update({
      aiChatSessions: aiChatSessions.filter((s: any) => s.id !== sessionId),
      activeAiSessionId: activeAiSessionId === sessionId ? null : activeAiSessionId
    })
    setDeletingSession(null)
  }

  return (
    <div className={styles.container} ref={menuRef}>
      <button 
        className={styles.chatButton}
        onClick={handleCreateNewChat} 
        title="New Chat"
      >
        <Plus size={16} />
      </button>
      <button 
        className={styles.chatButton}
        onClick={() => setMenuOpen(!menuOpen)} 
        title="Chat History"
      >
        <History size={16} />
      </button>

      {menuOpen && (
        <div className={styles.menu}>
          {editingSession ? (
            <>
              <div className={styles.menuHeader}>
                <span className={styles.menuTitle}>Rename Chat</span>
                <button className={styles.closeBtn} onClick={() => setEditingSession(null)}>
                  <X size={14} />
                </button>
              </div>
              <div className={styles.menuContent} style={{ padding: '16px' }}>
                <input 
                  className={styles.modalInput}
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Enter new name..."
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleRename()}
                />
                <div className={styles.modalActions}>
                  <button className={styles.cancelBtn} onClick={() => setEditingSession(null)}>Cancel</button>
                  <button className={styles.saveBtn} onClick={handleRename}>Save</button>
                </div>
              </div>
            </>
          ) : deletingSession ? (
            <>
              <div className={styles.menuHeader}>
                <span className={styles.menuTitle}>Delete Chat</span>
                <button className={styles.closeBtn} onClick={() => setDeletingSession(null)}>
                  <X size={14} />
                </button>
              </div>
              <div className={styles.menuContent} style={{ padding: '16px' }}>
                <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '16px', lineHeight: '1.5' }}>
                  Are you sure you want to delete this chat? This action cannot be undone.
                </p>
                <div className={styles.modalActions}>
                  <button className={styles.cancelBtn} onClick={() => setDeletingSession(null)}>No, Cancel</button>
                  <button className={styles.saveBtn} onClick={confirmDelete} style={{ background: 'var(--red)', color: '#fff' }}>Yes, Delete</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={styles.menuHeader}>
                <span className={styles.menuTitle}>Chat History</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button className={styles.newChatHeaderBtn} onClick={handleCreateNewChat}>
                    <Plus size={14} /> New Chat
                  </button>
                  <button className={styles.closeBtn} onClick={() => setMenuOpen(false)}>
                    <X size={14} />
                  </button>
                </div>
              </div>
              
              <div className={styles.menuContent}>

                <div className={styles.sessionList}>
                  {aiChatSessions?.length === 0 && (
                    <div className={styles.emptyState}>No chat history yet.</div>
                  )}
                  {aiChatSessions?.map((session: any) => (
                    <div 
                      key={session.id} 
                      className={`${styles.sessionItem} ${session.id === activeAiSessionId ? styles.active : ''}`}
                      onClick={() => { update({ activeAiSessionId: session.id }); setMenuOpen(false); }}
                    >
                      <div className={styles.sessionName}>{session.name}</div>
                      <div className={styles.sessionActions}>
                        <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); setEditingSession(session); setEditName(session.name); }}>
                          <Edit2 size={12} />
                        </button>
                        <button className={styles.actionBtn} onClick={(e) => handleDelete(e, session)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
