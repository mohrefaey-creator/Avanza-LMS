// Avanza LMS — Curated Training Resource Library
// 94 hand-picked open-source training resources across 6 commercial roles.
// Source: Avanza_LMS_Training_Library.docx (curated by L&D leadership).
//
// Each course is added to the catalog without role assignments — admins
// assign per role via the catalog UI. The `roleGroup` field marks which
// pharmaceutical role the resource was originally curated for so the catalog
// can be filtered by role.
//
// `externalUrl` is a search URL (YouTube or Google) that takes the learner
// to the resource. Direct URLs were not provided in the source document; if
// you have direct YouTube IDs or PDF links, replace `externalUrl` accordingly.

const ROLE_GROUPS = {
  mr:  { code: 'MR',  en: 'Medical Representative',          ar: 'مندوب طبي' },
  dm:  { code: 'DM',  en: 'District / First-Line Manager',   ar: 'مدير منطقة' },
  pm:  { code: 'PM',  en: 'Product / Brand Manager',         ar: 'مدير منتج' },
  bum: { code: 'BUM', en: 'Business Unit Manager',           ar: 'مدير وحدة أعمال' },
  kam: { code: 'KAM', en: 'Key Account Manager',             ar: 'مدير حسابات رئيسية' },
  sm:  { code: 'SM',  en: 'Sales / Regional Sales Manager',  ar: 'مدير مبيعات إقليمي' },
}

const TYPE_BY_SOURCE = {
  'youtube':     'youtube',
  'pdf':         'pdf',
  'web-course':  'web-course',
  'web-article': 'web-article',
  'web-pdf':     'pdf',
}

const DURATION_BY_SOURCE = {
  'youtube':     20,
  'pdf':         60,
  'web-course':  90,
  'web-article': 15,
  'web-pdf':     30,
}

function searchUrl(source, title, provider) {
  const q = encodeURIComponent(`${title} ${provider}`)
  if (source === 'youtube') return `https://www.youtube.com/results?search_query=${q}`
  return `https://www.google.com/search?q=${q}`
}

function makeCourse(roleGroup, idx, source, topic, topicAr, resource, provider) {
  const id = `tl-${roleGroup}-${String(idx).padStart(2, '0')}`
  return {
    id,
    title: topic,
    titleAr: topicAr,
    description: `${resource} — ${provider}.`,
    descriptionAr: `${resource} — ${provider}.`,
    type: TYPE_BY_SOURCE[source],
    contentUrl: searchUrl(source, resource, provider),
    externalUrl: searchUrl(source, resource, provider),
    provider,
    sourceType: source,
    therapyArea: 'Commercial Skills',
    product: 'All',
    version: 'v1.0.0',
    validFrom: '2026-01-01',
    validUntil: '2027-12-31',
    durationMin: DURATION_BY_SOURCE[source],
    passMark: 0,
    attemptsAllowed: 99,
    mandatory: false,
    language: 'en',
    targetRoles: [],
    roleGroup,
    tags: ['curated-library', `role:${roleGroup}`, `source:${source}`],
    status: 'active',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. MEDICAL REPRESENTATIVE (MR) — 14 topics
// ─────────────────────────────────────────────────────────────────────────────
const MR = [
  ['youtube',    'Pharmaceutical Selling Skills (Foundation)', 'مهارات البيع الدوائي (التأسيس)',                       'Pharmaceutical Sales Skills - Medical Representative Training Course', 'Udemy / YouTube'],
  ['youtube',    'Advanced Selling Skills - SPIN Selling',     'مهارات البيع المتقدمة - SPIN',                          'Neil Rackham - How to Apply SPIN® Selling Questions',                  'Huthwaite International'],
  ['youtube',    'SPIN Selling - Full Method Explained',       'شرح كامل لطريقة SPIN',                                  "Solution Selling: Neil Rackham's SPIN Selling",                        'Mike Clayton (OnlinePMCourses)'],
  ['youtube',    'Consultative / Solution Selling',            'البيع الاستشاري / بيع الحلول',                          'Sales Training Video #100 - SPIN Selling by Neil Rackham',             'Victor Antonio'],
  ['youtube',    'Negotiation Skills (Tactical Empathy)',      'مهارات التفاوض (التعاطف التكتيكي)',                     'Former FBI Negotiator Chris Voss - Improve Your Negotiation Skills',   'Game Changing Attorney Podcast'],
  ['web-article','Managing Conflict in Customer Interactions', 'إدارة النزاع في تفاعلات العملاء',                       'How to Deal with Difficult Customers - Harvard PON',                   'Harvard Program on Negotiation'],
  ['youtube',    'Presentation Skills (TED Playlist)',         'مهارات العرض (قائمة TED)',                              'How to Make a Great Presentation - TED Playlist',                      'TED.com'],
  ['youtube',    'Public Speaking - Overcome Stage Fright',    'الخطابة - التغلب على رهبة المنصة',                      '9 TED Talks to MASTER Your Public Speaking Skills',                    'TED Compilation'],
  ['youtube',    'Body Language & Presence',                   'لغة الجسد والحضور',                                     'Your Body Language May Shape Who You Are - Amy Cuddy TED',             'TED'],
  ['youtube',    'Excel Essential Skills (Beginner)',          'مهارات Excel الأساسية (للمبتدئين)',                     'ExcelIsFun - Free Basics Course (Mike Girvin)',                        'ExcelIsFun YouTube Channel'],
  ['youtube',    'Excel for Sales Reps - Practical',           'Excel للمندوبين - تطبيقي',                              'Microsoft Excel Tutorials - Beginner to Advanced',                     'Leila Gharani'],
  ['pdf',        'Pharmaceutical Industry Knowledge - SPIN',   'المعرفة الصناعية الدوائية - SPIN',                      'SPIN Selling - Neil Rackham (Full Book PDF)',                          'Bookey'],
  ['web-course', 'Detailing & Call Structure (Pharma)',        'هيكل المكالمة الطبية',                                  'Pharmaceutical Sales Skills - Fundamental Selling Skills',             'Udemy'],
  ['youtube',    'Personal Productivity / Self-Management',    'الإنتاجية الشخصية / إدارة الذات',                       'How to Make Stress Your Friend - Kelly McGonigal TED',                 'TED'],
]

// ─────────────────────────────────────────────────────────────────────────────
// 2. DISTRICT MANAGER (DM) / FIRST-LINE MANAGER — 13 topics
// ─────────────────────────────────────────────────────────────────────────────
const DM = [
  ['youtube',    'Coaching Skills - GROW Model',                  'مهارات التدريب - نموذج GROW',                        'How to Coach with the GROW Model',                                 'Mike Clayton / OnlinePMCourses'],
  ['web-article','Field Coaching for Sales Reps',                 'التدريب الميداني للمندوبين',                         'GROW Model of Coaching and Mentoring (Article + Templates)',        'MindTools'],
  ['youtube',    'Leadership - Start With Why',                   'القيادة - ابدأ بالسبب',                              'How Great Leaders Inspire Action - Simon Sinek TED',                'TED'],
  ['youtube',    'Why Good Leaders Make You Feel Safe',           'لماذا يشعرك القادة الجيدون بالأمان',                 'Why Good Leaders Make You Feel Safe - Simon Sinek TED',             'TED'],
  ['youtube',    'Performance Management & Feedback',             'إدارة الأداء والتغذية الراجعة',                      'Radical Candor - Kim Scott Full Talk',                              'Stanford Graduate School of Business'],
  ['youtube',    'Holding People Accountable',                    'محاسبة الفريق',                                      'Crucial Accountability - VitalSmarts Overview',                     'Crucial Learning'],
  ['youtube',    'Situational Leadership',                        'القيادة الموقفية',                                   'Situational Leadership - Hersey & Blanchard Model',                 'Center for Leadership Studies'],
  ['youtube',    'Team Motivation',                               'تحفيز الفريق',                                       'Drive: The Surprising Truth About What Motivates Us - Dan Pink',    'RSA Animate'],
  ['youtube',    'Difficult Conversations',                       'المحادثات الصعبة',                                   'How to Have Difficult Conversations - Harvard Negotiation',         'Harvard Negotiation Project'],
  ['youtube',    'Sales Pipeline & Forecasting',                  'خط أنابيب المبيعات والتنبؤ',                         'Sales Pipeline Management for Managers',                            'Salesforce'],
  ['youtube',    "Change Management (Kotter's 8 Steps)",          'إدارة التغيير (خطوات كوتر الثمانية)',                "Leading Change - John Kotter's 8 Steps",                            'Kotter Inc.'],
  ['youtube',    'Emotional Intelligence in Leadership',          'الذكاء العاطفي في القيادة',                          'Daniel Goleman - The Power of Emotional Intelligence',              'Talks at Google'],
  ['web-article','Field Visit / Ride-Along Best Practices',       'الممارسات المثلى للزيارات الميدانية',                'The Five Pillars of Pharmaceutical Sales Training Excellence',      'Mindtickle'],
]

// ─────────────────────────────────────────────────────────────────────────────
// 3. PRODUCT MANAGER (PM) / BRAND MANAGER — 16 topics
// ─────────────────────────────────────────────────────────────────────────────
const PM = [
  ['web-course', 'Pharma Brand Planning Fundamentals',         'أساسيات تخطيط الماركة الدوائية',                   'The Pharma Brand Planning Course',                            'CELforPharma'],
  ['web-course', 'Pharmaceutical Marketing Strategy',          'استراتيجية التسويق الدوائي',                       'Marketing Strategy in the Pharmaceutical Industry',           'Udemy (Mohamed Wafik)'],
  ['youtube',    'Brand Positioning Strategy',                 'استراتيجية تموضع الماركة',                         'Brand Positioning - Mark Ritson Marketing Explained',         'Marketing Week'],
  ['web-course', 'Pharmaceutical Product Life Cycle',          'دورة حياة المنتج الدوائي',                         'Pharma Product Management Certification',                     'Royed Training'],
  ['web-course', 'Pharma Brand Plan Development',              'تطوير خطة الماركة الدوائية',                       'Pharmaceutical Brand Plan Development',                       'Royed Training'],
  ['youtube',    'Market Research & Insights',                 'أبحاث السوق والرؤى',                               'How to Conduct Market Research - Philip Kotler',              'London Business Forum'],
  ['youtube',    "Competitive Analysis - Porter's 5 Forces",   'التحليل التنافسي - قوى بورتر الخمس',                "Porter's Five Forces - Michael Porter Harvard",               'Harvard Business School'],
  ['youtube',    'Blue Ocean Strategy',                        'استراتيجية المحيط الأزرق',                         'Blue Ocean Strategy - W. Chan Kim Full Lecture',              'Talks at Google'],
  ['web-course', 'Pharma Forecasting',                         'التنبؤ في الصناعة الدوائية',                       'Pharma Forecasting - Long Range Planning',                    'Udemy (Marketing Strategy in Pharma)'],
  ['web-course', 'Pricing Strategy in Pharma',                 'استراتيجية التسعير الدوائي',                       'Pharma Pricing Methodology Course',                           'Royed Training'],
  ['web-article','Digital Marketing for Pharma',               'التسويق الرقمي للأدوية',                           'Pharma Digital Marketing Courses Guide',                      'Doctor Marketing MD'],
  ['youtube',    'Product Launch Strategy',                    'استراتيجية إطلاق المنتج',                          'Product Launch Strategy Masterclass',                         'GrowthInstitute / Verne Harnish'],
  ['youtube',    'Storytelling for Brands',                    'سرد القصص للماركات',                               'The Clues to a Great Story - Andrew Stanton TED',             'TED'],
  ['web-article','Sales Force Effectiveness for PMs',          'فعالية فريق المبيعات لمديري المنتج',                'WLH Pharmaceutical Account Management Academy',               'WLH Consulting'],
  ['youtube',    'Marketing ROI & P&L Basics',                 'أساسيات العائد على الاستثمار والأرباح والخسائر',     'Profit and Loss Statement Explained - For Marketers',         'Accounting Stuff'],
  ['youtube',    'Advanced Excel for Brand Managers',          'Excel المتقدم لمديري الماركة',                      'Excel Essentials for the Real World',                         'Leila Gharani'],
]

// ─────────────────────────────────────────────────────────────────────────────
// 4. BUSINESS UNIT MANAGER (BUM) — 18 topics
// ─────────────────────────────────────────────────────────────────────────────
const BUM = [
  ['youtube',    'Strategic Thinking & Planning',          'التفكير والتخطيط الاستراتيجي',                       'Strategic Thinking - Roger Martin Full Lecture',              'Rotman School / University of Toronto'],
  ['youtube',    'Good Strategy / Bad Strategy',           'الاستراتيجية الجيدة / السيئة',                       'Good Strategy Bad Strategy - Richard Rumelt',                 'London Business Forum'],
  ['youtube',    'P&L Management for BU Leaders',          'إدارة الأرباح والخسائر لقادة الوحدة',               'How to Read a P&L Statement - Finance for Non-Financial Managers','Edspira'],
  ['youtube',    'Financial Acumen for Leaders',           'الفطنة المالية للقادة',                              'Finance for Non-Finance Professionals - Wharton Online',      'Wharton / Coursera'],
  ['youtube',    "Leading Change (Kotter's Model)",        'قيادة التغيير (نموذج كوتر)',                         'Leading Change - John Kotter Full Talk at Google',            'Talks at Google'],
  ['youtube',    'Infinite Game Leadership',              'قيادة اللعبة اللانهائية',                             'The Infinite Game - Simon Sinek Full Talk',                   'Talks at Google'],
  ['youtube',    'Building Organizational Culture',        'بناء الثقافة المؤسسية',                              'Leaders Eat Last - Simon Sinek Full Speech',                  'CreativeMornings / Talks at Google'],
  ['youtube',    'Decision Making Under Uncertainty',      'اتخاذ القرار في ظل عدم اليقين',                      'Thinking Fast and Slow - Daniel Kahneman',                    'Talks at Google'],
  ['web-course', 'Strategic Pharmaceutical Marketing',     'التسويق الدوائي الاستراتيجي',                        'Pharma Brand Planning Course (Strategic level)',              'CELforPharma'],
  ['web-course', 'Healthcare Business Acumen',             'الفطنة في أعمال الرعاية الصحية',                     'Account Management Academy - Pharma Business Acumen',         'WLH Consulting'],
  ['youtube',    'Negotiation for Senior Leaders',         'التفاوض لكبار القادة',                               'Getting to Yes - William Ury Full Talk',                      'TED / Harvard PON'],
  ['youtube',    'Power of Listening (Negotiation)',       'قوة الإنصات (التفاوض)',                              'The Power of Listening - William Ury TEDx',                   'TEDx San Diego'],
  ['youtube',    'Talent Management & Succession',         'إدارة المواهب والخلافة',                             'How to Develop Future Leaders - Ram Charan',                  'Talks at Google'],
  ['youtube',    'Executive Presence',                     'الحضور التنفيذي',                                    'Executive Presence - Sylvia Ann Hewlett',                     'Talks at Google'],
  ['youtube',    'Innovation & Disruption Strategy',       'الابتكار واستراتيجية الإحلال',                       "The Innovator's Dilemma - Clayton Christensen",               'Harvard Business School'],
  ['youtube',    'Building & Leading Teams',               'بناء وقيادة الفرق',                                  '5 Dysfunctions of a Team - Patrick Lencioni',                 'Lencioni / Talks at Google'],
  ['web-article','Pharma Industry Trends & Market Access', 'اتجاهات الصناعة الدوائية ودخول السوق',                'How Sellers in Healthcare Can Adapt to Key Trends',           'Richardson Sales Performance'],
  ['web-course', 'Coaching the Coach (Coaching Managers)', 'تدريب المدربين (تدريب المديرين)',                    'Develop Coaching Skills as a Leader - LinkedIn Learning',     'LinkedIn Learning'],
]

// ─────────────────────────────────────────────────────────────────────────────
// 5. KEY ACCOUNT MANAGER (KAM) — 18 topics
// ─────────────────────────────────────────────────────────────────────────────
const KAM = [
  ['web-course', 'KAM Fundamentals - Pharma Specific',           'أساسيات KAM - خاصة بالأدوية',                          'Excellence in Pharmaceutical Key Account Management',         'Upbeat Consult'],
  ['web-course', 'Pharma KAM Masterclass',                       'ماستركلاس KAM دوائي',                                   'Masterclass: Fundamentals of Key Account Management',         'PharmaState Academy'],
  ['web-article','Strategic Account Planning',                   'التخطيط الاستراتيجي للحسابات',                          'Strategic Account Management - RAIN Group',                   'RAIN Group'],
  ['web-course', 'Key Account Management Masterclass',           'ماستركلاس KAM',                                         'Key Account Management - The Masterclass (Pharma Ex-Exec)',   'Udemy'],
  ['youtube',    'Selling to C-Suite Executives',                'البيع للتنفيذيين',                                      'How to Sell to C-Level Executives - Steve Bistritz',          'RAIN Group'],
  ['web-article','Hospital / Institutional Selling',             'البيع للمستشفيات / المؤسسات',                           'Pharmaceutical Account Management Training - CMR Institute', 'CMR Institute'],
  ['youtube',    'Negotiation for KAMs',                         'التفاوض لمديري الحسابات',                               'Never Split the Difference - Chris Voss Full Masterclass',    'Black Swan Group'],
  ['youtube',    'Tactical Empathy in High-Stakes Deals',        'التعاطف التكتيكي في الصفقات الكبرى',                    'Tactical Empathy & Negotiation - Chris Voss',                 'Black Swan Group'],
  ['youtube',    'Building Long-Term Customer Relationships',    'بناء علاقات عملاء طويلة الأمد',                         'How to Build Lasting Business Relationships - Keith Ferrazzi','Talks at Google'],
  ['web-article','Value-Based Selling',                          'البيع المبني على القيمة',                               'Pharmaceutical Sales Training - Richardson',                  'Richardson Sales Performance'],
  ['web-article','Account Business Plan Development',            'تطوير خطة عمل الحساب',                                  'Brooks Group - Excellence in Account Management',             'The Brooks Group'],
  ['web-course', 'Formulary Management & P&T Committee',         'إدارة القوائم ولجنة P&T',                              'Formulary Placement & P&T Committee - KAM Training',          'Mercury Training Institute'],
  ['web-course', 'Tender Business / Government Sales',           'العطاءات والمبيعات الحكومية',                           'Pharma KAM with Tender & Government Business',                'PharmaState Academy'],
  ['youtube',    'Health Economics & Outcomes (HEOR Basics)',    'اقتصاديات الصحة والمخرجات (أساسيات)',                   'Introduction to Health Economics - HEOR Basics',              'ISPOR'],
  ['web-article','Cross-Functional Account Teams',               'فرق الحسابات متعددة الوظائف',                           'Account Team Toolkit - WLH Consulting',                       'WLH Consulting'],
  ['youtube',    'Persuasion & Influence (Cialdini)',            'الإقناع والتأثير (سيالديني)',                           'Science of Persuasion - Robert Cialdini',                     'Influence At Work'],
  ['web-article','Difficult Customers / Conflict in Accounts',   'العملاء الصعبون / النزاع في الحسابات',                  'Conflict Management in Customer Service',                     'Udemy'],
  ['youtube',    'Excel Dashboards for KAM Tracking',            'لوحات Excel لتتبع KAM',                                'Excel Dashboard Tutorial - Build a KPI Dashboard',            'MyOnlineTrainingHub'],
]

// ─────────────────────────────────────────────────────────────────────────────
// 6. SALES MANAGER (SM) / REGIONAL SALES MANAGER — 15 topics
// ─────────────────────────────────────────────────────────────────────────────
const SM = [
  ['web-article','Sales Management Fundamentals',                'أساسيات إدارة المبيعات',                              'Pharmaceutical Sales Manager Training - Factor 8',           'Factor 8'],
  ['web-article','Sales Coaching for Performance',               'تدريب المبيعات لتحسين الأداء',                         'Pharma Sales Coaching - Performance Development Group',      'PDG'],
  ['youtube',    'GROW Coaching Model for Sales Managers',       'نموذج GROW لمديري المبيعات',                          'How to Coach with the GROW Model',                           'Mike Clayton'],
  ['youtube',    'Building & Leading Sales Teams',               'بناء وقيادة فرق المبيعات',                             'How to Build a High-Performing Sales Team - Salesforce',     'Salesforce'],
  ['youtube',    'Sales Forecasting & Pipeline',                 'التنبؤ بالمبيعات وخط الأنابيب',                        'Sales Forecasting Methods - Step by Step',                   'HubSpot Academy'],
  ['youtube',    'Performance Management of Reps & DMs',         'إدارة أداء المندوبين والمديرين',                       'Radical Candor - Kim Scott Stanford GSB',                    'Stanford GSB'],
  ['youtube',    'Leading Sales Through Change',                 'قيادة المبيعات خلال التغيير',                           'Leading Change - John Kotter (Talks at Google)',             'Talks at Google'],
  ['youtube',    'Sales Negotiation Strategy',                   'استراتيجية التفاوض في المبيعات',                       'Sales Negotiation Masterclass - Chris Voss',                 'Black Swan Group'],
  ['web-article','Coaching Field Visits / Ride-Alongs',          'تدريب الزيارات الميدانية',                             '4 Components of Great Pharma Sales Training',                'ASLAN Training'],
  ['youtube',    'Motivating & Retaining Sales Reps',            'تحفيز وإبقاء المندوبين',                                'Drive: What Motivates Us - Daniel Pink RSA',                 'RSA Animate'],
  ['web-article','Sales Analytics & Data-Driven Decisions',      'تحليلات المبيعات والقرارات المدفوعة بالبيانات',         '5 Pillars of Pharmaceutical Sales Training',                 'Mindtickle'],
  ['pdf',        'Strategic Selling - Major Account Strategy',   'البيع الاستراتيجي - إدارة الحسابات الكبرى',            'SPIN Selling - Neil Rackham (Full Book PDF)',                'Bookey'],
  ['youtube',    'Leadership Development - Simon Sinek',         'تطوير القيادة - سيمون سينك',                            'How Great Leaders Inspire Action - Simon Sinek TED',         'TED'],
  ['youtube',    'Emotional Intelligence for Sales Leaders',     'الذكاء العاطفي لقادة المبيعات',                         'Daniel Goleman - Emotional Intelligence',                    'Talks at Google'],
  ['youtube',    'Excel for Sales Managers (Dashboards)',        'Excel لمديري المبيعات (لوحات)',                        'Sales Dashboard in Excel - Step by Step',                    'MyOnlineTrainingHub / Leila Gharani'],
]

function buildAll() {
  const out = []
  const groups = [['mr', MR], ['dm', DM], ['pm', PM], ['bum', BUM], ['kam', KAM], ['sm', SM]]
  for (const [groupId, list] of groups) {
    list.forEach((row, i) => {
      const [source, topic, topicAr, resource, provider] = row
      out.push(makeCourse(groupId, i + 1, source, topic, topicAr, resource, provider))
    })
  }
  return out
}

export const TRAINING_LIBRARY_ROLE_GROUPS = ROLE_GROUPS
export const mockTrainingLibrary = buildAll()
