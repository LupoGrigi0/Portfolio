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
  backgroundImage?: string; // Optional hero background image URL
  backgroundPosition?: string; // CSS background-position (default: 'center')
  backgroundSize?: string; // CSS background-size (default: 'cover')
  minHeight?: string; // Min height (default: '60vh')
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
  backgroundImage,
  backgroundPosition = 'center',
  backgroundSize = 'cover',
  minHeight = '60vh',
  className = '',
}: HeroSectionProps) {
  const textPositionClass = textPositionClasses[textPosition];

  const containerStyle: React.CSSProperties = {
    backgroundColor: `rgba(0, 0, 0, ${containerOpacity})`,
    ...(backgroundImage && {
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize,
      backgroundPosition,
      backgroundRepeat: 'no-repeat',
      minHeight,
    }),
  };

  return (
    <div
      className={`p-8 sm:p-12 backdrop-blur-sm ${backgroundImage ? 'flex items-center justify-center' : ''} ${className}`}
      style={containerStyle}
    >
      <div className={`flex flex-col gap-4 ${textPositionClass} ${backgroundImage ? 'bg-black/40 backdrop-blur-md p-8 rounded-lg' : ''}`}>
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
