import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { Scale, Users, X, Check, ChevronDown, ChevronUp } from 'lucide-react'
import Avatar from './Avatar'
import { useApp } from '../context/AppContext'
import styles from './DecisionsTab.module.css'

export default function DecisionsTab() {
  const { decisions, addDecision, members, team, currentUser, role } = useApp()
  const [form, setForm] = useState({ decision: '', reason: '', involvedPeople: [] as string[], impact: '' })
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleAdd = () => {
    if (!form.decision) return
    addDecision({ ...form })
    setForm({ decision: '', reason: '', involvedPeople: [], impact: '' })
    setAnchorEl(null)
  }

  // Get all members for selection
  const allMembersRaw = (members && members.length > 0) ? members : (JSON.parse(localStorage.getItem('flowmind_team_members') || '{}')[team?.code] || [])
  const allMembers = allMembersRaw.length > 0 ? allMembersRaw : [{ name: currentUser?.name || 'You', isLeader: true }]

  const toggleMember = (name: string) => {
    if (form.involvedPeople.includes(name)) {
      set('involvedPeople', form.involvedPeople.filter((n: string) => n !== name))
    } else {
      set('involvedPeople', [...form.involvedPeople, name])
    }
  }

  const [showPeopleDropdown, setShowPeopleDropdown] = useState(false)
  const [showImpactDropdown, setShowImpactDropdown] = useState(false)

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <div>
          <div className={styles.pageTitle}>Decision Log</div>
          <div className={styles.pageSub}>Every decision stored in FlowMind Memory with full context</div>
        </div>
        {role === 'leader' && (
          <button className="btn-primary" onClick={(e) => setAnchorEl(anchorEl ? null : e.currentTarget)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {anchorEl ? <><X size={16} /> Cancel</> : '+ Log Decision'}
          </button>
        )}
      </div>

      {anchorEl && createPortal(
        <div className={styles.modalOverlay} onClick={() => setAnchorEl(null)}>
          <div 
            className={`${styles.formCard} animate-in`} 
            style={{ 
              top: (anchorEl.getBoundingClientRect().bottom + 12) + 'px', 
              right: (window.innerWidth - anchorEl.getBoundingClientRect().right) + 'px' 
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="section-title">Log a Decision</div>
          <div className={styles.formFields}>
            <div>
              <label className="label">What was decided? *</label>
              <textarea className="textarea" placeholder="e.g. We decided to use PostgreSQL instead of MongoDB for better relational data support" value={form.decision} onChange={e => set('decision', e.target.value)} style={{ borderRadius: '16px' }} />
            </div>
            <div>
              <label className="label">Why was this decided?</label>
              <textarea className="textarea" placeholder="The reasoning behind this decision" value={form.reason} onChange={e => set('reason', e.target.value)} style={{ minHeight: '60px', borderRadius: '16px' }} />
            </div>
            <div className={styles.twoCol}>
              <div style={{ position: 'relative' }}>
                <label className="label">People Involved</label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                  <button className="input" style={{ color: 'var(--text3)', padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', minHeight: '42px', borderRadius: '16px' }} onClick={(e) => { e.preventDefault(); setShowPeopleDropdown(!showPeopleDropdown); }}>
                    <span>{form.involvedPeople.length === 0 ? 'Select people' : '+ Add People'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {form.involvedPeople.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {form.involvedPeople.map((name: string, idx: number) => (
                            <div key={name} title={`Click to remove ${name}`} onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleMember(name); }} style={{ marginLeft: idx === 0 ? 0 : '-8px', borderRadius: '50%', position: 'relative', zIndex: 10 - idx, cursor: 'pointer', background: 'var(--surface2)', transition: 'transform 0.15s' }} onMouseEnter={e => e.currentTarget.style.transform='scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
                              <Avatar name={name} size={22} />
                            </div>
                          ))}
                        </div>
                      )}
                      {showPeopleDropdown ? <ChevronUp size={14} style={{ opacity: 0.5, color: 'var(--text3)' }} /> : <ChevronDown size={14} style={{ opacity: 0.5, color: 'var(--text3)' }} />}
                    </div>
                  </button>
                </div>

                {showPeopleDropdown && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowPeopleDropdown(false)} />
                    <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: '8px', background: '#1a1a1a', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px', zIndex: 100, width: '260px', boxShadow: '0 -8px 32px rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text2)', padding: '4px 8px', marginBottom: '4px' }}>Select Team Members</div>
                      <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {allMembers.map((m: any) => (
                          <div key={m.name} onClick={() => toggleMember(m.name)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '8px', cursor: 'pointer', background: form.involvedPeople.includes(m.name) ? 'rgba(255,255,255,0.08)' : 'transparent', transition: 'background 0.15s' }}>
                            <Avatar name={m.name} size={32} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>{m.name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{m.isLeader ? 'Team Leader' : 'Member'}</div>
                            </div>
                            {form.involvedPeople.includes(m.name) && <div style={{ color: 'var(--accent)' }}><Check size={16} /></div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <label className="label">Impact Level</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                  <button className="input" style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', width: '100%', minHeight: '42px', borderRadius: '16px' }} onClick={(e) => { e.preventDefault(); setShowImpactDropdown(!showImpactDropdown); }}>
                    <span style={{ textTransform: form.impact ? 'capitalize' : 'none', flex: 1, textAlign: 'left', color: !form.impact ? 'var(--text3)' : form.impact === 'critical' ? 'var(--red)' : form.impact === 'high' ? 'var(--yellow)' : form.impact === 'medium' ? '#a855f7' : 'var(--green)' }}>{form.impact || 'Select impact'}</span>
                    {showImpactDropdown ? <ChevronUp size={14} style={{ opacity: 0.5, color: 'var(--text3)' }} /> : <ChevronDown size={14} style={{ opacity: 0.5, color: 'var(--text3)' }} />}
                  </button>
                </div>

                {showImpactDropdown && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowImpactDropdown(false)} />
                    <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: '8px', background: '#1a1a1a', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px', zIndex: 100, width: '100%', minWidth: '160px', boxShadow: '0 -8px 32px rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text2)', padding: '4px 8px', marginBottom: '4px' }}>Select Impact</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {['low', 'medium', 'high', 'critical'].map(level => (
                          <div key={level} onClick={() => { set('impact', level); setShowImpactDropdown(false) }} style={{ padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', background: form.impact === level ? 'rgba(255,255,255,0.08)' : 'transparent', transition: 'background 0.15s', textTransform: 'capitalize', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: level === 'critical' ? 'var(--red)' : level === 'high' ? 'var(--yellow)' : level === 'medium' ? '#a855f7' : 'var(--green)', fontWeight: 500 }}>{level}</span>
                            {form.impact === level && <Check size={14} color="var(--accent)" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className={styles.formActions}>
            <button className="btn-primary" onClick={handleAdd} disabled={!form.decision || !form.impact} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Scale size={16} /> Save to Memory
            </button>
          </div>
        </div>
        </div>,
        document.body
      )}

      {decisions.length === 0 && !anchorEl && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><Scale size={40} /></div>
          <div className={styles.emptyTitle}>No decisions logged yet</div>
          <div className={styles.emptySub}>Start logging decisions so your AI can learn from them</div>
          <button className="btn-primary" onClick={(e) => setAnchorEl(e.currentTarget)}>Log First Decision</button>
        </div>
      )}

      <div className={styles.timeline}>
        {decisions.map((d, i) => (
          <div key={d.id} className={`${styles.decisionCard} animate-in`} style={{ animationDelay: `${i * 0.07}s` }}>
            <div className={styles.timelineLine} />
            <div className={styles.timelineDot} />
            <div className={styles.timelineConnector} />
            <div className={styles.decisionContent}>
              <div className={styles.decisionHeader}>
                <span className={styles.impactTag}>
                  {d.impact} impact
                </span>
                <span className={styles.decisionDate}>
                  {new Date(d.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={styles.decisionText}>{d.decision}</div>
              {d.reason && (
                <div className={styles.decisionReason}>
                  <span className={styles.reasonLabel}>Why:</span> {d.reason}
                </div>
              )}
              {d.involvedPeople && (d.involvedPeople.length > 0 || typeof d.involvedPeople === 'string') && (
                <div className={styles.decisionPeople} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: 500 }}>Involved:</div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {(Array.isArray(d.involvedPeople) ? d.involvedPeople : d.involvedPeople.split(',').map((s: string) => s.trim()).filter(Boolean)).map((name: string, idx: number) => (
                      <div key={idx} title={name} style={{ marginLeft: idx === 0 ? 0 : '-8px', borderRadius: '50%', position: 'relative', zIndex: 10 - idx, background: 'var(--surface2)' }}>
                        <Avatar name={name} size={28} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
