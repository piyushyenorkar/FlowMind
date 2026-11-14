import React, { useState, useEffect, useRef } from 'react'
import { Brain, MessageSquare, ChevronUp, ChevronDown, Reply, X, Edit2, Trash2, Info } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { retainMemory, recallMemory, groqChat } from '../services/api'
import { supabase } from '../services/supabase'
import styles from './TeamChat.module.css'
import favicon from '../assets/favicon.png'

function getMemberColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Multiply by 137 (a prime number) to spread the hues widely across the color wheel
  const hue = Math.abs(hash * 137) % 360;
  return `hsl(${hue}, 80%, 70%)`;
}

function getScrollParent(node: HTMLElement | null): HTMLElement | null {
  if (!node) return null
  let parent = node.parentElement
  while (parent) {
    const { overflowY } = window.getComputedStyle(parent)
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return parent
    }
    parent = parent.parentElement
  }
  return document.documentElement
}

const cachedGroupMessages: Record<string, any[]> = {}
const cachedGroupReads: Record<string, Record<string, string>> = {}

const KNOWN_HEADERS: Record<string, string> = {
  'key points': 'Key Points',
  'key point': 'Key Points',
  'decisions': 'Decisions',
  'decision': 'Decisions',
  'action items': 'Action Items',
  'action item': 'Action Items',
  'unresolved questions': 'Unresolved Questions',
  'unresolved question': 'Unresolved Questions',
}

const AISummaryFormatter = ({ text }: { text: string }) => {
  if (!text) return null

  // 1. Normalize: match headers like **Key points**, * **Key points:**, etc.
  // Consumes any colons and asterisks so trailing colons don't become rogue ":" bullet lines.
  const normalizedText = text
    .replace(/(?:\s|^)\*?\s*\*\*(Key [pP]oints?|Decisions?|Action [iI]tems?|Unresolved [qQ]uestions?)[^*]*\*\*[:\s]*/gi, '\n\n__SEC__$1\n')
    .replace(/(?:\s|^)\*?\s*###?\s*(Key [pP]oints?|Decisions?|Action [iI]tems?|Unresolved [qQ]uestions?)[:\s]*/gi, '\n\n__SEC__$1\n')
    // Convert sub-bullet titles like `* **Greeting & Check-in:**` into indented list items
    .replace(/(?:\s|^)\*\s*\*\*([^*]+):\*\*\s*/g, '\n- **$1:** ')

  const rawLines = normalizedText.split('\n').map(l => l.trim()).filter(Boolean)
  const sections: { title: string; items: string[] }[] = []
  let intro = ''
  let currentTitle = ''
  let currentItems: string[] = []
  let trailingNote = ''
  let trailingNoteTitle = ''

  for (const line of rawLines) {
    // If a line is just punctuation like ':', '-', or '•', skip it completely
    const stripped = line.replace(/^[-*•\d.:\s]+$/, '').trim()
    if (!stripped) continue

    if (line.startsWith('__SEC__')) {
      if (currentTitle) {
        sections.push({ title: currentTitle, items: currentItems })
      }
      const rawKey = line.replace(/^__SEC__/, '').replace(/[:*#]/g, '').trim().toLowerCase()
      currentTitle = KNOWN_HEADERS[rawKey] || (rawKey.charAt(0).toUpperCase() + rawKey.slice(1))
      currentItems = []
    } else {
      const lower = line.replace(/^[#*\s-]+/, '').replace(/[*:]/g, '').trim().toLowerCase()
      const matchedHeader = Object.keys(KNOWN_HEADERS).find(h => lower === h || lower.startsWith(h + ' ') || lower.startsWith(h + ':'))

      if (matchedHeader) {
        if (currentTitle) {
          sections.push({ title: currentTitle, items: currentItems })
        }
        currentTitle = KNOWN_HEADERS[matchedHeader]
        currentItems = []
        const afterText = line.replace(new RegExp(`^[#*\\s-]*\\*?\\*?${matchedHeader}\\*?\\*?[:\\s]*`, 'i'), '').trim()
        if (afterText && afterText !== ':') {
          currentItems.push(afterText)
        }
      } else if (currentTitle) {
        // Detect if line is a trailing explanatory note (e.g. "Context of Previous Summary..." or "Note: ...")
        const isNoteLine = /^(context( of previous summary)?|note|disclaimer|important notice)[:\s]/i.test(line) ||
                           /^(context of previous summary)/i.test(line)
        if (isNoteLine && sections.length >= 2) {
          sections.push({ title: currentTitle, items: currentItems })
          currentTitle = ''
          currentItems = []

          const colonIdx = line.indexOf(':')
          if (colonIdx > 0 && colonIdx < 40) {
            trailingNoteTitle = line.slice(0, colonIdx).replace(/[*#]/g, '').trim()
            trailingNote = line.slice(colonIdx + 1).replace(/^[:\s]+/, '').trim()
          } else {
            trailingNoteTitle = 'Context Note'
            trailingNote = line.replace(/^(context of previous summary|note|context)[:\s]*/i, '').trim()
          }
        } else {
          // Normal bullet item (strip leading dashes, bullets, and colons)
          const cleanItem = line.replace(/^[-*•\d.]+\s*/, '').replace(/^[:\s]+/, '').trim()
          if (cleanItem && cleanItem !== ':') {
            currentItems.push(cleanItem)
          }
        }
      } else if (trailingNote) {
        trailingNote += ' ' + line
      } else {
        intro = intro ? `${intro} ${line}` : line
      }
    }
  }

  if (currentTitle) {
    sections.push({ title: currentTitle, items: currentItems })
  }

  if (sections.length === 0 && !trailingNote) {
    return <span className={styles.msgText} style={{ whiteSpace: 'pre-wrap' }}>{text}</span>
  }

  return (
    <div className={styles.aiSummaryContainer}>
      {intro && <div className={styles.aiSummaryIntro}>{intro}</div>}
      {sections.map((sec, idx) => (
        <div key={idx} className={styles.aiSummaryBox}>
          <div className={styles.aiSummaryHeading}>
            <div className={styles.aiSummaryBullet} />
            <span>{sec.title}</span>
          </div>
          <ul className={styles.aiSummaryList}>
            {sec.items.length > 0 ? (
              sec.items.map((item, i) => {
                const parts = item.split(/(\*\*[^*]+\*\*)/g)
                return (
                  <li key={i}>
                    {parts.map((part, pIdx) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={pIdx} style={{ color: 'var(--text)' }}>{part.slice(2, -2)}</strong>
                      }
                      return part
                    })}
                  </li>
                )
              })
            ) : (
              <li style={{ color: 'var(--text3)' }}>No items to display</li>
            )}
          </ul>
        </div>
      ))}

      {trailingNote && (
        <div className={styles.aiSummaryNote}>
          <div className={styles.aiSummaryNoteTitle}>
            <Info size={13} />
            <span>{trailingNoteTitle || 'Context Note'}</span>
          </div>
          <div className={styles.aiSummaryNoteText}>
            {trailingNote}
          </div>
        </div>
      )}
    </div>
  )
}

export default function GroupChat() {
  const { team, currentUser, members, memberProfiles } = useApp()
  const teamCode = team?.code || ''
  
  const [messages, setMessages] = useState<any[]>(() => cachedGroupMessages[teamCode] || [])
  const [memberReads, setMemberReads] = useState<Record<string, string>>(() => cachedGroupReads[teamCode] || {})
  const [isLoading, setIsLoading] = useState(() => !cachedGroupMessages[teamCode])
  const [text, setText] = useState('')
  const [replyingTo, setReplyingTo] = useState<any | null>(null)
  const [editingMsg, setEditingMsg] = useState<any | null>(null)
  const [contextMenu, setContextMenu] = useState<{ msg: any, x: number, y: number, confirmDelete?: boolean } | null>(null)
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null)
  const [summarizing, setSummarizing] = useState(false)
  const [showSummarize, setShowSummarize] = useState(false)
  
  // Scrolling and navigation
  const groupWrapRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [showScrollBottom, setShowScrollBottom] = useState(false)
  const [newBelowCount, setNewBelowCount] = useState(0)
  const prevMsgCountRef = useRef(messages.length)
  const isAtBottomRef = useRef(true)

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior, block: 'end' })
    } else {
      const container = getScrollParent(groupWrapRef.current)
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior })
      }
    }
    setShowScrollBottom(false)
    setNewBelowCount(0)
    isAtBottomRef.current = true
  }

  // Smooth entrance: starts from above and smoothly glides down to recent messages like DirectChat
  const initialScrollDoneRef = useRef(false)

  useEffect(() => {
    initialScrollDoneRef.current = false
    const container = getScrollParent(groupWrapRef.current)
    if (container) {
      container.scrollTop = 0
    }
  }, [teamCode])

  useEffect(() => {
    if (!isLoading && messages.length > 0 && !initialScrollDoneRef.current) {
      initialScrollDoneRef.current = true
      const t1 = setTimeout(() => {
        scrollToBottom('smooth')
      }, 80)
      const t2 = setTimeout(() => {
        scrollToBottom('smooth')
      }, 450)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
  }, [isLoading, messages.length, teamCode])

  // Track scroll position of the parent container to toggle down chevron button
  useEffect(() => {
    const container = getScrollParent(groupWrapRef.current)
    if (!container) return

    const handleScroll = () => {
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
      const isAway = distanceFromBottom > 150
      setShowScrollBottom(isAway)
      isAtBottomRef.current = !isAway
      if (!isAway) {
        setNewBelowCount(0)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    const checkTimer = setTimeout(handleScroll, 120)

    return () => {
      clearTimeout(checkTimer)
      container.removeEventListener('scroll', handleScroll)
    }
  }, [messages.length, isLoading])

  // Handle incoming messages: stay at bottom if already there, or increment newBelowCount if scrolled up
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      const diff = messages.length - prevMsgCountRef.current
      if (isAtBottomRef.current) {
        scrollToBottom('smooth')
      } else {
        setNewBelowCount(prev => prev + diff)
      }
    }
    prevMsgCountRef.current = messages.length
  }, [messages.length])

  const handleScrollToMsg = (id: string) => {
    const el = document.getElementById(`msg-${id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightedMsgId(id)
      setTimeout(() => setHighlightedMsgId(null), 1500)
    }
  }

  const handleContextMenu = (e: React.MouseEvent, msg: any) => {
    e.preventDefault()
    setContextMenu({ msg, x: e.clientX, y: e.clientY })
  }

  const handleDeleteMessage = async (msgId: string) => {
    await supabase.from('group_chats').delete().eq('id', msgId)
    setMessages(prev => {
      const newMsgs = prev.filter(m => m.id !== msgId)
      cachedGroupMessages[teamCode] = newMsgs
      return newMsgs
    })
    setContextMenu(null)
  }

  const handleEditMessage = (msg: any) => {
    setEditingMsg(msg)
    setText(msg.text)
    setReplyingTo(null)
    setContextMenu(null)
  }

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

  const handleSend = async () => {
    if (!text.trim()) return
    if (editingMsg) {
      // Update existing message
      await supabase.from('group_chats').update({ text: text.trim(), is_edited: true }).eq('id', editingMsg.id)
      setMessages(prev => {
        const newMsgs = prev.map(m => m.id === editingMsg.id ? { ...m, text: text.trim(), is_edited: true } : m)
        cachedGroupMessages[teamCode] = newMsgs
        return newMsgs
      })
      setText('')
      setEditingMsg(null)
      return
    }

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

    setTimeout(() => scrollToBottom('smooth'), 10)

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

    try {
      const recentMsgs = messages.slice(-30)
      const chatLog = recentMsgs.map(m =>
        `[${new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ${m.from_name}: ${m.text}`
      ).join('\n')

      const recalled = await recallMemory(teamCode, 'group chat discussions decisions actions')
      const memoryContext = recalled
        ? JSON.stringify(recalled).substring(0, 2000)
        : 'No additional memories available.'

      const systemPrompt = `You are FlowMind AI. Summarize the following team group chat conversation.
Format your output cleanly using the following exact structure with separate lines for every section and bullet:

Here is a summary of the group chat conversation:

**Key points**
- [First key point discussed]
- [Second key point discussed]

**Decisions**
- [Decisions made, or "No specific decisions were made in the conversation."]

**Action items**
- [Action items and assignments, or "No specific action items were assigned."]

**Unresolved questions**
- [Unresolved questions or pending discussions, or "None."]

Hindsight memory context: ${memoryContext}

CRITICAL: Do NOT output everything in a continuous paragraph. Put blank lines between sections and place each item on its own line starting with "- ". Do NOT add unrequested meta-commentary, previous context disclaimers, or historical comparisons at the end (e.g. do NOT write "Context of Previous Summary..."). Only output the 4 sections.`

      const reply = await groqChat(
        [{ role: 'user', content: `Summarize this group chat:\n\n${chatLog}` }],
        systemPrompt
      )

      const summaryText = reply || 'Unable to generate summary. Please try again.'
      
      const aiMsg = {
        team_code: teamCode,
        from_name: 'FlowMind AI',
        text: summaryText,
        timestamp: new Date().toISOString()
      }

      const { data: insertedMsg } = await supabase.from('group_chats').insert([aiMsg]).select().single()

      setMessages(prev => {
        const newMsgs = [...prev, insertedMsg || aiMsg]
        cachedGroupMessages[teamCode] = newMsgs
        return newMsgs
      })

      retainMemory(
        teamCode,
        `Group chat summary generated: ${summaryText}`,
        { type: 'chat_summary', chatType: 'group', messageCount: String(recentMsgs.length) }
      )
    } catch (err) {
      console.warn('[GroupChat] Summarize error:', err)
      const errorMsg = {
        team_code: teamCode,
        from_name: 'FlowMind AI',
        text: 'Failed to generate summary. Please try again.',
        timestamp: new Date().toISOString()
      }
      const { data: insertedErr } = await supabase.from('group_chats').insert([errorMsg]).select().single()
      setMessages(prev => {
        const newMsgs = [...prev, insertedErr || errorMsg]
        cachedGroupMessages[teamCode] = newMsgs
        return newMsgs
      })
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
    <div ref={groupWrapRef} className={styles.groupWrap}>
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
            const isSystemMsg = msg.from_name === 'FlowMind AI'
            const avatarUrl = isSystemMsg ? favicon : (memberProfiles?.[msg.from_name]?.photoUrl || null)
            const showAvatar = !isMine && (!prevMsg || prevMsg.from_name !== msg.from_name || showDateDivider)

            const readers = readReceiptsByIndex[i] || []

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
                    {isMine ? (
                      <div className={`${styles.msgBubble} ${styles.msgMine} ${highlightedMsgId === msg.id ? styles.highlightMsg : ''}`} onDoubleClick={() => setReplyingTo(msg)} onContextMenu={(e) => handleContextMenu(e, msg)}>
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
                          {msg.is_edited && <span style={{ marginRight: '4px', fontStyle: 'italic', opacity: 0.5, fontSize: '0.7em' }}>(edited)</span>}
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', maxWidth: '100%' }}>
                          {showAvatar ? (
                            <div className={styles.msgAvatar} style={{ marginTop: '4px' }}>
                              {avatarUrl ? (
                                <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: isSystemMsg ? 'contain' : 'cover', background: isSystemMsg ? 'rgba(255,255,255,0.05)' : 'transparent' }} />
                              ) : (
                                <div style={{ width: '100%', height: '100%', background: 'var(--accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                                  {msg.from_name?.charAt(0)?.toUpperCase()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ width: '24px', flexShrink: 0 }} />
                          )}
                          <div className={`${styles.msgBubble} ${styles.msgOther} ${highlightedMsgId === msg.id ? styles.highlightMsg : ''}`} onDoubleClick={() => setReplyingTo(msg)}>
                            {showSender && <div style={{ fontSize: '11px', fontWeight: 600, color: getMemberColor(msg.from_name), marginBottom: '4px' }}>{msg.from_name}</div>}
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
                            {isSystemMsg ? (
                              <AISummaryFormatter text={msg.text?.trim()} />
                            ) : (
                              <span className={styles.msgText}>{msg.text?.trim()}</span>
                            )}
                            <span className={styles.msgTimeBelow}>
                              {msg.is_edited && <span style={{ marginRight: '4px', fontStyle: 'italic', opacity: 0.5, fontSize: '0.7em' }}>(edited)</span>}
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

          {/* Bottom ref */}
          <div ref={bottomRef} />
        </div>
      )}

      <div className={styles.groupFooter}>
        {/* Floating scroll to bottom chevron button */}
        {showScrollBottom && (
          <button
            type="button"
            className={styles.scrollToBottomBtn}
            onClick={() => scrollToBottom('smooth')}
            title="Scroll to recent messages"
            aria-label="Scroll to recent messages"
          >
            <ChevronDown size={20} strokeWidth={2.5} />
            {newBelowCount > 0 && (
              <span className={styles.scrollBadge}>
                {newBelowCount > 99 ? '99+' : newBelowCount}
              </span>
            )}
          </button>
        )}

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

      {/* Context Menu Modal */}
      {contextMenu && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setContextMenu(null)} />
          <div style={{
            position: 'fixed',
            top: contextMenu.y,
            left: Math.min(contextMenu.x, window.innerWidth - (contextMenu.confirmDelete ? 240 : 180)),
            width: contextMenu.confirmDelete ? '220px' : '160px',
            background: '#1a1a1a',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '8px',
            zIndex: 1000,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)'
          }}>
            {contextMenu.confirmDelete ? (
              <div style={{ padding: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                  <Trash2 size={20} color="#fff" />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text)', marginBottom: '12px', textAlign: 'center', lineHeight: 1.4 }}>
                  Delete permanently from both sides?
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setContextMenu({ ...contextMenu, confirmDelete: false })}
                    style={{ flex: 1, padding: '6px', borderRadius: '20px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer', fontSize: '12px' }}
                  >
                    No
                  </button>
                  <button 
                    onClick={() => handleDeleteMessage(contextMenu.msg.id)}
                    style={{ flex: 1, padding: '6px', borderRadius: '20px', background: '#ff4d4f', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Yes
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '11px', color: 'var(--text2)', padding: '4px 8px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Message Options</div>
                <div 
                  onClick={() => handleEditMessage(contextMenu.msg)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Edit2 size={16} color="var(--text)" />
                  <span style={{ color: 'var(--text)' }}>Edit</span>
                </div>
                <div 
                  onClick={() => setContextMenu({ ...contextMenu, confirmDelete: true })}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Trash2 size={16} color="var(--text)" />
                  <span style={{ color: 'var(--text)' }}>Delete</span>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Reply Context UI */}
      {(replyingTo || editingMsg) && (
          <div className={styles.replyContext}>
            <div className={styles.replyPreviewBox}>
              <div className={styles.replyContextInfo}>
                <div className={styles.replyContextAuthor}>
                  {editingMsg ? 'Editing message' : `Replying to ${replyingTo.from_name === myName ? 'You' : replyingTo.from_name}`}
                </div>
                <div className={styles.replyContextText}>{editingMsg ? 'Update your message' : replyingTo.text}</div>
              </div>
              <button className={styles.cancelReplyBtn} onClick={() => { setReplyingTo(null); setEditingMsg(null); setText('') }}>
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className={`${styles.inputBar} ${styles.inputBarGroup} ${replyingTo || editingMsg ? styles.inputBarReplying : ''}`} style={{ marginTop: '0' }}>
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

