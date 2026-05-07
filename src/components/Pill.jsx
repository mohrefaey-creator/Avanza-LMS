const VARIANTS = {
  green:  { bg:'#DCFCE7', fg:'#15803D' },
  red:    { bg:'#FEE2E2', fg:'#DC2626' },
  blue:   { bg:'#EEF3FF', fg:'#1D4ED8' },
  amber:  { bg:'#FEF3C7', fg:'#B45309' },
  purple: { bg:'#EDE9FE', fg:'#6D28D9' },
  teal:   { bg:'#E0F7FA', fg:'#0E7490' },
  gray:   { bg:'#E2E6F0', fg:'#5A6380' },
}

export default function Pill({ children, variant = 'blue', style }) {
  const v = VARIANTS[variant] || VARIANTS.blue
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 20,
      fontSize: 9,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '.3px',
      background: v.bg,
      color: v.fg,
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {children}
    </span>
  )
}
