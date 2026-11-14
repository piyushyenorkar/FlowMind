// ─── FlowMind Backend — GitHub Service ─────────────────────────────────────────

export interface FormattedCommit {
  sha: string
  shortSha: string
  author: {
    name: string
    username?: string
    avatarUrl?: string
  }
  message: string
  date: string
  url: string
}

export interface FormattedPR {
  id: number
  number: number
  title: string
  state: 'open' | 'closed'
  isMerged: boolean
  author: string
  authorAvatar?: string
  url: string
  createdAt: string
  updatedAt: string
}

export interface ContributorStat {
  name: string
  username?: string
  avatarUrl?: string
  commitCount: number
}

export interface GitHubActivityResponse {
  success: boolean
  repo: string
  owner: string
  repoName: string
  defaultBranch: string
  description?: string
  stats: {
    commitsFetched: number
    openPrCount: number
    closedPrCount: number
    stars: number
    forks: number
  }
  latestCommit?: FormattedCommit
  commits: FormattedCommit[]
  pullRequests: FormattedPR[]
  contributors: ContributorStat[]
  error?: string
  rateLimitRemaining?: number
}

/**
 * Extracts owner and repo from various GitHub URL formats:
 * - https://github.com/owner/repo
 * - github.com/owner/repo
 * - owner/repo
 */
export function parseGitHubUrl(input: string): { owner: string; repo: string } | null {
  if (!input) return null
  const cleaned = input.trim().replace(/\/+$/, '')

  // Match https://github.com/owner/repo or git@github.com:owner/repo
  const urlMatch = cleaned.match(/github\.com[/:]([^/]+)\/([^/]+)/i)
  if (urlMatch) {
    return {
      owner: urlMatch[1],
      repo: urlMatch[2].replace(/\.git$/i, '')
    }
  }

  // Match simple "owner/repo"
  const simpleMatch = cleaned.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/)
  if (simpleMatch) {
    return {
      owner: simpleMatch[1],
      repo: simpleMatch[2].replace(/\.git$/i, '')
    }
  }

  return null
}

/**
 * Fetches recent activity (commits, PRs, stats) from GitHub REST API
 * Supports both public unauthenticated repos and authenticated private/public tokens.
 */
export async function getGitHubActivity(
  repoUrlOrSlug: string,
  customToken?: string
): Promise<GitHubActivityResponse> {
  const parsed = parseGitHubUrl(repoUrlOrSlug)
  if (!parsed) {
    return {
      success: false,
      repo: repoUrlOrSlug || 'unknown',
      owner: '',
      repoName: '',
      defaultBranch: 'main',
      stats: { commitsFetched: 0, openPrCount: 0, closedPrCount: 0, stars: 0, forks: 0 },
      commits: [],
      pullRequests: [],
      contributors: [],
      error: 'Invalid GitHub URL or repository slug format. Expected e.g. https://github.com/owner/repo'
    }
  }

  const { owner, repo } = parsed
  const token = customToken || process.env.GITHUB_TOKEN

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'FlowMind-Engineering-PM/1.0',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  if (token && token.trim().length > 0) {
    headers['Authorization'] = `Bearer ${token.trim()}`
  }

  try {
    // 1. Fetch Repo Metadata
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers })
    let defaultBranch = 'main'
    let description = ''
    let stars = 0
    let forks = 0
    let rateLimitRemaining: number | undefined

    if (repoRes.headers.get('x-ratelimit-remaining')) {
      rateLimitRemaining = parseInt(repoRes.headers.get('x-ratelimit-remaining') || '0', 10)
    }

    if (!repoRes.ok) {
      if (repoRes.status === 404) {
        return {
          success: false,
          repo: `${owner}/${repo}`,
          owner,
          repoName: repo,
          defaultBranch: 'main',
          stats: { commitsFetched: 0, openPrCount: 0, closedPrCount: 0, stars: 0, forks: 0 },
          commits: [],
          pullRequests: [],
          contributors: [],
          error: `Repository '${owner}/${repo}' not found. If it is private, please add GITHUB_TOKEN to backend/.env.`
        }
      }
      if (repoRes.status === 403 && rateLimitRemaining === 0) {
        return {
          success: false,
          repo: `${owner}/${repo}`,
          owner,
          repoName: repo,
          defaultBranch: 'main',
          stats: { commitsFetched: 0, openPrCount: 0, closedPrCount: 0, stars: 0, forks: 0 },
          commits: [],
          pullRequests: [],
          contributors: [],
          error: 'GitHub API rate limit exceeded. Add a GITHUB_TOKEN in backend/.env to increase limit to 5000 req/hr.'
        }
      }
    } else {
      const repoData = await repoRes.json()
      defaultBranch = repoData.default_branch || 'main'
      description = repoData.description || ''
      stars = repoData.stargazers_count || 0
      forks = repoData.forks_count || 0
    }

    // 2. Fetch Commits (Fetch up to 100 recent commits for the activity list)
    const commitsRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=100`,
      { headers }
    )
    const rawCommits = commitsRes.ok ? await commitsRes.json() : []

    const commits: FormattedCommit[] = Array.isArray(rawCommits)
      ? rawCommits.map((c: any) => {
          let authorName = c.commit?.author?.name || c.author?.login || 'Unknown'
          if (authorName.trim() === '=' || authorName.trim() === '') {
            authorName = c.author?.login || 'Contributor'
          }
          const messageLines = (c.commit?.message || '').split('\n')
          const title = messageLines[0] || 'Commit'

          return {
            sha: c.sha,
            shortSha: c.sha ? c.sha.substring(0, 7) : '',
            author: {
              name: authorName,
              username: c.author?.login,
              avatarUrl: c.author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authorName)}`
            },
            message: title,
            date: c.commit?.author?.date || c.commit?.committer?.date || new Date().toISOString(),
            url: c.html_url || `https://github.com/${owner}/${repo}/commit/${c.sha}`
          }
        })
      : []

    // 3. Fetch Pull Requests
    const prsRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=30`,
      { headers }
    )
    const rawPrs = prsRes.ok ? await prsRes.json() : []

    const pullRequests: FormattedPR[] = Array.isArray(rawPrs)
      ? rawPrs.map((pr: any) => ({
          id: pr.id,
          number: pr.number,
          title: pr.title,
          state: pr.state === 'open' ? 'open' : 'closed',
          isMerged: !!pr.merged_at,
          author: pr.user?.login || 'Unknown',
          authorAvatar: pr.user?.avatar_url,
          url: pr.html_url,
          createdAt: pr.created_at,
          updatedAt: pr.updated_at
        }))
      : []

    // 4. Fetch Contributors from GitHub's Official Contributors API
    let contributors: ContributorStat[] = []
    try {
      const contribRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100&anon=true`,
        { headers }
      )
      if (contribRes.ok) {
        const rawContribs = await contribRes.json()
        if (Array.isArray(rawContribs)) {
          contributors = rawContribs.map((c: any) => {
            const username = c.login || (c.type === 'Anonymous' ? c.name : undefined)
            let displayName = c.login || c.name || 'Contributor'
            if (displayName.trim() === '=' || displayName.trim() === '') {
              displayName = c.login || 'Contributor'
            }
            return {
              name: displayName,
              username: c.login || username,
              avatarUrl: c.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
              commitCount: c.contributions || 0
            }
          })
        }
      }
    } catch (e) {
      console.warn('[GitHub Service] Could not fetch contributors API, falling back to commit map', e)
    }

    // Merge in any contributors from the fetched commits if missing
    const knownLogins = new Set(contributors.map(c => (c.username || c.name || '').toLowerCase()))
    for (const c of commits) {
      const authorKey = (c.author.username || c.author.name || '').toLowerCase()
      if (authorKey && !knownLogins.has(authorKey)) {
        knownLogins.add(authorKey)
        let dispName = c.author.name
        if (dispName.trim() === '=' || dispName.trim() === '') {
          dispName = c.author.username || 'Contributor'
        }
        contributors.push({
          name: dispName,
          username: c.author.username,
          avatarUrl: c.author.avatarUrl,
          commitCount: 1
        })
      }
    }

    // Merge in any contributors from pull requests if missing
    for (const pr of pullRequests) {
      const prAuthorKey = (pr.author || '').toLowerCase()
      if (prAuthorKey && prAuthorKey !== 'unknown' && !knownLogins.has(prAuthorKey)) {
        knownLogins.add(prAuthorKey)
        contributors.push({
          name: pr.author,
          username: pr.author,
          avatarUrl: pr.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(pr.author)}`,
          commitCount: 0
        })
      }
    }
    contributors.sort((a, b) => b.commitCount - a.commitCount)

    // 5. Compute Accurate Total Commits
    let totalCommits = 0
    try {
      const totalRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`,
        { headers }
      )
      const linkHeader = totalRes.headers.get('link')
      if (linkHeader) {
        const match = linkHeader.match(/&page=(\d+)[^>]*>;\s*rel="last"/)
        if (match && match[1]) {
          totalCommits = parseInt(match[1], 10)
        }
      }
      if (!totalCommits) {
        const sumContribs = contributors.reduce((acc, curr) => acc + (curr.commitCount || 0), 0)
        totalCommits = Math.max(sumContribs, commits.length)
      }
    } catch {
      totalCommits = commits.length
    }

    const openPrCount = pullRequests.filter(p => p.state === 'open').length
    const closedPrCount = pullRequests.filter(p => p.state === 'closed').length

    return {
      success: true,
      repo: `${owner}/${repo}`,
      owner,
      repoName: repo,
      defaultBranch,
      description,
      stats: {
        commitsFetched: totalCommits || commits.length,
        openPrCount,
        closedPrCount,
        stars,
        forks
      },
      latestCommit: commits[0] || undefined,
      commits,
      pullRequests,
      contributors,
      rateLimitRemaining
    }
  } catch (err: any) {
    console.error('[GitHub Service Error]:', err.message)
    return {
      success: false,
      repo: `${owner}/${repo}`,
      owner,
      repoName: repo,
      defaultBranch: 'main',
      stats: { commitsFetched: 0, openPrCount: 0, closedPrCount: 0, stars: 0, forks: 0 },
      commits: [],
      pullRequests: [],
      contributors: [],
      error: `Failed to fetch GitHub activity: ${err.message}`
    }
  }
}
