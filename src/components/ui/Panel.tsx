import type { ReactNode } from 'react';

interface PanelProps {
  title?: string;
  titleRight?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  /** Render the header as a custom node */
  header?: ReactNode;
}

export function Panel({ title, titleRight, children, className = '', contentClassName = '', header }: PanelProps) {
  return (
    <div className={`panel flex flex-col min-h-0 ${className}`}>
      {(title || titleRight || header) && (
        header ?? (
          <div className="panel-header flex items-center justify-between">
            <span>{title}</span>
            {titleRight && <span>{titleRight}</span>}
          </div>
        )
      )}
      <div className={`flex-1 min-h-0 ${contentClassName || 'overflow-auto'}`}>
        {children}
      </div>
    </div>
  );
}
