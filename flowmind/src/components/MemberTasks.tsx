import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useApp } from '../context/AppContext'
import styles from './MemberTasks.module.css'

import { CheckSquare, Search, ChevronRight, CheckCircle2, CircleDashed, ListTodo, Calendar, Clock, Edit2, Circle, X } from 'lucide-react'

const STATUS_OPTIONS = ['todo', 'in-progress', 'done']
const STATUS_LABELS = { 'todo': 'To Do', 'in-progress': 'In Progress', 'done': 'Done' }
const FILTER_WIDTHS = { 'all': 70, 'todo': 90, 'in-progress': 130, 'done': 90 }

export default function MemberTasks() {
  const { tasks, currentUser, updateTaskStatus, addTaskUpdate } = useApp()
  const [filter, setFilter] = useState('all')

  const myTasks = tasks.filter(t => t.assignedTo?.toLowerCase() === currentUser?.name?.toLowerCase())
  const filteredTasks = filter === 'all' ? myTasks : myTasks.filter(t => t.status === filter)
  const sortedTasks = [...filteredTasks].reverse().sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
    return 0;
  });
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.segmentedControl}>
          <div
            className={styles.segmentIndicator}
            style={{
              transform: `translateX(${['all', ...STATUS_OPTIONS].slice(0, ['all', ...STATUS_OPTIONS].indexOf(filter)).reduce((sum, f) => sum + FILTER_WIDTHS[f as keyof typeof FILTER_WIDTHS], 0)}px)`,
              width: `${FILTER_WIDTHS[filter as keyof typeof FILTER_WIDTHS]}px`
            }}
          />
          {['all', ...STATUS_OPTIONS].map(f => (
            <button key={f} className={`${styles.segmentBtn} ${filter === f ? styles.active : ''}`} onClick={() => setFilter(f)} style={{ width: FILTER_WIDTHS[f as keyof typeof FILTER_WIDTHS] + 'px', flex: `0 0 ${FILTER_WIDTHS[f as keyof typeof FILTER_WIDTHS]}px` }}>
              {f === 'all' ? 'All' : STATUS_LABELS[f]}
              <span className={styles.filterCount}>
                {f === 'all' ? myTasks.length : myTasks.filter(t => t.status === f).length}
              </span>
            </button>
          ))}
        </div>
        <div className={myTasks.length === 0 ? styles.sub : styles.taskCounter}>
          {myTasks.length === 0
            ? 'No tasks assigned'
            : (
              <>
                <CheckCircle2 size={16} color="var(--green)" />
                {`${myTasks.filter(t => t.status === 'done').length} of ${myTasks.length} tasks`}
              </>
            )}
        </div>
      </div>

      {myTasks.length === 0 && (
        <div className={styles.emptyState}>
          <ListTodo size={48} className={styles.emptyIcon} />
          <div className={styles.emptyTitle}>No tasks yet</div>
          <div className={styles.emptySub}>Your leader hasn't assigned you any tasks. Check back soon!</div>
        </div>
      )}

      <div className={styles.taskList}>
        {sortedTasks.map(task => (
          <TaskItem key={task.id} task={task} onStatusChange={updateTaskStatus} addTaskUpdate={addTaskUpdate} currentUser={currentUser} />
        ))}
      </div>
    </div>
  )
}

function TaskItem({ task, onStatusChange, addTaskUpdate, currentUser }) {
  const [anchorEl, setAnchorEl] = useState(null)
  const latestUpdate = task.updates[task.updates.length - 1]?.text || ''
  const [text, setText] = useState(latestUpdate)

  const handleOpen = (e) => {
    setText(task.updates[task.updates.length - 1]?.text || '')
    setAnchorEl(e.currentTarget)
  }

  const handleSave = () => {
    if (text.trim()) {
      addTaskUpdate(task.id, text.trim(), currentUser.name)
      setAnchorEl(null)
    }
  }

  const statusColor = task.status === 'done' ? 'var(--green)' : task.status === 'in-progress' ? 'var(--yellow)' : 'var(--text3)'

  return (
    <div className={`${styles.taskCard} ${task.status === 'done' ? styles.taskDone : ''}`}>
      <div className={styles.taskHeader} onClick={handleOpen}>
        <div className={styles.taskLeft}>
          <button
            className={styles.checkBtn}
            style={{ border: 'none', background: 'transparent', padding: 0 }}
            onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, task.status === 'done' ? 'todo' : 'done') }}
          >
            {task.status === 'done' ? (
              <CheckCircle2 size={24} color="var(--green)" />
            ) : task.status === 'in-progress' ? (
              <CircleDashed size={24} color="var(--yellow)" />
            ) : (
              <Circle size={24} color="var(--text3)" />
            )}
          </button>
          <div>
            <div className={styles.taskTitle} style={{ color: task.status === 'done' ? 'var(--text3)' : 'var(--text)' }}>
              {task.title}
            </div>
            {task.deadline && <div className={styles.taskDeadline} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> Due {new Date(task.deadline).toLocaleDateString()}</div>}
          </div>
        </div>
        <div className={styles.taskRight}>
          <span className="tag">
            {task.status === 'in-progress' ? 'In Progress' : task.status === 'done' ? 'Done' : 'To Do'}
          </span>
          <span className={styles.expandIcon}><ChevronRight size={16} /></span>
        </div>
      </div>

      {anchorEl && createPortal(
        <div className={styles.modalOverlay} onClick={() => setAnchorEl(null)}>
          <div 
            className={styles.modalContent} 
            style={{
              ...(anchorEl.getBoundingClientRect().top > window.innerHeight / 2 
                ? { bottom: Math.max(24, window.innerHeight - anchorEl.getBoundingClientRect().bottom - 120) + 'px' } 
                : { top: Math.max(24, anchorEl.getBoundingClientRect().top - 120) + 'px' }
              ),
              left: Math.min(anchorEl.getBoundingClientRect().right + 16, window.innerWidth - 360) + 'px'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>{task.title}</div>
              <button className={styles.closeBtn} onClick={() => setAnchorEl(null)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              {task.description && <p className={styles.taskDesc}>{task.description}</p>}
              
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['todo', 'in-progress', 'done'].map(s => (
                    <button 
                      key={s} 
                      style={{
                        background: task.status === s ? 'var(--accent-glow)' : 'var(--surface2)',
                        border: 'none',
                        color: task.status === s ? 'var(--accent2)' : 'var(--text2)',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => onStatusChange(task.id, s)}
                    >
                      {s === 'todo' ? 'To Do' : s === 'in-progress' ? 'In Progress' : 'Done'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progress / Notes</div>
                <textarea
                  className="textarea"
                  placeholder="Add your notes or progress here..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  style={{ minHeight: '100px', borderRadius: '16px' }}
                />
                <button className="btn-primary" onClick={handleSave} disabled={!text.trim()} style={{ marginTop: '12px', borderRadius: '100px' }}>
                  <Edit2 size={16} style={{ marginRight: '6px' }}/> Save updates
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
