import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useApp } from '../context/AppContext'
import Avatar from './Avatar'
import styles from './TasksTab.module.css'
import { Plus, X, ListTodo, User, Calendar, Clock, Check, ChevronDown, Users } from 'lucide-react'

const STATUS_OPTIONS = ['todo', 'in-progress', 'done']
const STATUS_LABELS = { 'todo': 'To Do', 'in-progress': 'In Progress', 'done': 'Done' }
const FILTER_WIDTHS = { 'all': 70, 'todo': 90, 'in-progress': 130, 'done': 90 }

export default function TasksTab() {
  const { tasks, members, addTask, updateTaskStatus } = useApp()
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', deadline: '', estimatedHours: '' })
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [showAssignDropdown, setShowAssignDropdown] = useState(false)
  const [filter, setFilter] = useState('all')
  const [selectedMember, setSelectedMember] = useState('all')
  const [expandedCols, setExpandedCols] = useState<Record<string, boolean>>({})

  const toggleExpand = (status: string) => {
    setExpandedCols(prev => ({
      ...prev,
      [status]: !prev[status]
    }))
  }

  // Deduplicate and gather all team members (from team members list + task assignees)
  const memberList = React.useMemo(() => {
    const map = new Map<string, { name: string; isLeader?: boolean }>()
    if (Array.isArray(members)) {
      members.forEach((m: any) => {
        if (m?.name && !map.has(m.name.toLowerCase())) {
          map.set(m.name.toLowerCase(), { name: m.name, isLeader: !!m.isLeader })
        }
      })
    }
    tasks.forEach(t => {
      if (t.assignedTo && !map.has(t.assignedTo.toLowerCase())) {
        map.set(t.assignedTo.toLowerCase(), { name: t.assignedTo, isLeader: false })
      }
    })
    return Array.from(map.values())
  }, [members, tasks])

  // Filter tasks based on selected team member
  const displayedTasks = React.useMemo(() => {
    if (selectedMember === 'all') return tasks
    return tasks.filter(t => t.assignedTo?.trim().toLowerCase() === selectedMember.trim().toLowerCase())
  }, [tasks, selectedMember])

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)

  // Auto-scroll while dragging
  const wrapRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLElement | null>(null)
  const scrollSpeedRef = useRef<number>(0)
  const animationFrameRef = useRef<number | null>(null)
  const isDraggingAnyRef = useRef<boolean>(false)

  // Find scrollable parent container once mounted
  useEffect(() => {
    let current = wrapRef.current?.parentElement
    while (current && current !== document.body) {
      const style = window.getComputedStyle(current)
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        scrollContainerRef.current = current
        break
      }
      current = current.parentElement
    }
  }, [])

  const stopAutoScroll = () => {
    scrollSpeedRef.current = 0
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }

  const startAutoScrollLoop = () => {
    if (animationFrameRef.current !== null) return

    const loop = () => {
      const speed = scrollSpeedRef.current
      if (speed !== 0 && isDraggingAnyRef.current) {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop += speed
        }
        window.scrollBy(0, speed)
        animationFrameRef.current = requestAnimationFrame(loop)
      } else {
        animationFrameRef.current = null
      }
    }

    animationFrameRef.current = requestAnimationFrame(loop)
  }

  const updateAutoScroll = (clientY: number) => {
    if (!isDraggingAnyRef.current) return
    const container = scrollContainerRef.current
    const rect = container ? container.getBoundingClientRect() : { top: 0, bottom: window.innerHeight }
    
    // Auto-scroll threshold: 140px from edge of viewport / container
    const threshold = 140
    const topZone = rect.top + threshold
    const bottomZone = rect.bottom - threshold

    if (clientY > bottomZone) {
      // Near bottom -> scroll down
      const distance = Math.min(threshold, clientY - bottomZone)
      const ratio = distance / threshold
      scrollSpeedRef.current = Math.round(ratio * 22) + 6 // speed 6px to 28px per frame
      startAutoScrollLoop()
    } else if (clientY < topZone && clientY >= rect.top - 50) {
      // Near top -> scroll up
      const distance = Math.min(threshold, topZone - clientY)
      const ratio = distance / threshold
      scrollSpeedRef.current = -(Math.round(ratio * 20) + 6)
      startAutoScrollLoop()
    } else {
      scrollSpeedRef.current = 0
    }
  }

  // Global dragover to support auto-scrolling across the entire viewport
  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      if (isDraggingAnyRef.current) {
        e.preventDefault()
        updateAutoScroll(e.clientY)
      }
    }

    const handleGlobalDragEnd = () => {
      isDraggingAnyRef.current = false
      stopAutoScroll()
      setDraggedTaskId(null)
      setDragOverCol(null)
    }

    window.addEventListener('dragover', handleGlobalDragOver)
    window.addEventListener('dragend', handleGlobalDragEnd)
    window.addEventListener('drop', handleGlobalDragEnd)

    return () => {
      window.removeEventListener('dragover', handleGlobalDragOver)
      window.removeEventListener('dragend', handleGlobalDragEnd)
      window.removeEventListener('drop', handleGlobalDragEnd)
      stopAutoScroll()
    }
  }, [])

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    isDraggingAnyRef.current = true
    e.dataTransfer.setData('text/plain', taskId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggedTaskId(taskId)
  }

  const handleDragEnd = () => {
    isDraggingAnyRef.current = false
    stopAutoScroll()
    setDraggedTaskId(null)
    setDragOverCol(null)
  }

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    updateAutoScroll(e.clientY)
    if (dragOverCol !== status) {
      setDragOverCol(status)
    }
  }

  const handleDragEnter = (e: React.DragEvent, status: string) => {
    e.preventDefault()
    setDragOverCol(status)
  }

  const handleDragLeave = (e: React.DragEvent, status: string) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    if (dragOverCol === status) {
      setDragOverCol(null)
    }
  }

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault()
    isDraggingAnyRef.current = false
    stopAutoScroll()
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId
    if (taskId) {
      const task = tasks.find(t => t.id === taskId)
      if (task && task.status !== targetStatus) {
        updateTaskStatus(taskId, targetStatus)
      }
    }
    setDraggedTaskId(null)
    setDragOverCol(null)
  }

  // Touch drag handlers (supports touchscreens & mobile)
  const handleTouchMove = (taskId: string, clientX: number, clientY: number) => {
    isDraggingAnyRef.current = true
    setDraggedTaskId(taskId)
    updateAutoScroll(clientY)

    const el = document.elementFromPoint(clientX, clientY)
    const colEl = el?.closest('[data-column-status]') as HTMLElement | null
    const colStatus = colEl?.getAttribute('data-column-status')
    if (colStatus && colStatus !== dragOverCol) {
      setDragOverCol(colStatus)
    } else if (!colStatus && dragOverCol) {
      setDragOverCol(null)
    }
  }

  const handleTouchEnd = (taskId: string) => {
    isDraggingAnyRef.current = false
    stopAutoScroll()
    if (dragOverCol) {
      const task = tasks.find(t => t.id === taskId)
      if (task && task.status !== dragOverCol) {
        updateTaskStatus(taskId, dragOverCol)
      }
    }
    setDraggedTaskId(null)
    setDragOverCol(null)
  }

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleAdd = () => {
    if (!form.title || !form.assignedTo) return
    addTask({ ...form, estimatedHours: Number(form.estimatedHours) || 0 })
    setForm({ title: '', description: '', assignedTo: '', deadline: '', estimatedHours: '' })
    setAnchorEl(null)
  }

  return (
    <div ref={wrapRef} className={styles.wrap}>
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
                {f === 'all' ? displayedTasks.length : displayedTasks.filter(t => t.status === f).length}
              </span>
            </button>
          ))}
        </div>
        <button className={styles.newTaskBtn} onClick={(e) => setAnchorEl(anchorEl ? null : e.currentTarget)}>
          {anchorEl ? <><X size={14} style={{ marginRight: '6px' }} /> Cancel</> : <><Plus size={14} style={{ marginRight: '6px' }} /> New Task</>}
        </button>
      </div>

      {/* Member Filter Bar */}
      <div className={styles.memberFilterBar}>
        <button
          type="button"
          className={`${styles.memberFilterChip} ${selectedMember === 'all' ? styles.memberFilterChipActive : ''}`}
          onClick={() => setSelectedMember('all')}
        >
          <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={14} />
          </div>
          <span>All</span>
          <span className={styles.memberChipBadge}>{tasks.length}</span>
        </button>
        {memberList.map(m => {
          const isSelected = selectedMember.toLowerCase() === m.name.toLowerCase()
          const memberTaskCount = tasks.filter(t => t.assignedTo?.trim().toLowerCase() === m.name.trim().toLowerCase()).length
          return (
            <button
              key={m.name}
              type="button"
              className={`${styles.memberFilterChip} ${isSelected ? styles.memberFilterChipActive : ''}`}
              onClick={() => setSelectedMember(isSelected ? 'all' : m.name)}
            >
              <Avatar name={m.name} size={18} />
              <span>{m.name}</span>
              <span className={styles.memberChipBadge}>{memberTaskCount}</span>
            </button>
          )
        })}
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
        {(filter === 'all' ? STATUS_OPTIONS : [filter]).map(status => {
          const colTasks = displayedTasks.filter(t => t.status === status)
          const isExpanded = !!expandedCols[status]
          return (
            <div 
              key={status} 
              data-column-status={status}
              className={`${styles.column} ${dragOverCol === status ? styles.columnDragOver : ''} ${isExpanded ? styles.columnExpanded : ''}`}
              onDragOver={(e) => handleDragOver(e, status)}
              onDragEnter={(e) => handleDragEnter(e, status)}
              onDragLeave={(e) => handleDragLeave(e, status)}
              onDrop={(e) => handleDrop(e, status)}
            >
              <div className={styles.colHeader}>
                <div className={styles.colHeaderLeft}>
                  <span className={styles.colDot} data-status={status} />
                  <span className={styles.colTitle}>{STATUS_LABELS[status as keyof typeof STATUS_LABELS]}</span>
                </div>
                <div className={styles.colHeaderRight}>
                  <span className={styles.colCount}>{colTasks.length}</span>
                  <button
                    type="button"
                    className={`${styles.colExpandBtn} ${isExpanded ? styles.colExpandBtnActive : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleExpand(status)
                    }}
                    title={isExpanded ? 'Collapse to horizontal view' : 'Expand to vertical 3-column view'}
                    aria-label={`Toggle ${STATUS_LABELS[status as keyof typeof STATUS_LABELS]} expansion`}
                  >
                    <ChevronDown size={14} className={`${styles.chevronIcon} ${isExpanded ? styles.chevronIconRotated : ''}`} />
                  </button>
                </div>
              </div>
              <div 
                className={`${styles.colCards} ${isExpanded ? styles.colCardsExpanded : ''}`}
                onDragOver={(e) => handleDragOver(e, status)}
                onDrop={(e) => handleDrop(e, status)}
              >
                {colTasks.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onStatusChange={updateTaskStatus} 
                    isDragging={draggedTaskId === task.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  />
                ))}
                {colTasks.length === 0 && (
                  <div className={`${styles.empty} ${dragOverCol === status ? styles.emptyDragOver : ''}`}>
                    {dragOverCol === status ? 'Drop task here' : selectedMember !== 'all' ? `No tasks for ${selectedMember}` : 'No tasks here'}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface TaskCardProps {
  task: any
  onStatusChange: (id: string, status: string) => void
  isDragging?: boolean
  onDragStart?: (e: React.DragEvent, taskId: string) => void
  onDragEnd?: () => void
  onTouchMove?: (taskId: string, x: number, y: number) => void
  onTouchEnd?: (taskId: string) => void
}

function TaskCard({ 
  task, 
  onStatusChange,
  isDragging,
  onDragStart,
  onDragEnd,
  onTouchMove,
  onTouchEnd
}: TaskCardProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const isDraggingRef = useRef(false)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const touchMovedRef = useRef(false)

  const handleNativeDragStart = (e: React.DragEvent) => {
    isDraggingRef.current = true
    if (onDragStart) onDragStart(e, task.id)
  }

  const handleNativeDragEnd = () => {
    if (onDragEnd) onDragEnd()
    setTimeout(() => {
      isDraggingRef.current = false
    }, 120)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touchStartRef.current = { x: t.clientX, y: t.clientY }
    touchMovedRef.current = false
  }

  const handleTouchMoveInternal = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    const t = e.touches[0]
    const dist = Math.hypot(t.clientX - touchStartRef.current.x, t.clientY - touchStartRef.current.y)
    if (dist > 8) {
      touchMovedRef.current = true
      isDraggingRef.current = true
      if (onTouchMove) onTouchMove(task.id, t.clientX, t.clientY)
    }
  }

  const handleTouchEndInternal = () => {
    if (touchMovedRef.current) {
      if (onTouchEnd) onTouchEnd(task.id)
      setTimeout(() => {
        isDraggingRef.current = false
        touchMovedRef.current = false
      }, 120)
    }
    touchStartRef.current = null
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingRef.current || touchMovedRef.current) return
    setAnchorEl(e.currentTarget)
  }

  return (
    <>
      <div 
        className={`${styles.taskCard} ${isDragging ? styles.taskCardDragging : ''}`} 
        draggable={true}
        onDragStart={handleNativeDragStart}
        onDragEnd={handleNativeDragEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMoveInternal}
        onTouchEnd={handleTouchEndInternal}
        onClick={handleClick}
      >
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
