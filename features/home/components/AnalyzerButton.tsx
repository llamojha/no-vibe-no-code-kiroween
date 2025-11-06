"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface AnalyzerButtonProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  variant: "primary" | "secondary";
  onClick?: () => void;
  className?: string;
}

const AnalyzerButton: React.FC<AnalyzerButtonProps> = ({
  title,
  description,
  href,
  icon,
  variant,
  onClick,
  className = "",
}) => {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(href);
    }
  };

  const baseClasses = `
    w-full max-w-sm h-48
    flex flex-col items-center justify-center
    p-6
    font-bold text-lg
    rounded-none
    shadow-lg
    transform hover:scale-105
    transition-all duration-300 ease-in-out
    uppercase tracking-widest
    text-center
    cursor-pointer
    border-2
    ${className}
  `;

  const variantClasses = {
    primary: `
      bg-secondary/80
      text-white
      shadow-secondary/30
      hover:bg-secondary
      border-secondary/50
      hover:border-secondary
    `,
    secondary: `
      bg-gradient-to-r from-orange-500/80 to-purple-500/80
      text-white
      shadow-orange-500/30
      hover:from-orange-500 hover:to-purple-500
      border-orange-500/50
      hover:border-orange-500
    `,
  };

  return (
    <button
      onClick={handleClick}
      className={`${baseClasses} ${variantClasses[variant]}`}
      aria-label={`${title} - ${description}`}
    >
      <div className="mb-3 text-3xl">{icon}</div>
      <div className="mb-2 text-xl font-black">{title}</div>
      <div className="text-sm font-normal normal-case tracking-normal opacity-90 leading-tight">
        {description}
      </div>
    </button>
  );
};

export default AnalyzerButton;
