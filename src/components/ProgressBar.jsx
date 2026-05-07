export default function ProgressBar({ pct = 0, height = 6, fill }) {
  const clamped = Math.max(0, Math.min(100, pct || 0))
  let color = fill
  if (!color) {
    if (clamped >= 80) color = 'var(--green)'
    else if (clamped >= 50) color = 'var(--blue)'
    else if (clamped >= 25) color = 'var(--amb)'
    else color = 'var(--red)'
  }
  return (
    <div style={{ height, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{
        width: `${clamped}%`,
        height: '100%',
        background: color,
        borderRadius: 3,
        transition: 'width .3s',
      }} />
    </div>
  )
}
