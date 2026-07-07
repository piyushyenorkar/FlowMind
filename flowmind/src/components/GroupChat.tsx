import React, { useState, useEffect, useRef } from 'react'
import { Brain, MessageSquare, ChevronUp, ChevronDown, Reply, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { retainMemory, recallMemory, groqChat } from '../services/api'
import { supabase } from '../services/supabase'
import styles from './TeamChat.module.css'

function getMemberColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Multiply by 137 (a prime number) to spread the hues widely across the color wheel
  const hue = Math.abs(hash * 137) % 360;
  return `hsl(${hue}, 80%, 70%)`;
}

const cachedGroupMessages: Record<string, any[]> = {}
const cachedGroupReads: Record<string, Record<string, string>> = {}

export default function GroupChat() {
  const { team, currentUser, members, memberProfiles } = useApp()
  const teamCode = team?.code || ''
  
  const [messages, setMessages] = useState<any[]>(() => cachedGroupMessages[teamCode] || [])
  const [memberReads, setMemberReads] = useState<Record<string, string>>(() => cachedGroupReads[teamCode] || {})
  const [isLoading, setIsLoading] = useState(() => !cachedGroupMessages[teamCode])
  const [text, setText] = useState('')
  const [replyingTo, setReplyingTo] = useState<any | null>(null)
  const [summarizing, setSummarizing] = useState(false)
  const [showSummarize, setShowSummarize] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const bottomRef = useRef<any>(null)

  // Load messages & read receipts
  useEffect(() => {
    const loadData = async () => {
      if (!teamCode) return
      if (!cachedGroupMessages[teamCode]) {
        setIsLoading(true)
      }
      const { data, error } = await supabase.from('group_chats').select('*').eq('team_code', teamCode).order('timestamp', { ascending: true })
      if (!error && data) {
        setMessages(data)
        cachedGroupMessages[teamCode] = data
      }
      
      const { data: readData } = await supabase.from('team_chat_reads').select('*').eq('team_code', teamCode)
      if (readData) {
        const reads: Record<string, string> = {}
        readData.forEach((r: any) => reads[r.user_name] = r.last_read_timestamp)
        setMemberReads(reads)
        cachedGroupReads[teamCode] = reads
      }
      setIsLoading(false)
    }
    loadData()
  }, [teamCode])

  // Poll for new messages and reads every 2s
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!teamCode) return
      const { data, error } = await supabase.from('group_chats').select('*').eq('team_code', teamCode).order('timestamp', { ascending: true })
      if (!error && data) {
        setMessages(data)
        cachedGroupMessages[teamCode] = data
      }

      const { data: readData } = await supabase.from('team_chat_reads').select('*').eq('team_code', teamCode)
      if (readData) {
        const reads: Record<string, string> = {}
        readData.forEach((r: any) => reads[r.user_name] = r.last_read_timestamp)
        setMemberReads(reads)
        cachedGroupReads[teamCode] = reads
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [teamCode])

  // Upsert current user's read receipt
  useEffect(() => {
    if (messages.length > 0 && teamCode && currentUser?.name) {
      const latestTimestamp = messages[messages.length - 1].timestamp;
      console.log('Upserting read receipt for:', currentUser.name, latestTimestamp)
      supabase.from('team_chat_reads').upsert([{
        team_code: teamCode,
        user_name: currentUser.name,
        last_read_timestamp: latestTimestamp
      }], { onConflict: 'team_code, user_name' }).then(({ error }) => {
        if (error) console.error('Upsert read receipt error:', error)
      })
    }
  }, [messages, teamCode, currentUser])

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
      reply_to_id: replyingTo ? replyingTo.id : null,
      timestamp: new Date().toISOString(),
    }

    setText('')
    setReplyingTo(null)

    // Save to Supabase
    await supabase.from('group_chats').insert([msg])

    setMessages(prev => {
      const newMsgs = [...prev, msg]
      cachedGroupMessages[teamCode] = newMsgs
      return newMsgs
    })

    // Store in FlowMind Memory
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
      const recentMsgs = messages.slice(-30)
      const chatLog = recentMsgs.map(m =>
        `[${new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ${m.from_name}: ${m.text}`
      ).join('\n')

      const recalled = await recallMemory(teamCode, 'group chat discussions decisions actions')
      const memoryContext = recalled
        ? JSON.stringify(recalled).substring(0, 2000)
        : 'No additional memories available.'

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

  // Pre-calculate the latest read message index for each user
  const readReceiptsByIndex: Record<number, string[]> = {}
  Object.keys(memberReads).forEach(userName => {
    if (userName === myName) return // Don't show my own read receipt
    const readTs = new Date(memberReads[userName]).getTime()
    
    let lastIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (new Date(messages[i].timestamp).getTime() <= readTs) {
        lastIdx = i;
        break;
      }
    }
    if (lastIdx !== -1) {
      // Don't show a user's read receipt on their own message
      if (messages[lastIdx].from_name !== userName) {
        if (!readReceiptsByIndex[lastIdx]) {
          readReceiptsByIndex[lastIdx] = []
        }
        readReceiptsByIndex[lastIdx].push(userName)
      }
    }
  })

  // Debug log to see calculated read receipts
  console.log('readReceiptsByIndex:', readReceiptsByIndex)

  return (
    <div className={styles.groupWrap}>
      {/* Messages */}
      {isLoading ? (
        <div className={styles.empty} style={{ flexDirection: 'column', gap: '16px' }}>
          <span className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px', borderColor: 'var(--accent) transparent var(--accent) transparent' }} />
          <div className={styles.emptyText}>Loading messages...</div>
        </div>
      ) : messages.length === 0 ? (
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

            const readers = readReceiptsByIndex[i] || []

            return (
              <React.Fragment key={i}>
                {showDateDivider && (
                  <div className={styles.dateDivider}>
                    <span className={styles.dateDividerText}>{getDateLabel(msg.timestamp)}</span>
                  </div>
                )}
                <div className={`${styles.msgRow} ${isMine ? styles.msgRowMine : styles.msgRowOther}`}>
                  <div className={styles.msgWrapper}>
                    {isMine && (
                      <button className={styles.replyBtn} onClick={() => setReplyingTo(msg)} title="Reply">
                        <Reply size={14} />
                      </button>
                    )}
                    {isMine ? (
                      <div className={`${styles.msgBubble} ${styles.msgMine}`} onDoubleClick={() => setReplyingTo(msg)}>
                        {msg.reply_to_id && (() => {
                           const parentMsg = messages.find(m => m.id === msg.reply_to_id)
                           if (!parentMsg) return null
                           return (
                             <div className={styles.quotedMsg} style={{ borderLeftColor: getMemberColor(parentMsg.from_name) }}>
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
                    ) : (
                      <>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', maxWidth: '100%' }}>
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
                          <div className={`${styles.msgBubble} ${styles.msgOther}`} onDoubleClick={() => setReplyingTo(msg)}>
                            {showSender && <div style={{ fontSize: '11px', fontWeight: 600, color: getMemberColor(msg.from_name), marginBottom: '4px' }}>{msg.from_name}</div>}
                            {msg.reply_to_id && (() => {
                               const parentMsg = messages.find(m => m.id === msg.reply_to_id)
                               if (!parentMsg) return null
                               return (
                                 <div className={styles.quotedMsg} style={{ borderLeftColor: getMemberColor(parentMsg.from_name) }}>
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
                        </div>
                      </>
                    )}
                    {!isMine && (
                      <button className={styles.replyBtn} onClick={() => setReplyingTo(msg)} title="Reply">
                        <Reply size={14} />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Instagram-style Read Receipts */}
                {readers.length > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: isMine ? 'flex-end' : 'flex-start', 
                    gap: '4px', 
                    marginTop: '2px', 
                    marginBottom: '8px',
                    padding: isMine ? '0 10px' : '0 40px' 
                  }}>
                    {readers.map(reader => {
                      const rAvatar = memberProfiles?.[reader]?.photoUrl || null
                      return (
                        <div key={reader} className={styles.readReceiptAvatar}>
                          {rAvatar ? (
                            <img src={rAvatar} alt={reader} className={styles.readReceiptImg} />
                          ) : (
                            <div 
                              className={styles.readReceiptFallback}
                              style={{ background: getMemberColor(reader) }}
                            >
                              {reader.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className={styles.readReceiptTooltip}>
                            Seen by {reader}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
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

        {/* Reply Context UI */}
        {replyingTo && (
          <div className={styles.replyContext}>
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

        {/* Input */}
        <div className={`${styles.inputBar} ${styles.inputBarGroup} ${replyingTo ? styles.inputBarReplying : ''}`} style={{ marginTop: '0' }}>
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

