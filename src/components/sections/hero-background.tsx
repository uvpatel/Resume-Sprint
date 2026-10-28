import React from "react";

export function HeroBackground() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none -z-10"
      aria-hidden="true"
    >
      {/* 1. Deep atmospheric cosmic base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 130% 90% at 50% -15%, #0d1527 0%, #070b16 45%, #04060b 85%, #030407 100%)",
        }}
      />

      {/* 2. Starfield with subtle pinpoint stars */}
      <svg
        className="absolute inset-0 h-full w-full opacity-60"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Small starry constellations */}
        <circle cx="8%" cy="14%" r="1" fill="#fff" opacity="0.4" />
        <circle cx="15%" cy="8%" r="1.5" fill="#fff" opacity="0.7" />
        <circle cx="23%" cy="22%" r="0.8" fill="#fff" opacity="0.3" />
        <circle cx="34%" cy="12%" r="1.2" fill="#fff" opacity="0.6" />
        <circle cx="42%" cy="6%" r="0.9" fill="#fff" opacity="0.4" />
        <circle cx="49%" cy="18%" r="1.6" fill="#fff" opacity="0.8" />
        <circle cx="58%" cy="10%" r="1" fill="#fff" opacity="0.5" />
        <circle cx="67%" cy="24%" r="1.4" fill="#fff" opacity="0.7" />
        <circle cx="76%" cy="7%" r="0.8" fill="#fff" opacity="0.3" />
        <circle cx="84%" cy="16%" r="1.5" fill="#fff" opacity="0.65" />
        <circle cx="92%" cy="11%" r="1.1" fill="#fff" opacity="0.5" />

        <circle cx="12%" cy="32%" r="1.2" fill="#fff" opacity="0.5" />
        <circle cx="28%" cy="38%" r="0.9" fill="#fff" opacity="0.35" />
        <circle cx="39%" cy="28%" r="1.4" fill="#fff" opacity="0.6" />
        <circle cx="53%" cy="35%" r="1.1" fill="#fff" opacity="0.45" />
        <circle cx="64%" cy="31%" r="0.8" fill="#fff" opacity="0.3" />
        <circle cx="73%" cy="40%" r="1.3" fill="#fff" opacity="0.55" />
        <circle cx="88%" cy="34%" r="1.5" fill="#fff" opacity="0.6" />

        <circle cx="18%" cy="48%" r="0.9" fill="#fff" opacity="0.3" />
        <circle cx="31%" cy="52%" r="1.2" fill="#fff" opacity="0.4" />
        <circle cx="47%" cy="46%" r="0.8" fill="#fff" opacity="0.3" />
        <circle cx="62%" cy="50%" r="1" fill="#fff" opacity="0.4" />
        <circle cx="79%" cy="47%" r="1.3" fill="#fff" opacity="0.45" />
      </svg>

      {/* 3. Deep blue atmospheric horizon layer */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 95% 45% at 50% 70%, rgba(29, 78, 216, 0.16) 0%, rgba(15, 23, 42, 0.05) 55%, transparent 75%)",
        }}
      />

      {/* 4. Muted golden light radiating near the horizon */}
      <div
        className="absolute inset-x-0 bottom-[12%] h-[380px]"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% 85%, rgba(245, 158, 11, 0.13) 0%, rgba(217, 119, 6, 0.05) 45%, transparent 75%)",
        }}
      />

      {/* 5. Cinematic abstract landscape / mountain silhouette contours */}
      <div className="absolute inset-x-0 bottom-0 h-[280px] sm:h-[360px] opacity-95">
        <svg
          viewBox="0 0 1440 360"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          {/* Distant ridge highlighted against warm glow */}
          <path
            d="M0 240C180 215 320 230 460 210C610 188 740 220 900 195C1060 170 1220 205 1440 185V360H0V240Z"
            fill="#090d18"
            fillOpacity="0.75"
          />
          {/* Midground atmospheric silhouette */}
          <path
            d="M0 270C220 250 380 275 560 245C720 218 890 252 1080 228C1240 208 1360 232 1440 220V360H0V270Z"
            fill="#070a12"
            fillOpacity="0.9"
          />
          {/* Foreground ridge blending seamlessly into ground */}
          <path
            d="M0 300C260 282 420 310 640 280C840 252 1020 290 1200 268C1340 250 1400 265 1440 258V360H0V300Z"
            fill="#05070a"
          />
        </svg>
      </div>

      {/* 6. Dark overlay ensuring high text readability and smooth bottom blend */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(5,7,10,0.3) 0%, rgba(5,7,10,0.5) 45%, rgba(5,7,10,0.85) 85%, #05070a 100%)",
        }}
      />

      {/* 7. Subtle vertical grid guides matching reference's architectural aesthetic */}
      <div className="absolute inset-0 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-full w-full border-x border-white/[0.04]" />
      </div>
    </div>
  );
}
