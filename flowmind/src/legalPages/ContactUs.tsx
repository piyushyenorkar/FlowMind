import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { ArrowLeft, Mail, Github, Globe, Send, Check, MessageSquare, Clock, ShieldCheck } from 'lucide-react'
import flowmindLogo from '../assets/flowmind.png'
import styles from './Legal.module.css'

export default function ContactUs() {
  const { navigate } = useApp()
  const [copied, setCopied] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = 'Contact Us - FlowMind'
  }, [])

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('piyushyenorkar1@gmail.com')
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !email.trim()) return

    setSubmitting(true)
    setErrorMsg('')
    setSent(false)

    try {
      const response = await fetch('https://formsubmit.co/ajax/piyushyenorkar1@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim() || 'Anonymous User',
          email: email.trim(),
          _subject: subject.trim() || `FlowMind Inquiry from ${name.trim() || 'User'}`,
          message: message.trim(),
          _template: 'table',
          _captcha: 'false'
        })
      })

      const data = await response.json()
      if (response.ok || data.success === 'true' || data.message) {
        setSent(true)
        setName('')
        setEmail('')
        setSubject('')
        setMessage('')
      } else {
        throw new Error(data.message || 'Submission failed')
      }
    } catch (err: any) {
      console.error('Contact form error:', err)
      setErrorMsg('Failed to send message automatically. Please email directly to piyushyenorkar1@gmail.com')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.logoArea} onClick={() => navigate('landing')} title="Go to FlowMind Home">
            <img src={flowmindLogo} alt="FlowMind" className={styles.logo} />
          </div>
          <button className={styles.backBtn} onClick={() => navigate('landing')}>
            <ArrowLeft size={14} /> Back to FlowMind
          </button>
        </header>

        <main className={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Mail size={26} color="var(--accent, #14b8a6)" />
            <h1 className={styles.title} style={{ margin: 0 }}>Contact Us</h1>
          </div>
          <div className={styles.effectiveDate}>
            Have questions, feedback, partnership inquiries, or need support? We'd love to hear from you.
          </div>

          <div className={styles.contactGrid}>
            {/* EMAIL */}
            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>
                <Mail size={18} />
              </div>
              <div className={styles.contactLabel}>Primary Email</div>
              <div className={styles.contactValue}>piyushyenorkar1@gmail.com</div>
              <button className={styles.contactAction} onClick={handleCopyEmail}>
                {copied ? <><Check size={14} /> Copied to clipboard</> : 'Copy Email Address'}
              </button>
            </div>

            {/* GITHUB */}
            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>
                <Github size={18} />
              </div>
              <div className={styles.contactLabel}>Open Source & Issues</div>
              <div className={styles.contactValue}>piyushyenorkar/FlowMind</div>
              <a
                href="https://github.com/piyushyenorkar/FlowMind"
                target="_blank"
                rel="noreferrer"
                className={styles.contactAction}
              >
                View on GitHub →
              </a>
            </div>

            {/* LIVE APP */}
            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>
                <Globe size={18} />
              </div>
              <div className={styles.contactLabel}>Web Application</div>
              <div className={styles.contactValue}>flowwithmind.vercel.app</div>
              <a
                href="https://flowwithmind.vercel.app/"
                target="_blank"
                rel="noreferrer"
                className={styles.contactAction}
              >
                Launch Workspace →
              </a>
            </div>
          </div>

          {/* THE TEAM / CREATORS */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Built by Team Starcy</h2>
            <p className={styles.paragraph}>
              FlowMind was created by <strong>Team Starcy</strong> for <em>The Great Indian AI Internship Challenge</em> by <strong>Gnani AI</strong>.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginTop: '12px' }}>
              <div style={{ background: 'var(--bg3, #18181b)', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--border, #27272a)' }}>
                <div style={{ fontWeight: 600, color: 'var(--fg, #fafafa)', fontSize: '15px' }}>Piyush Rajendra Yenorkar</div>
                <div style={{ fontSize: '12.5px', color: 'var(--accent, #14b8a6)', marginTop: '2px' }}>Lead Full-Stack &amp; AI Engineer</div>
                <div style={{ fontSize: '12px', color: 'var(--fg-muted, #a1a1aa)', marginTop: '6px', lineHeight: 1.5 }}>
                  System architecture, Groq Llama 3.3 LLM extraction pipeline, Agora voice RTC, Neo4j knowledge graph &amp; Supabase backend.
                </div>
              </div>
              <div style={{ background: 'var(--bg3, #18181b)', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--border, #27272a)' }}>
                <div style={{ fontWeight: 600, color: 'var(--fg, #fafafa)', fontSize: '15px' }}>Debashree Mal</div>
                <div style={{ fontSize: '12.5px', color: 'var(--accent, #14b8a6)', marginTop: '2px' }}>Co-founder, UI/UX Designer &amp; Frontend Engineer</div>
                <div style={{ fontSize: '12px', color: 'var(--fg-muted, #a1a1aa)', marginTop: '6px', lineHeight: 1.5 }}>
                  Design systems, product workflows, interactive user flows, and responsive web aesthetics.
                </div>
              </div>
            </div>
          </section>

          {/* WHAT WE CAN HELP WITH */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>What Can We Help You With?</h2>
            <ul className={styles.list}>
              <li><strong>Technical Support:</strong> Issues with meetings, task assignments, or GitHub repository integrations.</li>
              <li><strong>Data Privacy & Security:</strong> Account deletion requests, Google API data management, or security disclosures.</li>
              <li><strong>Feature Requests & Feedback:</strong> Suggestions for AI sprint tools, Neo4j graph insights, or methodology templates.</li>
              <li><strong>Developer Collaboration:</strong> Contributing to FlowMind or integrating custom APIs.</li>
            </ul>
          </section>

          {/* QUICK MESSAGE FORM */}
          <section className={styles.section} style={{ marginBottom: 0 }}>
            <h2 className={styles.sectionTitle}>Send a Direct Message</h2>
            <p className={styles.paragraph}>
              Fill out the form below to send a message directly to our inbox:
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div>
                  <label className="label">Your Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Alex Morgan"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={{ borderRadius: '16px' }}
                  />
                </div>
                <div>
                  <label className="label">Your Email *</label>
                  <input
                    type="email"
                    required
                    className="input"
                    placeholder="alex@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ borderRadius: '16px' }}
                  />
                </div>
              </div>

              <div>
                <label className="label">Subject</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Question about Google OAuth or Team Setup"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  style={{ borderRadius: '16px' }}
                />
              </div>

              <div>
                <label className="label">Message *</label>
                <textarea
                  rows={4}
                  required
                  className="textarea"
                  placeholder="Tell us what you need help with..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  style={{ borderRadius: '16px', minHeight: '100px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginTop: '6px' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: 'var(--accent, #14b8a6)',
                    color: '#000',
                    fontWeight: 700,
                    fontSize: '14px',
                    padding: '10px 22px',
                    borderRadius: '50px',
                    border: 'none',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? (
                    <>
                      <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} /> Sending Message...
                    </>
                  ) : (
                    <>
                      <Send size={15} /> Send Message
                    </>
                  )}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text3, #71717a)' }}>
                  <Clock size={14} /> Typical response time: 24–48 hours
                </div>
              </div>

              {sent && (
                <div className={styles.calloutBox} style={{ color: 'var(--accent, #14b8a6)', marginTop: '12px' }}>
                  ✓ Message sent directly! Thank you for reaching out we have received your email and will respond shortly.
                </div>
              )}
              {errorMsg && (
                <div className={styles.calloutBox} style={{ color: 'var(--red, #ef4444)', marginTop: '12px' }}>
                  {errorMsg}
                </div>
              )}
            </form>
          </section>
        </main>

        <footer className={styles.footerLinks}>
          <span>© 2026 FlowMind • Built by Team Starcy</span>
          <button className={styles.link} style={{ background: 'none', border: 'none', padding: 0 }} onClick={() => navigate('privacy')}>
            Privacy Policy
          </button>
          <span>•</span>
          <button className={styles.link} style={{ background: 'none', border: 'none', padding: 0 }} onClick={() => navigate('terms')}>
            Terms of Service
          </button>
        </footer>
      </div>
    </div>
  )
}
