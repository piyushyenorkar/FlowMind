import React, { useState, useEffect, useRef } from 'react'
import { Check, CheckCircle2, Crown, Save, User, X, Plus, Search, Clock, AlertCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { storeMemberProfile } from '../utils/hindsightClient'
import styles from './MemberProfile.module.css'

const PREDEFINED_SKILLS = [
  // Web & Core Tech
  { name: 'HTML', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg' },
  { name: 'CSS', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg' },
  { name: 'JavaScript', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg' },
  { name: 'TypeScript', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg' },
  { name: 'React', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg' },
  { name: 'Next.js', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg' },
  { name: 'Node.js', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg' },
  { name: 'Python', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg' },
  { name: 'Java', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg' },
  { name: 'C++', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg' },
  { name: 'Go', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original.svg' },
  { name: 'Rust', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/rust/rust-plain.svg' },
  { name: 'PHP', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/php/php-original.svg' },
  
  // Database & DevOps
  { name: 'MongoDB', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg' },
  { name: 'PostgreSQL', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg' },
  { name: 'MySQL', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mysql/mysql-original.svg' },
  { name: 'Firebase', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/firebase/firebase-plain.svg' },
  { name: 'Docker', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg' },
  { name: 'AWS', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-original-wordmark.svg' },
  { name: 'Git', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg' },
  
  // Design & Others
  { name: 'Figma', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg' },
  { name: 'Tailwind CSS', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg' },
  
  // Non-tech / Soft skills
  { name: 'Content Creation', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/youtube/youtube-original.svg' },
  { name: 'Public Speaking', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/chrome/chrome-original.svg' },
  { name: 'Video Editing', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/premierepro/premierepro-original.svg' },
  { name: 'Copywriting', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/notion/notion-original.svg' },
  { name: 'Project Management', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/jira/jira-original.svg' },
  { name: 'SEO', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/google/google-original.svg' }
]

const TASK_TYPES = [
  { name: 'Frontend', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg' },
  { name: 'Backend', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg' },
  { name: 'Design', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg' },
  { name: 'Research', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/google/google-original.svg' },
  { name: 'Testing', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/jest/jest-plain.svg' },
  { name: 'Documentation', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/notion/notion-original.svg' }
]


export default function MemberProfile() {
  const { currentUser: appUser, memberProfiles, updateMemberProfile, team } = useApp()
  const { user: authUser, updateGlobalProfile } = useAuth()
  
  // Try to use authUser name if it's the current user editing their own profile, otherwise fallback to appUser
  const name = appUser?.name || authUser?.name || 'Member'
  const isMe = authUser?.name === name || appUser?.isLeader // Fallback logic for demo
  
  // Find existing profile: check memberProfiles, then authUser.profileData
  const existing = memberProfiles?.[name] || (isMe && authUser?.profileData) || {}

  const [form, setForm] = useState({
    title: existing.title || '',
    skills: existing.skills || [],
    pastWork: existing.pastWork || '',
    availability: existing.availability || '',
    preferredTypes: existing.preferredTypes || [],
    photoUrl: existing.photoUrl || ''
  })
  const [skillInput, setSkillInput] = useState('')
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef(null)

  const [showSkillDropdown, setShowSkillDropdown] = useState(false)

  // Re-sync form when persisted profile data loads (e.g. team switch, or on first load)
  const existingKey = JSON.stringify(existing)
  useEffect(() => {
    if (Object.keys(existing).length > 0) {
      setForm({
        title: existing.title || '',
        skills: existing.skills || [],
        pastWork: existing.pastWork || '',
        availability: existing.availability || '',
        preferredTypes: existing.preferredTypes || [],
        photoUrl: existing.photoUrl || ''
      })
    }
  }, [existingKey])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleAddSkill = (skill) => {
    const s = skill.trim()
    if (s && form.skills.length < 15 && !form.skills.includes(s)) {
      set('skills', [...form.skills, s])
      setSkillInput('')
      setShowSkillDropdown(false)
    }
  }

  const removeSkill = (skill) => set('skills', form.skills.filter(s => s !== skill))

  const filteredSkills = PREDEFINED_SKILLS.filter(r => r.name.toLowerCase().includes(skillInput.toLowerCase()) && !form.skills.includes(r.name))
  const exactMatch = PREDEFINED_SKILLS.some(r => r.name.toLowerCase() === skillInput.toLowerCase()) || form.skills.some(r => r.toLowerCase() === skillInput.toLowerCase())

  const toggleType = (t) => {
    set('preferredTypes',
      form.preferredTypes.includes(t)
        ? form.preferredTypes.filter(x => x !== t)
        : [...form.preferredTypes, t]
    )
  }

  const handleSave = () => {
    updateMemberProfile(name, form)
    storeMemberProfile(name, form, team?.code)
    if (isMe && updateGlobalProfile) {
      updateGlobalProfile(form)
    } else {
      alert(`Debug: Not updating global profile. isMe=${isMe}, name=${name}, authUser.name=${authUser?.name}, appUser.name=${appUser?.name}`)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxDim = 400
        let w = img.width
        let h = img.height
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round(h * (maxDim / w)); w = maxDim }
          else { w = Math.round(w * (maxDim / h)); h = maxDim }
        }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, w, h)
        // Compress to JPEG with 0.8 quality
        set('photoUrl', canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }


  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div 
          className={styles.avatar} 
          onClick={() => fileInputRef.current?.click()} 
          style={{ cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
          title="Click to upload photo"
        >
          {form.photoUrl ? (
            <img src={form.photoUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            name[0]?.toUpperCase()
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePhotoUpload} 
            accept="image/*" 
            style={{ display: 'none' }} 
          />
        </div>
        <div className={styles.headerInfo}>
          <div className={styles.headerName}>{name}</div>
          <div className={styles.headerRole} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {appUser?.isLeader ? <><Crown size={14} /> Leader</> : <><User size={14} /> Member</>}
          </div>
        </div>
      </div>


      <div className={styles.form}>
        <div className={styles.field}>
          <label>Role / Title</label>
          <input className="input" placeholder="e.g. Frontend Developer" value={form.title} onChange={e => set('title', e.target.value)} />
        </div>

        <div className={styles.field} style={{ position: 'relative' }}>
          <label>Skills ({form.skills.length}/15)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {form.skills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {form.skills.map(skill => {
                  const predefined = PREDEFINED_SKILLS.find(r => r.name === skill)
                  return (
                    <div key={skill} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface2)', border: '1px solid transparent', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', padding: '8px 14px', borderRadius: '100px', fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>
                      {predefined ? <img src={predefined.logo} alt="" style={{ width: '16px', height: '16px', objectFit: 'contain' }} /> : <span style={{ color: 'var(--accent)' }}>•</span>}
                      {skill}
                      <X size={14} style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => removeSkill(skill)} />
                    </div>
                  )
                })}
              </div>
            )}
            
            <div className="input" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', height: '44px' }}>
              <Search size={16} style={{ color: 'var(--text3)' }} />
              <input 
                type="text" 
                placeholder={form.skills.length === 0 ? "Search or add a skill..." : "Add another skill..."}
                value={skillInput}
                onChange={e => { setSkillInput(e.target.value); setShowSkillDropdown(true) }}
                onFocus={() => setShowSkillDropdown(true)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text)', outline: 'none', flex: 1, minWidth: '150px', fontSize: '14px' }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (skillInput) {
                      handleAddSkill(skillInput)
                    }
                  }
                }}
              />
            </div>
          </div>

          {showSkillDropdown && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowSkillDropdown(false)} />
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '100%', background: 'var(--bg2)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 50, maxHeight: '240px', overflowY: 'auto', animation: 'fadeIn 0.2s ease forwards' }}>
                {filteredSkills.length === 0 && !skillInput && (
                  <div style={{ padding: '8px 12px', color: 'var(--text3)', fontSize: '13px', textAlign: 'center' }}>
                    Type to search skills
                  </div>
                )}
                {filteredSkills.map((skill, idx) => (
                  <React.Fragment key={skill.name}>
                    <div onClick={() => handleAddSkill(skill.name)} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '8px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', transition: 'background 0.2s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <img src={skill.logo} alt="" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                      {skill.name}
                    </div>
                    {(idx < filteredSkills.length - 1 || (!exactMatch && skillInput)) && <div style={{ height: '1px', background: 'var(--border)', opacity: 0.5, margin: '2px 8px' }} />}
                  </React.Fragment>
                ))}
                {!exactMatch && skillInput && (
                  <div onClick={() => handleAddSkill(skillInput)} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '8px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', transition: 'background 0.2s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)', borderRadius: '4px' }}>
                      <Plus size={12} color="#fff" />
                    </div>
                    Add "{skillInput}"
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className={styles.field}>
          <label>Past Work / Experience</label>
          <textarea className="textarea" placeholder="Describe projects you've worked on, technologies used, achievements..." value={form.pastWork} onChange={e => set('pastWork', e.target.value)} style={{ minHeight: '100px' }} />
        </div>

        <div className={styles.field}>
          <label>Availability</label>
          <div className={styles.availGroup}>
            {[
              { v: 'Full-time', c: 'var(--green)', icon: CheckCircle2 },
              { v: 'Part-time', c: 'var(--yellow)', icon: Clock },
              { v: 'Busy', c: 'var(--red)', icon: AlertCircle },
            ].map(a => {
              const active = form.availability === a.v;
              const Icon = a.icon;
              return (
                <button
                  key={a.v}
                  className={styles.availBtn}
                  onClick={() => set('availability', a.v)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    ...(active ? {
                      background: 'var(--surface2)',
                      borderColor: 'transparent',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                      color: 'var(--text)'
                    } : {})
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: active ? 600 : 500 }}>{a.v}</span>
                  {active && <Icon size={16} color={a.c} />}
                </button>
              )
            })}
          </div>
        </div>

        <div className={styles.field}>
          <label>Preferred Task Types</label>
          <div className={styles.checkGrid}>
            {TASK_TYPES.map(t => {
              const active = form.preferredTypes.includes(t.name)
              return (
                <div key={t.name} className={`${styles.checkItem} ${active ? styles.checkActive : ''}`} onClick={() => toggleType(t.name)}>
                  {active ? (
                    <CheckCircle2 size={16} color="var(--green)" style={{ flexShrink: 0 }} />
                  ) : (
                    <div className={styles.checkBox} />
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <img src={t.logo} alt="" style={{ width: '16px', height: '16px', objectFit: 'contain', filter: active ? 'none' : 'grayscale(100%)', opacity: active ? 1 : 0.6 }} />
                    {t.name}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <button 
          className="btn-primary" 
          onClick={handleSave} 
          style={{ 
            width: '100%', 
            justifyContent: 'center', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            backgroundColor: saved ? 'var(--green)' : undefined,
            borderColor: saved ? 'var(--green)' : undefined,
            color: saved ? '#000' : undefined
          }}
        >
          {saved ? (
            <>
              <CheckCircle2 size={16} /> Profile Saved
            </>
          ) : (
            <>
              <Save size={16} /> Save Profile
            </>
          )}
        </button>
      </div>
    </div>
  )
}
