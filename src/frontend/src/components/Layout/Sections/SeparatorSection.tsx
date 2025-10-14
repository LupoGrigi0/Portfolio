/**
 * SeparatorSection Component
 *
 * Renders visual dividers between sections with multiple style options.
 * Supports line, gradient, and dots styles with configurable opacity and spacing.
 */

interface SeparatorSectionProps {
  style?: 'line' | 'gradient' | 'dots';
  opacity?: number; // 0-1, default 0.3
  thickness?: number; // px, default 1
  spacing?: number; // vertical margin in px, default 40
  className?: string;
}

export default function SeparatorSection({
  style = 'line',
  opacity = 0.3,
  thickness = 1,
  spacing = 40,
  className = '',
}: SeparatorSectionProps) {
  const marginStyle = { marginTop: `${spacing}px`, marginBottom: `${spacing}px` };

  if (style === 'line') {
    return (
      <div
        className={`w-full ${className}`}
        style={marginStyle}
      >
        <div
          className="w-full border-white"
          style={{
            borderTopWidth: `${thickness}px`,
            opacity,
          }}
        />
      </div>
    );
  }

  if (style === 'gradient') {
    return (
      <div
        className={`w-full ${className}`}
        style={marginStyle}
      >
        <div
          className="w-full"
          style={{
            height: `${thickness}px`,
            background: `linear-gradient(to right, rgba(255, 255, 255, ${opacity}), rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, ${opacity}))`,
          }}
        />
      </div>
    );
  }

  // dots style
  return (
    <div
      className={`w-full flex justify-center items-center ${className}`}
      style={marginStyle}
    >
      <span
        className="text-white text-2xl tracking-widest"
        style={{ opacity }}
      >
        • • •
      </span>
    </div>
  );
}
