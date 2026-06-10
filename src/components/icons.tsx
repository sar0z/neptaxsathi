export function EditIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

export function ChartIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

export function InfoIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  );
}

export function AppLogoIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Background Gradient */}
        <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B132B" />
          <stop offset="100%" stopColor="#1C2541" />
        </linearGradient>

        {/* Center Mountain Gradient */}
        <linearGradient id="mountainCenterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0D9488" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>

        {/* Left Mountain Gradient */}
        <linearGradient id="mountainLeftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0F766E" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        {/* Right Mountain Gradient (Nepal Crimson & Gold) */}
        <linearGradient id="mountainRightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="50%" stopColor="#991B1B" />
          <stop offset="100%" stopColor="#7F1D1D" />
        </linearGradient>

        {/* Snow Cap Gradient */}
        <linearGradient id="snowCapGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>

        {/* Chart Bars Gradient */}
        <linearGradient id="barChartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#0F766E" />
        </linearGradient>

        {/* Growth Arrow Gradient */}
        <linearGradient id="growthArrowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>

      {/* Main Badge Background */}
      <rect x="2" y="2" width="96" height="96" rx="22" fill="url(#logoBgGrad)" />

      {/* Background Mountain Peak (Right) */}
      <path d="M 45 85 L 68 38 L 90 85 Z" fill="url(#mountainRightGrad)" />
      {/* Right Peak Snow Cap */}
      <path d="M 62 48 L 68 38 L 74 48 L 71 45 L 68 49 L 65 45 Z" fill="url(#snowCapGrad)" />

      {/* Background Chart Bars (Underneath Foreground Mountains) */}
      <rect x="20" y="70" width="7" height="15" rx="2" fill="url(#barChartGrad)" fillOpacity="0.35" />
      <rect x="31" y="60" width="7" height="25" rx="2" fill="url(#barChartGrad)" fillOpacity="0.45" />
      <rect x="42" y="65" width="7" height="20" rx="2" fill="url(#barChartGrad)" fillOpacity="0.4" />
      <rect x="53" y="55" width="7" height="30" rx="2" fill="url(#barChartGrad)" fillOpacity="0.5" />
      <rect x="64" y="50" width="7" height="35" rx="2" fill="url(#barChartGrad)" fillOpacity="0.55" />
      <rect x="75" y="45" width="7" height="40" rx="2" fill="url(#barChartGrad)" fillOpacity="0.6" />

      {/* Left Mountain Peak */}
      <path d="M 10 85 L 32 42 L 55 85 Z" fill="url(#mountainLeftGrad)" />
      {/* Left Peak Snow Cap */}
      <path d="M 27 52 L 32 42 L 37 52 L 35 49 L 32 53 L 29 49 Z" fill="url(#snowCapGrad)" />

      {/* Center Mountain Peak */}
      <path d="M 25 85 L 50 28 L 75 85 Z" fill="url(#mountainCenterGrad)" />
      {/* Center Peak Snow Cap */}
      <path d="M 43 44 L 50 28 L 57 44 L 53 40 L 50 45 L 47 40 Z" fill="url(#snowCapGrad)" />

      {/* Interactive Floating Symbols (Tax Document & Percentage) */}
      <g opacity="0.9">
        {/* Percentage Symbol */}
        <circle cx="41" cy="48" r="2" fill="#FFFFFF" />
        <circle cx="49" cy="56" r="2" fill="#FFFFFF" />
        <line x1="48" y1="45" x2="42" y2="59" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />

        {/* Document Icon */}
        <rect x="54" y="45" width="11" height="14" rx="1.5" fill="#FFFFFF" />
        <line x1="57" y1="49" x2="62" y2="49" stroke="#0F766E" strokeWidth="1.2" />
        <line x1="57" y1="52" x2="62" y2="52" stroke="#0F766E" strokeWidth="1.2" />
        <line x1="57" y1="55" x2="60" y2="55" stroke="#0F766E" strokeWidth="1.2" />
      </g>

      {/* Rising Trend Arrow */}
      <path
        d="M 15 68 L 32 60 L 50 72 L 85 33"
        stroke="url(#growthArrowGrad)"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M 70 33 L 85 33 L 85 48"
        stroke="url(#growthArrowGrad)"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function SunIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  );
}

export function MoonIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  );
}

export function TableIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6zM3.75 9h16.5M3.75 14.25h16.5M9 3.75v16.5M15 3.75v16.5" />
    </svg>
  );
}

export function CalcIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 5h1M5 8h1M5 11h1M8 5h3M8 8h3M8 11h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

