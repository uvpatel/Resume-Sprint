export function HeroGraphic() {
  return (
    <div
      className="absolute right-0 top-0 bottom-0 w-full sm:w-[60%] lg:w-[52%] overflow-hidden pointer-events-none select-none z-0"
      aria-hidden="true"
    >
      {/* Soft atmospheric pale blue background ambient gradient */}
      <div
        className="absolute top-[-10%] right-[-10%] w-[550px] h-[550px] rounded-full opacity-60 blur-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(234, 244, 255, 0.9) 0%, rgba(206, 230, 255, 0.4) 60%, transparent 80%)",
        }}
      />

      {/* Modern geometric diagonal bands SVG */}
      <svg
        className="absolute right-0 top-0 h-full w-full"
        viewBox="0 0 700 700"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Primary Blue gradient */}
          <linearGradient
            id="blueBand1"
            x1="100%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#2996F3" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#60A5FA" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#EAF4FF" stopOpacity="0.1" />
          </linearGradient>

          {/* Deeper Blue accent gradient */}
          <linearGradient
            id="blueBand2"
            x1="80%"
            y1="10%"
            x2="10%"
            y2="90%"
          >
            <stop offset="0%" stopColor="#147DD8" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#2996F3" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.05" />
          </linearGradient>

          {/* Translucent pale blue layer */}
          <linearGradient
            id="paleLayer"
            x1="90%"
            y1="20%"
            x2="20%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.5" />
            <stop offset="70%" stopColor="#EAF4FF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Subtle soft shadow filter for depth */}
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="-10"
              dy="16"
              stdDeviation="24"
              floodColor="#147DD8"
              floodOpacity="0.12"
            />
          </filter>
        </defs>

        {/* Layer 1: Background broad pale geometric wedge */}
        <path
          d="M750 -40 L380 340 L520 740 L880 740 Z"
          fill="url(#paleLayer)"
        />

        {/* Layer 2: Middle floating diagonal band */}
        <path
          d="M620 -80 L240 310 L390 680 L760 120 Z"
          fill="url(#blueBand1)"
          filter="url(#softShadow)"
        />

        {/* Layer 3: Foreground crisp dynamic diagonal ribbon */}
        <path
          d="M720 40 L340 430 L450 720 L840 280 Z"
          fill="url(#blueBand2)"
          filter="url(#softShadow)"
          opacity="0.9"
        />

        {/* Layer 4: Minimal accent diagonal sliver */}
        <path
          d="M580 200 L440 350 L475 385 L615 235 Z"
          fill="#FFFFFF"
          fillOpacity="0.6"
        />

        {/* Layer 5: Modern subtle grid dots on top-right */}
        <g opacity="0.35">
          <circle cx="580" cy="80" r="2.5" fill="#2996F3" />
          <circle cx="610" cy="80" r="2.5" fill="#2996F3" />
          <circle cx="640" cy="80" r="2.5" fill="#2996F3" />
          <circle cx="670" cy="80" r="2.5" fill="#2996F3" />

          <circle cx="580" cy="110" r="2.5" fill="#2996F3" />
          <circle cx="610" cy="110" r="2.5" fill="#2996F3" />
          <circle cx="640" cy="110" r="2.5" fill="#2996F3" />
          <circle cx="670" cy="110" r="2.5" fill="#2996F3" />

          <circle cx="580" cy="140" r="2.5" fill="#2996F3" />
          <circle cx="610" cy="140" r="2.5" fill="#2996F3" />
          <circle cx="640" cy="140" r="2.5" fill="#2996F3" />
          <circle cx="670" cy="140" r="2.5" fill="#2996F3" />
        </g>
      </svg>
    </div>
  );
}
