/**
 * HeroSection Component
 *
 * Renders title/subtitle in a semi-transparent container for overlay on background images.
 * Features configurable text positioning, container opacity, and optional separator bar.
 */

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  textPosition?: 'center' | 'left' | 'right';
  containerOpacity?: number; // 0-1 for background, default 0.3
  separator?: boolean; // Show separator bar under title
  className?: string;
}

const textPositionClasses = {
  center: 'text-center items-center',
  left: 'text-left items-start',
  right: 'text-right items-end',
};

export default function HeroSection({
  title,
  subtitle,
  textPosition = 'center',
  containerOpacity = 0.3,
  separator = false,
  className = '',
}: HeroSectionProps) {
  const textPositionClass = textPositionClasses[textPosition];

  return (
    <div
      className={`p-8 sm:p-12 backdrop-blur-sm ${className}`}
      style={{ backgroundColor: `rgba(0, 0, 0, ${containerOpacity})` }}
    >
      <div className={`flex flex-col gap-4 ${textPositionClass}`}>
        <h1 className="text-4xl sm:text-5xl font-bold text-white">
          {title}
        </h1>

        {separator && (
          <div
            className="bg-white/50"
            style={{
              width: '100px',
              height: '2px',
            }}
          />
        )}

        {subtitle && (
          <p className="text-xl text-white/80">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
