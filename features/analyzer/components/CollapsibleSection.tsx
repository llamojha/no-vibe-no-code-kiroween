'use client';

import React, { ReactNode, useMemo, useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  animationDelay: string;
  defaultOpen?: boolean;
  icon?: ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  animationDelay,
  defaultOpen = false,
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const sectionId = useMemo(
    () => `collapsible-content-${title.replace(/\s+/g, '-')}`,
    [title],
  );

  return (
    <div
      className="bg-primary/50 border border-slate-700 shadow-lg animate-slide-in-up"
      style={{ animationDelay }}
    >
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex justify-between items-center p-6 text-left transition-colors hover:bg-accent/10"
        aria-expanded={isOpen}
        aria-controls={sectionId}
      >
        <div className="flex items-center gap-4">
          {icon}
          <h2 className="text-2xl font-bold text-slate-200 uppercase tracking-wider">
            {title}
          </h2>
        </div>
        <div className="w-6 h-6 flex items-center justify-center text-accent">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-6 h-6 transform transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
          </svg>
        </div>
      </button>
      <div
        id={sectionId}
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isOpen ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-6 pt-0">
          <div className="border-t border-slate-700 pt-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;
