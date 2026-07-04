import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import styles from './LeaderOverview.module.css'
import { Activity, Users, Clock, CheckCircle2, CircleDashed, ListTodo, Scale, Sparkles, MessageSquare, Plus, ChevronRight, X, AlertTriangle, Lightbulb, Network, RefreshCw } from 'lucide-react'
import TeamMembers from './TeamMembers'
import Avatar from './Avatar'
import flowmindLogo from '../assets/flowmind.png'
import neo4jLogo from '../assets/neo4j.png'
import { generateInsights } from '../services/api'

export default function LeaderOverview({ setActiveTab }) {
  const { team, tasks, decisions, members, memoryFeed, memberProfiles, role } = useApp()
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [showInsightsModal, setShowInsightsModal] = useState(false)
  const [insights, setInsights] = useState<any>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)

  const handleRegenerateInsights = () => {
    if (!team?.code) return
    setLoadingInsights(true)
    setInsights(null)
    generateInsights(team.code, tasks, decisions, members).then(res => {
      setInsights(res)
      setLoadingInsights(false)
    })
  }

  useEffect(() => {
    if (showInsightsModal && team?.code && tasks.length > 0 && !insights && !loadingInsights) {
      setLoadingInsights(true)
      generateInsights(team.code, tasks, decisions, members).then(res => {
        setInsights(res)
        setLoadingInsights(false)
      })
    }
  }, [showInsightsModal, team?.code])
  const done = tasks.filter(t => t.status === 'done').length
  const inProgress = tasks.filter(t => t.status === 'in-progress').length
  const todo = tasks.filter(t => t.status === 'todo').length
  const healthScore = tasks.length === 0 ? 100 : Math.round((done / tasks.length) * 60 + (inProgress / tasks.length) * 30 + 10)

  const healthColor = healthScore >= 70 ? 'var(--green)' : healthScore >= 40 ? 'var(--yellow)' : 'var(--red)'

  return (
    <div className={styles.wrap}>

      {/* Top Main Cards */}
      <div className={styles.shareRow}>
        {/* Team Code Card */}
        <div className={`${styles.card} ${styles.codeCardHorizontal}`}>
          <div className={styles.cardIconWrapper} style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
            <Users size={18} />
          </div>
          <div className={styles.cardTitle} style={{ marginRight: 'auto', marginBottom: 0 }}>Share with Team</div>

          <div className={styles.codeDisplayHorizontal}>Code: {team?.code}</div>

          <div className={styles.memberAvatars}>
            {members.slice(0, 5).map((m, i) => {
              return (
                <div key={i} style={{ zIndex: 10 - i, cursor: 'pointer', marginLeft: i > 0 ? '-10px' : '0' }} title={m.name} onClick={() => setActiveTab('members')}>
                  <Avatar name={m.name} size={32} />
                </div>
              )
            })}
            {members.length > 5 && (
              <div
                className={styles.avatarCircle}
                style={{ background: 'var(--surface2)', zIndex: 1, cursor: 'pointer' }}
                title="View all members"
                onClick={() => setActiveTab('members')}
              >
                +{members.length - 5}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.middleRow}>
        {/* Health score */}
        <div className={`${styles.card} ${styles.healthCard}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIconWrapper} style={{ background: `${healthColor}20`, color: healthColor }}>
              <Activity size={18} />
            </div>
            <div className={styles.cardTitle}>Team Health</div>
          </div>
          <div className={styles.healthContent}>
            <div className={styles.healthScore} style={{ color: healthColor }}>
              {healthScore}
              <span className={styles.healthSub}>/ 100</span>
            </div>
            <div className={styles.healthBar}>
              <div className={styles.healthFill} style={{ width: `${healthScore}%`, background: healthColor, boxShadow: `0 0 10px ${healthColor}80` }} />
            </div>
            <div className={styles.healthHint}>
              {healthScore >= 70 ? 'Team is on track' : healthScore >= 40 ? 'Some tasks need attention' : 'Team needs help'}
            </div>
          </div>
        </div>

        {/* Insights & Deadline Split */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minHeight: 0 }}>
          {/* Neo4j Insights Button */}
          <div 
            className={styles.card} 
            style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', cursor: 'pointer', minHeight: 0 }}
            onClick={() => setShowInsightsModal(true)}
          >
            <div className={styles.cardHeader} style={{ marginBottom: '4px' }}>
              <div className={styles.cardIconWrapper} style={{ background: 'transparent', color: 'var(--text)' }}>
                <Network size={18} />
              </div>
              <div className={styles.cardTitle}>Graph Insights</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: 'auto', marginBottom: 'auto' }}>
              <div style={{ fontSize: '12px', color: 'var(--text2)', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 10px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Insights by <img src={neo4jLogo} alt="Neo4j" style={{ height: '14px', objectFit: 'contain', filter: 'invert(1) hue-rotate(180deg)' }} />
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: '12px', right: '12px', color: 'var(--text3)', opacity: 0.7 }}>
              <ChevronRight size={16} />
            </div>
          </div>

          {/* Deadline */}
          <div className={`${styles.card} ${styles.deadlineCard}`} style={{ flex: 1, padding: '16px', margin: 0, minHeight: 0 }}>
            <div className={styles.cardHeader} style={{ marginBottom: '12px' }}>
              <div className={styles.cardIconWrapper} style={{ background: 'transparent', color: 'var(--text)' }}>
                <Clock size={18} />
              </div>
              <div className={styles.cardTitle}>Deadline</div>
              {team?.deadline && (
                <div className={styles.deadlineDays} style={{ marginLeft: 'auto', fontSize: '10px', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 6px', borderRadius: '10px' }}>
                  {Math.max(0, Math.ceil((new Date(team.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days left
                </div>
              )}
            </div>
            <div className={styles.deadlineContent} style={{ marginTop: 'auto', marginBottom: '10px', textAlign: 'center' }}>
              <div className={styles.deadlineDate} style={{ marginBottom: '4px' }}>
                {team?.deadline ? new Date(team.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'}
              </div>
            </div>
          </div>
        </div>

        {/* Vertical Quick Actions */}
        <div className={styles.verticalActions}>
          <button className={styles.verticalActionBtn} onClick={() => setActiveTab(role === 'leader' ? 'tasks' : 'mytasks')} title={role === 'leader' ? "Assign a Task" : "View My Tasks"}>
            <Plus size={20} />
          </button>
          <button className={styles.verticalActionBtn} onClick={() => setActiveTab('decisions')} title="Log a Decision">
            <Scale size={20} />
          </button>
          <button className={styles.verticalActionBtn} onClick={() => setActiveTab('chat')} title="Ask AI AI Assistant">
            <MessageSquare size={20} />
          </button>
        </div>
      </div>

      {/* Task Stats */}
      <div className={styles.statsRow}>
        {[
          { label: 'To Do', val: todo, color: 'var(--text2)', icon: ListTodo },
          { label: 'In Progress', val: inProgress, color: 'var(--yellow)', icon: CircleDashed },
          { label: 'Done', val: done, color: 'var(--green)', icon: CheckCircle2 },
          { label: 'Decisions', val: decisions.length, color: 'var(--accent2)', icon: Scale },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className={styles.statCard}>
              <div className={styles.statTop}>
                <div className={styles.statLabel}>{s.label}</div>
                <Icon size={16} style={{ color: s.color }} />
              </div>
              <div className={styles.statVal} style={{ color: s.color }}>{s.val}</div>
            </div>
          )
        })}
      </div>

      {/* Insights are now in a modal */}
      {/* Recent tasks */}
      {tasks.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>Recent Tasks</div>
            <button className="btn-ghost" onClick={() => setActiveTab(role === 'leader' ? 'tasks' : 'mytasks')} style={{ fontSize: '13px' }}>View All</button>
          </div>
          <div className={styles.taskList}>
            {[...tasks].reverse().sort((a, b) => {
              if (a.status === 'done' && b.status !== 'done') return 1;
              if (a.status !== 'done' && b.status === 'done') return -1;
              return 0;
            }).slice(0, 4).map(task => (
              <div key={task.id} className={styles.taskRow}>
                <div className={styles.taskStatus} data-status={task.status} />
                <div className={styles.taskTitle}>{task.title}</div>
                <div className={styles.taskMeta}>{task.assignedTo}</div>
                <span className={`tag ${task.status === 'done' ? 'tag-green' : task.status === 'in-progress' ? 'tag-yellow' : 'tag-purple'}`}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Members Modal */}
      {showMembersModal && (
        <div className={styles.modalOverlay} onClick={() => setShowMembersModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setShowMembersModal(false)}>
              <X size={20} />
            </button>
            <div className={styles.modalScroll}>
              <TeamMembers />
            </div>
          </div>
        </div>
      )}
      {/* Neo4j Insights Modal */}
      {showInsightsModal && (
        <div className={styles.modalOverlay} onClick={() => setShowInsightsModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ width: '900px', maxWidth: '90vw', minHeight: '500px' }}>
            <div className={styles.modalScroll} style={{ display: 'flex', flexDirection: 'column', padding: '32px 32px 32px 32px' }}>
              <div className={styles.sectionHeader} style={{ marginBottom: '24px', alignItems: 'center' }}>
                <div className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)' }}>
                  <img src={neo4jLogo} alt="Neo4j" style={{ height: '24px', objectFit: 'contain', filter: 'invert(1) hue-rotate(180deg)' }} />
                  Graph Insights
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button 
                    onClick={handleRegenerateInsights} 
                    disabled={loadingInsights}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text3)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: loadingInsights ? 0.3 : 0.7 }}
                    onMouseOver={e => !loadingInsights && (e.currentTarget.style.opacity = '1')}
                    onMouseOut={e => !loadingInsights && (e.currentTarget.style.opacity = '0.7')}
                  >
                    <RefreshCw size={14} />
                    Regenerate
                  </button>
                  <button onClick={() => setShowInsightsModal(false)} className={styles.headerIconBtn}>
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              {!insights && !loadingInsights && (
                <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '40px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Insights are not available right now.
                </div>
              )}

              {loadingInsights && (
                <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '40px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                  <span className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px', borderColor: 'var(--accent) transparent var(--accent) transparent' }} />
                  Analyzing team data and FlowMind memory...
                </div>
              )}

              {insights && !loadingInsights && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', flex: 1, overflow: 'hidden' }}>
                  {/* Bottlenecks (Powered by Graph) */}
                  <div className={styles.card} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, boxShadow: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '20px 20px 16px 20px', flexShrink: 0 }}>
                      <Network size={18} color="#7ffe7dff" />
                      <span style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '13px', letterSpacing: '0.05em', color: '#fff' }}>Graph Bottlenecks</span>
                    </div>
                    {insights.bottlenecks?.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', padding: '0 20px 20px 20px' }}>
                        {insights.bottlenecks.map((b: any, i: number) => (
                          <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <strong style={{ fontSize: '14px' }}>{b.person}</strong>
                              <span style={{ fontSize: '12px', color: 'var(--red)', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '100px' }}>{b.waiting} days</span>
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>Blocking: {b.task}</div>
                            {b.graph_insight && (
                              <div style={{ fontSize: '12px', color: 'var(--text3)', borderLeft: '2px solid var(--red)', paddingLeft: '8px' }}>
                                {b.graph_insight}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text3)', fontSize: '14px' }}>No graph bottlenecks detected.</div>
                    )}
                  </div>

                  {/* General Risks & Recommendations */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', overflow: 'hidden' }}>
                    <div className={styles.card} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, boxShadow: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '20px 20px 12px 20px', color: 'var(--yellow)', flexShrink: 0 }}>
                        <Lightbulb size={18} />
                        <span style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '13px', letterSpacing: '0.05em', color: '#fff' }}>AI Recommendation</span>
                      </div>
                      <div style={{ overflowY: 'auto', padding: '0 20px 20px 20px' }}>
                        <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text2)', margin: 0 }}>
                          {insights.recommendation || "Maintain current task velocity."}
                        </p>
                      </div>
                    </div>

                    <div className={styles.card} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, boxShadow: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '20px 20px 12px 20px', color: 'var(--text)', flexShrink: 0 }}>
                        <Activity size={18} />
                        <span style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '13px', letterSpacing: '0.05em', color: '#fff' }}>Detected Risks</span>
                      </div>
                      <div style={{ overflowY: 'auto', padding: '0 20px 20px 20px' }}>
                        {insights.risks?.length > 0 ? (
                          <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text2)', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {insights.risks.map((r: any, i: number) => (
                              <li key={i}>
                                <strong>{r.member}</strong>: {r.reason}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div style={{ color: 'var(--text3)', fontSize: '14px' }}>No immediate risks detected.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
