export { mockUsers } from './users.js'
export { mockCourses, mockLearningPaths, mockAssignments, mockCertificates } from './courses.js'
export { mockTeams, mockActivity, mockScores, mockHoursPerWeek, mockHeatmap } from './teams.js'

export const mockAuditLog = [
  { id:'aud-1', userId:'u-admin-1', userName:'Layla Hassan', role:'admin',   action:'course_uploaded',   target:'c-1', meta:{ version:'v2.1.0' }, timestamp:'2026-05-04T08:21:00Z', ip:'10.0.0.10' },
  { id:'aud-2', userId:'u-admin-1', userName:'Layla Hassan', role:'admin',   action:'course_assigned',   target:'47-users', meta:{ courseId:'c-1', deadlineDays:30 }, timestamp:'2026-05-04T08:23:00Z', ip:'10.0.0.10' },
  { id:'aud-3', userId:'u-mgr-1',   userName:'Fadi Saleh',   role:'manager', action:'reminder_sent',     target:'u-rep-1', meta:{ courseId:'c-1' }, timestamp:'2026-05-05T13:02:00Z', ip:'10.0.0.22' },
  { id:'aud-4', userId:'u-rep-1',   userName:'Omar Khalifa', role:'learner', action:'quiz_submitted',    target:'c-5', meta:{ score:92, attempt:1 }, timestamp:'2026-04-26T11:08:00Z', ip:'10.0.0.42' },
  { id:'aud-5', userId:'u-rep-1',   userName:'Omar Khalifa', role:'learner', action:'esignature_applied', target:'c-2', meta:{ statement:'I confirm I have completed this training' }, timestamp:'2026-04-25T14:31:00Z', ip:'10.0.0.42' },
  { id:'aud-6', userId:'u-msl-1',   userName:'Sara Najjar',  role:'learner', action:'cert_issued',       target:'cert-2', meta:{ courseId:'c-6', score:96 }, timestamp:'2026-04-30T10:14:00Z', ip:'10.0.0.55' },
  { id:'aud-7', userId:'u-admin-1', userName:'Layla Hassan', role:'admin',   action:'course_archived',   target:'c-7', meta:{ replacedBy:'c-1' }, timestamp:'2026-05-04T08:25:00Z', ip:'10.0.0.10' },
  { id:'aud-8', userId:'u-mgr-1',   userName:'Fadi Saleh',   role:'manager', action:'deadline_waived',   target:'u-rep-1', meta:{ reason:'Maternity leave', courseId:'c-3' }, timestamp:'2026-05-02T09:45:00Z', ip:'10.0.0.22' },
]
