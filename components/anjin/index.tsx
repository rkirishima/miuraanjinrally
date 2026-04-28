/**
 * Anjin Design System — shared SVG primitives & tokens
 * Based on Claude Design handoff: palette=sand, displayFont=serif
 * All components are React/TSX, server-component safe (no hooks).
 */

// ─── Brand Icon ──────────────────────────────────────────────────────────────
export function CompassIcon({
  size = 24,
  color = 'currentColor',
  strokeWidth = 1.4,
  className = '',
}: {
  size?: number
  color?: string
  strokeWidth?: number
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="12,3 13,11 12,12 11,11" fill={color} />
      <polygon points="12,21 13,13 12,12 11,13" fill={color} opacity="0.4" />
      <circle cx="12" cy="12" r="0.8" fill={color} />
    </svg>
  )
}

// ─── Hanko (判子) stamp ───────────────────────────────────────────────────────
export function Hanko({
  size = 64,
  kanji = '零',
  color,
  locked = false,
  completed = false,
}: {
  size?: number
  kanji?: string
  color?: string
  locked?: boolean
  completed?: boolean
}) {
  const c = color ?? (locked ? '#b5b0a0' : '#a85a3a')
  const filterId = `ink-${size}-${kanji}`
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg
        viewBox="0 0 80 80"
        width={size}
        height={size}
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <filter id={filterId}>
            <feTurbulence baseFrequency="0.9" numOctaves="2" seed="4" />
            <feDisplacementMap in="SourceGraphic" scale="0.9" />
          </filter>
        </defs>
        <g filter={`url(#${filterId})`} opacity={locked ? 0.35 : 1}>
          <circle cx="40" cy="40" r="36" fill="none" stroke={c} strokeWidth="3.2" />
          <circle cx="40" cy="40" r="31" fill="none" stroke={c} strokeWidth="0.7" opacity="0.55" />
        </g>
        {!locked &&
          [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((a, i) => (
            <line
              key={i}
              x1={40 + Math.cos(a) * 32}
              y1={40 + Math.sin(a) * 32}
              x2={40 + Math.cos(a) * 36}
              y2={40 + Math.sin(a) * 36}
              stroke={c}
              strokeWidth="1.4"
            />
          ))}
      </svg>
      {completed ? (
        <svg
          viewBox="0 0 24 24"
          width={size * 0.44}
          height={size * 0.44}
          fill="none"
          stroke={c}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ position: 'relative', zIndex: 1 }}
        >
          <polyline points="4 12 10 18 20 6" />
        </svg>
      ) : locked ? (
        <svg
          viewBox="0 0 24 24"
          width={size * 0.32}
          height={size * 0.32}
          fill="none"
          stroke={c}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ position: 'relative', zIndex: 1 }}
        >
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      ) : (
        <span
          style={{
            fontFamily: '"Shippori Mincho", serif',
            fontSize: size * 0.46,
            color: c,
            fontWeight: 700,
            transform: 'rotate(-4deg)',
            textShadow: `0 0 1px ${c}`,
            position: 'relative',
            zIndex: 1,
            lineHeight: 1,
          }}
        >
          {kanji}
        </span>
      )}
    </div>
  )
}

// ─── Texture layers ───────────────────────────────────────────────────────────
export function PaperGrain({ opacity = 0.18 }: { opacity?: number }) {
  return (
    <svg
      width="100%"
      height="100%"
      style={{
        position: 'absolute',
        inset: 0,
        mixBlendMode: 'multiply',
        opacity,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      <defs>
        <filter id="pg-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.92" numOctaves="2" seed="3" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0" />
        </filter>
      </defs>
      <rect width="100%" height="100%" filter="url(#pg-noise)" />
    </svg>
  )
}

export function Halftone({ color = '#f4ecdb', opacity = 0.12 }: { color?: string; opacity?: number }) {
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: 'absolute', inset: 0, opacity, pointerEvents: 'none' }}
    >
      <defs>
        <pattern id="ht" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="0.7" fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#ht)" />
    </svg>
  )
}

export function WoodblockWave({ color = '#f4ecdb', opacity = 0.32 }: { color?: string; opacity?: number }) {
  return (
    <svg
      viewBox="0 0 400 240"
      preserveAspectRatio="xMidYMax slice"
      width="100%"
      height="100%"
      style={{ position: 'absolute', inset: 0, opacity, pointerEvents: 'none' }}
    >
      <g fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round">
        <path d="M -10 200 Q 40 170 90 195 T 180 200 T 280 190 T 410 200" />
        <path d="M -10 215 Q 50 195 100 215 T 200 215 T 300 210 T 410 215" />
        <path d="M -10 230 Q 60 220 120 230 T 240 230 T 360 225 T 410 230" />
        <path d="M 30 180 Q 50 150 80 165 Q 110 180 95 200 Q 80 215 60 200 Q 45 188 55 178" />
        <path d="M 200 170 Q 225 138 260 152 Q 295 168 280 195 Q 260 215 235 200 Q 215 187 230 175" />
        <path d="M 320 175 Q 340 150 365 162 Q 388 175 378 195" />
        {Array.from({ length: 30 }).map((_, i) => (
          <circle key={i} cx={20 + i * 13} cy={158 + (i % 3) * 4} r="0.8" fill={color} />
        ))}
      </g>
    </svg>
  )
}

export function TopoLines({ color = '#2a2925', opacity = 0.06 }: { color?: string; opacity?: number }) {
  return (
    <svg
      viewBox="0 0 400 800"
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      style={{ position: 'absolute', inset: 0, opacity, pointerEvents: 'none' }}
    >
      <g fill="none" stroke={color} strokeWidth="0.6">
        {[40, 80, 120, 160, 200, 240, 280, 320, 360].map((cx, i) =>
          [40, 70, 100, 130, 160, 200, 250].map((r, j) => (
            <circle key={`${i}-${j}`} cx={cx + (i % 2 ? 40 : 0)} cy={400 + ((i % 3) - 1) * 30} r={r} />
          ))
        )}
        <path d="M0 100 Q 100 80 200 100 T 400 100" />
        <path d="M0 130 Q 100 110 200 130 T 400 130" />
        <path d="M0 660 Q 100 640 200 660 T 400 660" />
        <path d="M0 690 Q 100 670 200 690 T 400 690" />
      </g>
    </svg>
  )
}

// ─── Compass rose watermark (large, decorative) ───────────────────────────────
export function CompassRose({
  size = 300,
  color = '#f4ecdb',
  opacity = 0.22,
}: {
  size?: number
  color?: string
  opacity?: number
}) {
  const ticks = Array.from({ length: 32 }).map((_, i) => {
    const a = (i / 32) * Math.PI * 2
    const r1 = 78
    const r2 = i % 8 === 0 ? 96 : i % 4 === 0 ? 92 : 86
    return { x1: 100 + Math.cos(a) * r1, y1: 100 + Math.sin(a) * r1, x2: 100 + Math.cos(a) * r2, y2: 100 + Math.sin(a) * r2 }
  })
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="0.7"
      style={{ opacity }}
    >
      <circle cx="100" cy="100" r="96" />
      <circle cx="100" cy="100" r="78" />
      <circle cx="100" cy="100" r="60" strokeDasharray="2 3" />
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
      ))}
      <polygon points="100,8 105,100 100,80 95,100" fill={color} />
    </svg>
  )
}

// ─── Typography helper ────────────────────────────────────────────────────────
export function Eyebrow({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={`text-[10px] tracking-[0.3em] uppercase font-semibold text-rally-ink2 font-sans ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}

// ─── Emergency footer (shared across rally layout) ────────────────────────────
export function EmergencyFooter() {
  return (
    <footer
      style={{ padding: '18px 20px', background: '#3a2a25', color: '#f4dcd0' }}
      className="safe-bottom"
    >
      <div className="flex justify-between items-center">
        <div>
          <div style={{ fontSize: 9, letterSpacing: '0.3em', opacity: 0.7 }}>緊急連絡先  ·  EMERGENCY</div>
          <div className="font-display text-sm italic mt-0.5">Royal Enfield 湘南WEST・萩原</div>
        </div>
        <a href="tel:09023235606" className="font-mono text-sm">
          090-2323-5606
        </a>
      </div>
    </footer>
  )
}
