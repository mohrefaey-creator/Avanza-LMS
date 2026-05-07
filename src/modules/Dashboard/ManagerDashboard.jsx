import { useApp } from '../../context/AppContext.jsx'
import StatCard from '../../components/StatCard.jsx'
import TeamCard from '../../components/TeamCard.jsx'
import Icon from '../../components/Icon.jsx'

export default function ManagerDashboard() {
  const { t, teams, user, goto, setSelectedMember } = useApp()

  const onTrack    = teams.filter(m => m.status === 'on-track' || m.status === 'top-performer').length
  const atRisk     = teams.filter(m => m.status === 'at-risk').length
  const avgCompletion = Math.round(teams.reduce((s, m) => s + m.completion, 0) / teams.length)
  const avgScore   = Math.round(teams.reduce((s, m) => s + m.avgScore, 0) / teams.length)

  const top3 = [...teams].sort((a, b) => b.avgScore - a.avgScore).slice(0, 3)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('Manager dashboard', 'لوحة المشرف')}</h1>
          <div className="subtitle">
            {t(`${user?.name} · ${user?.region} region · ${teams.length} reports`,
               `${user?.nameAr || user?.name} · منطقة ${user?.region} · ${teams.length} موظف`)}
          </div>
        </div>
        <div className="row">
          <button className="btn" onClick={() => goto('reports')}><Icon name="chart" size={14} /> &nbsp; {t('Team report', 'تقرير الفريق')}</button>
          <button className="btn primary" onClick={() => goto('team-view')}><Icon name="users" size={14} /> &nbsp; {t('Open team', 'فتح الفريق')}</button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label={t('On track', 'على المسار')} value={onTrack} subtitle={t(`of ${teams.length} reports`, `من ${teams.length}`)} icon="check" iconBg="var(--green-l)" iconColor="var(--green)" valueColor="var(--green)" />
        <StatCard label={t('At risk', 'في خطر')} value={atRisk} subtitle={t('Needs intervention', 'يحتاج تدخلًا')} icon="bell" iconBg="var(--red-l)" iconColor="var(--red)" valueColor="var(--red)" />
        <StatCard label={t('Avg completion', 'متوسط الإنجاز')} value={`${avgCompletion}%`} subtitle={t('Target 75%', 'الهدف 75٪')} icon="pulse" iconBg="var(--blue-l)" iconColor="var(--blue-d)" valueColor="var(--blue-d)" />
        <StatCard label={t('Avg score', 'متوسط الدرجة')} value={`${avgScore}%`} subtitle={t('Across last 12 courses', 'آخر 12 دورة')} icon="award" iconBg="var(--amb-l)" iconColor="var(--amb)" valueColor="var(--amb)" />
      </div>

      <div className="card mb-16">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ margin:0 }}>{t('Top performers this month', 'المتميزون هذا الشهر')}</h2>
          <button className="btn ghost" onClick={() => goto('team-view')}>{t('See all →', 'عرض الكل →')}</button>
        </div>
        <div className="team-grid mt-12">
          {top3.map((m) => (
            <TeamCard key={m.id} member={m} onClick={() => { setSelectedMember(m.id); goto('team-view'); }} />
          ))}
        </div>
      </div>

      <div className="card">
        <h2>{t('Risk alerts', 'تنبيهات الخطر')}</h2>
        {teams.filter(m => m.status === 'at-risk' || m.status === 'needs-review').map((m) => (
          <div key={m.id} style={{ padding:'10px 0', borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <div className="team-avatar" style={{ background: m.bg, color: m.col, width:32, height:32, fontSize:11 }}>{m.init}</div>
              <div>
                <div style={{ fontWeight:700 }}>{t(m.name, m.nameAr)}</div>
                <div style={{ fontSize:11, color:'var(--tx2)' }}>
                  {t(`${m.completion}% complete · ${m.hours}h logged`, `${m.completion}٪ مكتمل · ${m.hours} ساعة`)}
                </div>
              </div>
            </div>
            <div className="row">
              <button className="btn">{t('Send reminder', 'إرسال تذكير')}</button>
              <button className="btn primary" onClick={() => { setSelectedMember(m.id); goto('team-view'); }}>{t('Open record', 'فتح السجل')}</button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
