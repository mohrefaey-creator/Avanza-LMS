// Inline SVG icons — no icon library.
const PATHS = {
  home:    <path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2v-9z" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  book:    <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5z M8 7h8 M8 11h8 M8 15h6" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  edit:    <path d="M14 4l6 6-10 10H4v-6L14 4z" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  check:   <path d="M5 12l5 5 9-11" stroke="currentColor" strokeWidth="1.9" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  users:   <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1 M17 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M22 21v-1a4 4 0 0 0-4-4h-1" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  chart:   <path d="M3 21h18 M5 17v-6 M10 17V7 M15 17v-9 M20 17v-4" stroke="currentColor" strokeWidth="1.9" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  shield:  <path d="M12 3l8 4v6c0 5-4 8-8 9-4-1-8-4-8-9V7l8-4z M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  settings:<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.5 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.5l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1A2 2 0 1 1 19.5 7l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  play:    <polygon points="6 4 20 12 6 20" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  search:  <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-5-5" stroke="currentColor" strokeWidth="1.9" fill="none" strokeLinecap="round" />,
  message: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  award:   <circle cx="12" cy="9" r="6" stroke="currentColor" strokeWidth="1.7" fill="none" />,
  awardR:  <path d="M9 13l-2 8 5-3 5 3-2-8" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  trophy:  <path d="M8 4h8v4a4 4 0 0 1-8 0V4z M5 4h3 M16 4h3 M12 12v4 M9 20h6 M10 16h4l1 4H9l1-4z M5 4a3 3 0 0 0 3 3 M19 4a3 3 0 0 1-3 3" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  bell:    <path d="M6 8a6 6 0 0 1 12 0v5l2 3H4l2-3V8z M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  flame:   <path d="M12 22a6 6 0 0 0 6-6c0-3-2-4-3-7-1-2 0-5-3-7 0 4-2 5-3 7-1 1-3 3-3 7a6 6 0 0 0 6 6z" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  lock:    <path d="M5 11h14v10H5z M8 11V8a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  pen:     <path d="M3 21l3-1 11-11-2-2L4 18l-1 3z" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  clock:   <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" />,
  pulse:   <path d="M3 12h4l2-6 4 12 2-6h6" stroke="currentColor" strokeWidth="1.9" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  upload:  <path d="M12 4v12 M7 9l5-5 5 5 M5 20h14" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  download:<path d="M12 4v12 M7 11l5 5 5-5 M5 20h14" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  plus:    <path d="M12 5v14 M5 12h14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />,
  x:       <path d="M6 6l12 12 M18 6l-12 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />,
  arrow:   <path d="M5 12h14 M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  arrowL:  <path d="M19 12H5 M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  doc:     <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z M14 3v6h6 M8 13h8 M8 17h6" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  video:   <path d="M3 6h12v12H3z M15 10l6-3v10l-6-3z" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  login:   <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4 M10 17l5-5-5-5 M15 12H3" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  zap:     <polygon points="13 2 4 14 12 14 11 22 20 10 12 10" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  filter:  <path d="M3 5h18 M6 12h12 M10 19h4" stroke="currentColor" strokeWidth="1.9" fill="none" strokeLinecap="round" />,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinejoin="round" />,
  menu:    <path d="M3 6h18 M3 12h18 M3 18h18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />,
}

export default function Icon({ name = 'home', size = 18, color }) {
  const path = PATHS[name] || PATHS.home
  if (name === 'award') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ color: color || 'currentColor', display: 'block' }}>
        <circle cx="12" cy="9" r="6" stroke="currentColor" strokeWidth="1.7" fill="none" />
        <path d="M9 13l-2 8 5-3 5 3-2-8" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ color: color || 'currentColor', display: 'block' }}>
      {path}
    </svg>
  )
}
