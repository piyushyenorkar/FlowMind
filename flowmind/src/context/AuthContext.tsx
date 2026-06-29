import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase'
import { User } from '../types'

const AuthContext = createContext<any>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const syncUser = async (sessionUser: any) => {
      const email = sessionUser.email;
      const name = sessionUser.user_metadata?.name || 'User';
      const { data } = await supabase.from('users').select('*').eq('email', email).single()

      if (!data) {
        // User not in public.users (likely due to previous RLS issue), upsert them!
        const newUser = {
          name,
          email,
          password_hash: 'managed_by_supabase_auth',
          created_at: new Date().toISOString()
        }
        await supabase.from('users').upsert([newUser])
      } else {
        console.log('Fetched user from DB:', data)
      }

      return {
        name: data?.name || name,
        email,
        createdAt: data?.created_at || new Date().toISOString(),
        profileData: data?.profile_data || {},
        photoUrl: data?.photo_url || null,
        teams: []
      }
    }

    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const userObj = await syncUser(session.user)
        setUser(userObj)
      }
      setLoading(false)
    }
    fetchSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const userObj = await syncUser(session.user)
        setUser(userObj)
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Auth ──────────────────────────────────────────────────────────────
  const signup = useCallback(async (name: string, email: string, password: string) => {
    const key = email.toLowerCase().trim()

    const { data, error } = await supabase.auth.signUp({
      email: key,
      password,
      options: {
        data: { name: name.trim() }
      }
    })

    if (error) return { error: error.message }

    const newUser = {
      name: name.trim(),
      email: key,
      password_hash: 'managed_by_supabase_auth',
      created_at: new Date().toISOString()
    }
    await supabase.from('users').upsert([newUser])

    return { success: true }
  }, [])

  const signin = useCallback(async (email: string, password: string) => {
    const key = email.toLowerCase().trim()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: key,
      password
    })

    if (error) return { error: error.message }
    return { success: true }
  }, [])

  const signout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  // ── Team Persistence ──────────────────────────────────────────────────
  const isTeamMember = useCallback(async (teamCode: string) => {
    if (!user?.email) return false
    const { data } = await supabase.from('user_teams').select('*').eq('user_email', user.email).eq('team_code', teamCode).single()
    return !!data
  }, [user])

  const saveTeam = useCallback(async (teamCode: string, projectName: string, role: string, source = 'code') => {
    if (!user?.email) return { error: 'Not logged in' }

    const { data: existing } = await supabase.from('user_teams').select('*').eq('user_email', user.email).eq('team_code', teamCode).single()
    if (existing) return { error: 'Already in this team.' }

    const { error } = await supabase.from('user_teams').insert([{
      user_email: user.email,
      team_code: teamCode,
      role,
      source
    }])
    if (error) return { error: error.message }
    return { success: true }
  }, [user])

  const getMyTeams = useCallback(async () => {
    if (!user?.email) return []
    const { data, error } = await supabase.from('user_teams').select(`*, teams ( project_name, group_chat_name, description, deadline, created_at )`).eq('user_email', user.email)
    if (error || !data) return []
    return data.map(d => {
      let desc = d.teams?.description
      try { if (desc?.startsWith('{')) desc = JSON.parse(desc).description } catch (e) { }
      return {
        code: d.team_code,
        projectName: d.teams?.project_name,
        groupChatName: d.teams?.group_chat_name,
        description: desc,
        deadline: d.teams?.deadline,
        createdAt: d.teams?.created_at,
        role: d.role,
        source: d.source,
        joinedAt: d.joined_at
      }
    })
  }, [user])

  // ── Universal Teams ───────────────────────────────────────────────────
  const saveUniversalTeam = useCallback(async (teamData: any) => {
    if (!user?.email) return
    const meta = JSON.stringify({
      description: teamData.description,
      purpose: teamData.purpose,
      rolesNeeded: teamData.rolesNeeded,
      maxMembers: teamData.maxMembers,
      city: teamData.city,
      state: teamData.state
    })
    await supabase.from('teams').upsert([{
      code: teamData.code,
      project_name: teamData.projectName,
      description: meta,
      deadline: teamData.deadline,
      leader_name: teamData.leaderName,
      created_by: user.email,
      created_at: new Date().toISOString()
    }])

    await supabase.from('user_teams').upsert([{
      user_email: user.email,
      team_code: teamData.code,
      role: 'leader',
      source: 'universal'
    }])
  }, [user])

  const getUniversalTeams = useCallback(async () => {
    const { data: ut } = await supabase.from('user_teams').select('team_code').eq('source', 'universal')
    const codes = ut?.map(u => u.team_code) || []
    if (codes.length === 0) return []

    const { data, error } = await supabase.from('teams').select('*').in('code', codes).order('created_at', { ascending: false })
    if (error || !data) return []

    const creatorEmails = data.map((d: any) => d.created_by).filter(Boolean)
    const { data: usersData } = await supabase.from('users').select('email, photo_url').in('email', creatorEmails)
    const photoMap: Record<string, string> = {}
    usersData?.forEach((u: any) => { if (u.photo_url) photoMap[u.email] = u.photo_url })

    return data.map((d: any) => {
      let meta: any = { description: d.description }
      try { if (d.description?.startsWith('{')) meta = JSON.parse(d.description) } catch (e) { }
      return {
        code: d.code, name: d.project_name, projectName: d.project_name,
        description: meta.description, deadline: d.deadline, leaderName: d.leader_name,
        leaderPhoto: photoMap[d.created_by] || null,
        createdBy: d.created_by, createdAt: d.created_at,
        purpose: meta.purpose, rolesNeeded: meta.rolesNeeded, maxMembers: meta.maxMembers,
        city: meta.city, state: meta.state
      }
    })
  }, [])

  const getMyUniversalTeams = useCallback(async () => {
    if (!user?.email) return []
    const { data: ut } = await supabase.from('user_teams').select('team_code').eq('source', 'universal').eq('user_email', user.email)
    const codes = ut?.map(u => u.team_code) || []
    if (codes.length === 0) return []

    const { data, error } = await supabase.from('teams').select('*').in('code', codes).order('created_at', { ascending: false })
    if (error || !data) return []

    const creatorEmails = data.map((d: any) => d.created_by).filter(Boolean)
    const { data: usersData } = await supabase.from('users').select('email, photo_url').in('email', creatorEmails)
    const photoMap: Record<string, string> = {}
    usersData?.forEach((u: any) => { if (u.photo_url) photoMap[u.email] = u.photo_url })

    return data.map((d: any) => {
      let meta: any = { description: d.description }
      try { if (d.description?.startsWith('{')) meta = JSON.parse(d.description) } catch (e) { }
      return {
        code: d.code, name: d.project_name, projectName: d.project_name,
        description: meta.description, deadline: d.deadline, leaderName: d.leader_name,
        leaderPhoto: photoMap[d.created_by] || null,
        createdBy: d.created_by, createdAt: d.created_at,
        purpose: meta.purpose, rolesNeeded: meta.rolesNeeded, maxMembers: meta.maxMembers,
        city: meta.city, state: meta.state
      }
    })
  }, [user])

  // ── Applications ──────────────────────────────────────────────────────
  const applyToTeam = useCallback(async (teamCode: string, teamName: string, role: string) => {
    if (!user?.email) return { error: 'Not logged in' }

    const { data: existing } = await supabase.from('applications').select('*').eq('team_code', teamCode).eq('applicant_email', user.email).single()
    if (existing) return { error: 'You have already applied to this team.' }

    const id = 'app_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)

    const { error } = await supabase.from('applications').insert([{
      id,
      team_code: teamCode,
      team_name: teamName,
      applicant_email: user.email,
      applicant_name: user.name,
      applied_role: role || 'Member',
      status: 'pending'
    }])

    if (error) return { error: error.message }
    return { success: true, id }
  }, [user])

  const getMyApplications = useCallback(async () => {
    if (!user?.email) return []
    const { data, error } = await supabase.from('applications').select('*').eq('applicant_email', user.email).order('created_at', { ascending: false })
    if (error || !data) return []
    return data.map(d => ({
      id: d.id, teamCode: d.team_code, teamName: d.team_name, applicantEmail: d.applicant_email, applicantName: d.applicant_name, appliedRole: d.applied_role, status: d.status, createdAt: d.created_at
    }))
  }, [user])

  const getReceivedApplications = useCallback(async () => {
    if (!user?.email) return []
    // Get teams created by me
    const { data: myTeams } = await supabase.from('teams').select('code').eq('created_by', user.email)
    if (!myTeams || myTeams.length === 0) return []

    const myCodes = myTeams.map(t => t.code)
    const { data, error } = await supabase.from('applications').select('*').in('team_code', myCodes).order('created_at', { ascending: false })
    if (error || !data) return []

    const emails = [...new Set(data.map(d => d.applicant_email).filter(Boolean))]
    let photoMap: Record<string, string> = {}
    if (emails.length > 0) {
      const { data: users } = await supabase.from('users').select('email, photo_url').in('email', emails)
      if (users) {
        users.forEach(u => { if (u.photo_url) photoMap[u.email] = u.photo_url })
      }
    }

    return data.map(d => ({
      id: d.id, teamCode: d.team_code, teamName: d.team_name, applicantEmail: d.applicant_email, applicantName: d.applicant_name, applicantPhoto: photoMap[d.applicant_email] || null, appliedRole: d.applied_role, status: d.status, createdAt: d.created_at
    }))
  }, [user])

  const getAcceptedRoles = useCallback(async (teamCodes: string[]) => {
    if (!teamCodes || teamCodes.length === 0) return []
    const { data, error } = await supabase.from('applications')
      .select('team_code, applied_role, applicant_name, applicant_email')
      .in('team_code', teamCodes)
      .eq('status', 'accepted')
    if (error || !data) return []

    // Batch-fetch profile photos from users table
    const emails = [...new Set(data.map(d => d.applicant_email).filter(Boolean))]
    let photoMap: Record<string, string> = {}
    if (emails.length > 0) {
      const { data: users } = await supabase.from('users').select('email, photo_url').in('email', emails)
      if (users) {
        users.forEach(u => { if (u.photo_url) photoMap[u.email] = u.photo_url })
      }
    }

    return data.map(d => ({
      team_code: d.team_code,
      role: d.applied_role,
      applicant_name: d.applicant_name,
      applicant_email: d.applicant_email,
      photo_url: photoMap[d.applicant_email] || null
    }))
  }, [])

  const updateApplication = useCallback(async (appId: string, status: string) => {
    const { data: app, error: fetchErr } = await supabase.from('applications').select('*').eq('id', appId).single()
    if (fetchErr || !app) return { error: 'Application not found' }

    const { error } = await supabase.from('applications').update({ status }).eq('id', appId)
    if (error) return { error: error.message }

    if (status === 'accepted') {
      // 1. Add to user_teams
      await supabase.from('user_teams').upsert([{
        user_email: app.applicant_email,
        team_code: app.team_code,
        role: 'member',
        source: 'universal'
      }])

      // 2. Add to team_members
      await supabase.from('team_members').upsert([{
        id: `m_${app.team_code}_${app.applicant_email}`,
        team_code: app.team_code,
        name: app.applicant_name,
        role: app.applied_role || 'Member',
        is_leader: false
      }])
    }
    return { success: true }
  }, [])

  const addChatMessage = useCallback(async (appId: string, text: string, fromEmail?: string) => {
    const { error } = await supabase.from('application_chats').insert([{
      application_id: appId,
      from_email: fromEmail || user?.email || 'unknown',
      from_name: user?.name || 'Unknown',
      text
    }])
    if (error) return { error: error.message }
    return { success: true }
  }, [user])

  const getApplication = useCallback(async (appId: string) => {
    const { data, error } = await supabase.from('applications').select('*').eq('id', appId).single()
    if (error || !data) return null

    const { data: chats } = await supabase.from('application_chats').select('*').eq('application_id', appId).order('timestamp', { ascending: true })

    return {
      id: data.id, teamCode: data.team_code, teamName: data.team_name, applicantEmail: data.applicant_email, applicantName: data.applicant_name, appliedRole: data.applied_role, status: data.status, createdAt: data.created_at,
      chat: chats?.map(c => ({ from: c.from_email, fromName: c.from_name, text: c.text, timestamp: c.timestamp })) || []
    }
  }, [])

  const updateGlobalProfile = useCallback(async (profileData: any) => {
    if (!user?.email) return { error: 'Not logged in' }

    const photoUrl = profileData.photoUrl || null

    // Update local state immediately for fast UI
    setUser(prev => prev ? { ...prev, profileData, photoUrl } : null)

    // Persist to Supabase globally
    // We update photo_url and profile_data
    const { error } = await supabase.from('users').update({ photo_url: photoUrl, profile_data: profileData }).eq('email', user.email)
    if (error) {
      console.error('Failed to update global profile:', error)
      alert('Error saving to database: ' + error.message)
      return { error: error.message }
    }
    return { success: true }
  }, [user])

  return (
    <AuthContext.Provider value={{
      user, loading,
      signup, signin, signout,
      saveTeam, getMyTeams, isTeamMember,
      saveUniversalTeam, getUniversalTeams, getMyUniversalTeams, getAcceptedRoles,
      applyToTeam, getMyApplications, getReceivedApplications,
      updateApplication, addChatMessage, getApplication,
      updateGlobalProfile,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
