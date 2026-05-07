// User categorization — maps free-form business-role text to one of seven
// categories. The category drives the avatar color in TeamCard and the
// color of various role-based UI affordances. Used both at bulk-upload
// time (so categories are persisted on each team member) and at render
// time as a fallback for legacy records.

export function categorizeUser(...textParts) {
  const v = textParts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[\s_\-./]+/g, '')
  if (!v) return 'other'
  if (/marketing|brand|productmanager|productmgr|^pm$/.test(v)) return 'marketing'
  if (/bumanager|bumanger|businessunit|^bum$|buhead/.test(v)) return 'bu'
  if (/districtmanager|^dm$|rsm|regional|nsm|nationalsales|salesmanager|firstline/.test(v)) return 'dm'
  if (/admin|administrator|^director|^head$|landdirector|landmanager|managingdirector/.test(v)) return 'admin'
  if (/auditor|compliance/.test(v)) return 'auditor'
  if (/^rep|medicalrep|^msl|^kam|fieldforce|salesrep/.test(v)) return 'rep'
  return 'other'
}

// Theme per category — used to color avatars, line pills, etc.
export const CATEGORY_THEME = {
  rep:       { col: '#92400E', bg: '#FEF3C7', en: 'Rep',         ar: 'مندوب',         pillVariant: 'amber' },
  dm:        { col: '#15803D', bg: '#DCFCE7', en: 'DM',          ar: 'مدير منطقة',    pillVariant: 'green' },
  bu:        { col: '#6D28D9', bg: '#EDE9FE', en: 'BU Manager',  ar: 'مدير وحدة',     pillVariant: 'purple' },
  marketing: { col: '#1D4ED8', bg: '#DBEAFE', en: 'Marketing',   ar: 'تسويق',         pillVariant: 'blue' },
  admin:     { col: '#B91C1C', bg: '#FEE2E2', en: 'Admin',       ar: 'مدير',          pillVariant: 'red' },
  auditor:   { col: '#0F766E', bg: '#CCFBF1', en: 'Auditor',     ar: 'مدقق',          pillVariant: 'teal' },
  other:     { col: '#5A6380', bg: '#E2E6F0', en: 'Member',      ar: 'عضو',           pillVariant: 'gray' },
}

export function getCategoryTheme(category) {
  return CATEGORY_THEME[category] || CATEGORY_THEME.other
}

// Per-Line theme — L1..L6 each get a distinct Pill variant so seniority
// is visually scannable.
export const LINE_THEME = {
  L1: { variant: 'red',    en: 'L1 · Managing Director',     ar: 'L1 · المدير العام' },
  L2: { variant: 'purple', en: 'L2 · Business Unit Head',    ar: 'L2 · رئيس الوحدة' },
  L3: { variant: 'teal',   en: 'L3 · National Sales Mgr',    ar: 'L3 · مدير مبيعات وطني' },
  L4: { variant: 'blue',   en: 'L4 · District / Regional',   ar: 'L4 · مدير المنطقة' },
  L5: { variant: 'green',  en: 'L5 · Senior',                ar: 'L5 · أول' },
  L6: { variant: 'amber',  en: 'L6 · Rep / MSL / KAM',       ar: 'L6 · مندوب' },
}

export function getLineVariant(line) {
  return LINE_THEME[line]?.variant || 'gray'
}
