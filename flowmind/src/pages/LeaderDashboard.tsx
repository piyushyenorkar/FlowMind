import React, { useState } from 'react'
import { History } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import MemoryFeed from '../components/MemoryFeed'
import LeaderOverview from '../components/LeaderOverview'
import TasksTab from '../components/TasksTab'
import MeetingsTab from '../components/MeetingsTab'
import DecisionsTab from '../components/DecisionsTab'
import ChatTab from '../components/ChatTab'
import ChatHistoryMenu from '../components/ChatHistoryMenu'
import TeamMembers from '../components/TeamMembers'
import GroupChat from '../components/GroupChat'
import DirectChat from '../components/DirectChat'
import FacepileChat from '../components/FacepileChat'
import { useApp } from '../context/AppContext'
import { supabase } from '../services/supabase'
import styles from './Dashboard.module.css'

const TAB_TITLES = {
  overview: 'Overview',
  tasks: 'Task Manager',
  meetings: 'AI Meetings',
  decisions: 'Decision Log',
  chat: 'AI Assistant',
  members: 'Team Members',
  groupchat: 'Group Chat',
}

export default function LeaderDashboard() {
  const { dmTarget, update, members, team } = useApp()
  const [activeTab, setActiveTab] = useState('overview')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const [showChatHistory, setShowChatHistory] = useState(false)

  const handleTitleClick = () => {
    if (activeTab === 'groupchat') {
      setTitleInput(team?.groupChatName || 'Group Chat')
      setEditingTitle(true)
    }
  }

  const handleTitleSave = async () => {
    setEditingTitle(false)
    if (titleInput.trim() && titleInput !== team?.groupChatName) {
      if (team?.code) {
        await supabase.from('teams').update({ group_chat_name: titleInput.trim() }).eq('code', team.code)
        update({ team: { ...team, groupChatName: titleInput.trim() } })
      }
    }
  }

  return (
    <div className={styles.layout}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className={styles.main}>
        <div className={styles.topBar} style={{ justifyContent: 'space-between' }}>
          <div
            className={styles.pageTitle}
            onClick={handleTitleClick}
            style={activeTab === 'groupchat' ? { cursor: 'pointer' } : {}}
            title={activeTab === 'groupchat' ? 'Click to edit team name' : undefined}
          >
            {activeTab === 'groupchat' && editingTitle ? (
              <input
                value={titleInput}
                onChange={e => setTitleInput(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={e => e.key === 'Enter' && handleTitleSave()}
                autoFocus
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text)',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  fontWeight: 'inherit',
                  padding: 0,
                  margin: 0,
                  width: '300px'
                }}
              />
            ) : activeTab === 'groupchat' ? (
              team?.groupChatName || 'Group Chat'
            ) : (
              TAB_TITLES[activeTab as keyof typeof TAB_TITLES]
            )}
          </div>
          {activeTab === 'groupchat' && members && (
            <FacepileChat members={members} />
          )}
          {activeTab === 'chat' && (
            <ChatHistoryMenu />
          )}
        </div>
        <div className={styles.content}>
          {activeTab === 'overview' && <LeaderOverview setActiveTab={setActiveTab} />}
          {activeTab === 'tasks' && <TasksTab />}
          {activeTab === 'meetings' && <MeetingsTab />}
          {activeTab === 'decisions' && <DecisionsTab />}
          {activeTab === 'chat' && <ChatTab />}
          {activeTab === 'members' && <TeamMembers />}
          {activeTab === 'groupchat' && <GroupChat />}
        </div>
      </main>

      {dmTarget ? (
        <DirectChat targetMember={dmTarget} onClose={() => update({ dmTarget: null })} />
      ) : (
        <MemoryFeed />
      )}
    </div>
  )
}
