import { timingSafeEqual } from 'node:crypto'

export const MISSION_CONTROL_COOKIE_NAME = 'mission_control_access'

const DEFAULT_ALLOWED_EMAILS = [
  'charlesbettiol@gmail.com',
  'charlesbettiolbusiness@gmail.com',
  'charlesbettiolcoaching@gmail.com',
]

export function missionControlAllowedEmails() {
  const configured = process.env.MISSION_CONTROL_ALLOWED_EMAILS
    ?.split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)

  return new Set(configured?.length ? configured : DEFAULT_ALLOWED_EMAILS)
}

export function isMissionControlAllowedEmail(email) {
  if (!email) return false
  return missionControlAllowedEmails().has(email.toLowerCase())
}

export function missionControlAccessKey() {
  return process.env.MISSION_CONTROL_ACCESS_KEY?.trim() || ''
}

export function isMissionControlAccessKeyConfigured() {
  return missionControlAccessKey().length > 0
}

export function isMissionControlAccessKey(value) {
  const expected = missionControlAccessKey()
  const candidate = String(value || '').trim()
  if (!expected || !candidate) return false
  const expectedBuffer = Buffer.from(expected)
  const candidateBuffer = Buffer.from(candidate)
  if (expectedBuffer.length !== candidateBuffer.length) return false
  return timingSafeEqual(expectedBuffer, candidateBuffer)
}

export function missionControlOwnerEmail() {
  return (process.env.MISSION_CONTROL_OWNER_EMAIL || 'charlesbettiol@gmail.com').trim().toLowerCase()
}
