import React, { useState, useEffect, useRef } from 'react'
import { Crown, MessageSquare, ChevronUp, ChevronDown, X, Reply } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { retainMemory } from '../services/api'
import { supabase } from '../services/supabase'
import styles from './TeamChat.module.css'

function getChatKey(teamCode: string, name1: string, name2: string) {
  const sorted = [name1, name2].sort()
  return `${teamCode}_${sorted[0]}_${sorted[1]}`
}

function getMemberColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash * 137) % 360;
  return `hsl(${hue}, 80%, 70%)`;
}

const cachedDirectMessages: Record<string, any[]> = {}

export default function DirectChat({ targetMember, onClose }: any) {
  const { team, currentUser, memberProfiles } = useApp()
  const chatKey = getChatKey(team?.code || '', currentUser?.name || '', targetMember?.name || '')
  
  const [messages, setMessages] = useState<any[]>(() => cachedDirectMessages[chatKey] || [])
  const [isLoading, setIsLoading] = useState(() => !cachedDirectMessages[chatKey])
  const [text, setText] = useState('')
  const [replyingTo, setReplyingTo] = useState<any | null>(null)
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null)
  const bottomRef = useRef<any>(null)

  const handleScrollToMsg = (id: string) => {
    const el = document.getElementById(`msg-${id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightedMsgId(id)
      setTimeout(() => setHighlightedMsgId(null), 1500)
    }
  }

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      if (!chatKey) return
      if (!cachedDirectMessages[chatKey]) {
        setIsLoading(true)
      }
      const { data, error } = await supabase.from('direct_chats').select('*').eq('chat_key', chatKey).order('timestamp', { ascending: true })
      if (!error && data) {
        setMessages(data)
        cachedDirectMessages[chatKey] = data
      }
      setIsLoading(false)
    }
    loadMessages()
  }, [chatKey])

  // Poll for new messages every 2s (simulates real-time)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!chatKey) return
      const { data, error } = await supabase.from('direct_chats').select('*').eq('chat_key', chatKey).order('timestamp', { ascending: true })
      if (!error && data) {
        setMessages(data)
        cachedDirectMessages[chatKey] = data
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [chatKey])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = async () => {
    if (!text.trim()) return
    const msg = {
      chat_key: chatKey,
      from_name: currentUser?.name || 'You',
      text: text.trim(),
      reply_to_id: replyingTo?.id || null,
      timestamp: new Date().toISOString(),
    }
    
    setText('')
    setReplyingTo(null)
    
    // Save to Supabase
    await supabase.from('direct_chats').insert([msg])
    
    setMessages(prev => {
      const newMsgs = [...prev, msg]
      cachedDirectMessages[chatKey] = newMsgs
      return newMsgs
    })

    // Store in FlowMind Memory
    retainMemory(
      team?.code,
      `Direct message from ${currentUser?.name} to ${targetMember?.name}: "${msg.text}"`,
      {
        type: 'dm_message',
        from: currentUser?.name,
        to: targetMember?.name,
        chatType: 'direct',
      }
    )
  }

  const myName = currentUser?.name || ''
  const isSelf = myName.toLowerCase() === targetMember?.name?.toLowerCase()

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
          <div className={styles.avatar} style={{ background: targetMember?.isLeader ? 'var(--accent)' : 'var(--green)', overflow: 'hidden' }}>
            {memberProfiles?.[targetMember?.name]?.photoUrl ? (
              <img src={memberProfiles[targetMember?.name].photoUrl} alt={targetMember?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              targetMember?.name?.[0]?.toUpperCase() || '?'
            )}
          </div>
          <div className={styles.headerInfo}>
            <div className={styles.headerName} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {targetMember?.name} {targetMember?.isLeader ? <Crown size={14} /> : ''}
            </div>
            <div className={styles.headerSub}>
              {isSelf ? 'Self Chat' : `${targetMember?.isLeader ? 'Team Leader' : 'Member'} · DM`}
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        {/* Messages */}
        {isLoading ? (
          <div className={styles.empty} style={{ flexDirection: 'column', gap: '16px' }}>
            <span className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px', borderColor: 'var(--accent) transparent var(--accent) transparent' }} />
            <div className={styles.emptyText}>Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}><MessageSquare size={40} /></div>
            <div className={styles.emptyText}>{isSelf ? 'Message Yourself' : 'Start a conversation'}</div>
            <div className={styles.emptySub}>{isSelf ? 'Save notes, links, and ideas here' : 'Messages are stored in FlowMind memory for AI context'}</div>
          </div>
        ) : (
          <div className={styles.messages}>
            {messages.map((msg, i) => {
              const isMine = msg.from_name === myName
              const prevMsg = messages[i - 1]
              const currentMsgDate = new Date(msg.timestamp).toDateString()
              const prevMsgDate = prevMsg ? new Date(prevMsg.timestamp).toDateString() : null
              const showDateDivider = currentMsgDate !== prevMsgDate

              const getDateLabel = (dateString: string) => {
                const msgDate = new Date(dateString)
                const today = new Date()
                const yesterday = new Date(today)
                yesterday.setDate(yesterday.getDate() - 1)

                if (msgDate.toDateString() === today.toDateString()) {
                  return 'Today'
                } else if (msgDate.toDateString() === yesterday.toDateString()) {
                  return 'Yesterday'
                } else {
                  return msgDate.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
                }
              }

              return (
                <React.Fragment key={i}>
                  {showDateDivider && (
                    <div className={styles.dateDivider}>
                      <span className={styles.dateDividerText}>{getDateLabel(msg.timestamp)}</span>
                    </div>
                  )}
                  <div id={`msg-${msg.id}`} className={`${styles.msgRow} ${isMine ? styles.msgRowMine : styles.msgRowOther}`}>
                    <div className={styles.msgWrapper}>
                      {isMine && (
                        <button className={styles.replyBtn} onClick={() => setReplyingTo(msg)} title="Reply">
                          <Reply size={14} />
                        </button>
                      )}
                      <div className={`${styles.msgBubble} ${isMine ? styles.msgMine : styles.msgOther} ${highlightedMsgId === msg.id ? styles.highlightMsg : ''}`} onDoubleClick={() => setReplyingTo(msg)}>
                        {msg.reply_to_id && (() => {
                           const parentMsg = messages.find(m => m.id === msg.reply_to_id)
                           if (!parentMsg) return null
                           return (
                             <div className={styles.quotedMsg} style={{ borderLeftColor: getMemberColor(parentMsg.from_name) }} onClick={() => handleScrollToMsg(parentMsg.id)}>
                               <div className={styles.quotedAuthor} style={{ color: getMemberColor(parentMsg.from_name) }}>
                                 {parentMsg.from_name === myName ? 'You' : parentMsg.from_name}
                               </div>
                               <div className={styles.quotedText}>{parentMsg.text}</div>
                             </div>
                           )
                        })()}
                        <span className={styles.msgText}>{msg.text?.trim()}</span>
                        <span className={styles.msgTimeBelow}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {!isMine && (
                        <button className={styles.replyBtn} onClick={() => setReplyingTo(msg)} title="Reply">
                          <Reply size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Input */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {/* Reply Context UI */}
          {replyingTo && (
            <div className={styles.replyContext} style={{ margin: '12px 20px 0 20px', width: 'calc(100% - 40px)', maxWidth: 'none', boxSizing: 'border-box' }}>
              <div className={styles.replyPreviewBox}>
                <div className={styles.replyContextInfo}>
                  <div className={styles.replyContextAuthor}>
                    Replying to {replyingTo.from_name === myName ? 'You' : replyingTo.from_name}
                  </div>
                  <div className={styles.replyContextText}>{replyingTo.text}</div>
                </div>
                <button className={styles.cancelReplyBtn} onClick={() => setReplyingTo(null)}>
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
          <div className={`${styles.inputBar} ${styles.inputBarDirect} ${replyingTo ? styles.inputBarReplying : ''}`} style={{ marginTop: replyingTo ? '0' : '', boxSizing: 'border-box' }}>
            <input
              placeholder={`Message ${targetMember?.name}`}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              autoFocus
            />
            <button className={styles.sendBtn} onClick={handleSend} disabled={!text.trim()}>
              {text.trim() ? <ChevronUp size={20} strokeWidth={2.5} style={{ marginLeft: '1px' }} /> : <ChevronDown size={20} strokeWidth={2.5} style={{ marginLeft: '1px' }} />}
            </button>
          </div>
        </div>
      </div>
  )
}
