import React, { useState, useEffect } from 'react'
import { History, Edit2 } from 'lucide-react'
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
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'overview';
  })

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') || 'overview';
      setActiveTab(tab);
      if (tab !== 'overview') {
        setShowMethodologyCanvas(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (tab: string) => {
    window.history.pushState({}, '', `${window.location.pathname}?tab=${tab}`);
    setActiveTab(tab);
    if (tab !== 'overview') {
      setShowMethodologyCanvas(false);
    }
  };
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const [showChatHistory, setShowChatHistory] = useState(false)
  const [showMethodologyCanvas, setShowMethodologyCanvas] = useState(false)

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
    <div className={styles.layout} style={showMethodologyCanvas ? { gridTemplateColumns: '260px 1fr' } : {}}>
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />

      <main className={styles.main}>
        {!showMethodologyCanvas && (
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>{team?.groupChatName || 'Group Chat'}</span>
                  <Edit2 size={16} style={{ color: 'var(--text3)' }} />
                </div>
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
            {activeTab === 'overview' && !showMethodologyCanvas && (
              <button 
                onClick={() => setShowMethodologyCanvas(true)}
                style={{
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background 0.2s'
                }}
              >
                Select Methodology
              </button>
            )}
          </div>
        )}
        <div className={styles.content} style={showMethodologyCanvas ? { padding: 0 } : {}}>
            {activeTab === 'overview' && <LeaderOverview setActiveTab={handleTabChange} showMethodologyCanvas={showMethodologyCanvas} setShowMethodologyCanvas={setShowMethodologyCanvas} />}
          {activeTab === 'tasks' && <TasksTab />}
          {activeTab === 'meetings' && <MeetingsTab />}
          {activeTab === 'decisions' && <DecisionsTab />}
          {activeTab === 'chat' && <ChatTab />}
          {activeTab === 'members' && <TeamMembers />}
          {activeTab === 'groupchat' && <GroupChat />}
        </div>
      </main>

      {!showMethodologyCanvas && (
        dmTarget ? (
          <DirectChat targetMember={dmTarget} onClose={() => update({ dmTarget: null })} />
        ) : (
          <MemoryFeed />
        )
      )}
    </div>
  )
}
