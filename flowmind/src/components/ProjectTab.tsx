import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useApp } from '../context/AppContext'
import { 
  FolderGit2, 
  Github, 
  Globe, 
  GitCommit, 
  GitPullRequest, 
  ExternalLink, 
  RefreshCw, 
  Edit2, 
  Save, 
  GitBranch, 
  Star, 
  Users, 
  Clock, 
  Link2,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Unlink,
  CheckCircle2,
  Plus,
  Info,
  Key,
  X
} from 'lucide-react'
import { fetchGitHubActivity, GitHubActivityResult } from '../services/api'
import styles from './ProjectTab.module.css'

export default function ProjectTab() {
  const { team, role, updateTeamLinks } = useApp()
  const isRepoConnected = Boolean(team?.githubLink && team.githubLink.trim().length > 0)

  const [activity, setActivity] = useState<GitHubActivityResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [activeSegment, setActiveSegment] = useState<'commits' | 'prs' | 'contributors'>('commits')
  const [indicator, setIndicator] = useState({ left: 4, width: 0 })
  const commitsBtnRef = useRef<HTMLButtonElement>(null)
  const prsBtnRef = useRef<HTMLButtonElement>(null)
  const contribBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const updateIndicator = () => {
      let btn: HTMLButtonElement | null = null
      if (activeSegment === 'commits') btn = commitsBtnRef.current
      else if (activeSegment === 'prs') btn = prsBtnRef.current
      else if (activeSegment === 'contributors') btn = contribBtnRef.current

      if (btn) {
        setIndicator({
          left: btn.offsetLeft,
          width: btn.offsetWidth
        })
      }
    }
    updateIndicator()
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [activeSegment, activity?.stats?.commitsFetched, activity?.pullRequests?.length, activity?.contributors?.length])

  // Contributors ranked by number of commits
  const sortedContributors = useMemo(() => {
    if (!activity?.contributors) return []
    return [...activity.contributors].sort((a, b) => (b.commitCount || 0) - (a.commitCount || 0))
  }, [activity?.contributors])

  // Connect Onboarding Form State (when no repo is connected)
  const [connectForm, setConnectForm] = useState({
    repoUrl: '',
    token: '',
    deployUrl: team?.deployLink || '',
  })
  const [showConnectToken, setShowConnectToken] = useState(false)
  const [showConnectTokenInfo, setShowConnectTokenInfo] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  // Floating Edit Popover State
  const [showEditPopover, setShowEditPopover] = useState(false)
  const actionButtonRef = useRef<HTMLButtonElement>(null)
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; right: number }>({ top: 0, right: 0 })
  const [showEditToken, setShowEditToken] = useState(false)
  const [showEditTokenInfo, setShowEditTokenInfo] = useState(false)
  const [showMemberTokenInfo, setShowMemberTokenInfo] = useState(false)
  const [linksForm, setLinksForm] = useState({
    github: team?.githubLink || '',
    token: '',
    deploy: team?.deployLink || '',
  })
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Member Token Configuration State
  const [showMemberTokenModal, setShowMemberTokenModal] = useState(false)
  const [memberTokenInput, setMemberTokenInput] = useState('')
  const [showMemberTokenSecret, setShowMemberTokenSecret] = useState(false)
  const [savingMemberToken, setSavingMemberToken] = useState(false)
  const [memberTokenError, setMemberTokenError] = useState<string | null>(null)
  const [shareTokenWithTeam, setShareTokenWithTeam] = useState(true)

  const getSavedToken = () => {
    if (!team?.code) return ''
    return team?.githubToken || localStorage.getItem(`flowmind_gh_token_${team.code}`) || localStorage.getItem('flowmind_github_token') || ''
  }

  const loadActivity = async (isManualRefresh = false) => {
    if (!team?.githubLink || !team.githubLink.trim()) {
      setActivity(null)
      return
    }

    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)

    const token = getSavedToken()
    const data = await fetchGitHubActivity(team.githubLink.trim(), token)
    setActivity(data)
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    if (isRepoConnected) {
      loadActivity()
    } else {
      setActivity(null)
      setLoading(false)
    }
  }, [team?.githubLink, team?.code, team?.githubToken])

  const updatePosition = () => {
    if (actionButtonRef.current) {
      const rect = actionButtonRef.current.getBoundingClientRect()
      setPopoverCoords({
        top: rect.bottom + 10,
        right: Math.max(16, window.innerWidth - rect.right),
      })
    }
  }

  const handleToggleEditPopover = () => {
    if (!showEditPopover) {
      setShowMemberTokenModal(false)
      updatePosition()
      handleStartEdit()
    } else {
      setShowEditPopover(false)
    }
  }

  const handleToggleMemberTokenModal = () => {
    if (!showMemberTokenModal) {
      setShowEditPopover(false)
      updatePosition()
      setMemberTokenInput(getSavedToken())
      setMemberTokenError(null)
      setShowMemberTokenModal(true)
    } else {
      setShowMemberTokenModal(false)
    }
  }

  useEffect(() => {
    if (!showEditPopover && !showMemberTokenModal) return
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [showEditPopover, showMemberTokenModal])

  // Connect New Repository
  const handleConnectRepo = async (e: React.FormEvent) => {
    e.preventDefault()
    const repoInput = connectForm.repoUrl.trim()
    if (!repoInput) {
      setConnectError('Please enter a GitHub repository URL or slug (e.g. organization/repo).')
      return
    }

    setConnecting(true)
    setConnectError(null)

    const tokenInput = connectForm.token.trim()
    const result = await fetchGitHubActivity(repoInput, tokenInput)

    if (!result.success || result.error) {
      setConnectError(result.error || 'Failed to verify repository. Please check URL or token.')
      setConnecting(false)
      return
    }

    // Save token if provided
    if (team?.code && tokenInput) {
      localStorage.setItem(`flowmind_gh_token_${team.code}`, tokenInput)
    }

    // Save repo, deploy link, and githubToken to Supabase team
    updateTeamLinks({
      githubLink: result.repo ? `https://github.com/${result.repo}` : repoInput,
      githubToken: tokenInput || null,
      deployLink: connectForm.deployUrl.trim() || null,
    })

    setActivity(result)
    setConnecting(false)
  }

  // Open Edit Mode
  const handleStartEdit = () => {
    setLinksForm({
      github: team?.githubLink || '',
      token: getSavedToken(),
      deploy: team?.deployLink || '',
    })
    setEditError(null)
    setShowEditPopover(true)
  }

  // Save Edited Links
  const handleSaveLinks = async () => {
    const repoInput = linksForm.github.trim()
    setSavingEdit(true)
    setEditError(null)

    if (repoInput) {
      const tokenInput = linksForm.token.trim()
      const result = await fetchGitHubActivity(repoInput, tokenInput)

      if (!result.success || result.error) {
        setEditError(result.error || 'Failed to verify repository. Please check URL or token.')
        setSavingEdit(false)
        return
      }

      if (team?.code && tokenInput) {
        localStorage.setItem(`flowmind_gh_token_${team.code}`, tokenInput)
      } else if (team?.code && !tokenInput) {
        localStorage.removeItem(`flowmind_gh_token_${team.code}`)
      }

      updateTeamLinks({
        githubLink: result.repo ? `https://github.com/${result.repo}` : repoInput,
        githubToken: tokenInput || null,
        deployLink: linksForm.deploy.trim() || null,
      })
      setActivity(result)
    } else {
      // Cleared repo link
      if (team?.code) {
        localStorage.removeItem(`flowmind_gh_token_${team.code}`)
      }
      updateTeamLinks({
        githubLink: null,
        githubToken: null,
        deployLink: linksForm.deploy.trim() || null,
      })
      setActivity(null)
    }

    setSavingEdit(false)
    setShowEditPopover(false)
  }

  // Disconnect Repository
  const handleDisconnectRepo = () => {
    if (!window.confirm('Are you sure you want to disconnect this repository from the project?')) return
    if (team?.code) {
      localStorage.removeItem(`flowmind_gh_token_${team.code}`)
    }
    updateTeamLinks({
      githubLink: null,
      githubToken: null,
      deployLink: team?.deployLink || null,
    })
    setActivity(null)
    setShowEditPopover(false)
  }

  // Member Token Configuration Handlers
  const handleOpenMemberTokenModal = () => {
    updatePosition()
    setMemberTokenInput(getSavedToken())
    setMemberTokenError(null)
    setShowMemberTokenModal(true)
  }

  const handleSaveMemberToken = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const token = memberTokenInput.trim()
    setSavingMemberToken(true)
    setMemberTokenError(null)

    if (team?.githubLink && token) {
      const testResult = await fetchGitHubActivity(team.githubLink.trim(), token)
      if (!testResult.success || testResult.error) {
        setMemberTokenError(testResult.error || 'Failed to verify token with repository. Please check permissions.')
        setSavingMemberToken(false)
        return
      }
      setActivity(testResult)
    }

    if (team?.code) {
      if (token) {
        localStorage.setItem(`flowmind_gh_token_${team.code}`, token)
      } else {
        localStorage.removeItem(`flowmind_gh_token_${team.code}`)
      }
    }

    if (shareTokenWithTeam && team?.code) {
      updateTeamLinks({
        githubToken: token || null
      })
    }

    setSavingMemberToken(false)
    setShowMemberTokenModal(false)
    loadActivity(true)
  }

  const formatRelativeTime = (dateStr: string) => {
    try {
      const now = new Date().getTime()
      const past = new Date(dateStr).getTime()
      const diffMs = now - past
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      if (diffMins < 1) return 'just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays === 1) return 'yesterday'
      return `${diffDays}d ago`
    } catch {
      return ''
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE 1: NO REPOSITORY CONNECTED YET
  // ═══════════════════════════════════════════════════════════════════════════
  if (!isRepoConnected) {
    return (
      <div className={styles.connectWrap}>
        {/* Background GitHub Connection Flow Graphic spanning whole between box */}
        <div className={styles.bgGridIllustration} aria-hidden="true">
          <svg 
            className={styles.bgSvg} 
            width="100%" 
            height="100%" 
            viewBox="0 0 1400 800" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient id="lineGradAqua" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.04" />
                <stop offset="25%" stopColor="#14b8a6" stopOpacity="0.3" />
                <stop offset="75%" stopColor="#14b8a6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.04" />
              </linearGradient>
              <linearGradient id="lineGradWhite" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.02" />
                <stop offset="25%" stopColor="#ffffff" stopOpacity="0.1" />
                <stop offset="75%" stopColor="#ffffff" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Horizontal Dashed Rows across whole background */}
            <line x1="0" y1="100" x2="1400" y2="100" stroke="url(#lineGradWhite)" strokeWidth="1.2" strokeDasharray="6 6" />
            <line x1="0" y1="220" x2="1400" y2="220" stroke="url(#lineGradAqua)" strokeWidth="1.2" strokeDasharray="8 6" />
            <line x1="0" y1="340" x2="1400" y2="340" stroke="url(#lineGradWhite)" strokeWidth="1.2" strokeDasharray="6 6" />
            <line x1="0" y1="460" x2="1400" y2="460" stroke="url(#lineGradAqua)" strokeWidth="1.2" strokeDasharray="8 6" />
            <line x1="0" y1="580" x2="1400" y2="580" stroke="url(#lineGradWhite)" strokeWidth="1.2" strokeDasharray="6 6" />
            <line x1="0" y1="700" x2="1400" y2="700" stroke="url(#lineGradAqua)" strokeWidth="1.2" strokeDasharray="8 6" />

            {/* Git Branch Paths spanning from left to right */}
            <path d="M 0 220 C 240 220, 300 130, 460 130 H 940 C 1100 130, 1160 220, 1400 220" stroke="url(#lineGradAqua)" strokeWidth="1.8" strokeDasharray="7 6" fill="none" />
            <path d="M 0 580 C 240 580, 300 670, 460 670 H 940 C 1100 670, 1160 580, 1400 580" stroke="url(#lineGradAqua)" strokeWidth="1.8" strokeDasharray="7 6" fill="none" />

            {/* Diagonal interconnect branches */}
            <path d="M 120 340 C 200 340, 240 220, 320 220" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.2" strokeDasharray="5 5" fill="none" />
            <path d="M 1080 220 C 1160 220, 1200 340, 1280 340" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.2" strokeDasharray="5 5" fill="none" />
            <path d="M 160 460 C 240 460, 280 580, 360 580" stroke="rgba(20, 184, 166, 0.2)" strokeWidth="1.2" strokeDasharray="5 5" fill="none" />
            <path d="M 1040 580 C 1120 580, 1160 460, 1240 460" stroke="rgba(20, 184, 166, 0.2)" strokeWidth="1.2" strokeDasharray="5 5" fill="none" />

            {/* Left Git Nodes (FlowMind Team side) */}
            <g transform="translate(140, 220)">
              <circle r="7" fill="#18181b" stroke="#14b8a6" strokeWidth="2" />
              <circle r="3" fill="#14b8a6" />
              <text x="0" y="24" fill="#a1a1aa" fontSize="10.5" fontFamily="Inter, sans-serif" fontWeight="600" textAnchor="middle" letterSpacing="0.06em">FLOWMIND</text>
            </g>

            <g transform="translate(280, 130)">
              <circle r="5" fill="#18181b" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="1.5" />
              <circle r="2" fill="#ffffff" />
              <text x="0" y="-12" fill="rgba(255, 255, 255, 0.45)" fontSize="9.5" fontFamily="Inter, sans-serif" textAnchor="middle">commit</text>
            </g>

            <g transform="translate(180, 580)">
              <circle r="6" fill="#18181b" stroke="#14b8a6" strokeWidth="1.5" />
              <circle r="2.5" fill="#14b8a6" />
              <text x="0" y="-12" fill="rgba(20, 184, 166, 0.6)" fontSize="9.5" fontFamily="Inter, sans-serif" textAnchor="middle">main</text>
            </g>

            {/* Right Git Nodes (GitHub Repository side) */}
            <g transform="translate(1260, 220)">
              <circle r="7" fill="#18181b" stroke="#ffffff" strokeWidth="2" />
              <circle r="3" fill="#ffffff" />
              <text x="0" y="24" fill="#a1a1aa" fontSize="10.5" fontFamily="Inter, sans-serif" fontWeight="600" textAnchor="middle" letterSpacing="0.06em">GITHUB</text>
            </g>

            <g transform="translate(1120, 130)">
              <circle r="5" fill="#18181b" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="1.5" />
              <circle r="2" fill="#ffffff" />
              <text x="0" y="-12" fill="rgba(255, 255, 255, 0.45)" fontSize="9.5" fontFamily="Inter, sans-serif" textAnchor="middle">pull/req</text>
            </g>

            <g transform="translate(1220, 580)">
              <circle r="6" fill="#18181b" stroke="#14b8a6" strokeWidth="1.5" />
              <circle r="2.5" fill="#14b8a6" />
              <text x="0" y="22" fill="rgba(20, 184, 166, 0.6)" fontSize="9.5" fontFamily="Inter, sans-serif" textAnchor="middle">origin</text>
            </g>
          </svg>
        </div>

        {role === 'leader' ? (
          <div className={styles.connectCard}>
            <div className={styles.connectIconWrapper}>
              <FolderGit2 size={24} color="#ffffff" />
            </div>
            <div>
              <div className={styles.connectTitle}>Connect Your Team Repository</div>
              <div className={styles.connectSub}>
                Link your team's GitHub repository to track commits, PRs, and contributions.
              </div>
            </div>

            {connectError && (
              <div className={styles.errorBox} style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                  <AlertTriangle size={15} /> Error Connecting Repository
                </div>
                <div>{connectError}</div>
              </div>
            )}

            <form className={styles.connectForm} onSubmit={handleConnectRepo}>
              <div>
                <label className={styles.fieldLabel}>GitHub Repository URL or Slug *</label>
                <input
                  className={styles.inputField}
                  placeholder="https://github.com/organization/repository"
                  value={connectForm.repoUrl}
                  onChange={e => setConnectForm(prev => ({ ...prev, repoUrl: e.target.value }))}
                  required
                />
              </div>

              <div>
                <div className={styles.labelRow}>
                  <label className={styles.fieldLabel} style={{ marginBottom: 0 }}>GitHub Access Token (Optional)</label>
                  <div 
                    className={styles.infoWrapper}
                    onMouseEnter={() => setShowConnectTokenInfo(true)}
                    onMouseLeave={() => setShowConnectTokenInfo(false)}
                  >
                    <button 
                      type="button" 
                      className={styles.infoIconBtn}
                      onClick={() => setShowConnectTokenInfo(!showConnectTokenInfo)}
                      aria-label="GitHub Token Details"
                      title="Token details"
                    >
                      <Info size={13} color="#ffffff" />
                    </button>
                    {showConnectTokenInfo && (
                      <div className={styles.infoTooltip}>
                        <div style={{ marginBottom: '8px' }}>
                          Public repos need no token (60 req/hr). For private repos or high rate limits, enter a GitHub Personal Access Token with repo read permissions.
                        </div>
                        <a 
                          href="https://github.com/settings/tokens/new?scopes=repo&description=FlowMind%20Project%20Sync" 
                          target="_blank" 
                          rel="noreferrer" 
                          className={styles.tokenInlineLink}
                        >
                          Generate token on GitHub <ExternalLink size={10} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.inputWithIconWrapper}>
                  <input
                    className={styles.inputField}
                    type={showConnectToken ? 'text' : 'password'}
                    placeholder="ghp_... or github_pat_... (Optional for public repositories)"
                    value={connectForm.token}
                    onChange={e => setConnectForm(prev => ({ ...prev, token: e.target.value }))}
                    style={{ paddingRight: '40px' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConnectToken(!showConnectToken)} 
                    className={styles.insideInputBtn}
                    aria-label={showConnectToken ? "Hide token" : "Show token"}
                    title={showConnectToken ? "Hide token" : "Show token"}
                  >
                    {showConnectToken ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className={styles.fieldLabel}>Live Deployed Application URL (Optional)</label>
                <input
                  className={styles.inputField}
                  placeholder="https://your-project.vercel.app (optional)"
                  value={connectForm.deployUrl}
                  onChange={e => setConnectForm(prev => ({ ...prev, deployUrl: e.target.value }))}
                />
              </div>

              <button type="submit" className={styles.verifyBtn} disabled={connecting || !connectForm.repoUrl.trim()}>
                {connecting ? (
                  <>
                    <RefreshCw size={14} className={styles.spin} />
                    <span>Verifying Repository on GitHub...</span>
                  </>
                ) : (
                  <>
                    <Link2 size={15} />
                    <span>Verify &amp; Connect Repository</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className={styles.connectCard}>
            <div className={styles.connectIconWrapper}>
              <FolderGit2 size={24} color="#ffffff" />
            </div>
            <div className={styles.connectTitle}>No Repository Connected Yet</div>
            <div className={styles.connectSub}>
              The team leader hasn't connected a GitHub repository to this project yet. Once your leader links the team's repository, live commits, pull requests, and contributor activity will appear here.
            </div>
          </div>
        )}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE 2: REPOSITORY CONNECTED (LIVE ACTIVITY DASHBOARD)
  // ═══════════════════════════════════════════════════════════════════════════
  const repoDisplayUrl = team?.githubLink || ''
  const deployDisplayUrl = team?.deployLink || ''

  return (
    <div className={styles.wrap}>

      {/* ── 1. Hero / Summary Card ─────────────────────────────── */}
      <div className={styles.heroCard}>
        {/* Top-Right Corner Action Button */}
        {role === 'leader' ? (
          <div className={styles.editPopoverWrapper}>
            <button 
              ref={actionButtonRef}
              type="button"
              className={styles.heroEditBtn}
              onClick={handleToggleEditPopover}
              title="Edit Project Links & Repo"
            >
              <Edit2 size={12} />
              <span>Edit Links</span>
            </button>
          </div>
        ) : (
          <div className={styles.editPopoverWrapper}>
            <button 
              ref={actionButtonRef}
              type="button"
              className={styles.heroEditBtn}
              onClick={handleToggleMemberTokenModal}
              title="Configure GitHub Personal Access Token"
            >
              <Key size={12} />
              <span>{getSavedToken() ? 'Update Token' : 'Configure Token'}</span>
            </button>
          </div>
        )}

        <div className={styles.heroLeft}>
          <div className={styles.heroIconWrapper}>
            <FolderGit2 size={24} color="#ffffff" />
          </div>
          <div className={styles.heroInfo}>
            <div className={styles.heroTitle}>
              {team?.projectName || 'Project Repository'}
            </div>
            <div className={styles.heroSubtitle}>
              <span>{activity?.repo || repoDisplayUrl.replace('https://github.com/', '')}</span>
              {activity?.defaultBranch && (
                <>
                  <span className={styles.dotSeparator}>•</span>
                  <span className={styles.branchPill}>
                    <GitBranch size={11} color="var(--accent)" />
                    <span>{activity.defaultBranch}</span>
                  </span>
                </>
              )}
            </div>

            {/* Quick Stats Pills */}
            {activity?.stats && (
              <div className={styles.heroStats}>
                <span className={styles.statPill}>
                  <GitCommit size={12} color="#38bdf8" />
                  <span>{activity.stats.commitsFetched} commits</span>
                </span>
                <span className={styles.statPill}>
                  <GitPullRequest size={12} color="#38bdf8" />
                  <span>{activity.stats.openPrCount} open PRs</span>
                </span>
                {activity.stats.stars > 0 && (
                  <span className={styles.statPill}>
                    <Star size={12} color="#38bdf8" />
                    <span>{activity.stats.stars} stars</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={styles.heroRight}>
          <div className={styles.heroActionGroup}>
            <a 
              href={repoDisplayUrl} 
              target="_blank" 
              rel="noreferrer" 
              className={styles.openRepoBtn}
              title="Open on GitHub"
            >
              <Github size={14} />
              <span>View on GitHub</span>
              <ExternalLink size={12} />
            </a>

            {deployDisplayUrl && (
              <a 
                href={deployDisplayUrl} 
                target="_blank" 
                rel="noreferrer" 
                className={styles.liveSiteBtn}
                title={`Open Live App: ${deployDisplayUrl}`}
              >
                <Globe size={13} color="var(--text2)" />
                <span>Live Site</span>
                <ExternalLink size={11} />
              </a>
            )}
          </div>

          <div className={styles.heroRightCluster}>
            {/* Contributor Avatars Back-to-Back (Ranked by Commit Count) */}
            {sortedContributors.length > 0 && (
              <div 
                className={styles.facepileContainer}
                title="Contributors ranked by commits (Click to view list)"
                onClick={() => setActiveSegment('contributors')}
              >
                {sortedContributors.slice(0, 5).map((c, idx) => (
                  <div
                    key={c.username || c.name || idx}
                    className={styles.facepileItem}
                    style={{ marginLeft: idx === 0 ? 0 : '-8px', zIndex: 10 - idx }}
                    title={`#${idx + 1} ${c.name} (${c.commitCount} commits)`}
                  >
                    <img 
                      src={c.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.name)}`}
                      alt={c.name}
                      className={styles.facepileImg}
                    />
                  </div>
                ))}
                {sortedContributors.length > 5 && (
                  <div 
                    className={styles.facepileMore}
                    style={{ marginLeft: '-8px', zIndex: 1 }}
                    title={`+${sortedContributors.length - 5} more contributors`}
                  >
                    +{sortedContributors.length - 5}
                  </div>
                )}
              </div>
            )}

            <button 
              type="button"
              className={styles.refreshBtn} 
              onClick={() => loadActivity(true)} 
              disabled={refreshing || loading}
              title="Refresh GitHub Activity"
              aria-label="Refresh GitHub Activity"
            >
              <RefreshCw size={14} className={refreshing ? styles.spin : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Floating Popover Window (Portaled to document.body) ── */}
      {showEditPopover && typeof document !== 'undefined' && createPortal(
        <div 
          className={styles.modalOverlay} 
          onClick={() => setShowEditPopover(false)}
        >
          <div 
            className={styles.floatingEditWindow}
            style={{
              top: `${popoverCoords.top}px`,
              right: `${popoverCoords.right}px`,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className={styles.floatingHeader}>
              <div className={styles.floatingTitle}>Edit Project Links</div>
              <button 
                type="button" 
                className={styles.floatingCloseBtn}
                onClick={() => setShowEditPopover(false)}
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            {editError && (
              <div className={styles.errorBox} style={{ marginBottom: '14px', padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '12px' }}>
                  <AlertTriangle size={14} /> Error
                </div>
                <div style={{ fontSize: '11.5px', marginTop: '2px' }}>{editError}</div>
              </div>
            )}

            <div className={styles.floatingForm}>
              <div className={styles.floatingFieldGroup}>
                <label className={styles.fieldLabel}>GitHub Repository URL or Slug</label>
                <input
                  className={styles.inputField}
                  placeholder="https://github.com/organization/repository"
                  value={linksForm.github}
                  onChange={e => setLinksForm(prev => ({ ...prev, github: e.target.value }))}
                />
              </div>

              <div className={styles.floatingFieldGroup}>
                <div className={styles.labelRow}>
                  <label className={styles.fieldLabel} style={{ marginBottom: 0 }}>GitHub Access Token (Optional)</label>
                  <div 
                    className={styles.infoWrapper}
                    onMouseEnter={() => setShowEditTokenInfo(true)}
                    onMouseLeave={() => setShowEditTokenInfo(false)}
                  >
                    <button 
                      type="button" 
                      className={styles.infoIconBtn}
                      onClick={() => setShowEditTokenInfo(!showEditTokenInfo)}
                      aria-label="GitHub Token Details"
                      title="Token info"
                    >
                      <Info size={11} />
                    </button>
                    {showEditTokenInfo && (
                      <div className={styles.infoTooltip}>
                        <div style={{ marginBottom: '6px' }}>
                          Public repos need no token (60 req/hr). For private repos or higher limits, enter a GitHub Personal Access Token.
                        </div>
                        <a 
                          href="https://github.com/settings/tokens/new?scopes=repo&description=FlowMind%20Project%20Sync" 
                          target="_blank" 
                          rel="noreferrer" 
                          className={styles.tokenInlineLink}
                        >
                          Generate token on GitHub <ExternalLink size={10} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.inputWithIconWrapper}>
                  <input
                    className={styles.inputField}
                    type={showEditToken ? 'text' : 'password'}
                    placeholder="ghp_... (leave empty for public repos)"
                    value={linksForm.token}
                    onChange={e => setLinksForm(prev => ({ ...prev, token: e.target.value }))}
                    style={{ paddingRight: '40px' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowEditToken(!showEditToken)} 
                    className={styles.insideInputBtn}
                    aria-label={showEditToken ? "Hide token" : "Show token"}
                    title={showEditToken ? "Hide token" : "Show token"}
                  >
                    {showEditToken ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className={styles.floatingFieldGroup}>
                <label className={styles.fieldLabel}>Live Deployed Application URL</label>
                <input
                  className={styles.inputField}
                  placeholder="https://your-project.vercel.app"
                  value={linksForm.deploy}
                  onChange={e => setLinksForm(prev => ({ ...prev, deploy: e.target.value }))}
                />
              </div>

              <div className={styles.floatingActions}>
                <button 
                  type="button" 
                  className={styles.disconnectLinkBtn} 
                  onClick={handleDisconnectRepo} 
                  disabled={savingEdit}
                  title="Disconnect repository"
                >
                  <Unlink size={13} /> Disconnect Repo
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    type="button" 
                    className={styles.cancelPopBtn} 
                    onClick={() => setShowEditPopover(false)} 
                    disabled={savingEdit}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className={styles.savePopBtn} 
                    onClick={handleSaveLinks} 
                    disabled={savingEdit}
                  >
                    {savingEdit ? <RefreshCw size={12} className={styles.spin} /> : <Save size={13} />}
                    <span>Save</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Member Token Popover Window (Portaled to document.body) ── */}
      {showMemberTokenModal && typeof document !== 'undefined' && createPortal(
        <div 
          className={styles.modalOverlay} 
          onClick={() => setShowMemberTokenModal(false)}
        >
          <div 
            className={styles.floatingEditWindow}
            style={{
              top: `${popoverCoords.top}px`,
              right: `${popoverCoords.right}px`,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className={styles.floatingHeader}>
              <div className={styles.floatingTitle}>Configure GitHub Token</div>
              <button 
                type="button" 
                className={styles.floatingCloseBtn}
                onClick={() => setShowMemberTokenModal(false)}
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            {memberTokenError && (
              <div className={styles.errorBox} style={{ marginBottom: '14px', padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '12px' }}>
                  <AlertTriangle size={14} /> Error
                </div>
                <div style={{ fontSize: '11.5px', marginTop: '2px' }}>{memberTokenError}</div>
              </div>
            )}

            <form onSubmit={handleSaveMemberToken} className={styles.floatingForm}>
              <div className={styles.floatingFieldGroup}>
                <div className={styles.labelRow}>
                  <label className={styles.fieldLabel} style={{ marginBottom: 0 }}>GitHub Access Token</label>
                  <div 
                    className={styles.infoWrapper}
                    onMouseEnter={() => setShowMemberTokenInfo(true)}
                    onMouseLeave={() => setShowMemberTokenInfo(false)}
                  >
                    <button 
                      type="button" 
                      className={styles.infoIconBtn}
                      onClick={() => setShowMemberTokenInfo(!showMemberTokenInfo)}
                      aria-label="GitHub Token Details"
                      title="Token info"
                    >
                      <Info size={11} />
                    </button>
                    {showMemberTokenInfo && (
                      <div className={styles.infoTooltip}>
                        <div style={{ marginBottom: '6px' }}>
                          Required for private repositories. Enter a token with repo scope.
                        </div>
                        <a 
                          href="https://github.com/settings/tokens/new?scopes=repo&description=FlowMind%20Project%20Sync" 
                          target="_blank" 
                          rel="noreferrer" 
                          className={styles.tokenInlineLink}
                        >
                          Generate token on GitHub <ExternalLink size={10} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.inputWithIconWrapper}>
                  <input
                    className={styles.inputField}
                    type={showMemberTokenSecret ? 'text' : 'password'}
                    placeholder="ghp_... or github_pat_..."
                    value={memberTokenInput}
                    onChange={e => setMemberTokenInput(e.target.value)}
                    style={{ paddingRight: '40px' }}
                    autoFocus
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowMemberTokenSecret(!showMemberTokenSecret)} 
                    className={styles.insideInputBtn}
                    aria-label={showMemberTokenSecret ? "Hide token" : "Show token"}
                    title={showMemberTokenSecret ? "Hide token" : "Show token"}
                  >
                    {showMemberTokenSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text2)', cursor: 'pointer', margin: 0 }}>
                  <input 
                    type="checkbox" 
                    checked={shareTokenWithTeam} 
                    onChange={e => setShareTokenWithTeam(e.target.checked)} 
                    style={{ accentColor: 'var(--accent)', cursor: 'pointer', width: '13px', height: '13px' }}
                  />
                  <span>Share with team</span>
                </label>

                <a 
                  href="https://github.com/settings/tokens/new?scopes=repo&description=FlowMind%20Project%20Sync" 
                  target="_blank" 
                  rel="noreferrer" 
                  className={styles.tokenInlineLink}
                  style={{ fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                >
                  Generate token <ExternalLink size={9} />
                </a>
              </div>

              <div className={styles.floatingActions} style={{ justifyContent: 'flex-end', marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    type="button" 
                    className={styles.cancelPopBtn} 
                    onClick={() => setShowMemberTokenModal(false)} 
                    disabled={savingMemberToken}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className={styles.savePopBtn} 
                    disabled={savingMemberToken}
                  >
                    {savingMemberToken ? <RefreshCw size={12} className={styles.spin} /> : <Save size={13} />}
                    <span>Save</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── 3. Live GitHub Activity Section ────────────────────── */}
      <div className={styles.sectionCard}>
        <div className={styles.activityTopBar}>
          <div className={styles.sectionTitleRow}>
            <GitBranch size={16} color="var(--accent)" />
            <span className={styles.sectionTitle}>Live Activity</span>
          </div>

          {/* Segmented Filter Control */}
          <div className={styles.segmentedControl}>
            <div 
              className={styles.segmentIndicator}
              style={{
                transform: `translateX(${indicator.left}px)`,
                width: indicator.width ? `${indicator.width}px` : undefined,
                opacity: indicator.width ? 1 : 0
              }}
            />
            <button 
              ref={commitsBtnRef}
              className={`${styles.segmentBtn} ${activeSegment === 'commits' ? styles.segmentBtnActive : ''}`}
              onClick={() => setActiveSegment('commits')}
            >
              <GitCommit size={13} /> Commits
              <span className={styles.filterCount}>{activity?.stats?.commitsFetched || activity?.commits?.length || 0}</span>
            </button>
            <button 
              ref={prsBtnRef}
              className={`${styles.segmentBtn} ${activeSegment === 'prs' ? styles.segmentBtnActive : ''}`}
              onClick={() => setActiveSegment('prs')}
            >
              <GitPullRequest size={13} /> Pull Requests
              <span className={styles.filterCount}>{activity?.pullRequests?.length || 0}</span>
            </button>
            <button 
              ref={contribBtnRef}
              className={`${styles.segmentBtn} ${activeSegment === 'contributors' ? styles.segmentBtnActive : ''}`}
              onClick={() => setActiveSegment('contributors')}
            >
              <Users size={13} /> Contributors
              <span className={styles.filterCount}>{activity?.contributors?.length || 0}</span>
            </button>
          </div>
        </div>

        {/* Content area */}
        {loading ? (
          <div className={styles.loadingBox}>
            <RefreshCw size={24} className={styles.spin} />
            <span>Fetching live GitHub activity...</span>
          </div>
        ) : activity?.error ? (
          <div className={styles.errorBox}>
            <div className={styles.errorTitleRow}>
              <AlertTriangle size={16} />
              <span>{activity.error}</span>
            </div>
            <div className={styles.errorActionsRow}>
              <span className={styles.errorTipText}>
                {role === 'leader'
                  ? 'Tip: If this is a private repository, configure a GitHub Personal Access Token with repo scope so all team members can access it.'
                  : 'Tip: This repository is private or restricted. Configure a GitHub Personal Access Token to unlock commits, branches, and live activity.'}
              </span>
              <button
                type="button"
                className={styles.errorConfigureBtn}
                onClick={() => {
                  if (actionButtonRef.current) {
                    actionButtonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }
                  if (role === 'leader') {
                    handleToggleEditPopover()
                  } else {
                    handleOpenMemberTokenModal()
                  }
                }}
              >
                <Key size={13} />
                <span>{role === 'leader' ? 'Configure Links & Token' : 'Configure GitHub Token'}</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 1. Commits Feed */}
            {activeSegment === 'commits' && (
              <div className={styles.activityList}>
                {activity?.commits?.length ? (
                  <>
                    {activity.commits.map((c, i) => (
                      <div key={c.sha || i} className={styles.commitItem}>
                        <img 
                          src={c.author.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.author.name)}`} 
                          alt={c.author.name} 
                          className={styles.authorAvatar} 
                        />
                        <div className={styles.commitInfo}>
                          <div className={styles.commitTitleRow}>
                            <span className={styles.commitMessage} title={c.message}>
                              {c.message}
                            </span>
                            <a 
                              href={c.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className={styles.shaPill} 
                              title="View commit on GitHub"
                            >
                              {c.shortSha} <ExternalLink size={10} />
                            </a>
                          </div>
                          <div className={styles.commitMeta}>
                            <span className={styles.authorName}>
                              {c.author.name === '=' || !c.author.name ? (c.author.username || 'Contributor') : c.author.name}
                            </span>
                            {c.author.username && c.author.username !== c.author.name && c.author.name !== '=' && (
                              <span className={styles.authorHandle}>@{c.author.username}</span>
                            )}
                            <span>•</span>
                            <span className={styles.commitTime}>
                              <Clock size={11} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                              {formatRelativeTime(c.date)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {activity.stats && activity.stats.commitsFetched > activity.commits.length && (
                      <div style={{ textAlign: 'center', padding: '16px 0 6px', fontSize: '12px', color: 'var(--text3)' }}>
                        Showing latest {activity.commits.length} of {activity.stats.commitsFetched} total commits •{' '}
                        <a 
                          href={`${repoDisplayUrl}/commits`} 
                          target="_blank" 
                          rel="noreferrer" 
                          style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          View all on GitHub <ExternalLink size={11} />
                        </a>
                      </div>
                    )}
                  </>
                ) : (
                  <div className={styles.emptyState}>No commits found in this repository yet.</div>
                )}
              </div>
            )}

            {/* 2. Pull Requests Feed */}
            {activeSegment === 'prs' && (
              <div className={styles.activityList}>
                {activity?.pullRequests?.length ? (
                  activity.pullRequests.map((pr) => (
                    <a 
                      key={pr.id} 
                      href={pr.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className={styles.prItem}
                    >
                      <div className={styles.prStatusIcon}>
                        <GitPullRequest size={18} color={pr.state === 'open' ? 'var(--green)' : '#a855f7'} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                          <span className={styles.prTitle}>{pr.title}</span>
                          <span className={`${styles.prBadge} ${pr.state === 'open' ? styles.prBadgeOpen : styles.prBadgeMerged}`}>
                            {pr.isMerged ? 'Merged' : pr.state}
                          </span>
                        </div>
                        <div className={styles.commitMeta}>
                          <span>#{pr.number} by @{pr.author}</span>
                          <span>•</span>
                          <span>{formatRelativeTime(pr.updatedAt || pr.createdAt)}</span>
                        </div>
                      </div>
                    </a>
                  ))
                ) : (
                  <div className={styles.emptyState}>No pull requests found for this repository.</div>
                )}
              </div>
            )}

            {/* 3. Contributors Feed */}
            {activeSegment === 'contributors' && (
              <div className={styles.contributorsGrid}>
                {activity?.contributors?.length ? (
                  activity.contributors.map((contributor) => {
                    const isNameEquals = contributor.name === '=' || !contributor.name
                    const displayName = isNameEquals ? (contributor.username || 'Contributor') : contributor.name
                    const showHandle = contributor.username && contributor.username !== displayName

                    return (
                      <div key={contributor.username || contributor.name} className={styles.contributorCard}>
                        <img 
                          src={contributor.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`} 
                          alt={displayName} 
                          className={styles.contributorAvatar} 
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className={styles.contributorName}>{displayName}</div>
                          {showHandle && (
                            <div className={styles.contributorHandle}>@{contributor.username}</div>
                          )}
                        </div>
                        <div className={styles.contributorBadge}>
                          {contributor.commitCount} {contributor.commitCount === 1 ? 'commit' : 'commits'}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className={styles.emptyState}>No contributors computed yet.</div>
                )}
              </div>
            )}
          </>
        )}
      </div>

    </div>
  )
}
