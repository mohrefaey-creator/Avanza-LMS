export const mockTeams = [
  { id:'t-1', name:'Omar Khalifa',     nameAr:'عمر خليفة',    init:'OK', col:'#15803D', bg:'#DCFCE7', role:'Medical Rep', location:'Dubai · Western', completion:64, avgScore:88, hours:42, status:'on-track',      reportsTo:'u-mgr-1', region:'Western', district:'Western District', userId:'u-rep-1' },
  { id:'t-2', name:'Mariam Saeed',     nameAr:'مريم سعيد',    init:'MS', col:'#1D4ED8', bg:'#EEF3FF', role:'Medical Rep', location:'Abu Dhabi · Western', completion:96, avgScore:94, hours:58, status:'top-performer', reportsTo:'u-mgr-1', region:'Western', district:'Western District' },
  { id:'t-3', name:'Khaled Younis',    nameAr:'خالد يونس',    init:'KY', col:'#DC2626', bg:'#FEE2E2', role:'KAM',         location:'Sharjah · Western', completion:28, avgScore:62, hours:14, status:'at-risk',       reportsTo:'u-mgr-1', region:'Western', district:'Western District' },
  { id:'t-4', name:'Noura Al Ali',     nameAr:'نورة العلي',   init:'NA', col:'#0E7490', bg:'#E0F7FA', role:'MSL',         location:'Dubai · Western', completion:78, avgScore:85, hours:38, status:'on-track',      reportsTo:'u-mgr-1', region:'Western', district:'Western District' },
  { id:'t-5', name:'Adam Mostafa',     nameAr:'آدم مصطفى',    init:'AM', col:'#B45309', bg:'#FEF3C7', role:'Medical Rep', location:'Al Ain · Western', completion:48, avgScore:71, hours:22, status:'needs-review',  reportsTo:'u-mgr-1', region:'Western', district:'Western District' },
  { id:'t-6', name:'Lina Halabi',      nameAr:'لينا حلبي',    init:'LH', col:'#2563EB', bg:'#EEF3FF', role:'Medical Rep', location:'Dubai · Western', completion:18, avgScore:0,  hours:8,  status:'new-hire',      reportsTo:'u-mgr-1', region:'Western', district:'Western District' },
  { id:'t-7', name:'Yousef Idris',     nameAr:'يوسف إدريس',   init:'YI', col:'#15803D', bg:'#DCFCE7', role:'KAM',         location:'Ajman · Western', completion:84, avgScore:90, hours:46, status:'on-track',      reportsTo:'u-mgr-1', region:'Western', district:'Western District' },
  { id:'t-8', name:'Hala Tarabishi',   nameAr:'هالة طرابيشي', init:'HT', col:'#7C3AED', bg:'#EDE9FE', role:'MSL',         location:'Dubai · Western', completion:88, avgScore:91, hours:52, status:'top-performer', reportsTo:'u-mgr-1', region:'Western', district:'Western District' },
]

export const mockActivity = [
  { id:'ac-1', userId:'u-rep-1', icon:'play', text:'Started "KEYNORX — Product Knowledge"', textAr:'بدأ "كاينوركس — المعرفة بالمنتج"', ts:'2026-05-06T09:14:00Z' },
  { id:'ac-2', userId:'u-rep-1', icon:'check', text:'Completed module 5/11', textAr:'أكمل الوحدة ٥/١١', ts:'2026-05-05T17:42:00Z' },
  { id:'ac-3', userId:'u-rep-1', icon:'award', text:'Passed quiz "Diabetes 101" with 92%', textAr:'اجتاز اختبار "السكري ١٠١" بنسبة ٩٢٪', ts:'2026-04-26T11:08:00Z' },
  { id:'ac-4', userId:'u-rep-1', icon:'pen',   text:'Signed e-signature for Pharmacovigilance', textAr:'وقع إلكترونيًا على اليقظة الدوائية', ts:'2026-04-25T14:31:00Z' },
  { id:'ac-5', userId:'u-rep-1', icon:'login', text:'Logged in from Dubai (IP 10.0.0.42)', textAr:'تسجيل دخول من دبي (IP 10.0.0.42)', ts:'2026-05-06T08:55:00Z' },
  { id:'ac-6', userId:'u-rep-1', icon:'video', text:'Watched 100% of "ARNI Dosing"', textAr:'شاهد ١٠٠٪ من "جرعات ARNI"', ts:'2026-04-22T10:12:00Z' },
  { id:'ac-7', userId:'u-rep-1', icon:'message', text:'Completed AI roleplay — Oncologist (score 84)', textAr:'أتم محاكاة بالذكاء — طبيب أورام (الدرجة ٨٤)', ts:'2026-04-20T15:50:00Z' },
]

export const mockScores = [
  { course:'Diabetes 101',           courseAr:'السكري ١٠١',            score:92 },
  { course:'ARNI Dosing',            courseAr:'جرعات ARNI',             score:88 },
  { course:'Selling Skills',         courseAr:'مهارات البيع',           score:79 },
  { course:'Oncology Trials',        courseAr:'تجارب الأورام',          score:85 },
  { course:'PV — Adverse Events',    courseAr:'اليقظة الدوائية',        score:90 },
  { course:'KEYNORX (in progress)',  courseAr:'كاينوركس (قيد التقدم)',  score:0 },
]

export const mockHoursPerWeek = [4, 3, 6, 7, 5, 8, 9, 6, 7, 4, 5, 8]

export const mockHeatmap = (() => {
  const out = []
  for (let i = 0; i < 90; i++) {
    const r = Math.random()
    const lvl = r > 0.85 ? 4 : r > 0.7 ? 3 : r > 0.5 ? 2 : r > 0.25 ? 1 : 0
    out.push(lvl)
  }
  return out
})()
