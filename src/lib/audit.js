// 21 CFR Part 11 audit logger — append-only.
// In production this writes to Supabase audit_log table with RLS preventing UPDATE / DELETE.

import { supabase, getClientIP } from './supabase.js'

export async function logAudit({ user, action, target, meta = {}, role }) {
  const entry = {
    user_id: user?.id || 'system',
    role: role || user?.role || 'system',
    action,
    target,
    meta,
    timestamp: new Date().toISOString(),
    ip: await getClientIP(),
  }
  if (supabase.isConfigured) {
    await supabase.from('audit_log').insert(entry)
  } else if (typeof console !== 'undefined' && console.info) {
    console.info('[audit]', entry)
  }
  return entry
}

export const AUDIT_ACTIONS = {
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  COURSE_ASSIGNED: 'course_assigned',
  COURSE_UPLOADED: 'course_uploaded',
  COURSE_ARCHIVED: 'course_archived',
  QUIZ_SUBMITTED: 'quiz_submitted',
  ESIGNATURE_APPLIED: 'esignature_applied',
  CERT_ISSUED: 'cert_issued',
  CERT_REVOKED: 'cert_revoked',
  DEADLINE_WAIVED: 'deadline_waived',
  REMINDER_SENT: 'reminder_sent',
  PERMISSION_CHANGE: 'permission_change',
}
