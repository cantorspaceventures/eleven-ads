import React from 'react';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "" }: LogoProps) {
  return (
    <img 
      src="/logo.png" 
      alt="ElevenAds" 
      className={`h-10 w-auto object-contain ${className}`}
    />
  );
}
