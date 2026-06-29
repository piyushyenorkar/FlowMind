// ─── Hindsight Client — Memory Store/Recall for Meetings ────────────────────
// Uses the existing Hindsight API already configured in api.js
import { retainMemory, recallMemory } from '../services/api'

/**
 * Store a meeting in Hindsight memory
 */
export async function storeMeeting(meetingData) {
  try {
    await retainMemory(
      meetingData.teamCode || 'default',
      `Meeting "${meetingData.title}" held on ${meetingData.date} with ${meetingData.attendees?.join(', ')}. Summary: ${meetingData.summary}. Tasks created: ${meetingData.tasksCreated?.length || 0}. Decisions: ${meetingData.decisionsLogged?.length || 0}.`,
      { type: 'meeting', meetingId: meetingData.id, title: meetingData.title }
    )
    return { success: true, key: 'meeting_' + meetingData.id }
  } catch (err) {
    console.warn('[HindsightClient] storeMeeting error:', err)
    return { success: false }
  }
}

/**
 * Store a task generated from a meeting
 */
export async function storeTask(taskData, meetingId) {
  try {
    await retainMemory(
      taskData.teamCode || 'default',
      `Task "${taskData.title}" assigned to ${taskData.assignedTo} from meeting. Description: ${taskData.description}. Priority: ${taskData.priority}. Estimated hours: ${taskData.estimatedHours}.`,
      { type: 'task_from_meeting', meetingId, taskId: taskData.id }
    )
    return { success: true }
  } catch (err) {
    console.warn('[HindsightClient] storeTask error:', err)
    return { success: false }
  }
}

/**
 * Store a member's skill profile
 */
export async function storeMemberProfile(memberName, profile, teamCode) {
  try {
    await retainMemory(
      teamCode || 'profiles',
      `Team member profile — ${memberName}: Title: ${profile.title || 'N/A'}. Skills: ${profile.skills?.join(', ') || 'N/A'}. Experience: ${profile.pastWork || 'N/A'}. Availability: ${profile.availability || 'N/A'}. Preferred tasks: ${profile.preferredTypes?.join(', ') || 'N/A'}.`,
      { type: 'member_profile', memberName }
    )
    return { success: true }
  } catch (err) {
    console.warn('[HindsightClient] storeMemberProfile error:', err)
    return { success: false }
  }
}

/**
 * Recall all member profiles from Hindsight
 */
export async function recallAllProfiles() {
  try {
    const result = await recallMemory('profiles', 'team member profiles skills availability')
    return result || []
  } catch {
    return []
  }
}

/**
 * Recall meeting history from Hindsight
 */
export async function recallMeetingHistory(teamCode) {
  try {
    const result = await recallMemory(teamCode || 'default', 'meetings summary tasks decisions')
    return result || []
  } catch {
    return []
  }
}
