import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import MemoryFeed from '../components/MemoryFeed'
import LeaderOverview from '../components/LeaderOverview'
import MemberTasks from '../components/MemberTasks'
import MeetingsTab from '../components/MeetingsTab'
import ChatTab from '../components/ChatTab'
import DecisionsTab from '../components/DecisionsTab'
import TeamMembers from '../components/TeamMembers'
import GroupChat from '../components/GroupChat'
import FacepileChat from '../components/FacepileChat'
import DirectChat from '../components/DirectChat'
import { useApp } from '../context/AppContext'
import styles from './Dashboard.module.css'

const TAB_TITLES = {
  overview: 'Overview',
  mytasks: 'My Tasks',
  meetings: 'Meetings',
  chat: 'AI Assistant',
  decisions: 'Decisions',
  members: 'Team Members',
  groupchat: 'Group Chat',
}

export default function MemberDashboard() {
  const { dmTarget, update, members, team } = useApp()
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className={styles.layout}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className={styles.main}>
        <div className={styles.topBar} style={{ justifyContent: 'space-between' }}>
          <div className={styles.pageTitle}>
            {activeTab === 'groupchat' ? (team?.groupChatName || 'Group Chat') : TAB_TITLES[activeTab as keyof typeof TAB_TITLES]}
          </div>
          {activeTab === 'groupchat' && members && (
            <FacepileChat members={members} />
          )}
        </div>
        <div className={styles.content}>
          {activeTab === 'overview' && <LeaderOverview setActiveTab={setActiveTab} />}
          {activeTab === 'mytasks' && <MemberTasks />}
          {activeTab === 'meetings' && <MeetingsTab />}
          {activeTab === 'chat' && <ChatTab />}
          {activeTab === 'decisions' && <DecisionsTab />}
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
