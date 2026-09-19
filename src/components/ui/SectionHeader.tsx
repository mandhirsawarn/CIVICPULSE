import React from 'react';
import { cn } from '../../utils/cn';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6", className)}>
      <div>
        {eyebrow && (
          <span className="text-[11px] font-bold tracking-wider text-blue-600 uppercase block mb-1">
            {eyebrow}
          </span>
        )}
        <h2 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-slate-900 leading-tight">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-slate-500 mt-1 max-w-2xl font-normal">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="shrink-0 flex items-center">
          {action}
        </div>
      )}
    </div>
  );
};

export default SectionHeader;
