import assert from 'node:assert/strict'
import {
  isMissionControlAccessKey,
  isMissionControlAccessKeyConfigured,
  isMissionControlAllowedEmail,
  missionControlAllowedEmails,
  missionControlOwnerEmail,
} from './auth.mjs'

{
  delete process.env.MISSION_CONTROL_ALLOWED_EMAILS
  assert.equal(isMissionControlAllowedEmail('charlesbettiol@gmail.com'), true)
  assert.equal(isMissionControlAllowedEmail('CHARLESBETTIOL@GMAIL.COM'), true)
  assert.equal(isMissionControlAllowedEmail('charlesbettiolbusiness@gmail.com'), true)
  assert.equal(isMissionControlAllowedEmail('someone@example.com'), false)
}

{
  process.env.MISSION_CONTROL_ALLOWED_EMAILS = 'one@example.com, TWO@example.com '
  const allowed = missionControlAllowedEmails()
  assert.equal(allowed.has('one@example.com'), true)
  assert.equal(allowed.has('two@example.com'), true)
  assert.equal(isMissionControlAllowedEmail('charlesbettiol@gmail.com'), false)
  assert.equal(isMissionControlAllowedEmail('two@example.com'), true)
}

delete process.env.MISSION_CONTROL_ALLOWED_EMAILS
delete process.env.MISSION_CONTROL_ACCESS_KEY
delete process.env.MISSION_CONTROL_OWNER_EMAIL

{
  assert.equal(isMissionControlAccessKeyConfigured(), false)
  assert.equal(isMissionControlAccessKey('anything'), false)
}

{
  process.env.MISSION_CONTROL_ACCESS_KEY = 'secret-key'
  assert.equal(isMissionControlAccessKeyConfigured(), true)
  assert.equal(isMissionControlAccessKey('secret-key'), true)
  assert.equal(isMissionControlAccessKey(' secret-key '), true)
  assert.equal(isMissionControlAccessKey('wrong-key'), false)
}

{
  assert.equal(missionControlOwnerEmail(), 'charlesbettiol@gmail.com')
  process.env.MISSION_CONTROL_OWNER_EMAIL = ' Owner@Example.com '
  assert.equal(missionControlOwnerEmail(), 'owner@example.com')
}

delete process.env.MISSION_CONTROL_ACCESS_KEY
delete process.env.MISSION_CONTROL_OWNER_EMAIL
console.log('mission-control auth ok')
