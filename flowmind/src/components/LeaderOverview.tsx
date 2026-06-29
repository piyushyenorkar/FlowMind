import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import styles from './LeaderOverview.module.css'
import { Activity, Users, Clock, CheckCircle2, CircleDashed, ListTodo, Scale, Sparkles, MessageSquare, Plus, ChevronRight, X } from 'lucide-react'
import TeamMembers from './TeamMembers'
import Avatar from './Avatar'

export default function LeaderOverview({ setActiveTab }) {
  const { team, tasks, decisions, members, memoryFeed, memberProfiles, role } = useApp()
  const [showMembersModal, setShowMembersModal] = useState(false)

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

        {/* Deadline */}
        <div className={`${styles.card} ${styles.deadlineCard}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIconWrapper} style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text)' }}>
              <Clock size={18} />
            </div>
            <div className={styles.cardTitle}>Deadline</div>
          </div>
          <div className={styles.deadlineContent}>
            <div className={styles.deadlineDate}>
              {team?.deadline ? new Date(team.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'}
            </div>
            {team?.deadline && (
              <div className={styles.deadlineDays}>
                {Math.max(0, Math.ceil((new Date(team.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days left
              </div>
            )}
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
    </div>
  )
}
