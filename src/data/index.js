import { mockCourses as baseCourses, mockLearningPaths, mockAssignments, mockCertificates } from './courses.js'
import { mockTrainingLibrary, TRAINING_LIBRARY_ROLE_GROUPS } from './trainingLibrary.js'

// The catalog combines the original mock courses with the 120 curated
// training-library resources (6 commercial roles × 20 topics). Library
// entries land with `targetRoles: []` so admins assign them per role.
export const mockCourses = [...baseCourses, ...mockTrainingLibrary]
export { mockLearningPaths, mockAssignments, mockCertificates }
export { TRAINING_LIBRARY_ROLE_GROUPS }

export { mockUsers } from './users.js'
export { mockTeams, mockActivity, mockScores, mockHoursPerWeek, mockHeatmap } from './teams.js'

// Production state — audit log starts empty.
// Live actions (logins, course_uploaded, course_assigned, etc.) are
// appended to this array at runtime via the logAction() helper in
// AppContext.jsx as users interact with the platform.
export const mockAuditLog = []
