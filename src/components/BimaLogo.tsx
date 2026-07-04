import React from "react";

interface BimaLogoProps {
  className?: string;
  showText?: boolean;
}

export default function BimaLogo({ className = "h-12", showText = true }: BimaLogoProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 260 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto"
      >
        {/* Top and Bottom thin blue horizontal lines */}
        <line x1="74" y1="10" x2="224" y2="10" stroke="#1F285F" strokeWidth="2.5" />
        <line x1="50" y1="100" x2="200" y2="100" stroke="#1F285F" strokeWidth="2.5" />

        {/* Left Side Stripes */}
        {/* Leftmost thick bar */}
        <polygon points="26,100 50,10 62,10 38,100" fill="#1F285F" />
        {/* Left thin bar */}
        <polygon points="42,100 66,10 69,10 45,100" fill="#1F285F" />

        {/* Right Side Stripes */}
        {/* Right thin bar */}
        <polygon points="191,100 215,10 218,10 194,100" fill="#1F285F" />
        {/* Rightmost thick bar */}
        <polygon points="198,100 222,10 234,10 210,100" fill="#1F285F" />

        {/* Background inside the parallelogram is white */}
        <polygon points="69,11.25 214.75,11.25 195.25,98.75 49.5,98.75" fill="#ffffff" />

        {/* Letters Group skewed by -15 degrees to match the slant */}
        <g transform="translate(68, 0) skewX(-15)">
          {/* "B" letter in Red */}
          <path
            d="M 12,25 
               L 34,25 
               C 42,25, 47,29, 47,35 
               C 47,40, 43,44, 37,45 
               C 44,47, 48,51, 48,58 
               C 48,65, 42,70, 33,70 
               L 12,70 
               Z 
               M 23,34 
               L 23,43 
               L 31,43 
               C 34,43, 36,41, 36,38 
               C 36,35, 34,34, 31,34 
               Z 
               M 23,51 
               L 23,61 
               L 32,61 
               C 35,61, 37,59, 37,56 
               C 37,53, 35,51, 32,51 
               Z"
            fill="#E31E24"
            fillRule="evenodd"
          />

          {/* "N" letter in Red */}
          <path
            d="M 55,25 
               L 68,25 
               L 82,52 
               L 82,25 
               L 95,25 
               L 95,70 
               L 82,70 
               L 68,43 
               L 68,70 
               L 55,70 
               Z"
            fill="#E31E24"
          />
        </g>
      </svg>
      {/* Subtitle */}
      {showText && (
        <span className="text-[9px] font-black tracking-[0.14em] text-slate-800 dark:text-slate-200 mt-1 uppercase text-center whitespace-nowrap">
          PT BIMA NUSA INTERNASIONAL
        </span>
      )}
    </div>
  );
}
