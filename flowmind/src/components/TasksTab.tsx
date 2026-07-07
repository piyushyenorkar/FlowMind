import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useApp } from '../context/AppContext'
import Avatar from './Avatar'
import styles from './TasksTab.module.css'
import { Plus, X, ListTodo, User, Calendar, Clock, Check } from 'lucide-react'

const STATUS_OPTIONS = ['todo', 'in-progress', 'done']
const STATUS_LABELS = { 'todo': 'To Do', 'in-progress': 'In Progress', 'done': 'Done' }
const FILTER_WIDTHS = { 'all': 70, 'todo': 90, 'in-progress': 130, 'done': 90 }

export default function TasksTab() {
  const { tasks, members, addTask, updateTaskStatus } = useApp()
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', deadline: '', estimatedHours: '' })
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [showAssignDropdown, setShowAssignDropdown] = useState(false)
  const [filter, setFilter] = useState('all')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleAdd = () => {
    if (!form.title || !form.assignedTo) return
    addTask({ ...form, estimatedHours: Number(form.estimatedHours) || 0 })
    setForm({ title: '', description: '', assignedTo: '', deadline: '', estimatedHours: '' })
    setAnchorEl(null)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
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
                {f === 'all' ? tasks.length : tasks.filter(t => t.status === f).length}
              </span>
            </button>
          ))}
        </div>
        <button className={styles.newTaskBtn} onClick={(e) => setAnchorEl(anchorEl ? null : e.currentTarget)}>
          {anchorEl ? <><X size={14} style={{ marginRight: '6px' }} /> Cancel</> : <><Plus size={14} style={{ marginRight: '6px' }} /> New Task</>}
        </button>
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
            <div className="section-title">Assign New Task</div>
            <div className={styles.formGrid}>
              <div>
                <label className="label">Task Title *</label>
                <input className="input" placeholder="e.g. Build login API" value={form.title} onChange={e => set('title', e.target.value)} style={{ height: '42px', borderRadius: '16px' }} />
              </div>
              <div style={{ position: 'relative' }}>
                <label className="label">Assign To *</label>
                <div className="input" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', minHeight: '42px', padding: '10px 14px', borderRadius: '16px', color: form.assignedTo ? 'var(--text)' : 'var(--text3)' }} onClick={() => setShowAssignDropdown(!showAssignDropdown)}>
                  <span style={{ flex: 1 }}>
                    {form.assignedTo ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Avatar name={form.assignedTo} size={20} />
                        <span style={{ color: 'var(--text)' }}>{form.assignedTo}</span>
                      </div>
                    ) : 'Select a team member'}
                  </span>
                  <div style={{ fontSize: '10px', opacity: 0.5 }}>▼</div>
                </div>

                {showAssignDropdown && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowAssignDropdown(false)} />
                    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', background: '#1a1a1a', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px', zIndex: 100, width: '100%', minWidth: '220px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text2)', padding: '4px 8px', marginBottom: '4px' }}>Select Team Member</div>
                      <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {members.map((m: any) => (
                          <div key={m.name} onClick={() => { set('assignedTo', m.name); setShowAssignDropdown(false) }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '8px', cursor: 'pointer', background: form.assignedTo === m.name ? 'rgba(255,255,255,0.08)' : 'transparent', transition: 'background 0.15s' }}>
                            <Avatar name={m.name} size={32} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>{m.name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{m.isLeader ? 'Team Leader' : 'Member'}</div>
                            </div>
                            {form.assignedTo === m.name && <div style={{ color: 'var(--accent)' }}><Check size={16} /></div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div>
                <label className="label">Deadline</label>
                <input className={`input ${!form.deadline ? 'empty-date' : ''}`} type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} style={{ height: '42px', borderRadius: '16px' }} />
              </div>
              <div>
                <label className="label">Estimated Hours</label>
                <input className="input" type="number" placeholder="e.g. 4" value={form.estimatedHours} onChange={e => set('estimatedHours', e.target.value)} style={{ height: '42px', borderRadius: '16px' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="label">Description</label>
                <textarea className="textarea" placeholder="What needs to be done?" value={form.description} onChange={e => set('description', e.target.value)} style={{ borderRadius: '16px' }} />
              </div>
            </div>
            <div className={styles.formActions}>
              <button className={styles.newTaskBtn} onClick={handleAdd} disabled={!form.title || !form.assignedTo}>
                <Plus size={16} style={{ marginRight: '6px' }} /> Assign Task
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Kanban columns */}
      <div className={styles.kanban}>
        {(filter === 'all' ? STATUS_OPTIONS : [filter]).map(status => (
          <div key={status} className={styles.column}>
            <div className={styles.colHeader}>
              <span className={styles.colDot} data-status={status} />
              <span className={styles.colTitle}>{STATUS_LABELS[status]}</span>
              <span className={styles.colCount}>{tasks.filter(t => t.status === status).length}</span>
            </div>
            <div className={styles.colCards}>
              {tasks.filter(t => t.status === status).map(task => (
                <TaskCard key={task.id} task={task} onStatusChange={updateTaskStatus} />
              ))}
              {tasks.filter(t => t.status === status).length === 0 && (
                <div className={styles.empty}>No tasks here</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TaskCard({ task, onStatusChange }) {
  const [anchorEl, setAnchorEl] = useState(null)
  return (
    <>
      <div className={styles.taskCard} onClick={(e) => setAnchorEl(e.currentTarget)}>
        <div className={styles.taskTop}>
          <div className={styles.taskTitle}>{task.title}</div>
        </div>
        <div className={styles.taskAssigned} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Avatar name={task.assignedTo} size={16} /> {task.assignedTo}
        </div>
        {task.deadline && <div className={styles.taskDeadline}><Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} /> {new Date(task.deadline).toLocaleDateString()}</div>}
        {task.estimatedHours > 0 && <div className={styles.taskHours}><Clock size={14} style={{ display: 'inline', marginRight: '4px' }} /> {task.estimatedHours}h estimated</div>}
      </div>

      {anchorEl && createPortal(
        <div className={styles.popoverOverlay} onClick={() => setAnchorEl(null)}>
          <div
            className={styles.popoverContainer}
            style={{
              top: anchorEl.getBoundingClientRect().top + 'px',
              left: anchorEl.getBoundingClientRect().right + 16 + 'px'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button className={styles.closeModalBtn} onClick={() => setAnchorEl(null)}>
              <X size={16} />
            </button>

            <div className={styles.popoverContent}>
              {task.description && <p className={styles.taskDesc}>{task.description}</p>}
              {task.updates.length > 0 && (
                <div className={styles.updates}>
                  <div className={styles.updatesTitle}>Updates ({task.updates.length})</div>
                  {task.updates.map((u, i) => (
                    <div key={i} className={styles.update}>
                      <span className={styles.updateAuthor}>{u.author}:</span> {u.text}
                    </div>
                  ))}
                </div>
              )}
              <div className={styles.updatesTitle}>Update Status</div>
              <div className={styles.statusBtns}>
                {['todo', 'in-progress', 'done'].map(s => (
                  <button
                    key={s}
                    className={`${styles.statusBtn} ${task.status === s ? styles.statusActive : ''}`}
                    onClick={() => {
                      onStatusChange(task.id, s);
                      setAnchorEl(null);
                    }}
                  >
                    {s === 'todo' ? 'To Do' : s === 'in-progress' ? 'In Progress' : 'Done'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
