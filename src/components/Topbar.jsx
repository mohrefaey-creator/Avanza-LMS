import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import Icon from './Icon.jsx'

export default function Topbar() {
  const { lang, switchLang, user, t, logout, notifications, markNotificationRead, markAllNotificationsRead, mobileNavOpen, setMobileNavOpen } = useApp()
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef(null)

  useEffect(() => {
    if (!bellOpen) return
    const onClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [bellOpen])

  const unread = notifications?.filter((n) => !n.read).length || 0

  return (
    <div className="topbar">
      <button
        className="icon-btn topbar-burger"
        onClick={() => setMobileNavOpen(!mobileNavOpen)}
        aria-label={mobileNavOpen ? t('Close navigation', 'إغلاق القائمة') : t('Open navigation', 'فتح القائمة')}
        aria-expanded={mobileNavOpen}
      >
        <Icon name={mobileNavOpen ? 'x' : 'menu'} size={20} />
      </button>

      <div className="topbar-search">
        <span className="topbar-search-icon"><Icon name="search" size={14} /></span>
        <input type="text" placeholder={t('Search…', 'ابحث…')} />
      </div>

      <div className="topbar-actions">
        <div className="lang-toggle" role="tablist">
          <button className={lang === 'en' ? 'active' : ''} onClick={() => switchLang('en')}>EN</button>
          <button className={lang === 'ar' ? 'active' : ''} onClick={() => switchLang('ar')}>عربي</button>
        </div>

        <div ref={bellRef} style={{ position: 'relative' }}>
          <button className="icon-btn" title={t('Notifications', 'الإشعارات')} onClick={() => setBellOpen((s) => !s)}>
            <Icon name="bell" size={18} />
            {unread > 0 && <span className="dot" />}
          </button>

          {bellOpen && (
            <div className="fade-in" style={{
              position: 'absolute',
              top: 38,
              insetInlineEnd: 0,
              width: 340,
              maxHeight: 420,
              overflowY: 'auto',
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r)',
              boxShadow: '0 16px 36px rgba(15, 30, 60, .18)',
              zIndex: 40,
            }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{t('Notifications', 'الإشعارات')}</div>
                {unread > 0 && (
                  <button className="btn ghost" style={{ padding: '4px 6px' }} onClick={markAllNotificationsRead}>
                    {t('Mark all read', 'وضع علامة على الكل')}
                  </button>
                )}
              </div>

              {(notifications || []).length === 0 && (
                <div style={{ padding: 30, textAlign: 'center', color: 'var(--tx3)', fontSize: 12 }}>
                  {t('No notifications', 'لا توجد إشعارات')}
                </div>
              )}

              {(notifications || []).map((n) => (
                <button
                  key={n.id}
                  onClick={() => markNotificationRead(n.id)}
                  style={{
                    width: '100%', textAlign: 'start', display: 'grid', gridTemplateColumns: '32px 1fr', gap: 10,
                    padding: '10px 14px', borderBottom: '1px solid var(--border)',
                    background: n.read ? 'white' : 'var(--blue-l)',
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: n.type === 'cert' ? 'var(--green-l)' : n.type === 'recommendation' ? 'var(--pur-l)' : 'var(--amb-l)',
                    color:      n.type === 'cert' ? 'var(--green)'   : n.type === 'recommendation' ? 'var(--pur)'   : 'var(--amb)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name={n.icon} size={14} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: n.read ? 500 : 700, lineHeight: 1.4 }}>
                      {t(n.en, n.ar)}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 2 }}>
                      {new Date(n.ts).toLocaleString()}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="icon-btn" title={t('Sign out', 'تسجيل الخروج')} onClick={logout}>
          <Icon name="login" size={18} />
        </button>

        <div className="user-chip" title={user?.email}>
          <div className="avatar" style={{ background: user?.bg, color: user?.col }}>{user?.init}</div>
          <div>
            <div className="name">{t(user?.name, user?.nameAr || user?.name)}</div>
            <div className="role">{user?.jobTitle}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
