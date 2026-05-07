import { useApp } from '../context/AppContext.jsx'
import Pill from './Pill.jsx'

const STATUS_MAP = {
  'on-track':      { color: 'var(--green)', bg: '#DCFCE7', en: 'On track',     ar: 'على المسار' },
  'at-risk':       { color: 'var(--red)',   bg: '#FEE2E2', en: 'At risk',      ar: 'في خطر' },
  'top-performer': { color: 'var(--green)', bg: '#DCFCE7', en: 'Top performer',ar: 'متميز', thick: true },
  'needs-review':  { color: 'var(--amb)',   bg: '#FEF3C7', en: 'Needs review', ar: 'يحتاج مراجعة' },
  'new-hire':      { color: 'var(--blue)',  bg: '#EEF3FF', en: 'New hire',     ar: 'موظف جديد' },
}

export default function TeamCard({ member, onClick }) {
  const { t } = useApp()
  const s = STATUS_MAP[member.status] || STATUS_MAP['on-track']
  const scoreColor =
    member.avgScore >= 85 ? 'var(--green)' :
    member.avgScore >= 70 ? 'var(--blue)' :
    member.avgScore >= 60 ? 'var(--amb)' :
    member.avgScore > 0   ? 'var(--red)'  : 'var(--tx3)'

  return (
    <div className="team-card" onClick={onClick}>
      <div className={`team-card-strip ${s.thick ? 'thick' : ''}`} style={{ background: s.color }} />
      <div className="team-head">
        <div className="team-avatar" style={{ background: member.bg, color: member.col }}>
          {member.init}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="team-name">
            {t(member.name, member.nameAr || member.name)}
            {member.line && (
              <span style={{ marginInlineStart: 6 }}><Pill variant="purple">{member.line}</Pill></span>
            )}
          </div>
          <div className="team-meta">{member.role} · {member.location}</div>
        </div>
      </div>
      <div className="team-stats">
        <Stat label={t('Completion', 'الإنجاز')} value={`${member.completion}%`} />
        <Stat label={t('Avg score', 'متوسط الدرجة')} value={member.avgScore > 0 ? `${member.avgScore}%` : '—'} color={scoreColor} />
        <Stat label={t('Hours', 'الساعات')} value={member.hours} />
        <Stat label={t('Status', 'الحالة')} value={t(s.en, s.ar)} color={s.color} small />
      </div>
    </div>
  )
}

function Stat({ label, value, color = 'var(--tx)', small }) {
  return (
    <div>
      <div className="team-stat-label">{label}</div>
      <div className="team-stat-value" style={{ color, fontSize: small ? 11 : 14 }}>{value}</div>
    </div>
  )
}
