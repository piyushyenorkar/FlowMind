import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Check, CheckCircle2, Mic, MicOff, FileText, Pin, Scale, Users, User, Bookmark, Bot, Clock, Calendar, Brain, Loader2, ChevronDown, ChevronUp, Edit2, X, Play, History, RefreshCw, ShieldCheck } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'
import Avatar from './Avatar'
import { analyzeMeeting } from '../utils/meetingAnalyzer'
import { storeMeeting, storeTask } from '../utils/hindsightClient'
import { useAgora } from '../hooks/useAgora'
import styles from './MeetingsTab.module.css'

const AVATAR_COLORS = ['#7c6aff', '#22d3a0', '#ff6b6b', '#fbbf24', '#a78bfa', '#34bfff']

// Helper: determine if current user is the host of a meeting
// Falls back to attendee[0] / activeAttendee[0] for old meetings created before the `leader` column existed
function isHostOfMeeting(meeting: any, currentUserName: string | undefined): boolean {
  if (!currentUserName) return false
  // If leader field is set (new meetings), use it directly
  if (meeting?.leader) return meeting.leader === currentUserName
  // Fallback for old meetings: first attendee or first active attendee is the host
  if (meeting?.activeAttendees?.[0] === currentUserName) return true
  if (meeting?.attendees?.[0] === currentUserName) return true
  return false
}

// ── Step Indicator ─────────────────────────────────────────────────────────
function StepBar({ step }) {
  const labels = ['Setup', 'Voice Meeting', 'Review & Confirm']
  return (
    <div className={styles.steps}>
      {labels.map((l, i) => (
        <div key={i} className={`${styles.step} ${i + 1 === step ? styles.stepActive : ''} ${i + 1 < step ? styles.stepDone : ''}`}>
          <div className={styles.stepCircle}>{i + 1 < step ? <Check size={14} /> : i + 1}</div>
          <div className={styles.stepLabel}>{l}</div>
          {i < labels.length - 1 && <div className={styles.stepLine} />}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
export default function MeetingsTab() {
  const { meetings, members, tasks, decisions, memberProfiles, addTask, addDecision, addMeeting, scheduleMeeting, startLiveMeeting, joinLiveMeeting, addMemory, team, role, currentUser } = useApp()
  const [view, setViewInternal] = useState('list')
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const historyDepth = useRef(0)

  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state?.meetingsView) {
        setViewInternal(e.state.meetingsView)
        historyDepth.current = 1
      } else {
        setViewInternal('list')
        historyDepth.current = 0
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const setView = useCallback((newView) => {
    if (newView === 'list') {
      if (historyDepth.current > 0) {
        window.history.go(-historyDepth.current)
        historyDepth.current = 0
      }
      setViewInternal('list')
    } else {
      if (historyDepth.current === 0) {
        window.history.pushState({ meetingsView: newView }, '', window.location.hash)
        historyDepth.current = 1
      } else {
        window.history.replaceState({ meetingsView: newView }, '', window.location.hash)
      }
      setViewInternal(newView)
    }
  }, [])

  if (view === 'list') return <ListView meetings={meetings} members={members} setView={setView} setSelected={setSelectedMeeting} currentUser={currentUser} joinLiveMeeting={joinLiveMeeting} scheduleMeeting={scheduleMeeting} startLiveMeeting={startLiveMeeting} />
  if (view === 'create') return <CreateFlow members={members} tasks={tasks} decisions={decisions} memberProfiles={memberProfiles} addTask={addTask} addDecision={addDecision} addMeeting={addMeeting} scheduleMeeting={scheduleMeeting} startLiveMeeting={startLiveMeeting} addMemory={addMemory} team={team} setView={setView} setSelected={setSelectedMeeting} selectedMeeting={selectedMeeting} currentUser={currentUser} meetings={meetings} />
  if (view === 'detail') return <DetailView meeting={selectedMeeting} tasks={tasks} setView={setView} />
  if (view === 'voiceRoom' && selectedMeeting) return <ActiveVoiceRoom meeting={selectedMeeting} members={members} memberProfiles={memberProfiles} setView={setView} addMeeting={addMeeting} tasks={tasks} decisions={decisions} currentUser={currentUser} startLiveMeeting={startLiveMeeting} meetings={meetings} />
  return null
}

// ═══════════ LIST VIEW ═══════════════════════════════════════════════════════
function ListView({ meetings, members, setView, setSelected, currentUser, joinLiveMeeting, scheduleMeeting, startLiveMeeting }) {
  const pastMeetings = meetings.filter(m => m.status === 'completed')
  const liveMeetings = meetings.filter(m => m.status === 'ongoing')
  const allScheduled = meetings.filter(m => m.status === 'scheduled')

  // Split scheduled into truly upcoming vs overdue (date has passed)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcomingMeetings = allScheduled.filter(m => {
    if (!m.date) return true // No date = treat as upcoming
    return new Date(m.date) >= today
  })
  const overdueMeetings = allScheduled.filter(m => {
    if (!m.date) return false
    return new Date(m.date) < today
  })

  const totalTasks = pastMeetings.reduce((s, m) => s + (m.tasksCreated?.length || 0), 0)
  const totalDecisions = pastMeetings.reduce((s, m) => s + (m.decisionsLogged?.length || 0), 0)
  const lastDate = pastMeetings.length > 0 ? new Date(pastMeetings[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'

  // Reschedule handler: opens create form pre-filled with meeting data
  const handleReschedule = (m) => {
    setSelected({ ...m, _reschedule: true })
    setView('create')
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <div>
          <div className={styles.headerTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mic size={20} /> AI Meetings</div>
          <div className={styles.headerSub}>Voice meetings analyzed and converted to tasks</div>
        </div>
        <button className="btn-primary" onClick={() => setView('create')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mic size={16} /> New Meeting</button>
      </div>

      <div className={styles.statsRow}>
        {[
          { v: pastMeetings.length, l: 'Total Meetings' },
          { v: totalTasks, l: 'Tasks Created' },
          { v: totalDecisions, l: 'Decisions Logged' },
          { v: lastDate, l: 'Last Meeting' },
        ].map((s, i) => (
          <div key={i} className={styles.statCard}>
            <div className={styles.statValue}>{s.v}</div>
            <div className={styles.statLabel}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* ── Upcoming Meetings ─────────────────────────────── */}
      {upcomingMeetings.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={16} /> Upcoming Meetings</h3>
          <div className={styles.grid}>
            {upcomingMeetings.map(m => {
              const isHost = isHostOfMeeting(m, currentUser?.name);
              const isInvited = m.attendees?.includes(currentUser?.name) || isHost;

              return (
                <div key={m.id} className={styles.meetingCard} style={{ cursor: isHost ? 'pointer' : 'default' }} onClick={() => {
                  if (isHost) {
                    setSelected(m); setView('create');
                  }
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div className={styles.cardTitle}>{m.title}</div>
                      <div className={styles.cardDate}>{m.date ? new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Scheduled'}</div>
                    </div>
                    {isHost ? (
                      <button
                        className="btn-primary"
                        style={{ fontSize: '12px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(m); setView('create');
                        }}
                      >
                        <Play size={12} /> Start
                      </button>
                    ) : (
                      <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--surface2)', padding: '4px 8px', borderRadius: '12px' }}>
                        <Clock size={12} /> Waiting for host
                      </div>
                    )}
                  </div>
                  <div className={styles.cardAvatars}>
                    {m.attendees?.slice(0, 4).map((a, i) => (
                      <div key={i} className={styles.avatarWrapper}>
                        <Avatar name={a} size={28} />
                      </div>
                    ))}
                    {(m.attendees?.length || 0) > 4 && <div className={styles.cardAvatar} style={{ background: 'var(--surface2)' }}>+{m.attendees.length - 4}</div>}
                  </div>
                  <div className={styles.cardSummary}>
                    {isHost
                      ? 'You are the host — click to start'
                      : isInvited
                        ? `Hosted by ${m.leader || 'team member'} — waiting to start`
                        : `Hosted by ${m.leader || 'team member'}`
                    }
                  </div>
                  {m.agenda && (
                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      📋 {m.agenda}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Overdue / Missed Meetings ─────────────────────────────── */}
      {overdueMeetings.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} /> Missed Meetings</h3>
          <div className={styles.grid}>
            {overdueMeetings.map(m => {
              const isHost = isHostOfMeeting(m, currentUser?.name);
              const isInvited = m.attendees?.includes(currentUser?.name) || isHost;

              return (
                <div key={m.id} className={styles.meetingCard} style={{ opacity: 0.85 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div className={styles.cardTitle}>{m.title}</div>
                      <div className={styles.cardDate} style={{ color: 'var(--red, #ef4444)' }}>
                        {m.date ? new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Overdue'} — Missed
                      </div>
                    </div>
                    {isHost ? (
                      <button
                        className="btn-primary"
                        style={{ fontSize: '12px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--yellow, #f59e0b)', color: '#000' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReschedule(m);
                        }}
                      >
                        <RefreshCw size={12} /> Reschedule
                      </button>
                    ) : (
                      <div style={{ fontSize: '11px', color: 'var(--red, #ef4444)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(239,68,68,0.1)', padding: '4px 8px', borderRadius: '12px' }}>
                        <Clock size={12} /> Missed
                      </div>
                    )}
                  </div>
                  <div className={styles.cardAvatars}>
                    {m.attendees?.slice(0, 4).map((a, i) => (
                      <div key={i} className={styles.avatarWrapper}>
                        <Avatar name={a} size={28} />
                      </div>
                    ))}
                    {(m.attendees?.length || 0) > 4 && <div className={styles.cardAvatar} style={{ background: 'var(--surface2)' }}>+{m.attendees.length - 4}</div>}
                  </div>
                  <div className={styles.cardSummary} style={{ color: 'var(--text3)' }}>
                    {isHost
                      ? 'This meeting was missed — click Reschedule to pick a new date'
                      : isInvited
                        ? `Hosted by ${m.leader || 'team member'} — meeting was not started`
                        : `Hosted by ${m.leader || 'team member'} — missed`
                    }
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Live Meetings ─────────────────────────────── */}
      {liveMeetings.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '6px' }}><div className={styles.liveDotGreen} /> Live Meetings</h3>
          <div className={styles.grid}>
            {liveMeetings.map(m => {
              const isJoined = m.activeAttendees?.includes(currentUser?.name);
              const isInvited = m.attendees?.includes(currentUser?.name);
              const isHost = isHostOfMeeting(m, currentUser?.name);

              return (
                <div key={m.id} className={styles.meetingCard} style={{ border: '1px solid var(--green)' }} onClick={() => {
                  if (isJoined || isHost) {
                    setSelected(m); setView('voiceRoom');
                  } else if (isInvited) {
                    joinLiveMeeting(m.id);
                    setSelected(m);
                    setView('voiceRoom');
                  }
                }}>
                  <div className={styles.cardTitle}>{m.title}</div>
                  <div className={styles.cardDate}>Live Now</div>
                  <div className={styles.cardAvatars}>
                    {m.activeAttendees?.slice(0, 4).map((a, i) => (
                      <div key={i} className={styles.avatarWrapper}>
                        <Avatar name={a} size={28} />
                      </div>
                    ))}
                    {(m.activeAttendees?.length || 0) > 4 && <div className={styles.cardAvatar} style={{ background: 'var(--surface2)' }}>+{m.activeAttendees.length - 4}</div>}
                  </div>
                  <div className={styles.cardSummary}>
                    {isJoined || isHost ? 'Click to re-enter room' : isInvited ? 'Click to Join' : 'You are not invited'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Past Meetings ─────────────────────────────── */}
      <h3 style={{ fontSize: '14px', margin: '4px 0 12px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}><History size={16} /> Past Meetings</h3>
      {pastMeetings.length === 0 ? (
        <div className={styles.emptyCard}>
          <div className={styles.emptyIcon}><Mic size={40} /></div>
          <div className={styles.emptyTitle}>No meetings yet</div>
          <div className={styles.emptySub}>Start a voice meeting and let AI auto-assign tasks</div>
          <button className="btn-primary" onClick={() => setView('create')}>Start New Meeting</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {pastMeetings.map(m => (
            <div key={m.id} className={styles.meetingCard} onClick={() => { setSelected(m); setView('detail') }}>
              <div className={styles.cardTitle}>{m.title}</div>
              <div className={styles.cardDate}>{new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              <div className={styles.cardAvatars}>
                {m.attendees?.slice(0, 4).map((a, i) => (
                  <div key={i} className={styles.avatarWrapper}>
                    <Avatar name={a} size={28} />
                  </div>
                ))}
                {(m.attendees?.length || 0) > 4 && <div className={styles.cardAvatar} style={{ background: 'var(--surface2)' }}>+{m.attendees.length - 4}</div>}
              </div>
              <div className={styles.cardStats}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Pin size={14} /> {m.tasksCreated?.length || 0} tasks</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Scale size={14} /> {m.decisionsLogged?.length || 0} decisions</span>
              </div>
              <div className={styles.cardSummary}>{m.summary}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════ CREATE FLOW ═══════════════════════════════════════════════════
function CreateFlow({ members, tasks, decisions, memberProfiles, addTask, addDecision, addMeeting, scheduleMeeting, startLiveMeeting, addMemory, team, setView, setSelected, selectedMeeting, currentUser, meetings }) {
  const isReschedule = selectedMeeting?._reschedule === true
  const [step, setStep] = useState(() => {
    if (isReschedule) return 1 // Go back to setup to change date
    return selectedMeeting?.status === 'scheduled' ? 2 : 1
  })
  const [title, setTitle] = useState(selectedMeeting?.title || '')
  const [date, setDate] = useState(isReschedule ? '' : (selectedMeeting?.date || ''))
  const [attendees, setAttendees] = useState(selectedMeeting?.attendees || [])
  const [agenda, setAgenda] = useState(selectedMeeting?.agenda || '')
  const [transcript, setTranscript] = useState('')
  const [duration, setDuration] = useState(0)

  const [analysis, setAnalysis] = useState(null)
  const [checkedTasks, setCheckedTasks] = useState({})
  const [checkedDecisions, setCheckedDecisions] = useState({})
  const [taskAssignees, setTaskAssignees] = useState({})
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeStep, setAnalyzeStep] = useState('')
  const [success, setSuccess] = useState(false)

  const toggleAttendee = (name) => {
    setAttendees(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  }

  // ── STEP 2: End meeting & analyze ────────────────────────────────────
  const handleEndMeeting = async () => {
    setStep(3)
    setAnalyzing(true)

    const steps = ['Reading transcript...', 'Analyzing team skill profiles...', 'Matching tasks to members...', 'Generating meeting summary...']
    for (const s of steps) {
      setAnalyzeStep(s)
      await new Promise(r => setTimeout(r, 600))
    }

    const result = await analyzeMeeting({
      transcript,
      attendees,
      memberProfiles,
      pastTasks: tasks,
      pastDecisions: decisions,
    })

    setAnalysis(result)

    // Default all checked
    const tc = {}; result.tasks?.forEach((_, i) => tc[i] = true)
    const dc = {}; result.decisions?.forEach((_, i) => dc[i] = true)
    const ta = {}; result.tasks?.forEach((t, i) => ta[i] = t.assignedTo)
    setCheckedTasks(tc)
    setCheckedDecisions(dc)
    setTaskAssignees(ta)
    setAnalyzing(false)
  }

  // ── STEP 3: Confirm & create ─────────────────────────────────────────
  const handleConfirm = () => {
    const meetingId = selectedMeeting?.id || ('meeting_' + Date.now())
    const createdTasks = []
    const loggedDecisions = []

    // Create tasks
    analysis.tasks?.forEach((t, i) => {
      if (!checkedTasks[i]) return
      const taskData = {
        id: `mt_${Date.now()}_${i}`,
        title: t.title,
        description: t.description,
        assignedTo: taskAssignees[i] || t.assignedTo,
        status: 'todo',
        deadline: t.deadline || '',
        estimatedHours: t.estimatedHours,
        priority: t.priority,
        taskType: t.taskType,
        assignmentReason: t.assignmentReason,
        meetingSource: meetingId,
        createdAt: new Date().toISOString(),
        updates: [],
      }
      addTask(taskData)
      createdTasks.push(taskData)
      storeTask(taskData, meetingId)
    })

    // Create decisions
    analysis.decisions?.forEach((d, i) => {
      if (!checkedDecisions[i]) return
      const decData = {
        id: `md_${Date.now()}_${i}`,
        decision: d.decision,
        reason: d.reason,
        impact: d.impact,
        involvedPeople: d.involvedPeople,
        meetingSource: meetingId,
      }
      addDecision(decData)
      loggedDecisions.push(decData)
    })

    // Save meeting
    const meetingObj = {
      id: meetingId,
      title,
      date,
      attendees,
      transcript,
      duration,
      summary: analysis.summary,
      keyTopics: analysis.keyTopics,
      tasksCreated: createdTasks,
      decisionsLogged: loggedDecisions,
      followUpItems: analysis.followUpItems || [],
      analyzedAt: new Date().toISOString(),
      memoryStored: true,
    }
    addMeeting(meetingObj)
    storeMeeting({ ...meetingObj, teamCode: team?.code })
    setSuccess(true)
    setSelected(meetingObj)
  }

  // ── Render Steps ─────────────────────────────────────────────────────
  return (
    <div className={styles.wrap}>
      <StepBar step={step} />

      {/* STEP 1: Setup */}
      {step === 1 && (
        <div className={styles.setupForm}>
          <div className="section-title">{isReschedule ? 'Reschedule Meeting' : 'Meeting Setup'}</div>
          {isReschedule && (
            <div style={{ background: 'var(--surface2)', borderRadius: '16px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: 'var(--white, #fff)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={14} style={{ color: 'var(--primary1)' }} /> Pick a new date for this meeting. Title, attendees, and agenda are preserved.
            </div>
          )}

          <div className={styles.setupMasterBox}>
            <div className={styles.setupGridContent}>
              <div className={styles.setupLeft}>
                <div className={styles.field || ''}>
                  <label className="label">Meeting Title</label>
                  <input className="input" placeholder="e.g. Sprint Planning" value={title} onChange={e => setTitle(e.target.value)} style={{ borderRadius: '16px' }} />
                </div>
                <div>
                  <label className="label">Date</label>
                  <input className={`input ${!date ? styles.emptyDateInput : ''}`} type="date" value={date} onChange={e => setDate(e.target.value)} style={{ colorScheme: 'dark', color: date ? 'var(--text)' : 'var(--text3)', borderRadius: '16px' }} />
                </div>
                <div>
                  <label className="label">Agenda (optional)</label>
                  <textarea className="textarea" placeholder="What will be discussed..." value={agenda} onChange={e => setAgenda(e.target.value)} style={{ borderRadius: '16px' }} />
                </div>
                <button className="btn-primary" disabled={!title.trim() || attendees.length === 0} onClick={() => {
                  const meetingId = isReschedule ? selectedMeeting.id : 'meeting_' + Date.now()
                  const meetingObj = {
                    id: meetingId,
                    title,
                    date,
                    attendees,
                    agenda,
                    transcript: '',
                    duration: 0,
                  }
                  scheduleMeeting(meetingObj);
                  setSelected(meetingObj);
                  setStep(2);
                }} style={{ alignSelf: 'flex-start', marginTop: '16px' }}>
                  Create Meeting
                </button>
              </div>

              <div className={styles.divider}></div>

              <div className={styles.setupRight}>
                <label className="label">Select Attendees</label>
                <div className={styles.attendeeList}>
                  {members.map((m, i) => (
                    <div
                      key={m.id || i}
                      className={`${styles.attendeeRowCard} ${attendees.includes(m.name) ? styles.attendeeSelected : ''}`}
                      onClick={() => toggleAttendee(m.name)}
                    >
                      <Avatar name={m.name} size={32} style={{ borderRadius: '12px' }} />
                      <div className={styles.attendeeInfo} style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                        <div className={styles.attendeeName} style={{ lineHeight: '1.2' }}>{m.name}</div>
                        <div className={styles.attendeeRole} style={{ fontSize: '11px', color: 'var(--text3)', lineHeight: '1' }}>{m.role || 'Member'}</div>
                      </div>
                      {attendees.includes(m.name) && (
                        <CheckCircle2 size={16} color="var(--green)" style={{ marginLeft: 'auto' }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Voice Room */}
      {step === 2 && (
        <VoiceRoom
          meeting={meetings.find(m => m.id === selectedMeeting?.id) || selectedMeeting}
          isLeader={true}
          transcript={transcript}
          setTranscript={setTranscript}
          duration={duration}
          setDuration={setDuration}
          onEnd={handleEndMeeting}
          onLeave={() => setView('list')}
          memberProfiles={memberProfiles}
          onStart={() => {
            const mId = selectedMeeting?.id || (meetings.find(m => m.id === selectedMeeting?.id)?.id)
            if (mId) startLiveMeeting(mId);
          }}
        />
      )}

      {/* STEP 3: Review */}
      {step === 3 && analyzing && (
        <div className={styles.analyzing}>
          <div className={styles.analyzingIcon}><span className="spinner" /></div>
          <div className={styles.analyzingTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}><Bot size={18} /> AI is analyzing your meeting...</div>
          <div className={styles.analyzingStep}>{analyzeStep}</div>
        </div>
      )}

      {step === 3 && !analyzing && !success && analysis && (
        <ReviewSection
          analysis={analysis}
          attendees={attendees}
          checkedTasks={checkedTasks}
          setCheckedTasks={setCheckedTasks}
          checkedDecisions={checkedDecisions}
          setCheckedDecisions={setCheckedDecisions}
          taskAssignees={taskAssignees}
          setTaskAssignees={setTaskAssignees}
          onBack={() => setStep(2)}
          onConfirm={handleConfirm}
        />
      )}

      {step === 3 && success && (
        <div className={styles.successScreen}>
          <div className={styles.successIcon}><CheckCircle2 size={40} /></div>
          <div className={styles.successTitle}>Meeting saved to FlowMind Memory</div>
          <div className={styles.successStat} style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}><Pin size={16} /> {Object.values(checkedTasks).filter(Boolean).length} tasks created and assigned</div>
          <div className={styles.successStat} style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}><Scale size={16} /> {Object.values(checkedDecisions).filter(Boolean).length} decisions logged</div>
          <div className={styles.successActions}>
            <button className="btn-primary" onClick={() => setView('detail')}>View Meeting</button>
            <button className="btn-secondary" onClick={() => setView('list')}>Back to Meetings</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════ VOICE ROOM ══════════════════════════════════════════════════
function VoiceRoom({ meeting, isLeader, transcript, setTranscript, duration, setDuration, onEnd, onLeave, memberProfiles, onStart }) {
  const { user } = useAuth()
  const title = meeting?.title || 'Live Meeting'
  const attendees = meeting?.attendees || []
  const activeAttendees = meeting?.activeAttendees || []

  const [micStatus, setMicStatus] = useState<'idle' | 'requesting' | 'listening' | 'paused' | 'denied' | 'unsupported'>('idle')
  const [meetingState, setMeetingState] = useState(meeting?.status === 'ongoing' ? 'active' : 'idle') // idle | active | paused

  // Sync meetingState from meeting status (realtime updates)
  useEffect(() => {
    if (meeting?.status === 'ongoing' && meetingState === 'idle') {
      setMeetingState('active')
    }
  }, [meeting?.status, meetingState])

  // Auto-exit when host ends meeting (status changes to 'completed')
  useEffect(() => {
    if (meeting?.status === 'completed' && meetingState === 'active') {
      stoppedByUserRef.current = true
      clearInterval(timerRef.current)
      recognitionRef.current?.stop()
      agora.leave()
      onLeave?.()
    }
  }, [meeting?.status])

  const [showTranscript, setShowTranscript] = useState(true)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualNoteError, setManualNoteError] = useState(false)
  const [interimText, setInterimText] = useState('')
  const timerRef = useRef<any>(null)
  const recognitionRef = useRef<any>(null)
  const finalTranscriptRef = useRef(transcript || '')


  const micStatusRef = useRef(micStatus)
  useEffect(() => { micStatusRef.current = micStatus }, [micStatus])

  const stoppedByUserRef = useRef(false)
  const transcriptEndRef = useRef<any>(null)
  const transcriptSyncRef = useRef<any>(null)
  const startTimeRef = useRef<number>(Date.now()) // Track when this user's meeting started

  // ── Agora Live Audio ─────────────────────────────────────────────────
  const agora = useAgora(meeting?.id || '', user?.id || user?.name || 'anonymous')

  // Auto-join Agora when meeting becomes active
  useEffect(() => {
    if (meetingState === 'active' && !agora.isConnected && !agora.isConnecting) {
      agora.join()
    }
  }, [meetingState, agora.isConnected, agora.isConnecting])

  // Auto-start mic for ALL users when meeting becomes active
  useEffect(() => {
    if (meetingState === 'active' && micStatus === 'idle') {
      // Small delay to avoid race with Agora join
      const t = setTimeout(() => startListening(), 500)
      return () => clearTimeout(t)
    }
  }, [meetingState])

  // ── Real-time Transcript Broadcast ───────────────────────────────────
  const broadcastChannelRef = useRef<any>(null)
  const [broadcastStatus, setBroadcastStatus] = useState<string>('connecting')

  useEffect(() => {
    if (!meeting?.id) return
    const channel = supabase.channel(`room-${meeting.id}`, {
      config: {
        broadcast: { ack: true },
      },
    })

    channel.on('broadcast', { event: 'speech' }, (payload) => {
      console.log('[VoiceRoom] Received broadcast:', payload)
      const newLine = payload.payload?.text
      if (newLine) {
        const localLines = finalTranscriptRef.current.split('\n').filter(l => l.trim())
        if (!localLines.includes(newLine.trim())) {
          const merged = finalTranscriptRef.current + newLine + '\n'
          finalTranscriptRef.current = merged
          setTranscript(merged)
        }
      }
    }).subscribe((status) => {
      console.log('[VoiceRoom] Broadcast channel status:', status)
      if (status === 'SUBSCRIBED') setBroadcastStatus('connected')
      else if (status === 'CHANNEL_ERROR') setBroadcastStatus('error')
    })

    broadcastChannelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [meeting?.id])

  // ── Sync transcript TO Supabase (Host Only) ──────────────────────────
  useEffect(() => {
    if (!meeting?.id || !transcript) return
    // ONLY the meeting leader (host) syncs the transcript to the database
    // This prevents RLS permission errors and concurrent write overwrites
    if (user?.name !== meeting?.leader) return

    clearTimeout(transcriptSyncRef.current)
    transcriptSyncRef.current = setTimeout(() => {
      supabase.from('meetings').update({ transcript }).eq('id', meeting.id).then(({ error }) => {
        if (error) console.warn('[VoiceRoom] Transcript sync error:', error.message)
      })
    }, 1500) // Debounce 1.5s
    return () => clearTimeout(transcriptSyncRef.current)
  }, [transcript, meeting?.id, user?.name, meeting?.leader])

  // ── Sync transcript FROM Supabase (Initial Load Only) ────────────────
  useEffect(() => {
    if (!meeting?.transcript || meeting.transcript === finalTranscriptRef.current) return
    // Only merge DB transcript if it has lines we don't have
    const incomingLines = meeting.transcript.split('\n').filter(l => l.trim())
    const localLines = finalTranscriptRef.current.split('\n').filter(l => l.trim())
    const newLines = incomingLines.filter(line => !localLines.includes(line))

    if (newLines.length > 0) {
      const merged = finalTranscriptRef.current + newLines.join('\n') + '\n'
      finalTranscriptRef.current = merged
      setTranscript(merged)
    }
  }, [meeting?.transcript])

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript, interimText])

  // ── Timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (meetingState === 'active') {
      startTimeRef.current = Date.now()
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
      return () => clearInterval(timerRef.current)
    }
  }, [meetingState, setDuration])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      agora.leave()
    }
  }, [])

  // ── Robust Declarative Speech Recognition ────────────────────────────
  useEffect(() => {
    if (micStatus !== 'listening') {
      recognitionRef.current?.stop()
      return
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setMicStatus('unsupported')
      return
    }

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      let interim = ''
      let newFinal = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          const text = result[0].transcript.trim()
          if (text) {
            newFinal += `${user?.name || 'Speaker'}: ${text}\n`
          }
        } else {
          interim += result[0].transcript
        }
      }

      if (newFinal) {
        console.log('[VoiceRoom] Final speech detected locally:', newFinal)
        finalTranscriptRef.current += newFinal
        setTranscript(finalTranscriptRef.current)

        if (broadcastChannelRef.current && broadcastStatus === 'connected') {
          broadcastChannelRef.current.send({
            type: 'broadcast',
            event: 'speech',
            payload: { text: newFinal.trim() }
          }).then(() => console.log('[VoiceRoom] Broadcast sent successfully'))
            .catch((e: any) => console.warn('[VoiceRoom] Broadcast error:', e))
        }
      }
      setInterimText(interim)
    }

    recognition.onerror = (event: any) => {
      console.warn('[VoiceRoom] Speech error:', event.error)
      if (event.error === 'not-allowed') {
        setMicStatus('denied')
      }
    }

    recognition.onend = () => {
      console.log('[VoiceRoom] Speech recognition ended automatically')
      if (micStatusRef.current === 'listening') {
        setTimeout(() => {
          if (micStatusRef.current === 'listening') {
            try { recognition.start() } catch (e) { }
          }
        }, 300)
      }
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
    } catch (err) {
      console.warn('[VoiceRoom] Recognition start error:', err)
    }

    return () => {
      recognition.stop()
    }
  }, [micStatus, user?.name])

  const startListening = () => {
    stoppedByUserRef.current = false
    setMicStatus('listening')
  }

  const pauseListening = () => {
    stoppedByUserRef.current = true
    if (!agora.isMuted) agora.toggleMute()
    setMicStatus('paused')
  }

  const resumeListening = () => {
    stoppedByUserRef.current = false
    if (agora.isMuted) agora.toggleMute()
    setMicStatus('listening')
  }

  const handleEnd = () => {
    stoppedByUserRef.current = true
    clearInterval(timerRef.current)
    recognitionRef.current?.stop()
    agora.leave()
    // Ensure final transcript is set
    setTranscript(finalTranscriptRef.current)
    // Update Supabase so other participants get notified via realtime
    if (meeting?.id) {
      supabase.from('meetings').update({
        status: 'completed',
        transcript: finalTranscriptRef.current,
        duration,
      }).eq('id', meeting.id).then(({ error }) => {
        if (error) console.warn('[VoiceRoom] End meeting sync error:', error.message)
      })
    }
    onEnd()
  }

  const mins = String(Math.floor(duration / 60)).padStart(2, '0')
  const secs = String(duration % 60).padStart(2, '0')

  const micStatusLabel = meetingState === 'idle'
    ? (isLeader ? 'Click "Start Meeting" to begin' : `Waiting for ${meeting?.leader || 'the host'} to start the meeting...`)
    : {
      idle: 'Click mic icon to start recording',
      requesting: 'Requesting microphone access...',
      listening: 'Recording — speak clearly',
      paused: 'Microphone off — click icon to speak',
      denied: 'Microphone access denied — type your notes below',
      unsupported: 'Voice not supported in this browser — type your notes below',
    }[micStatus]

  return (
    <div className={styles.voiceRoom}>
      <div className={styles.roomHeader}>
        <div className={styles.roomTitle}>{title}</div>
        <div className={styles.timerGroup}>
          <div className={styles.timerWrap}>
            {meetingState === 'active' ? (
              <div className={styles.liveIndicator}>
                <div className={styles.liveDotGreen} /> LIVE
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--text3)', fontWeight: 500 }}>Not Started</div>
            )}
            <div className={styles.timer}>{mins}:{secs}</div>
          </div>
        </div>
      </div>

      {/* Agora Live Audio Status */}
      {meetingState === 'active' && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 500,
          background: 'var(--surface)',
          color: 'var(--text3)',
          border: 'none',
          marginBottom: '16px',
        }}>
          {agora.isConnected ? (
            <>
              <ShieldCheck size={14} style={{ color: 'var(--green)' }} />
              Secure Voice Session Active — {agora.remoteUsers.length + 1} participant{agora.remoteUsers.length !== 0 ? 's' : ''} connected
            </>
          ) : agora.isConnecting ? (
            <>
              <Loader2 size={14} className="spin" style={{ color: 'var(--yellow)' }} />
              Establishing secure connection...
            </>
          ) : agora.error ? (
            <>
              <X size={14} style={{ color: 'var(--red)' }} />
              Connection Error: {agora.error}
            </>
          ) : (
            <>
              <MicOff size={14} />
              Voice module inactive
            </>
          )}
        </div>
      )}

      <div className={styles.participantGrid}>
        {attendees.map((name, i) => {
          const isMe = name === user?.name;
          // Use BOTH Supabase activeAttendees AND Agora remoteUsers for real-time status
          // Agora gives instant feedback, Supabase has slight delay
          const isInActiveAttendees = activeAttendees.includes(name);
          const isConnectedViaAgora = !isMe && agora.remoteUsers.length > 0; // In a 2-person call, if there's a remote user, the other person is connected
          const isJoined = isMe || isInActiveAttendees || isConnectedViaAgora;
          const isSpeaking = isMe && micStatus === 'listening';
          // Check if remote user has audio via Agora (real-time mic status)
          const hasRemoteAudio = !isMe && isConnectedViaAgora && agora.remoteUsers.some(u => u.hasAudio);
          const isParticipantHost = name === meeting?.leader;

          return (
            <div key={i} className={`${styles.participantCard} ${(isSpeaking || hasRemoteAudio) ? styles.pCardSpeaking : ''}`} style={{ opacity: isJoined || isMe ? 1 : 0.5 }}>

              <div className={styles.micCornerIndicator}>
                {isMe ? (
                  <button
                    className={styles.micCornerBtn}
                    disabled={meetingState === 'idle'}
                    style={meetingState === 'idle' ? { opacity: 0.5, cursor: 'default' } : {}}
                    onClick={() => {
                      if (meetingState === 'idle') return;
                      if (micStatus === 'listening') pauseListening()
                      else if (micStatus === 'paused') resumeListening()
                      else if (micStatus === 'idle') startListening()
                    }}
                    title={meetingState === 'idle' ? "Start meeting to enable microphone" : "Toggle your microphone"}
                  >
                    {micStatus === 'listening' ? <Mic size={14} color="var(--green)" /> : <MicOff size={14} color="var(--text3)" />}
                  </button>
                ) : (
                  <div className={styles.micCornerStatus}>
                    {isJoined && hasRemoteAudio ? <Mic size={14} color="var(--green)" /> : <MicOff size={14} color="var(--text3)" />}
                  </div>
                )}
              </div>

              <div className={styles.pAvatar} style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length], overflow: 'hidden' }}>
                {memberProfiles?.[name]?.photoUrl ? (
                  <img src={memberProfiles[name].photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  name[0]?.toUpperCase()
                )}
              </div>
              <div className={styles.pName}>{name} {isMe && '(You)'}</div>
              {(isSpeaking || hasRemoteAudio) ? (
                <div className={styles.speakingBars}>
                  <div className={styles.bar} /><div className={styles.bar} /><div className={styles.bar} /><div className={styles.bar} />
                </div>
              ) : (
                <div className={styles.pSub}>
                  {isParticipantHost ? 'Host' : isJoined ? 'Connected' : 'Invited'}
                </div>
              )}
            </div>
          );
        })}
        <div className={`${styles.participantCard} ${styles.pCardAI}`}>
          <div className={styles.pAvatar} style={{ background: 'linear-gradient(135deg, #7c6aff, #a78bfa)', color: '#fff' }}><Bot size={24} /></div>
          <div className={styles.pName}>FlowMind AI</div>
          <div className={styles.pSub}>{micStatus === 'listening' ? 'Listening...' : 'Ready'}</div>
        </div>
      </div>

      {/* Mic status indicator */}
      <div style={{ textAlign: 'center', fontSize: '13px', color: micStatus === 'listening' ? 'var(--green)' : micStatus === 'denied' ? 'var(--red)' : 'var(--text2)', padding: '8px 0', fontWeight: 500 }}>
        {micStatusLabel}
      </div>

      {/* Transcript — always visible */}
      <div className={styles.transcriptSection} style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={16} /> Live Transcript</span>
          <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{transcript.split('\n').filter(l => l.trim()).length} lines</span>
        </div>
        <div className={styles.transcriptArea}>
          {transcript.split('\n').filter(l => l.trim()).length === 0 && !interimText && (
            <div style={{ color: 'var(--text3)', fontStyle: 'italic', textAlign: 'center', marginTop: '40px' }}>
              {meetingState === 'idle' ? `Waiting for ${meeting?.leader || 'the host'} to start the meeting...` : `Waiting for someone to speak...`}
            </div>
          )}
          {manualNoteError && (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
              <div style={{ background: 'var(--surface)', color: 'var(--text2)', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', animation: 'fadeIn 0.2s' }}>
                Please start the meeting first to add notes.
              </div>
            </div>
          )}
          {transcript.split('\n').filter(l => l.trim()).map((line, i) => (
            <div key={i} className={styles.transcriptLine}>{line}</div>
          ))}
          {interimText && (
            <div className={styles.transcriptLive}>{interimText}</div>
          )}
          <div ref={transcriptEndRef} />
        </div>

        {/* Floating manual input edit button and window */}
        {!showManualInput ? (
          <div style={{ position: 'absolute', bottom: '32px', right: '36px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', zIndex: 10 }}>
            <button
              onClick={() => setShowManualInput(true)}
              style={{ background: 'var(--surface2)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
              title="Add manual note"
            >
              <Edit2 size={18} />
            </button>
          </div>
        ) : (
          <div style={{ position: 'absolute', bottom: '32px', right: '36px', width: '300px', background: 'var(--surface2)', borderRadius: '12px', padding: '12px', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text2)' }}>Add Manual Note</span>
              <button onClick={() => setShowManualInput(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: '4px' }}>
                <X size={14} />
              </button>
            </div>
            <input
              autoFocus
              type="text"
              placeholder="Type note and press Enter..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', outline: 'none' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (meetingState === 'idle') {
                    setShowManualInput(false);
                    setManualNoteError(true);
                    setTimeout(() => setManualNoteError(false), 3000);
                    return;
                  }
                  if (e.currentTarget.value.trim()) {
                    const newText = `${user?.name || 'Manual'}: ${e.currentTarget.value.trim()}\n`;
                    finalTranscriptRef.current += newText;
                    setTranscript(finalTranscriptRef.current);
                    e.currentTarget.value = '';
                    setShowManualInput(false);
                  }
                } else if (e.key === 'Escape') {
                  setShowManualInput(false);
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className={styles.controlsBar}>
        <div className={styles.timerWrap}>
          <div className={styles.timer}>{mins}:{secs}</div>
        </div>
        <div className={styles.controlsRight}>
          {/* Meeting Timer Controls */}
          {meetingState === 'idle' && isLeader && (
            <button className={styles.muteBtn} onClick={() => { setMeetingState('active'); onStart && onStart(); }} style={{ background: 'var(--green)', color: '#fff' }} title="Start Meeting Timer">
              Start Meeting
            </button>
          )}
          {meetingState === 'idle' && !isLeader && (
            <div style={{ fontSize: '13px', color: 'var(--text3)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Loader2 size={14} className="spin" /> Waiting for host to start...
            </div>
          )}
          {meetingState !== 'idle' && (
            isLeader ? (
              <button className={styles.endBtn} onClick={handleEnd}>
                End Meeting & Analyze
              </button>
            ) : (
              <button className={styles.endBtn} onClick={() => {
                stoppedByUserRef.current = true;
                recognitionRef.current?.stop();
                agora.leave();
                onLeave?.();
              }}>
                Leave Meeting
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════ ACTIVE VOICE ROOM ════════════════════════════════════════════
// Standalone wrapper — any user joining a live/scheduled meeting from ListView
function ActiveVoiceRoom({ meeting, members, memberProfiles, setView, addMeeting, tasks, decisions, currentUser, startLiveMeeting, meetings }) {
  const [transcript, setTranscript] = useState('')
  const [duration, setDuration] = useState(0)

  // Derive host status from who created the meeting
  const isHost = isHostOfMeeting(meeting, currentUser?.name)
  // Get the latest version of this meeting from the meetings array (for realtime updates)
  const liveMeeting = meetings?.find(m => m.id === meeting?.id) || meeting

  return (
    <VoiceRoom
      meeting={liveMeeting}
      isLeader={isHost}
      transcript={transcript}
      setTranscript={setTranscript}
      duration={duration}
      setDuration={setDuration}
      onEnd={() => setView('list')} // handleEnd inside VoiceRoom already updates Supabase status
      onLeave={() => setView('list')}
      onStart={() => {
        // If the host re-enters a scheduled meeting via ListView card, start it
        if (isHost && liveMeeting?.id) startLiveMeeting(liveMeeting.id);
      }}
      memberProfiles={memberProfiles}
    />
  )
}

// ═══════════ REVIEW SECTION ═══════════════════════════════════════════════
function ReviewSection({ analysis, attendees, checkedTasks, setCheckedTasks, checkedDecisions, setCheckedDecisions, taskAssignees, setTaskAssignees, onBack, onConfirm }) {
  const checkedCount = Object.values(checkedTasks).filter(Boolean).length

  return (
    <div className={styles.wrap}>
      {/* Summary */}
      <div className={styles.reviewSection}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <div className={styles.summaryIcon}><Bot size={20} /></div>
            <div className={styles.summaryLabel}>AI Summary</div>
            <span className="tag tag-green">Memory-backed</span>
          </div>
          <div className={styles.summaryText}>{analysis.summary}</div>
          <div className={styles.topicTags}>
            {analysis.keyTopics?.map((t, i) => <span key={i} className="tag tag-purple">{t}</span>)}
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className={styles.reviewSection}>
        <div className={styles.reviewHeader}>
          <div className={styles.reviewTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Pin size={18} /> Tasks Extracted ({analysis.tasks?.length || 0})</div>
          <div className={styles.reviewSub}>Review and edit before creating</div>
        </div>
        {analysis.tasks?.map((t, i) => (
          <div key={i} className={styles.taskCard}>
            <div className={styles.taskCheck}>
              <input type="checkbox" checked={!!checkedTasks[i]} onChange={() => setCheckedTasks(p => ({ ...p, [i]: !p[i] }))} />
            </div>
            <div className={styles.taskContent}>
              <div className={styles.taskTitle}>{t.title}</div>
              <div className={styles.taskDesc}>{t.description}</div>
              <div className={styles.taskMeta}>
                <span className={`tag ${t.priority === 'high' ? 'tag-red' : t.priority === 'medium' ? 'tag-yellow' : 'tag-green'}`}>
                  {t.priority}
                </span>
                <span className="tag tag-purple">{t.taskType}</span>
              </div>
              <div className={styles.taskAssignRow}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} /> Assigned to:</span>
                <select value={taskAssignees[i] || t.assignedTo} onChange={e => setTaskAssignees(p => ({ ...p, [i]: e.target.value }))}>
                  {attendees.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className={styles.taskReason} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Brain size={14} /> {t.assignmentReason}</div>
              <div className={styles.taskEstimate} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {t.estimatedHours}h estimated</span>
                <span>·</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {t.deadline || 'No deadline'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Decisions */}
      <div className={styles.reviewSection}>
        <div className={styles.reviewHeader}>
          <div className={styles.reviewTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Scale size={18} /> Decisions ({analysis.decisions?.length || 0})</div>
        </div>
        {analysis.decisions?.map((d, i) => (
          <div key={i} className={styles.decisionCard}>
            <div className={styles.taskCheck}>
              <input type="checkbox" checked={!!checkedDecisions[i]} onChange={() => setCheckedDecisions(p => ({ ...p, [i]: !p[i] }))} />
            </div>
            <div className={styles.decisionContent}>
              <div className={styles.decisionText}>{d.decision}</div>
              <div className={styles.decisionReason}>{d.reason}</div>
              <span className={`tag ${d.impact === 'high' ? 'tag-red' : d.impact === 'medium' ? 'tag-yellow' : 'tag-green'}`}>{d.impact}</span>
              <div className={styles.decisionPeople} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} /> {d.involvedPeople}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Follow-ups */}
      {analysis.followUpItems?.length > 0 && (
        <div className={styles.reviewSection}>
          <div className={styles.reviewTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Bookmark size={18} /> Follow-up Items</div>
          <div className={styles.followUpList}>
            {analysis.followUpItems.map((f, i) => (
              <div key={i} className={styles.followUpItem} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Bookmark size={14} /> {f}</div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.actionsBar}>
        <button className="btn-ghost" onClick={onBack}>← Edit Transcript</button>
        <button className="btn-primary" onClick={onConfirm} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={16} /> Create {checkedCount} Tasks & Save Meeting</button>
      </div>
    </div>
  )
}

// ═══════════ DETAIL VIEW ════════════════════════════════════════════════════
function DetailView({ meeting, tasks: allTasks, setView }) {
  const [showTranscript, setShowTranscript] = useState(false)
  if (!meeting) return null

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <div>
          <div className={styles.headerTitle}>{meeting.title}</div>
          <div className={styles.headerSub}>{new Date(meeting.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface)', color: 'var(--text2)', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 500, border: 'none' }}>
          Analyzed by
          <img src={new URL('../assets/flowmind.png', import.meta.url).href} alt="FM" style={{ height: '16px', width: 'auto' }} />
        </span>
      </div>

      <div className={styles.cardAvatars} style={{ margin: '12px 0' }}>
        {meeting.attendees?.map((a, i) => (
          <div key={i} className={styles.avatarWrapper}>
            <Avatar name={a} size={32} style={{ border: 'none' }} />
          </div>
        ))}
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}><div className={styles.statValue}>{Math.floor((meeting.duration || 0) / 60) > 0 ? `${Math.floor(meeting.duration / 60)}m ${meeting.duration % 60}s` : `${meeting.duration || 0}s`}</div><div className={styles.statLabel}>Duration</div></div>
        <div className={styles.statCard}><div className={styles.statValue}>{meeting.tasksCreated?.length || 0}</div><div className={styles.statLabel}>Tasks</div></div>
        <div className={styles.statCard}><div className={styles.statValue}>{meeting.decisionsLogged?.length || 0}</div><div className={styles.statLabel}>Decisions</div></div>
        <div className={styles.statCard}><div className={styles.statValue}>{meeting.attendees?.length || 0}</div><div className={styles.statLabel}>Attendees</div></div>
      </div>

      {/* Summary */}
      <div className={styles.detailSection}>
        <div className={styles.detailTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Bot size={18} /> AI Summary</div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryText}>{meeting.summary}</div>
          <div className={styles.topicTags}>
            {meeting.keyTopics?.map((t, i) => <span key={i} className="tag tag-purple">{t}</span>)}
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className={styles.detailSection}>
        <div className={styles.detailTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Pin size={18} /> Tasks ({meeting.tasksCreated?.length || 0})</div>
        {(!meeting.tasksCreated || meeting.tasksCreated.length === 0) ? (
          <div style={{ color: 'var(--text3)', fontSize: '13px', fontStyle: 'italic', padding: '12px 14px', background: 'var(--surface)', borderRadius: '16px', border: 'none' }}>
            No tasks were extracted from this meeting.
          </div>
        ) : meeting.tasksCreated.map((t, i) => {
          const liveTask = allTasks.find(lt => lt.id === t.id) || t
          return (
            <div key={i} className={styles.taskCard} style={{ cursor: 'default' }}>
              <div className={styles.taskContent}>
                <div className={styles.taskTitle}>{t.title}</div>
                <div className={styles.taskAssignRow}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} /> {t.assignedTo}</span>
                  <span className={`tag ${liveTask.status === 'done' ? 'tag-green' : liveTask.status === 'in-progress' ? 'tag-yellow' : 'tag-purple'}`}>
                    {liveTask.status === 'done' ? 'Done' : liveTask.status === 'in-progress' ? 'In Progress' : 'Todo'}
                  </span>
                </div>
                <div className={styles.taskReason} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Brain size={14} /> {t.assignmentReason}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Decisions */}
      <div className={styles.detailSection}>
        <div className={styles.detailTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Scale size={18} /> Decisions ({meeting.decisionsLogged?.length || 0})</div>
        {(!meeting.decisionsLogged || meeting.decisionsLogged.length === 0) ? (
          <div style={{ color: 'var(--text3)', fontSize: '13px', fontStyle: 'italic', padding: '12px 14px', background: 'var(--surface)', borderRadius: '16px', border: 'none' }}>
            No decisions were logged from this meeting.
          </div>
        ) : meeting.decisionsLogged.map((d, i) => (
          <div key={i} className={styles.decisionCard} style={{ cursor: 'default' }}>
            <div className={styles.decisionContent}>
              <div className={styles.decisionText}>{d.decision}</div>
              <div className={styles.decisionReason}>{d.reason}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Follow-ups */}
      <div className={styles.detailSection}>
        <div className={styles.detailTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Bookmark size={18} /> Follow-up Items ({meeting.followUpItems?.length || 0})</div>
        {(!meeting.followUpItems || meeting.followUpItems.length === 0) ? (
          <div style={{ color: 'var(--text3)', fontSize: '13px', fontStyle: 'italic', padding: '12px 14px', background: 'var(--surface)', borderRadius: '16px', border: 'none' }}>
            No follow-up items were identified.
          </div>
        ) : (
          <div className={styles.followUpList}>
            {meeting.followUpItems.map((f, i) => (
              <div key={i} className={styles.followUpItem} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Bookmark size={14} /> {f}</div>
            ))}
          </div>
        )}
      </div>
      {/* Transcript */}
      <div className={styles.detailSection}>
        <div
          className={styles.detailTitle}
          onClick={() => setShowTranscript(!showTranscript)}
          style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={18} /> Full Transcript
          </div>
          {showTranscript ? <ChevronUp size={20} color="var(--text3)" /> : <ChevronDown size={20} color="var(--text3)" />}
        </div>
        {showTranscript && (
          <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '16px', fontSize: '13px', color: 'var(--text2)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {meeting.transcript || (
              <span style={{ fontStyle: 'italic', color: 'var(--text3)' }}>No transcript recorded.</span>
            )}
          </div>
        )}
      </div>

      <div className={styles.memoryBadge} style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
        <Brain size={16} /> AI will use this meeting context in future analysis
      </div>
    </div>
  )
}
