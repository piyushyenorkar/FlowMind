import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { Crown, Globe, Rocket, Layout, Server, PenTool, Code, Briefcase, Database, Smartphone, Settings, Plus, X, Search, Info } from 'lucide-react'
import styles from './Setup.module.css'

const PREDEFINED_ROLES = [
  { name: 'Frontend Developer', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg' },
  { name: 'Backend Developer', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg' },
  { name: 'Full Stack Developer', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg' },
  { name: 'UI/UX Designer', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg' },
  { name: 'Mobile Developer (Android)', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/android/android-original.svg' },
  { name: 'Mobile Developer (iOS)', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/apple/apple-original.svg' },
  { name: 'Data Scientist', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg' },
  { name: 'Machine Learning Engineer', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tensorflow/tensorflow-original.svg' },
  { name: 'DevOps Engineer', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg' },
  { name: 'Cloud Architect', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-original-wordmark.svg' },
  { name: 'QA Tester', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/selenium/selenium-original.svg' },
  { name: 'Database Administrator', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg' },
  { name: 'Game Developer', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/unity/unity-original.svg' },
  { name: 'Blockchain Developer', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/solidity/solidity-original.svg' },
  { name: 'Cybersecurity Analyst', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kali/kali-original.svg' },
  { name: 'Product Manager', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/jira/jira-original.svg' },
  { name: 'Graphic Designer', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/photoshop/photoshop-plain.svg' },
  { name: 'Content Writer', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/wordpress/wordpress-plain.svg' },
  { name: 'Marketing Specialist', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/google/google-original.svg' },
  { name: 'Data Analyst', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/pandas/pandas-original.svg' },
  { name: 'Rust Developer', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/rust/rust-plain.svg' },
  { name: 'Go Developer', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original.svg' },
  { name: 'Ruby Developer', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/ruby/ruby-original.svg' },
  { name: 'PHP Developer', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/php/php-original.svg' },
  { name: 'C++ Developer', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg' }
]

export default function LeaderSetup({ onClose, defaultUniversal }: { onClose?: () => void, defaultUniversal?: boolean }) {
  const { createTeam, navigate } = useApp()
  const { saveTeam, saveUniversalTeam, user } = useAuth()
  const [isUniversal, setIsUniversal] = useState(defaultUniversal || false)
  const [showStateDropdown, setShowStateDropdown] = useState(false)
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [roleSearch, setRoleSearch] = useState('')
  const [showRoleDropdown, setShowRoleDropdown] = useState(false)
  const [showMembersInfo, setShowMembersInfo] = useState(false)

  const LOCATION_DATA: Record<string, string[]> = {
    "Andaman and Nicobar Islands": ["Port Blair"],
    "Andhra Pradesh": ["Guntur", "Kurnool", "Nellore", "Vijayawada", "Visakhapatnam"],
    "Arunachal Pradesh": ["Bomdila", "Itanagar", "Pasighat", "Tawang", "Ziro"],
    "Assam": ["Dibrugarh", "Guwahati", "Jorhat", "Nagaon", "Silchar"],
    "Bihar": ["Bhagalpur", "Gaya", "Muzaffarpur", "Patna", "Purnia"],
    "Chandigarh": ["Chandigarh"],
    "Chhattisgarh": ["Bhilai", "Bilaspur", "Durg", "Korba", "Raipur"],
    "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Diu", "Silvassa"],
    "Delhi": ["East Delhi", "New Delhi", "North Delhi", "South Delhi", "West Delhi"],
    "Goa": ["Mapusa", "Margao", "Panaji", "Ponda", "Vasco da Gama"],
    "Gujarat": ["Ahmedabad", "Bhavnagar", "Rajkot", "Surat", "Vadodara"],
    "Haryana": ["Ambala", "Faridabad", "Gurugram", "Panipat", "Rohtak"],
    "Himachal Pradesh": ["Dharamshala", "Manali", "Mandi", "Shimla", "Solan"],
    "Jammu and Kashmir": ["Anantnag", "Baramulla", "Jammu", "Srinagar"],
    "Jharkhand": ["Bokaro", "Deoghar", "Dhanbad", "Jamshedpur", "Ranchi"],
    "Karnataka": ["Bangalore", "Belgaum", "Hubli", "Mangalore", "Mysore"],
    "Kerala": ["Kochi", "Kollam", "Kozhikode", "Thiruvananthapuram", "Thrissur"],
    "Ladakh": ["Kargil", "Leh"],
    "Lakshadweep": ["Agatti", "Kavaratti", "Minicoy"],
    "Madhya Pradesh": ["Bhopal", "Gwalior", "Indore", "Jabalpur", "Ujjain"],
    "Maharashtra": ["Aurangabad", "Mumbai", "Nagpur", "Nashik", "Pune"],
    "Manipur": ["Churachandpur", "Imphal", "Kakching", "Thoubal", "Ukhrul"],
    "Meghalaya": ["Baghmara", "Jowai", "Nongstoin", "Shillong", "Tura"],
    "Mizoram": ["Aizawl", "Champhai", "Kolasib", "Lunglei", "Saiha"],
    "Nagaland": ["Dimapur", "Kohima", "Mokokchung", "Tuensang", "Wokha"],
    "Odisha": ["Berhampur", "Bhubaneswar", "Cuttack", "Rourkela", "Sambalpur"],
    "Puducherry": ["Karaikal", "Mahe", "Ozhukarai", "Puducherry", "Yanam"],
    "Punjab": ["Amritsar", "Bathinda", "Jalandhar", "Ludhiana", "Patiala"],
    "Rajasthan": ["Bikaner", "Jaipur", "Jodhpur", "Kota", "Udaipur"],
    "Sikkim": ["Gangtok", "Mangan", "Namchi", "Pelling", "Ravangla"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli"],
    "Telangana": ["Hyderabad", "Karimnagar", "Khammam", "Nizamabad", "Warangal"],
    "Tripura": ["Agartala", "Bishalgarh", "Dharmanagar", "Kailashahar", "Udaipur"],
    "Uttar Pradesh": ["Agra", "Kanpur", "Lucknow", "Noida", "Varanasi"],
    "Uttarakhand": ["Dehradun", "Haldwani", "Haridwar", "Roorkee", "Rudrapur"],
    "West Bengal": ["Asansol", "Darjeeling", "Howrah", "Kolkata", "Siliguri"]
  };
  const [form, setForm] = useState({
    projectName: '', description: '', deadline: '', leaderName: user?.name || '',
    purpose: '', rolesNeeded: '', maxMembers: '', city: '', state: '',
  })

  const statesList = Object.keys(LOCATION_DATA)
  const citiesList = form.state ? (LOCATION_DATA[form.state as keyof typeof LOCATION_DATA] || []) : []
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.projectName || !form.leaderName) return
    if (isUniversal && (!form.purpose || !form.rolesNeeded || !form.city || !form.state)) return
    setLoading(true)

    try {
      const team = await createTeam(form.projectName, form.description, form.deadline, form.leaderName)
      if (team?.code) {
        const res1 = await saveTeam(team.code, form.projectName, 'leader', isUniversal ? 'universal' : 'code')
        if (res1?.error) {
          alert(`Failed to save to user_teams: ${res1.error}`)
          return
        }

        if (isUniversal) {
          await saveUniversalTeam({
            code: team.code,
            projectName: form.projectName,
            description: form.description,
            purpose: form.purpose,
            deadline: form.deadline,
            rolesNeeded: form.rolesNeeded,
            maxMembers: Number(form.maxMembers) || 5,
            city: form.city,
            state: form.state,
            createdBy: user?.email,
            leaderName: form.leaderName,
          })
        }
      }
    } catch (err: any) {
      alert(`Error creating team: ${err.message || err}`)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const selectedRoles = form.rolesNeeded ? form.rolesNeeded.split(',').map(t => t.trim()).filter(Boolean) : []
  const filteredRoles = PREDEFINED_ROLES.filter(r => r.name.toLowerCase().includes(roleSearch.toLowerCase()) && !selectedRoles.includes(r.name))
  const exactMatch = PREDEFINED_ROLES.some(r => r.name.toLowerCase() === roleSearch.toLowerCase()) || selectedRoles.some(r => r.toLowerCase() === roleSearch.toLowerCase())

  const handleAddRole = (role: string) => {
    if (!role.trim()) return;
    const newRoles = [...selectedRoles, role.trim()]
    set('rolesNeeded', newRoles.join(', '))
    setRoleSearch('')
    setShowRoleDropdown(false)
  }

  const handleRemoveRole = (role: string) => {
    const newRoles = selectedRoles.filter(r => r !== role)
    set('rolesNeeded', newRoles.join(', '))
  }

  return (
    <div style={{ maxWidth: '520px', width: '100%', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-10px', position: 'relative', zIndex: 10 }}>
        <button className="btn-ghost" onClick={onClose} style={{ padding: '4px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>

      <div className={styles.header}>
        <div className={styles.iconWrap}><Crown size={24} /></div>
        <h2 className={styles.title} style={{ margin: '16px 0 8px 0', fontSize: '24px' }}>Create New Team</h2>
        <p className={styles.sub} style={{ marginBottom: '24px' }}>Set up your project and get a shareable team code</p>
      </div>

      <div className={styles.form}>
        {/* Universal Toggle */}
        <div className={`${styles.universalToggle} ${isUniversal ? styles.active : ''}`} onClick={() => setIsUniversal(!isUniversal)}>
          <div style={{
            width: '38px', height: '20px', borderRadius: '10px',
            background: isUniversal ? 'var(--accent)' : 'var(--border2)',
            position: 'relative', transition: 'all 0.2s',
          }}>
            <div style={{
              width: '16px', height: '16px', borderRadius: '50%',
              background: '#fff', position: 'absolute', top: '2px',
              left: isUniversal ? '20px' : '2px', transition: 'left 0.2s',
            }} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}><Globe size={14} /> Make Universal</div>
            <div style={{ fontSize: '12px', color: 'var(--text2)' }}>
              {isUniversal ? 'Team will be publicly discoverable' : 'Only joinable with team code'}
            </div>
          </div>
        </div>

        <div className={styles.field}>
          <label className="label">Your Name</label>
          <input className="input" placeholder="e.g. Piyush" value={form.leaderName} onChange={e => set('leaderName', e.target.value)} />
        </div>

        <div className={styles.field}>
          <label className="label">Project / Team Name</label>
          <input className="input" placeholder="e.g. Campus Event App" value={form.projectName} onChange={e => set('projectName', e.target.value)} />
        </div>

        <div className={styles.field}>
          <label className="label">Project Description</label>
          <textarea className="textarea" placeholder="What are you building? (optional)" value={form.description} onChange={e => set('description', e.target.value)} />
        </div>



        {/* Universal-only fields */}
        {isUniversal && (
          <>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />
            <div style={{ fontSize: '13px', color: 'var(--accent2)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}><Globe size={14} /> Universal Team Details</div>

            <div className={styles.field}>
              <label className="label">Team Purpose *</label>
              <textarea className="textarea" placeholder="e.g. Building a mobile app for campus events. Looking for developers and designers." value={form.purpose} onChange={e => set('purpose', e.target.value)} style={{ minHeight: '60px' }} />
            </div>

            <div className={styles.field}>
              <label className="label">Deadline</label>
              <input className={`input ${styles.dateInput} ${form.deadline ? styles.hasValue : ''}`} type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
            </div>

            <div className={styles.field} style={{ position: 'relative' }}>
              <label className="label">Roles Needed *</label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedRoles.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedRoles.map(role => {
                      const predefined = PREDEFINED_ROLES.find(r => r.name === role)
                      const logoUrl = predefined ? predefined.logo : null
                      return (
                        <div key={role} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface2)', padding: '6px 12px', borderRadius: '100px', fontSize: '13px', color: 'var(--text)' }}>
                          {logoUrl ? <img src={logoUrl} alt="" style={{ width: '16px', height: '16px', objectFit: 'contain' }} /> : <span style={{ color: 'var(--accent)' }}>•</span>}
                          {role}
                          <X size={14} style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => handleRemoveRole(role)} />
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="input" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', height: '44px' }}>
                  <Search size={16} style={{ color: 'var(--text3)' }} />
                  <input
                    style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', width: '100%', height: '100%' }}
                    placeholder={selectedRoles.length === 0 ? "Search or add a role..." : "Add another role..."}
                    value={roleSearch}
                    onChange={e => { setRoleSearch(e.target.value); setShowRoleDropdown(true) }}
                    onFocus={() => setShowRoleDropdown(true)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (roleSearch) {
                          handleAddRole(roleSearch)
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {showRoleDropdown && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowRoleDropdown(false)} />
                  <div className={styles.noScrollbar} style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, width: '100%', background: 'var(--bg2)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px', boxShadow: '0 -10px 40px rgba(0,0,0,0.5)', zIndex: 50, maxHeight: '240px', overflowY: 'auto', animation: 'fadeIn 0.2s ease forwards' }}>
                    {filteredRoles.length === 0 && !roleSearch && (
                      <div style={{ padding: '8px 12px', color: 'var(--text3)', fontSize: '13px', textAlign: 'center' }}>
                        Type to search roles
                      </div>
                    )}
                    {filteredRoles.map((role, idx) => (
                      <React.Fragment key={role.name}>
                        <div onClick={() => handleAddRole(role.name)} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '8px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', transition: 'background 0.2s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <img src={role.logo} alt="" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                          {role.name}
                        </div>
                        {(idx < filteredRoles.length - 1 || (!exactMatch && roleSearch)) && <div style={{ height: '1px', background: 'var(--border)', opacity: 0.5, margin: '2px 8px' }} />}
                      </React.Fragment>
                    ))}
                    {!exactMatch && roleSearch && (
                      <div onClick={() => handleAddRole(roleSearch)} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '8px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', transition: 'background 0.2s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <div style={{ background: 'var(--accent)', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Plus size={12} color="#fff" />
                        </div>
                        Add "{roleSearch}"
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
              <div className={styles.field}>
                <label className="label">Max Members</label>
                {isUniversal ? (
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      className="input" 
                      type="number" 
                      value={selectedRoles.length + 1} 
                      readOnly
                      style={{ paddingRight: '40px', cursor: 'default', color: 'var(--text)' }}
                    />
                    <div 
                      onClick={() => setShowMembersInfo(!showMembersInfo)}
                      style={{ position: 'absolute', right: '12px', color: 'var(--text3)', cursor: 'pointer', display: 'flex' }}
                    >
                      <Info size={16} />
                    </div>
                    {showMembersInfo && (
                      <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: 0,
                        marginBottom: '8px',
                        background: '#1a1a1a',
                        border: '1px solid var(--border)',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        color: 'var(--text)',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                        zIndex: 10
                      }}>
                        Total members = Roles ({selectedRoles.length}) + Leader (1)
                      </div>
                    )}
                  </div>
                ) : (
                  <input className="input" type="number" placeholder="5" value={form.maxMembers} onChange={e => set('maxMembers', e.target.value)} />
                )}
              </div>
              <div className={styles.field} style={{ position: 'relative' }}>
                <label className="label">City *</label>
                <div
                  className="input"
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: form.city ? 'var(--text)' : 'rgba(255,255,255,0.4)', userSelect: 'none' }}
                  onClick={() => setShowCityDropdown(!showCityDropdown)}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.city || 'Select City'}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, transform: showCityDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="M6 9l6 6 6-6" /></svg>
                </div>
                {showCityDropdown && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowCityDropdown(false)} />
                    <div className={styles.noScrollbar} style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, width: '100%', background: 'rgba(23, 23, 23, 0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px', boxShadow: '0 -10px 40px rgba(0,0,0,0.4)', zIndex: 50, maxHeight: '200px', overflowY: 'auto', animation: 'fadeIn 0.2s ease forwards' }}>
                      {!form.state ? (
                        <div style={{ padding: '8px 12px', color: 'var(--text3)', fontSize: '13px', textAlign: 'center' }}>
                          Please select a State first
                        </div>
                      ) : citiesList.map((city, idx) => (
                        <React.Fragment key={city}>
                          <div onClick={() => { set('city', city); setShowCityDropdown(false) }} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '8px', color: 'var(--text)', background: form.city === city ? 'var(--surface2)' : 'transparent', fontSize: '13px' }}>
                            {city}
                          </div>
                          {idx < citiesList.length - 1 && <div style={{ height: '1px', background: 'var(--border)', opacity: 0.5, margin: '2px 8px' }} />}
                        </React.Fragment>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className={styles.field} style={{ position: 'relative' }}>
                <label className="label">State *</label>
                <div
                  className="input"
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: form.state ? 'var(--text)' : 'rgba(255,255,255,0.4)', userSelect: 'none' }}
                  onClick={() => setShowStateDropdown(!showStateDropdown)}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.state || 'Select State'}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, transform: showStateDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="M6 9l6 6 6-6" /></svg>
                </div>
                {showStateDropdown && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowStateDropdown(false)} />
                    <div className={styles.noScrollbar} style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, width: '100%', background: 'rgba(23, 23, 23, 0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px', boxShadow: '0 -10px 40px rgba(0,0,0,0.4)', zIndex: 50, maxHeight: '200px', overflowY: 'auto', animation: 'fadeIn 0.2s ease forwards' }}>
                      {statesList.map((state, idx) => (
                        <React.Fragment key={state}>
                          <div onClick={() => { set('state', state); set('city', ''); setShowStateDropdown(false) }} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '8px', color: 'var(--text)', background: form.state === state ? 'var(--surface2)' : 'transparent', fontSize: '13px' }}>
                            {state}
                          </div>
                          {idx < statesList.length - 1 && <div style={{ height: '1px', background: 'var(--border)', opacity: 0.5, margin: '2px 8px' }} />}
                        </React.Fragment>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        <button
          className={`btn-primary ${styles.submit}`}
          onClick={handleSubmit}
          disabled={loading || !form.projectName || !form.leaderName || (isUniversal && (!form.purpose || !form.rolesNeeded || !form.city || !form.state))}
        >
          {loading ? <><span className="spinner" /> Setting up...</> : isUniversal ? <>Create Universal Team</> : <>Create Team &amp; Get Code</>}
        </button>
      </div>
    </div>
  )
}
