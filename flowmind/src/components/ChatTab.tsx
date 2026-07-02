import React, { useState, useRef, useEffect } from 'react'
import { Bot, Brain, ChevronUp, ChevronDown } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { sendChatMessage } from '../services/api'
import styles from './ChatTab.module.css'
import flowmindLogo from '../assets/flowmind.png'

const SUGGESTIONS = [
  'Who should I assign the next task to?',
  'Summarise what the team has done',
  'Are there any delay risks?',
  'What decisions were made about the project?',
]

export default function ChatTab() {
  const { tasks, decisions, members, memoryFeed, currentUser, team } = useApp()
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hey ${currentUser?.name || 'there'}! I'm your AI project assistant. I have access to your team's full FlowMind Memory — all tasks, decisions, and activity. Ask me anything about your project.`,
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setLoading(true)
    try {
      const context = { tasks, decisions, members, memoryFeed }
      const reply = await sendChatMessage(team?.code, msg, context, messages)
      setMessages(prev => [...prev, { role: 'assistant', text: reply }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, something went wrong. Please try again.' }])
    }
    setLoading(false)
  }

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
              {m.text.split('\n').map((line, j) => (
                <p key={j} className={styles.msgLine}>
                  {line.split(/(\*\*[^*]+\*\*)/).map((part, k) =>
                    part.startsWith('**') && part.endsWith('**')
                      ? <strong key={k}>{part.slice(2, -2)}</strong>
                      : part
                  )}
                </p>
              ))}
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
    </div>
  )
}
