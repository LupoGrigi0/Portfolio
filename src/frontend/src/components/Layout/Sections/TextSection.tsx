/**
 * TextSection Component
 *
 * Renders markdown or HTML content with configurable positioning and width.
 * Currently accepts HTML directly; markdown parser can be added later.
 */

interface TextSectionProps {
  content: string; // Markdown or HTML
  position?: 'center' | 'left' | 'right';
  width?: 'full' | 'half' | 'third' | 'quarter';
  className?: string;
}

const positionClasses = {
  center: 'text-center',
  left: 'text-left',
  right: 'text-right',
};

const widthClasses = {
  full: 'w-full',
  half: 'w-1/2',
  third: 'w-1/3',
  quarter: 'w-1/4',
};

export default function TextSection({
  content,
  position = 'left',
  width = 'full',
  className = '',
}: TextSectionProps) {
  const positionClass = positionClasses[position];
  const widthClass = widthClasses[width];

  return (
    <div
      className={`${widthClass} ${positionClass} ${className}
        text-white/90 leading-relaxed
        prose prose-invert prose-headings:font-bold prose-headings:text-white
        prose-p:my-4 prose-ul:my-4 prose-ol:my-4
        prose-li:my-2 max-w-none`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
