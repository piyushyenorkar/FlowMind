import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { retainMemory, syncTeamToGraph, syncMemberToGraph, syncTaskToGraph } from '../services/api'
import { supabase } from '../services/supabase'

const AppContext = createContext<any>(null)

const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase()

const pushMemory = (prev: any, event: any, explicitTeamCode?: string) => {
  const entry = {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
    type: event.type,
    text: event.text,
    icon: event.icon,
    meta: event.meta,
    timestamp: new Date().toISOString(),
  }

  const targetCode = explicitTeamCode || prev.team?.code;
  if (targetCode) {
    supabase.from('memory_feed').insert([{
      id: entry.id,
      team_code: targetCode,
      type: entry.type,
      text: entry.text,
      icon: entry.icon,
      meta: entry.meta,
      timestamp: entry.timestamp
    }]).then(res => {
      if (res.error) console.error("Error inserting memory:", res.error)
    })
  }

  return [entry, ...prev.memoryFeed]
}

const getInitialState = () => {
  let saved = null
  try {
    const data = localStorage.getItem('flowmind_state')
    if (data) saved = JSON.parse(data)
  } catch (e) { }

  let hash = window.location.hash.slice(1)
  if (!hash) hash = 'landing'

  return {
    role: saved?.role || null,
    page: hash,
    team: saved?.team || null,
    currentUser: saved?.currentUser || null,
    tasks: [],
    decisions: [],
    memoryFeed: [],
    members: [],
    meetings: [],
    memberProfiles: {},
    dmTarget: null,
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<any>(getInitialState)
  const [initialFetchDone, setInitialFetchDone] = useState(false)

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (hash) {
        setState((prev: any) => ({ ...prev, page: hash }))
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    if (state.team && state.role && state.currentUser) {
      localStorage.setItem('flowmind_state', JSON.stringify({
        team: state.team,
        role: state.role,
        currentUser: state.currentUser
      }))
    }
  }, [state.team, state.role, state.currentUser])

  const update = useCallback((patch: any) => {
    setState((prev: any) => ({ ...prev, ...patch }))
  }, [])

  // Sync team data when a team is loaded
  const syncTeamData = useCallback(async (teamCode: string) => {
    if (!teamCode) return;

    // Fetch members and deduplicate by name
    const { data: membersData } = await supabase.from('team_members').select('*').eq('team_code', teamCode)
    const members = (membersData || []).reduce((acc: any[], m: any) => {
      if (!acc.some(existing => existing.name === m.name)) {
        acc.push({ id: m.id, name: m.name, role: m.role, isLeader: m.is_leader })
      }
      return acc
    }, [])

    // Fetch tasks
    const { data: tasksData } = await supabase.from('tasks').select('*, task_updates(*)').eq('team_code', teamCode)
    const tasks = tasksData?.map(t => ({
      id: t.id, title: t.title, description: t.description, assignedTo: t.assigned_to, status: t.status, estimatedHours: t.estimated_hours, actualHours: t.actual_hours, deadline: t.deadline, createdAt: t.created_at,
      updates: t.task_updates?.map((u: any) => ({ text: u.text, author: u.author, timestamp: u.timestamp })) || []
    })) || []

    // Fetch decisions
    const { data: decData } = await supabase.from('decisions').select('*').eq('team_code', teamCode)
    const decisions = decData?.map(d => ({
      id: d.id, decision: d.decision, reason: d.reason, impact: d.impact, people: d.involved_people, createdAt: d.created_at
    })) || []

    // Fetch memory feed (no limit so it persists forever)
    const { data: memData, error: memError } = await supabase.from('memory_feed').select('*').eq('team_code', teamCode).order('timestamp', { ascending: false })
    if (memError) console.error("Error fetching memory_feed:", memError);
    console.log("Fetched memory_feed:", memData?.length, "rows");
    const memoryFeed = memData?.map(m => ({
      id: m.id, type: m.type, text: m.text, icon: m.icon, meta: m.meta, timestamp: m.timestamp
    })) || []

    // Fetch meetings
    const { data: meetData } = await supabase.from('meetings').select('*').eq('team_code', teamCode)
    const meetings = meetData?.map(m => ({
      id: m.id, title: m.title, date: m.date, attendees: m.attendees, duration: m.duration, summary: m.summary, keyTopics: m.key_topics, transcript: m.transcript, followUpItems: m.follow_up_items, tasksCreated: [], decisionsLogged: [],
      status: m.status || 'completed', activeAttendees: m.active_attendees || [],
      leader: m.leader || null, agenda: m.agenda || ''
    })) || []

    // Fetch profiles (local team overrides)
    const { data: profData } = await supabase.from('member_profiles').select('*').eq('team_code', teamCode)
    const memberProfiles: Record<string, any> = {}
    profData?.forEach(p => { memberProfiles[p.member_name] = p.profile_data })

    // Fetch global profiles for registered users in this team
    const { data: userTeamsData } = await supabase.from('user_teams').select('user_email').eq('team_code', teamCode)
    if (userTeamsData && userTeamsData.length > 0) {
      const emails = userTeamsData.map(ut => ut.user_email)
      const { data: usersData } = await supabase.from('users').select('name, profile_data').in('email', emails)
      usersData?.forEach(u => {
        if (u.name && u.profile_data) {
          memberProfiles[u.name] = { ...memberProfiles[u.name], ...u.profile_data }
        }
      })
    }

    setState((prev: any) => ({
      ...prev, members, tasks, decisions, memoryFeed, meetings, memberProfiles
    }))
  }, [])

  useEffect(() => {
    if (state.team?.code && !initialFetchDone) {
      syncTeamData(state.team.code)
      setInitialFetchDone(true)
    }
  }, [state.team?.code, syncTeamData, initialFetchDone])

  useEffect(() => {
    if (!state.team?.code) return;

    const channel = supabase.channel('meetings-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings', filter: `team_code=eq.${state.team.code}` }, payload => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          setState((prev: any) => {
            const m = payload.new
            const updatedMeeting = {
              id: m.id, title: m.title, date: m.date, attendees: m.attendees, duration: m.duration, summary: m.summary, keyTopics: m.key_topics, transcript: m.transcript, followUpItems: m.follow_up_items, tasksCreated: [], decisionsLogged: [],
              status: m.status || 'completed', activeAttendees: m.active_attendees || [],
              leader: m.leader || null, agenda: m.agenda || ''
            }

            const exists = prev.meetings.find((prevM: any) => prevM.id === m.id)
            if (exists) {
              return {
                ...prev,
                meetings: prev.meetings.map((prevM: any) => prevM.id === m.id ? { ...prevM, ...updatedMeeting } : prevM)
              }
            } else {
              return {
                ...prev,
                meetings: [updatedMeeting, ...prev.meetings]
              }
            }
          })
        }
      })
      .subscribe()

    const teamsChannel = supabase.channel('teams-channel')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'teams', filter: `code=eq.${state.team.code}` }, payload => {
        setState((prev: any) => {
          if (prev.team && prev.team.code === payload.new.code) {
            return {
              ...prev,
              team: { ...prev.team, projectName: payload.new.project_name, groupChatName: payload.new.group_chat_name }
            }
          }
          return prev
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(teamsChannel)
    }
  }, [state.team?.code])

  const addMemory = useCallback(async (event: any, explicitTeamCode?: string) => {
    const entry = {
      id: Date.now().toString(),
      type: event.type,
      text: event.text,
      icon: event.icon,
      meta: event.meta,
      timestamp: new Date().toISOString(),
    }
    setState((prev: any) => ({
      ...prev,
      memoryFeed: [entry, ...prev.memoryFeed],
    }))

    const targetTeamCode = explicitTeamCode || state.team?.code;
    if (targetTeamCode) {
      await supabase.from('memory_feed').insert([{
        id: entry.id,
        team_code: targetTeamCode,
        type: entry.type,
        text: entry.text,
        icon: entry.icon,
        meta: entry.meta,
        timestamp: entry.timestamp
      }])
    }
    return entry
  }, [state.team?.code])

  // ── LEADER: Create team ──────────────────────────────────────────────
  const createTeam = useCallback(async (projectName: string, description: string, deadline: string, leaderName: string) => {
    const team = {
      code: generateCode(),
      projectName,
      description,
      deadline,
      leaderName,
      createdAt: new Date().toISOString(),
    }
    const leader = { id: `leader_${team.code}`, name: leaderName, role: 'Leader', isLeader: true }

    // Save to Supabase
    const { error: teamError } = await supabase.from('teams').insert([{
      code: team.code,
      project_name: team.projectName,
      description: team.description,
      deadline: team.deadline,
      leader_name: team.leaderName,
      created_at: team.createdAt
    }])

    if (teamError) {
      alert(`Database Error (teams): ${teamError.message}\nMake sure RLS is disabled in Supabase!`);
      throw teamError;
    }

    const { error: memberError } = await supabase.from('team_members').insert([{
      id: leader.id,
      team_code: team.code,
      name: leader.name,
      role: leader.role,
      is_leader: leader.isLeader
    }])

    if (memberError) {
      alert(`Database Error (team_members): ${memberError.message}`);
      throw memberError;
    }

    // Neo4j sync
    syncTeamToGraph(team.code, team.projectName);
    syncMemberToGraph(team.code, leader.id, leader.name, leader.role);

    // Fetch leader's global profile so their avatar loads immediately
    const { data: leaderUser } = await supabase.from('users').select('name, profile_data').eq('name', leaderName).single()
    const leaderProfile = leaderUser?.profile_data ? { [leaderName]: leaderUser.profile_data } : {}

    window.location.hash = 'leader-dashboard'
    setState((prev: any) => ({
      ...prev,
      role: 'leader',
      page: 'leader-dashboard',
      team,
      currentUser: leader,
      members: [leader],
      tasks: [],
      decisions: [],
      meetings: [],
      memberProfiles: leaderProfile,
      memoryFeed: [],
    }))

    addMemory({
      type: 'project_created',
      text: `Project "${projectName}" was created by ${leaderName}`,
      icon: 'Rocket',
    }, team.code)

    retainMemory(team.code, `Project "${projectName}" was created by ${leaderName}. Description: ${description || 'N/A'}. Deadline: ${deadline || 'Not set'}.`, {
      type: 'project_created',
      projectName,
      leaderName,
    })

    return team
  }, [])

  // ── MEMBER: Join team ────────────────────────────────────────────────
  const joinTeam = useCallback(async (code: string, name: string) => {
    const member = { id: `m_${Date.now()}`, name, role: 'Member', isLeader: false }

    const { data: teamData } = await supabase.from('teams').select('*').eq('code', code).single()

    // Add member to team_members
    await supabase.from('team_members').upsert([{
      id: member.id,
      team_code: code,
      name: member.name,
      role: member.role,
      is_leader: member.isLeader
    }])

    // Neo4j sync
    syncMemberToGraph(code, member.id, member.name, member.role);

    const mappedTeam = teamData ? {
      code: teamData.code,
      projectName: teamData.project_name,
      groupChatName: teamData.group_chat_name,
      description: teamData.description,
      deadline: teamData.deadline,
      leaderName: teamData.leader_name
    } : { code, projectName: 'Team Project', groupChatName: '', description: '', deadline: '', leaderName: '' }

    window.location.hash = 'member-dashboard'
    setState((prev: any) => ({
      ...prev,
      role: 'member',
      page: 'member-dashboard',
      team: mappedTeam,
      currentUser: member,
      members: [],
      tasks: [],
      decisions: [],
      meetings: [],
      memberProfiles: {},
      memoryFeed: [],
    }))

    await syncTeamData(code)

    addMemory({
      type: 'member_joined',
      text: `${name} joined the team`,
      icon: 'UserPlus',
    }, code)

    retainMemory(code, `${name} joined the team.`, {
      type: 'member_joined',
      memberName: name,
    })
  }, [syncTeamData])

  // ── LEADER: Load existing team ───────────────────────────────────────
  const loadTeamAsLeader = useCallback(async (code: string, projectName: string, leaderName: string) => {
    const { data: teamData } = await supabase.from('teams').select('*').eq('code', code).single()
    const mappedTeam = teamData ? {
      code: teamData.code,
      projectName: teamData.project_name,
      groupChatName: teamData.group_chat_name,
      description: teamData.description,
      deadline: teamData.deadline,
      leaderName: teamData.leader_name
    } : { code, projectName, groupChatName: '', description: '', deadline: '', leaderName }

    const leader = { id: 'leader', name: leaderName, role: 'Leader', isLeader: true }

    window.location.hash = 'leader-dashboard'
    setState((prev: any) => ({
      ...prev,
      role: 'leader',
      page: 'leader-dashboard',
      team: mappedTeam,
      currentUser: leader,
      members: [],
      tasks: [],
      decisions: [],
      meetings: [],
      memberProfiles: {},
      memoryFeed: [],
    }))

    await syncTeamData(code)
  }, [syncTeamData])

  // ── TASKS ────────────────────────────────────────────────────────────
  const addTask = useCallback(async (taskData: any) => {
    const task = {
      id: `t_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'todo',
      updates: [],
      estimatedHours: taskData.estimatedHours || 0,
      actualHours: 0,
      ...taskData,
    }

    setState((prev: any) => {
      if (prev.team?.code) {
        supabase.from('tasks').insert([{
          id: task.id,
          team_code: prev.team.code,
          title: task.title,
          description: task.description,
          assigned_to: task.assignedTo,
          status: task.status,
          estimated_hours: task.estimatedHours,
          deadline: task.deadline,
          created_at: task.createdAt
        }]).then()

        // Neo4j sync
        syncTaskToGraph(prev.team.code, task.id, task.title, task.status, task.assignedTo);

        retainMemory(prev.team.code, `Task "${task.title}" was assigned to ${task.assignedTo}. Description: ${task.description || 'N/A'}. Deadline: ${task.deadline || 'Not set'}. Estimated hours: ${task.estimatedHours}.`, {
          type: 'task_assigned',
          taskTitle: task.title,
          assignedTo: task.assignedTo,
        })
      }
      return {
        ...prev,
        tasks: [...prev.tasks, task],
        memoryFeed: pushMemory(prev, {
          type: 'task_assigned',
          text: `Task "${task.title}" assigned to ${task.assignedTo}`,
          icon: 'Pin',
          meta: { taskId: task.id },
        }),
      }
    })

    return task
  }, [])

  const updateTaskStatus = useCallback((taskId: string, status: string) => {
    setState((prev: any) => {
      if (prev.team?.code) {
        supabase.from('tasks').update({ status }).eq('id', taskId).then()
      }

      const tasks = prev.tasks.map((t: any) => t.id === taskId ? { ...t, status } : t)
      const task = tasks.find((t: any) => t.id === taskId)
      const iconName = status === 'done' ? 'CheckCircle' : status === 'in-progress' ? 'Zap' : 'ClipboardList'

      if (prev.team?.code && task) {
        retainMemory(prev.team.code, `Task "${task.title}" was moved to ${status} by ${prev.currentUser?.name || 'a team member'}.`, {
          type: 'task_status_change',
          taskTitle: task.title,
          newStatus: status,
        })
      }

      return {
        ...prev,
        tasks,
        memoryFeed: pushMemory(prev, {
          type: 'task_status',
          text: `"${task?.title}" moved to ${status}`,
          icon: iconName,
        }),
      }
    })
  }, [])

  const addTaskUpdate = useCallback((taskId: string, updateText: string, authorName: string) => {
    setState((prev: any) => {
      const updateData = { text: updateText, author: authorName, timestamp: new Date().toISOString() }

      supabase.from('task_updates').insert([{
        task_id: taskId,
        text: updateData.text,
        author: updateData.author,
        timestamp: updateData.timestamp
      }]).then()

      const tasks = prev.tasks.map((t: any) =>
        t.id === taskId
          ? { ...t, updates: [...t.updates, updateData] }
          : t
      )
      const task = tasks.find((t: any) => t.id === taskId)

      if (prev.team?.code) {
        retainMemory(prev.team.code, `${authorName} logged a progress update on "${task?.title}": "${updateText}"`, {
          type: 'task_update',
          taskTitle: task?.title,
          author: authorName,
        })
      }

      return {
        ...prev,
        tasks,
        memoryFeed: pushMemory(prev, {
          type: 'task_update',
          text: `${authorName} logged: "${updateText.substring(0, 60)}${updateText.length > 60 ? '…' : ''}"`,
          icon: 'FileText',
        }),
      }
    })
  }, [])

  // ── DECISIONS ────────────────────────────────────────────────────────
  const addDecision = useCallback((decisionData: any) => {
    const decision = {
      id: `d_${Date.now()}`,
      createdAt: new Date().toISOString(),
      outcome: '',
      ...decisionData,
    }
    setState((prev: any) => {
      if (prev.team?.code) {
        supabase.from('decisions').insert([{
          id: decision.id,
          team_code: prev.team.code,
          decision: decision.decision,
          reason: decision.reason,
          impact: decision.impact,
          involved_people: decision.involvedPeople || decision.people,
          created_at: decision.createdAt
        }]).then()

        retainMemory(prev.team.code, `Decision made: "${decision.decision}". Reason: ${decision.reason || 'N/A'}. Impact level: ${decision.impact || 'N/A'}. People involved: ${(decision.involvedPeople || decision.people) || 'N/A'}.`, {
          type: 'decision_made',
          decision: decision.decision,
          impact: decision.impact,
        })
      }

      return {
        ...prev,
        decisions: [decision, ...prev.decisions],
        memoryFeed: pushMemory(prev, {
          type: 'decision_made',
          text: `Decision: "${decision.decision.substring(0, 70)}${decision.decision.length > 70 ? '…' : ''}"`,
          icon: 'Scale',
        }),
      }
    })
    return decision
  }, [])

  const navigate = useCallback((page: string) => {
    window.location.hash = page
    setState((prev: any) => ({ ...prev, page }))
  }, [])

  const scheduleMeeting = useCallback(async (meetingData: any) => {
    setState((prev: any) => {
      const newMeeting = {
        ...meetingData,
        status: 'scheduled',
        leader: prev.currentUser?.name,
      }
      
      const isUpdate = prev.meetings.some((m: any) => m.id === newMeeting.id)
      const newMeetings = isUpdate 
        ? prev.meetings.map((m: any) => m.id === newMeeting.id ? newMeeting : m)
        : [newMeeting, ...prev.meetings]

      if (prev.team?.code) {
        supabase.from('meetings').upsert([{
          id: newMeeting.id,
          team_code: prev.team.code,
          title: newMeeting.title,
          date: newMeeting.date,
          attendees: newMeeting.attendees,
          agenda: newMeeting.agenda || '',
          status: 'scheduled',
          leader: prev.currentUser?.name
        }]).then(({ error }) => {
          if (error) {
            console.error('Error upserting scheduled meeting:', error)
            alert(`Database Error: ${error.message}\n\nDid you run the SQL migration to add 'leader' and 'agenda' columns?`)
            // Revert optimistic update
            setState((s: any) => ({
              ...s,
              meetings: s.meetings.filter((m: any) => m.id !== newMeeting.id)
            }))
          }
        })
      }
      return {
        ...prev,
        meetings: newMeetings,
      }
    })
  }, [])

  const startLiveMeeting = useCallback(async (meetingId: string) => {
    setState((prev: any) => {
      const meetingIdx = prev.meetings.findIndex((m: any) => m.id === meetingId)
      if (meetingIdx === -1) return prev

      const newMeetings = [...prev.meetings]
      newMeetings[meetingIdx] = {
        ...newMeetings[meetingIdx],
        status: 'ongoing',
        activeAttendees: [prev.currentUser?.name],
      }

      if (prev.team?.code) {
        supabase.from('meetings').update({
          status: 'ongoing',
          active_attendees: [prev.currentUser?.name]
        }).eq('id', meetingId).then(({ error }) => {
          if (error) console.error('Error starting live meeting:', error)
        })
      }
      return {
        ...prev,
        meetings: newMeetings,
      }
    })
  }, [])

  const joinLiveMeeting = useCallback(async (meetingId: string) => {
    setState((prev: any) => {
      const meeting = prev.meetings.find((m: any) => m.id === meetingId)
      if (!meeting) return prev

      const userName = prev.currentUser?.name
      if (!userName || meeting.activeAttendees?.includes(userName)) return prev

      const newActiveAttendees = [...(meeting.activeAttendees || []), userName]

      if (prev.team?.code) {
        supabase.from('meetings').update({
          active_attendees: newActiveAttendees
        }).eq('id', meetingId).then(({ error }) => {
          if (error) console.error('Error joining meeting:', error)
        })
      }

      return {
        ...prev,
        meetings: prev.meetings.map((m: any) => m.id === meetingId ? { ...m, activeAttendees: newActiveAttendees } : m)
      }
    })
  }, [])

  const addMeeting = useCallback((meetingData: any) => {
    setState((prev: any) => {
      const existingIdx = prev.meetings.findIndex((m: any) => m.id === meetingData.id)
      const finalMeeting = { ...meetingData, status: 'completed' }

      const newMeetings = [...prev.meetings]
      if (existingIdx >= 0) {
        newMeetings[existingIdx] = finalMeeting
      } else {
        newMeetings.unshift(finalMeeting)
      }

      if (prev.team?.code) {
        if (existingIdx >= 0) {
          supabase.from('meetings').update({
            duration: finalMeeting.duration,
            summary: finalMeeting.summary,
            key_topics: finalMeeting.keyTopics,
            transcript: finalMeeting.transcript,
            follow_up_items: finalMeeting.followUpItems,
            status: 'completed'
          }).eq('id', finalMeeting.id).then()
        } else {
          supabase.from('meetings').insert([{
            id: finalMeeting.id,
            team_code: prev.team.code,
            title: finalMeeting.title,
            date: finalMeeting.date,
            attendees: finalMeeting.attendees,
            duration: finalMeeting.duration,
            summary: finalMeeting.summary,
            key_topics: finalMeeting.keyTopics,
            transcript: finalMeeting.transcript,
            follow_up_items: finalMeeting.followUpItems,
            status: 'completed'
          }]).then()
        }
      }
      return {
        ...prev,
        meetings: newMeetings,
        memoryFeed: pushMemory(prev, {
          type: 'meeting_completed',
          text: `Meeting "${finalMeeting.title}" ended — ${finalMeeting.tasksCreated?.length || 0} tasks auto-assigned`,
          icon: 'Mic',
        }),
      }
    })
  }, [])

  const updateMemberProfile = useCallback((memberName: string, profileData: any) => {
    setState((prev: any) => {
      const newProfiles = { ...prev.memberProfiles, [memberName]: profileData }
      if (prev.team?.code) {
        supabase.from('member_profiles').upsert([{
          team_code: prev.team.code,
          member_name: memberName,
          profile_data: profileData
        }]).then()
      }
      return {
        ...prev,
        memberProfiles: newProfiles,
        memoryFeed: pushMemory(prev, {
          type: 'profile_updated',
          text: `${memberName} updated their skill profile`,
          icon: 'User',
        }),
      }
    })
  }, [])

  const updateTeamLinks = useCallback((links: any) => {
    setState((prev: any) => {
      if (!prev.team) return prev
      const updatedTeam = { ...prev.team, ...links }

      supabase.from('teams').update({
        description: updatedTeam.description
      }).eq('code', prev.team.code).then()

      return {
        ...prev,
        team: updatedTeam,
        memoryFeed: pushMemory(prev, {
          type: 'links_updated',
          text: 'Project links were updated',
          icon: 'LinkIcon',
        }),
      }
    })
  }, [])

  const reset = useCallback(() => {
    localStorage.removeItem('flowmind_state')
    window.location.hash = ''
    setState({
      role: null,
      page: 'landing',
      team: null,
      currentUser: null,
      tasks: [],
      decisions: [],
      memoryFeed: [],
      members: [],
      meetings: [],
      memberProfiles: {},
    })
  }, [])

  return (
    <AppContext.Provider value={{
      ...state,
      update,
      addMemory,
      createTeam,
      joinTeam,
      loadTeamAsLeader,
      addTask,
      updateTaskStatus,
      addTaskUpdate,
      addDecision,
      addMeeting,
      scheduleMeeting,
      startLiveMeeting,
      joinLiveMeeting,
      updateMemberProfile,
      updateTeamLinks,
      navigate,
      reset,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
