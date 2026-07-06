import React, { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import LeaderSetup from './pages/LeaderSetup'
import MemberJoin from './pages/MemberJoin'
import FindTeams from './pages/FindTeams'
import LeaderDashboard from './pages/LeaderDashboard'
import MemberDashboard from './pages/MemberDashboard'
import AuthPage from './pages/AuthPage'
import UserDashboard from './pages/UserDashboard'
import SplashIntro from './components/SplashIntro'

function Router() {
  const { page, navigate } = useApp()
  const { user, loading } = useAuth()
  const [initialLoad, setInitialLoad] = useState(true)

  // Show loading while restoring session
  if (loading) return null

  const renderPage = () => {
    // If not authenticated, show auth page modal over landing (unless already on landing)
    if (!user && page !== 'landing' && page !== 'auth') {
      return (
        <>
          <Landing />
          <AuthPage onClose={() => navigate('landing')} />
        </>
      )
    }

    // If authenticated and trying to go to landing/auth, go to dashboard
    if (user && (page === 'landing' || page === 'auth' || !page)) {
      return <UserDashboard />
    }

    switch (page) {
      case 'landing': return user ? <UserDashboard /> : <Landing />
      case 'auth': return user ? <UserDashboard /> : (
        <>
          <Landing />
          <AuthPage onClose={() => navigate('landing')} />
        </>
      )
      case 'user-dashboard': return <UserDashboard />
      case 'find-teams': return <FindTeams />
      case 'leader-dashboard': return <LeaderDashboard />
      case 'member-dashboard': return <MemberDashboard />
      default: return <Landing />
    }
  }

  const isUserDashboard = page === 'user-dashboard' || page === 'landing' || page === 'auth' || !page;

  return (
    <>
      {user && initialLoad && <SplashIntro onFinish={() => setInitialLoad(false)} flyToCorner={isUserDashboard} />}
      {renderPage()}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router />
      </AppProvider>
    </AuthProvider>
  )
}
