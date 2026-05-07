import Icon from './Icon.jsx'

export default function StatCard({ label, value, subtitle, icon = 'pulse', valueColor = 'var(--tx)', iconBg = 'var(--blue-l)', iconColor = 'var(--blue-d)', extra }) {
  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r)',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 8,
    }}>
      <div>
        <div style={{ fontSize: 9, color: 'var(--tx3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 5 }}>
          {label}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: valueColor, lineHeight: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          {value}
          {extra}
        </div>
        {subtitle && (
          <div style={{ fontSize: 9, color: 'var(--tx3)', marginTop: 5 }}>{subtitle}</div>
        )}
      </div>
      <div style={{
        width: 34, height: 34, borderRadius: 'var(--r2)', background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        color: iconColor,
      }}>
        <Icon name={icon} size={18} />
      </div>
    </div>
  )
}
