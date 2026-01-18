import React from 'react';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "" }: LogoProps) {
  return (
    <div className={`flex items-center select-none ${className}`}>
      {/* Red "11" Block */}
      <div className="bg-primary text-white rounded-xl flex items-center justify-center w-12 h-10 shadow-sm relative z-10">
        <span className="font-heading font-bold text-3xl tracking-tighter leading-none pb-1">11</span>
      </div>
      
      {/* White "ADS" Block */}
      <div className="bg-white border-2 border-primary text-primary flex items-center justify-center px-1.5 py-0.5 ml-[-4px] rounded-r-md shadow-sm relative z-20 h-7 self-center">
        <span className="font-bold text-[10px] tracking-wide leading-none">ADS</span>
      </div>
    </div>
  );
}
