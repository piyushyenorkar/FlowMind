import React, { useState, useRef, useEffect } from 'react'
import { Bot, Brain, ChevronUp, ChevronDown, History, X, Edit2, Trash2, Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { sendChatMessage, createAiChatSession, saveAiChatMessage, renameAiChatSession, deleteAiChatSession } from '../services/api'
import { supabase } from '../services/supabase'
import styles from './ChatTab.module.css'
import flowmindLogo from '../assets/flowmind.png'

const SUGGESTIONS = [
  'Who should I assign the next task to?',
  'Summarise what the team has done',
  'Are there any delay risks?',
  'What decisions were made about the project?',
]

export default function ChatTab({ 
  showSessionsModal = false, 
  setShowSessionsModal = () => {} 
}: { 
  showSessionsModal?: boolean, 
  setShowSessionsModal?: (val: boolean) => void 
}) {
  const { tasks, decisions, members, memoryFeed, currentUser, team, aiChatSessions, activeAiSessionId, update } = useApp()
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Modals state
  const [editingSession, setEditingSession] = useState<any>(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Fetch messages when active session changes
  useEffect(() => {
    let active = true;
    const fetchMessages = async () => {
      if (!activeAiSessionId) {
        if (active) setMessages([{ role: 'assistant', text: `Hey ${currentUser?.name || 'there'}! I'm your AI project assistant. I have access to your team's full FlowMind Memory — all tasks, decisions, and activity. Ask me anything about your project.` }])
        return
      }
      
      const { data } = await supabase.from('ai_chats').select('*').eq('session_id', activeAiSessionId).order('timestamp', { ascending: true })
      if (active) {
        if (data && data.length > 0) {
          setMessages(data)
        } else {
          setMessages([{ role: 'assistant', text: `Hey ${currentUser?.name || 'there'}! I'm your AI project assistant. I have access to your team's full FlowMind Memory — all tasks, decisions, and activity. Ask me anything about your project.` }])
        }
      }
    }
    fetchMessages()

    if (!activeAiSessionId) return;

    const channel = supabase.channel(`ai-chats-${activeAiSessionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ai_chats', filter: `session_id=eq.${activeAiSessionId}` }, payload => {
        setMessages(prev => {
          // avoid duplicates if we optimistically updated
          if (prev.some(m => m.id === payload.new.id || (m.role === payload.new.role && m.text === payload.new.text && !m.id))) {
            return prev.map(m => (!m.id && m.text === payload.new.text ? payload.new : m))
          }
          return [...prev, payload.new]
        })
      }).subscribe()

    return () => { 
      active = false;
      supabase.removeChannel(channel)
    }
  }, [activeAiSessionId, currentUser?.name])

  const send = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    
    // Optimistic UI
    const tempUserMsg = { role: 'user', text: msg }
    setMessages(prev => [...prev, tempUserMsg])
    setLoading(true)
    
    try {
      let currentSessionId = activeAiSessionId
      if (!currentSessionId) {
        const newSession = await createAiChatSession(team?.code, msg.substring(0, 30) + '...')
        currentSessionId = newSession.id
        update({ activeAiSessionId: currentSessionId, aiChatSessions: [newSession, ...(aiChatSessions || [])] })
      }

      await saveAiChatMessage(currentSessionId, 'user', msg)
      
      const context = { tasks, decisions, members, memoryFeed }
      const reply = await sendChatMessage(team?.code, msg, context, messages)
      
      await saveAiChatMessage(currentSessionId, 'assistant', reply)
      
      setMessages(prev => {
        if (prev[prev.length - 1]?.text === reply) return prev
        return [...prev, { role: 'assistant', text: reply }]
      })
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, something went wrong. Please try again.' }])
    }
    setLoading(false)
  }

  const handleCreateNewChat = () => {
    update({ activeAiSessionId: null })
    setShowSessionsModal(false)
  }

  const handleRename = async () => {
    if (!editingSession || !editName.trim()) return
    await renameAiChatSession(editingSession.id, editName)
    update({
      aiChatSessions: aiChatSessions.map((s: any) => s.id === editingSession.id ? { ...s, name: editName } : s)
    })
    setEditingSession(null)
  }

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this chat?')) return
    await deleteAiChatSession(sessionId)
    update({
      aiChatSessions: aiChatSessions.filter((s: any) => s.id !== sessionId),
      activeAiSessionId: activeAiSessionId === sessionId ? null : activeAiSessionId
    })
  }

  const parseInline = (text: string) => {
    const regex = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
    const parts = text.split(regex);
    return parts.map((part, i) => {
      if (!part) return null;
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--text)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        return (
          <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className={styles.msgLink}>
            {linkMatch[1]}
          </a>
        );
      }
      return part;
    });
  };

  const renderMessageContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, j) => {
      line = line.trim();
      if (!line) return <div key={j} style={{ height: '8px' }} />;

      if (line.startsWith('### ')) {
        return <div key={j} className={styles.msgHeading}>{parseInline(line.slice(4))}</div>;
      }
      if (line.startsWith('## ')) {
        return <div key={j} className={styles.msgHeading}>{parseInline(line.slice(3))}</div>;
      }

      const stepMatch = line.match(/^(\d+\.)\s+(.*)/);
      if (stepMatch) {
        return (
          <div key={j} className={styles.msgStepBox}>
            <div className={styles.stepNumber}>{stepMatch[1]}</div>
            <div className={styles.stepText}>{parseInline(stepMatch[2])}</div>
          </div>
        );
      }

      const isImportant = line.startsWith('> ') || line.match(/^(?:\*\*?(?:Note|Important)\*\*?|Note|Important):/i);
      if (isImportant) {
        const content = line.startsWith('> ') ? line.slice(2) : line;
        return (
          <div key={j} className={styles.msgImportantBox}>
            {parseInline(content)}
          </div>
        );
      }

      const bulletMatch = line.match(/^[-*]\s+(.*)/);
      if (bulletMatch) {
        return (
          <div key={j} className={styles.msgBullet}>
            <span className={styles.bulletDot}>•</span>
            <span className={styles.bulletText}>{parseInline(bulletMatch[1])}</span>
          </div>
        );
      }

      return (
        <p key={j} className={styles.msgLine}>
          {parseInline(line)}
        </p>
      );
    });
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={flowmindLogo} alt="FlowMind" style={{ height: '28px', objectFit: 'contain' }} />
          <div style={{ fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center' }}>
            <span style={{ color: 'var(--accent)', background: 'var(--accent-glow)', padding: '2px 6px', borderRadius: '6px', fontSize: '13px', fontWeight: '800' }}>AI</span>
          </div>
        </div>
      </div>

      <div className={styles.messages}>
        {messages.map((m, i) => (
          <div key={i} className={`${styles.msg} ${m.role === 'user' ? styles.user : styles.assistant}`}>
            {m.role === 'assistant' && <div className={styles.msgAvatar}><Bot size={16} /></div>}
            <div className={styles.msgBubble}>
              {renderMessageContent(m.text)}
            </div>
          </div>
        ))}
        {loading && (
          <div className={`${styles.msg} ${styles.assistant}`}>
            <div className={styles.msgAvatar}><Bot size={16} /></div>
            <div className={styles.msgBubble}>
              <div className={styles.typing}>
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className={styles.footer}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <button 
            className={styles.suggestionsToggle}
            onClick={() => setShowSuggestions(!showSuggestions)}
          >
            <span>Suggested Questions</span>
            {showSuggestions ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>

        {showSuggestions && (
          <div className={styles.suggestions}>
            {SUGGESTIONS.map((s, i) => (
              <button key={i} className={styles.suggestion} onClick={() => { send(s); setShowSuggestions(false); }}>
                {s}
              </button>
            ))}
          </div>
        )}

        <div className={styles.inputWrapper}>
          <input
            className={styles.chatInputInner}
            placeholder="Ask anything about your team, tasks, or decisions"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            disabled={loading}
          />
          <button className={styles.sendButton} onClick={() => send()} disabled={loading || !input.trim()}>
            {loading ? (
              <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
            ) : input.trim() ? (
              <ChevronUp size={20} strokeWidth={2.5} />
            ) : (
              <ChevronDown size={20} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>

      {showSessionsModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSessionsModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span>Chat History</span>
              <button className={styles.modalClose} onClick={() => setShowSessionsModal(false)}><X size={20} /></button>
            </div>
            
            <button className={styles.newChatBtn} onClick={handleCreateNewChat}>
              <Plus size={18} /> New Chat
            </button>

            <div className={styles.sessionList}>
              {aiChatSessions?.length === 0 && (
                <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '20px 0', fontSize: '14px' }}>No chat history yet.</div>
              )}
              {aiChatSessions?.map((session: any) => (
                <div 
                  key={session.id} 
                  className={`${styles.sessionItem} ${activeAiSessionId === session.id ? styles.active : ''}`}
                  onClick={() => { update({ activeAiSessionId: session.id }); setShowSessionsModal(false); }}
                >
                  <div className={styles.sessionName}>{session.name}</div>
                  <div className={styles.sessionActions}>
                    <button className={styles.editBtn} onClick={(e) => { e.stopPropagation(); setEditingSession(session); setEditName(session.name); }}>
                      <Edit2 size={14} />
                    </button>
                    <button className={styles.deleteBtn} onClick={(e) => handleDelete(e, session.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {editingSession && (
        <div className={styles.modalOverlay} onClick={() => setEditingSession(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span>Rename Chat</span>
              <button className={styles.modalClose} onClick={() => setEditingSession(null)}><X size={20} /></button>
            </div>
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
        </div>
      )}
    </div>
  )
}

