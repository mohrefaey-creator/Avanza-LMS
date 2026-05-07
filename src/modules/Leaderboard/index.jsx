import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Pill from '../../components/Pill.jsx'
import Icon from '../../components/Icon.jsx'

export default function Leaderboard() {
  const { t, teams, user } = useApp()
  const [scope, setScope] = useState('city')

  const leaders = [...teams]
    .map((m) => ({
      ...m,
      points: m.completion * 10 + m.avgScore * 5 + m.hours * 3,
    }))
    .sort((a, b) => b.points - a.points)

  const myIndex = leaders.findIndex((l) => l.id === 't-1')

  const badges = [
    { id: 'first-pass',    en: 'First Pass',    ar: 'أول نجاح',     icon: 'award',  color: 'green',  earned: true },
    { id: 'streak-master', en: 'Streak Master', ar: 'سيد السلسلة',  icon: 'flame',  color: 'amber',  earned: true },
    { id: 'speed-learner', en: 'Speed Learner', ar: 'متعلم سريع',  icon: 'zap',    color: 'blue',   earned: true },
    { id: 'top-of-class',  en: 'Top of Class',  ar: 'الأول على الفصل', icon: 'trophy', color: 'purple', earned: false },
    { id: 'compliance',    en: 'Compliance Hero', ar: 'بطل الامتثال', icon: 'shield', color: 'teal',   earned: true },
  ]

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('Leaderboard', 'لوحة المتصدرين')}</h1>
          <div className="subtitle">
            {t('Tied to launch readiness, certification speed, and compliance refresh.',
               'مرتبط بجاهزية الإطلاق وسرعة الاعتماد وتجديد الامتثال.')}
          </div>
        </div>
        <div className="chip-row" style={{ margin: 0 }}>
          {[
            { id: 'city',     en: 'City',     ar: 'المدينة' },
            { id: 'regional', en: 'Region',   ar: 'الإقليم' },
            { id: 'national', en: 'National', ar: 'الوطني' },
          ].map((s) => (
            <button key={s.id} className={`chip ${scope === s.id ? 'active' : ''}`} onClick={() => setScope(s.id)}>{t(s.en, s.ar)}</button>
          ))}
        </div>
      </div>

      <div className="card mb-16" style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FFFFFF 70%)', border: '1px solid #FCD34D' }}>
        <div className="row" style={{ alignItems: 'center', gap: 14 }}>
          <div style={{ width: 56, height: 56, background: '#D97706', color:'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="trophy" size={26} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#B45309' }}>{t('KEYNORX Launch Sprint — points doubled', 'سباق إطلاق كاينوركس — نقاط مضاعفة')}</div>
            <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{t('Ends 30 May 2026 · 24 days remaining',
                                                                            'ينتهي 30 مايو 2026 · 24 يومًا متبقية')}</div>
          </div>
          <Pill variant="amber">2× {t('points', 'نقاط')}</Pill>
        </div>
      </div>

      <div className="builder-grid">
        <div className="card">
          <h2>{t(`Top performers — ${scope}`, `الأوائل — ${scope}`)}</h2>
          {leaders.map((l, i) => (
            <div key={l.id} className="lb-row" style={{ background: l.id === 't-1' ? 'var(--blue-l)' : 'transparent', borderRadius: 'var(--r3)' }}>
              <div className={`lb-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}`}>
                {i + 1}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{t(l.name, l.nameAr)}</div>
                <div className="muted" style={{ fontSize: 11 }}>{l.role} · {l.location}</div>
              </div>
              <div style={{ textAlign: 'end' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--blue-d)' }}>{l.points.toLocaleString()}</div>
                <div className="muted" style={{ fontSize: 10 }}>{t('points', 'نقطة')}</div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="card">
            <h2>{t('Your status', 'حالتك')}</h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10 }}>
              <Stat label={t('Rank', 'الترتيب')} value={`#${myIndex + 1}`} color="var(--blue-d)" />
              <Stat label={t('Points', 'النقاط')} value={leaders[0]?.points || 0} color="var(--green)" />
              <Stat label={t('Level', 'المستوى')} value={t('Pro', 'محترف')} color="var(--pur)" />
              <Stat label={t('Streak', 'سلسلة')} value="12d" color="var(--amb)" />
            </div>
          </div>

          <div className="card mt-12">
            <h2>{t('Badges', 'الأوسمة')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {badges.map((b) => (
                <div key={b.id} className="card-tight" style={{ borderRadius: 'var(--r3)', padding: 10, opacity: b.earned ? 1 : .4 }}>
                  <Pill variant={b.color}><Icon name={b.icon} size={10} /> &nbsp; {t(b.en, b.ar)}</Pill>
                  <div style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 4 }}>
                    {b.earned ? t('Earned', 'مكتسب') : t('Locked', 'مغلق')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function Stat({ label, value, color }) {
  return (
    <div className="card-tight" style={{ background: 'var(--bg)', borderRadius: 'var(--r3)', padding: 10 }}>
      <div className="kv-label">{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
    </div>
  )
}
