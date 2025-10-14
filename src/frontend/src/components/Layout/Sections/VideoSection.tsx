/**
 * VideoSection Component
 *
 * Renders a single video file with configurable playback options and caption.
 * Uses HTML5 video element with responsive sizing and performance optimizations.
 */

interface VideoSectionProps {
  src: string; // Filename (will be resolved to full URL by parent)
  width?: 'full' | 'half' | 'third' | 'quarter';
  caption?: string;
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  className?: string;
}

const widthClasses = {
  full: 'w-full',
  half: 'w-1/2',
  third: 'w-1/3',
  quarter: 'w-1/4',
};

export default function VideoSection({
  src,
  width = 'full',
  caption,
  autoplay = false,
  controls = true,
  loop = false,
  muted = true,
  className = '',
}: VideoSectionProps) {
  const widthClass = widthClasses[width];

  return (
    <div className={`${widthClass} ${className}`}>
      <video
        src={src}
        autoPlay={autoplay}
        controls={controls}
        loop={loop}
        muted={muted}
        preload="metadata"
        className="w-full h-auto"
      >
        Your browser does not support the video tag.
      </video>
      {caption && (
        <p className="text-white/70 text-sm text-center mt-2">
          {caption}
        </p>
      )}
    </div>
  );
}
