import React, { useState, useEffect, useRef } from 'react'
import { Brain, MessageSquare, ChevronUp, ChevronDown } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { retainMemory, recallMemory, groqChat } from '../services/api'
import { supabase } from '../services/supabase'
import styles from './TeamChat.module.css'

function getMemberColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 80%, 70%)`;
}

export default function GroupChat() {
  const { team, currentUser, members, memberProfiles } = useApp()
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [summarizing, setSummarizing] = useState(false)
  const [showSummarize, setShowSummarize] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const bottomRef = useRef<any>(null)
  const teamCode = team?.code || ''

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      if (!teamCode) return
      const { data, error } = await supabase.from('group_chats').select('*').eq('team_code', teamCode).order('timestamp', { ascending: true })
      if (!error && data) {
        setMessages(data)
      }
    }
    loadMessages()
  }, [teamCode])

  // Poll for new messages every 2s
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!teamCode) return
      const { data, error } = await supabase.from('group_chats').select('*').eq('team_code', teamCode).order('timestamp', { ascending: true })
      if (!error && data) {
        setMessages(data)
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [teamCode])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = async () => {
    if (!text.trim()) return
    const msg = {
      team_code: teamCode,
      from_name: currentUser?.name || 'You',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    }

    setText('')

    // Save to Supabase
    await supabase.from('group_chats').insert([msg])

    setMessages(prev => [...prev, msg])

    // Store in Hindsight memory
    retainMemory(
      teamCode,
      `Group chat message from ${currentUser?.name}: "${msg.text}"`,
      {
        type: 'group_chat',
        from: currentUser?.name,
        chatType: 'group',
      }
    )
  }

  const handleSummarize = async () => {
    setSummarizing(true)
    setSummary(null)

    try {
      // Step 1: Get recent messages for context
      const recentMsgs = messages.slice(-30)
      const chatLog = recentMsgs.map(m =>
        `[${new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ${m.from_name}: ${m.text}`
      ).join('\n')

      // Step 2: Recall from Hindsight for extra context
      const recalled = await recallMemory(teamCode, 'group chat discussions decisions actions')
      const memoryContext = recalled
        ? JSON.stringify(recalled).substring(0, 2000)
        : 'No additional memories available.'

      // Step 3: Summarize using Groq
      const systemPrompt = `You are FlowMind AI. Summarize the following team group chat conversation. Include:
1. **Key points** discussed
2. **Decisions** made (if any)
3. **Action items** (if any)
4. **Unresolved questions** (if any)

Hindsight memory context: ${memoryContext}

Be concise but comprehensive. Use bullet points.`

      const reply = await groqChat(
        [{ role: 'user', content: `Summarize this group chat:\n\n${chatLog}` }],
        systemPrompt
      )

      const summaryText = reply || 'Unable to generate summary. Please try again.'
      setSummary(summaryText)

      // Store summary in Hindsight
      retainMemory(
        teamCode,
        `Group chat summary generated: ${summaryText}`,
        { type: 'chat_summary', chatType: 'group', messageCount: recentMsgs.length }
      )
    } catch (err) {
      console.warn('[GroupChat] Summarize error:', err)
      setSummary('Failed to generate summary. Please try again.')
    }
    setSummarizing(false)
  }

  const myName = currentUser?.name || ''
  const memberCount = members?.length || 0

  return (
    <div className={styles.groupWrap}>
      {/* Messages */}
      {messages.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}><MessageSquare size={40} /></div>
          <div className={styles.emptyText}>Team Group Chat</div>
          <div className={styles.emptySub}>
            {memberCount} members · Messages are memorized by FlowMind AI
          </div>
        </div>
      ) : (
        <div className={styles.groupMessages}>
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

            const showSender = !isMine && (!prevMsg || prevMsg.from_name !== msg.from_name || showDateDivider)

            const avatarUrl = memberProfiles?.[msg.from_name]?.photoUrl || null
            const showAvatar = !isMine && (!prevMsg || prevMsg.from_name !== msg.from_name || showDateDivider)

            return (
              <React.Fragment key={i}>
                {showDateDivider && (
                  <div className={styles.dateDivider}>
                    <span className={styles.dateDividerText}>{getDateLabel(msg.timestamp)}</span>
                  </div>
                )}
                <div className={`${styles.msgRow} ${isMine ? styles.msgRowMine : styles.msgRowOther}`}>
                {isMine ? (
                  <div className={`${styles.msgBubble} ${styles.msgMine}`}>
                    <span className={styles.msgText}>{msg.text?.trim()}</span>
                    <span className={styles.msgTimeBelow}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', maxWidth: '90%' }}>
                      {showAvatar ? (
                        <div className={styles.msgAvatar} style={{ marginTop: '4px' }}>
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: 'var(--accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                              {msg.from_name?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ width: '24px', flexShrink: 0 }} />
                      )}
                      <div style={{ position: 'relative', padding: '6px 10px', borderRadius: '14px', borderBottomLeftRadius: '4px', fontSize: '13px', lineHeight: 1.5, wordBreak: 'break-word' as const, background: 'rgba(23, 23, 23, 0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', color: 'var(--text)' }}>
                        {showSender && <div style={{ fontSize: '11px', fontWeight: 600, color: getMemberColor(msg.from_name), marginBottom: '4px' }}>{msg.from_name}</div>}
                        <span className={styles.msgText}>{msg.text?.trim()}</span>
                        <span style={{ position: 'absolute', bottom: '4px', right: '8px', fontSize: '9px', color: 'var(--text3)', opacity: 0.7, lineHeight: 1 }}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </>
                )}
                </div>
              </React.Fragment>
            )
          })}

          {/* Summary card */}
          {summary && (
            <div className={styles.summaryCard}>
              <div className={styles.summaryTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Brain size={16} /> AI Summary
              </div>
              <div className={styles.summaryText}>{summary}</div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      <div className={styles.groupFooter}>
        {/* Summarize button bar */}
        {messages.length >= 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '8px' }}>
            <button 
              className={styles.summarizeToggle}
              onClick={() => setShowSummarize(!showSummarize)}
            >
              <span>Summarize Chat</span>
              {showSummarize ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
            
            {showSummarize && (
              <div className={styles.summarizeBar}>
                <button
                  className={styles.summarizeBtn}
                  onClick={handleSummarize}
                  disabled={summarizing}
                >
                  {summarizing ? (
                    <><span className="spinner" style={{ width: 14, height: 14 }} /> Summarizing...</>
                  ) : (
                    <><Brain size={14} /> Generate Summary</>
                  )}
                </button>
                <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
                  {messages.length} messages · Powered by flowmind
                </span>
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <div className={`${styles.inputBar} ${styles.inputBarGroup}`} style={{ marginTop: '0' }}>
          <input
            placeholder="Message the team"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button className={styles.sendBtn} onClick={handleSend} disabled={!text.trim()}>
            {text.trim() ? <ChevronUp size={20} strokeWidth={2.5} /> : <ChevronDown size={20} strokeWidth={2.5} />}
          </button>
        </div>
      </div>
    </div>
  )
}
