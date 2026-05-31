import Image from 'next/image';

/**
 * AhagetLogo — official Ahaget brand mark
 *
 * Usage:
 *   <AhagetLogo size={32} />                          — mark only, light bg
 *   <AhagetLogo size={32} showWordmark />             — mark + wordmark, light bg
 *   <AhagetLogo size={32} variant="dark" />           — purple-bg mark for dark surfaces
 */
interface AhagetLogoProps {
  size?: number;
  showWordmark?: boolean;
  wordmarkSize?: number;
  wordmarkColor?: string;
  /** 'light' = transparent mark (white/light bg), 'dark' = purple-bg mark (dark/purple bg) */
  variant?: 'light' | 'dark';
  className?: string;
  style?: React.CSSProperties;
}

export default function AhagetLogo({
  size = 32,
  showWordmark = false,
  wordmarkSize,
  wordmarkColor = '#1A0530',
  variant = 'light',
  className,
  style,
}: AhagetLogoProps) {
  const fs = wordmarkSize ?? Math.round(size * 0.5);
  const src = variant === 'dark' ? '/logo-mark-bg.png' : '/logo-mark.png';

  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(size * 0.28), ...style }}
    >
      <Image
        src={src}
        alt="Ahaget"
        width={size}
        height={size}
        style={{ objectFit: 'contain', flexShrink: 0 }}
        priority
      />

      {showWordmark && (
        <span style={{
          fontSize: fs,
          fontWeight: 700,
          color: wordmarkColor,
          letterSpacing: '-0.025em',
          lineHeight: 1,
          userSelect: 'none',
        }}>
          Ahaget
        </span>
      )}
    </span>
  );
}

