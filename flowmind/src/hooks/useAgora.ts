// ─── useAgora Hook — WebRTC Live Audio via Agora.io ──────────────────────────
import { useState, useEffect, useRef, useCallback } from 'react'
import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  IRemoteAudioTrack,
} from 'agora-rtc-sdk-ng'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID || ''

// Suppress Agora's verbose console logs in dev
AgoraRTC.setLogLevel(3) // 3 = warning only

export interface AgoraUser {
  uid: number
  audioTrack?: IRemoteAudioTrack
  hasAudio: boolean
}

export interface UseAgoraReturn {
  join: () => Promise<void>
  leave: () => Promise<void>
  toggleMute: () => Promise<void>
  isMuted: boolean
  isConnected: boolean
  isConnecting: boolean
  connectionState: string
  remoteUsers: AgoraUser[]
  error: string | null
}

export function useAgora(channelName: string, userId: string, initialMute: boolean = true): UseAgoraReturn {
  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const localTrackRef = useRef<IMicrophoneAudioTrack | null>(null)
  const [isMuted, setIsMuted] = useState(initialMute)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionState, setConnectionState] = useState('DISCONNECTED')
  const [remoteUsers, setRemoteUsers] = useState<AgoraUser[]>([])
  const [error, setError] = useState<string | null>(null)
  const joinedRef = useRef(false)

  // Generate a random numeric UID for this session to prevent UID_CONFLICT
  // since we don't rely on specific UIDs for our UI mapping.
  const numericUid = useRef(Math.floor(Math.random() * 1000000) + 1)

  // Fetch token from backend using userId as the uid (account)
  const fetchToken = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/agora/token?channelName=${encodeURIComponent(channelName)}&uid=${numericUid.current}`
      )
      if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`)
      const data = await res.json()
      return data.token
    } catch (err: any) {
      console.error('[useAgora] Token fetch error:', err.message)
      setError('Could not get voice token. Voice-only mode unavailable.')
      return null
    }
  }, [channelName])

  // Join the Agora channel
  const join = useCallback(async () => {
    if (joinedRef.current || !channelName || !AGORA_APP_ID) return

    joinedRef.current = true // Set immediately to prevent race conditions
    setIsConnecting(true)
    setError(null)

    try {
      // Create client
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
      clientRef.current = client

      // Listen for connection state changes
      client.on('connection-state-change', (curState) => {
        setConnectionState(curState)
        setIsConnected(curState === 'CONNECTED')
        if (curState === 'DISCONNECTED') {
          joinedRef.current = false
        }
      })

      // Listen for remote users publishing audio
      client.on('user-published', async (user, mediaType) => {
        if (mediaType === 'audio') {
          await client.subscribe(user, mediaType)
          const audioTrack = user.audioTrack
          audioTrack?.play() // Play remote user's audio through speakers

          setRemoteUsers(prev => {
            const filtered = prev.filter(u => u.uid !== (user.uid as number))
            return [...filtered, { uid: user.uid as number, audioTrack, hasAudio: true }]
          })
        }
      })

      // Listen for remote users unpublishing audio (muting)
      client.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'audio') {
          setRemoteUsers(prev =>
            prev.map(u => u.uid === (user.uid as number) ? { ...u, hasAudio: false, audioTrack: undefined } : u)
          )
        }
      })

      // Listen for remote users leaving
      client.on('user-left', (user) => {
        setRemoteUsers(prev => prev.filter(u => u.uid !== (user.uid as number)))
      })

      // Fetch secure token from backend
      const token = await fetchToken()
      if (!token) {
        // Fallback: try joining with just App ID (works in testing mode)
        console.warn('[useAgora] No token, attempting App ID only join')
        await client.join(AGORA_APP_ID, channelName, null, numericUid.current)
      } else {
        await client.join(AGORA_APP_ID, channelName, token, numericUid.current)
      }

      // Create and publish local audio track
      const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'speech_standard', // Optimized for voice, not music
      })
      await localAudioTrack.setEnabled(!initialMute) 
      localTrackRef.current = localAudioTrack
      await client.publish([localAudioTrack])

      joinedRef.current = true
      setIsConnected(true)
      console.log('[useAgora] Joined channel:', channelName)
    } catch (err: any) {
      console.error('[useAgora] Join error:', err.message)
      setError(`Voice connection failed: ${err.message}`)
      setIsConnected(false)
      joinedRef.current = false
    } finally {
      setIsConnecting(false)
    }
  }, [channelName, fetchToken])

  // Leave the channel
  const leave = useCallback(async () => {
    try {
      // Stop and close local track
      if (localTrackRef.current) {
        localTrackRef.current.stop()
        localTrackRef.current.close()
        localTrackRef.current = null
      }

      // Leave the channel
      if (clientRef.current) {
        await clientRef.current.leave()
        clientRef.current = null
      }

      joinedRef.current = false
      setIsConnected(false)
      setConnectionState('DISCONNECTED')
      setRemoteUsers([])
      setIsMuted(false)
      console.log('[useAgora] Left channel')
    } catch (err: any) {
      console.error('[useAgora] Leave error:', err.message)
    }
  }, [])

  // Toggle mute
  const toggleMute = useCallback(async () => {
    if (localTrackRef.current) {
      const newMuted = !isMuted
      await localTrackRef.current.setEnabled(!newMuted)
      setIsMuted(newMuted)
    }
  }, [isMuted])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localTrackRef.current) {
        localTrackRef.current.stop()
        localTrackRef.current.close()
      }
      if (clientRef.current) {
        clientRef.current.leave().catch(() => { })
      }
    }
  }, [])

  return {
    join,
    leave,
    toggleMute,
    isMuted,
    isConnected,
    isConnecting,
    connectionState,
    remoteUsers,
    error,
  }
}
