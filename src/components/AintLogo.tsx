import React from 'react';

interface AintLogoProps {
  className?: string;
}

export const AintLogo: React.FC<AintLogoProps> = ({ className = 'w-5 h-5 text-white' }) => {
  return (
    <svg
      viewBox="0 0 1000 1000"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Ain't Logo"
    >
      <circle cx="413" cy="595" r="44" />
      <path d="M500 366 L630 630 L542 630 L457 456 Z" />
    </svg>
  );
};
