/**
 * ImageSection Component
 *
 * Renders a single named image from a collection with configurable width and caption.
 * Uses Next.js Image component for optimized image loading and lazy loading.
 */

import Image from 'next/image';

interface ImageSectionProps {
  src: string; // Filename (will be resolved to full URL by parent)
  alt?: string;
  width?: 'full' | 'half' | 'third' | 'quarter';
  caption?: string;
  className?: string;
}

const widthClasses = {
  full: 'w-full',
  half: 'w-1/2',
  third: 'w-1/3',
  quarter: 'w-1/4',
};

export default function ImageSection({
  src,
  alt = '',
  width = 'full',
  caption,
  className = '',
}: ImageSectionProps) {
  const widthClass = widthClasses[width];

  return (
    <div className={`${widthClass} ${className}`}>
      <div className="relative w-full h-auto">
        <Image
          src={src}
          alt={alt}
          width={1920}
          height={1080}
          loading="lazy"
          className="w-full h-auto object-contain"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
      {caption && (
        <p className="text-white/70 text-sm text-center mt-2">
          {caption}
        </p>
      )}
    </div>
  );
}
