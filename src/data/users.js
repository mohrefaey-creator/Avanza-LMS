// Production seed users.
//
// Only the platform owner is seeded so the empty Avanza LMS can be logged
// into. All real users (reps, managers, KAMs, etc.) are added via the
// Admin → Bulk Upload flow after deployment.

export const mockUsers = [
  {
    id: 'u-admin-1',
    email: 'moh.refaey@gmail.com',
    name: 'Mohamed Refaey',
    nameAr: 'محمد الرفاعي',
    init: 'MR', col: '#1D4ED8', bg: '#EEF3FF',
    role: 'admin',
    scope: null, reportsTo: null,
    country: 'UAE', region: 'MENA', district: null,
    therapyArea: 'All', jobTitle: 'Platform Owner',
    hireDate: '2026-05-07',
    activeDuty: true,
    learningIndex: 0,
  },
  {
    id: 'u-learner-1',
    email: 'malrefaey@cigalah.com.sa',
    name: 'Mohamed Al-Refaey',
    nameAr: 'محمد الرفاعي',
    init: 'MR', col: '#047857', bg: '#ECFDF5',
    role: 'learner',
    scope: null, reportsTo: null,
    country: 'KSA', region: 'GCC', district: null,
    therapyArea: 'All', jobTitle: 'Medical Representative',
    hireDate: '2026-05-21',
    activeDuty: true,
    learningIndex: 0,
  },
]
