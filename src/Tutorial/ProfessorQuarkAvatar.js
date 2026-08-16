import React from 'react';

/**
 * Professor Quark: Animated Science Companion Mascot
 * Duolingo-style vector character with rich facial expressions, gestures & particles.
 */
export function ProfessorQuarkAvatar({ expression = 'EXPLAINING', size = 110, className = '' }) {
  // Determine accessories and emotional visual states
  const isEureka = expression === 'EUREKA';
  const isCelebrating = expression === 'CELEBRATING';
  const isThinking = expression === 'THINKING';
  const isChallenge = expression === 'CHALLENGE';

  return (
    <div
      className={`professor-quark-avatar-wrap ${expression.toLowerCase()}-state ${className}`}
      style={{ width: size, height: size, position: 'relative' }}
      title="Professor Quark - Your SimHub STEM Guide"
    >
      <svg
        viewBox="0 0 140 140"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="quark-svg"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="quarkFeatherGrad" x1="20" y1="20" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="50%" stopColor="#16A34A" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>

          <linearGradient id="quarkBellyGrad" x1="45" y1="65" x2="95" y2="115" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFDF5" />
            <stop offset="100%" stopColor="#FEF08A" />
          </linearGradient>

          <linearGradient id="goggleRimGrad" x1="30" y1="40" x2="110" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>

          <radialGradient id="atomicCoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#0284C7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0369A1" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="lightbulbGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="1" />
            <stop offset="60%" stopColor="#FACC15" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#EAB308" stopOpacity="0" />
          </radialGradient>

          <filter id="quarkDropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* 1. Ambient Particle Aura (Eureka / Celebration / Challenge) */}
        {isEureka && (
          <g className="particle-aura eureka-particles">
            <circle cx="70" cy="18" r="14" fill="url(#lightbulbGlow)" />
            {/* Pop Lightbulb */}
            <path
              d="M63 18 C63 13 77 13 77 18 C77 22 73 23 73 26 L67 26 C67 23 63 22 63 18 Z"
              fill="#FDE047"
              stroke="#B45309"
              strokeWidth="1.5"
            />
            <rect x="67" y="26" width="6" height="3" rx="1" fill="#94A3B8" />
            {/* Radiant Rays */}
            <line x1="70" y1="6" x2="70" y2="1" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
            <line x1="82" y1="9" x2="86" y2="5" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
            <line x1="58" y1="9" x2="54" y2="5" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {isCelebrating && (
          <g className="particle-aura celebration-confetti">
            <polygon points="20,25 24,18 30,22 24,28" fill="#EC4899" className="confetti-p1" />
            <polygon points="115,20 122,25 118,32 110,27" fill="#3B82F6" className="confetti-p2" />
            <circle cx="28" cy="45" r="3" fill="#F59E0B" className="confetti-p3" />
            <circle cx="112" cy="50" r="3.5" fill="#10B981" className="confetti-p4" />
            <polygon points="70,2 73,8 79,9 75,14 76,20 70,17 64,20 65,14 61,9 67,8" fill="#FBBF24" />
          </g>
        )}

        {isChallenge && (
          <g className="particle-aura challenge-sparks">
            <path d="M68 6 L64 16 L70 16 L66 26" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="22" cy="35" r="2" fill="#38BDF8" />
            <circle cx="118" cy="35" r="2" fill="#38BDF8" />
          </g>
        )}

        {/* 2. Character Body & Feet */}
        <g filter="url(#quarkDropShadow)" className="quark-character-body">
          {/* Feet */}
          <ellipse cx="52" cy="122" rx="9" ry="4.5" fill="#F59E0B" />
          <ellipse cx="88" cy="122" rx="9" ry="4.5" fill="#F59E0B" />

          {/* Main Oval Body */}
          <path
            d="M 70 32 C 38 32 30 62 30 88 C 30 112 48 122 70 122 C 92 122 110 112 110 88 C 110 62 102 32 70 32 Z"
            fill="url(#quarkFeatherGrad)"
            stroke="#166534"
            strokeWidth="2.5"
          />

          {/* Cream Fluffy Belly */}
          <path
            d="M 70 66 C 52 66 46 80 46 96 C 46 112 56 118 70 118 C 84 118 94 112 94 96 C 94 80 88 66 70 66 Z"
            fill="url(#quarkBellyGrad)"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="1.5"
          />

          {/* Glowing Atomic Core on Belly */}
          <g transform="translate(70, 93)">
            <circle cx="0" cy="0" r="10" fill="url(#atomicCoreGlow)" />
            <ellipse cx="0" cy="0" rx="9" ry="3.5" fill="none" stroke="#0284C7" strokeWidth="1" strokeDasharray="3 2" transform="rotate(25)" />
            <ellipse cx="0" cy="0" rx="9" ry="3.5" fill="none" stroke="#0284C7" strokeWidth="1" strokeDasharray="3 2" transform="rotate(-25)" />
            <circle cx="0" cy="0" r="2.5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="0.8" />
          </g>

          {/* 3. Arms / Wings */}
          {isThinking ? (
            /* Thinking Pose: Wing to Chin */
            <g className="quark-wing-left">
              <path d="M 32 80 C 22 85 24 100 36 94" stroke="#166534" strokeWidth="5" strokeLinecap="round" fill="none" />
              <path d="M 108 80 C 114 74 100 68 82 74" stroke="#166534" strokeWidth="5" strokeLinecap="round" fill="none" />
            </g>
          ) : isCelebrating ? (
            /* Celebrating: Both Wings Raised High */
            <g className="quark-wings-celebrate">
              <path d="M 33 75 C 18 60 16 45 25 40 C 32 37 38 52 35 70" fill="#15803D" stroke="#166534" strokeWidth="2" />
              <path d="M 107 75 C 122 60 124 45 115 40 C 108 37 102 52 105 70" fill="#15803D" stroke="#166534" strokeWidth="2" />
            </g>
          ) : (
            /* Explaining / Default: Right Wing Holding Laser Pointer Stick */
            <g className="quark-wings-default">
              {/* Left Wing Rest */}
              <path d="M 32 78 C 22 84 22 96 34 100" fill="#15803D" stroke="#166534" strokeWidth="2" strokeLinecap="round" />
              {/* Right Wing Pointing */}
              <path d="M 108 78 C 120 74 126 64 122 56" fill="#15803D" stroke="#166534" strokeWidth="2" strokeLinecap="round" />
              {/* Laser Pointer Rod */}
              <line x1="120" y1="60" x2="136" y2="40" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="136" cy="40" r="2.5" fill="#EF4444" />
            </g>
          )}

          {/* 4. Big Expressive Eyes & Scientist Goggles */}
          <g className="quark-head-features">
            {/* Goggle Strap */}
            <path d="M 30 54 Q 70 50 110 54" stroke="#78350F" strokeWidth="4" strokeLinecap="round" fill="none" />

            {/* Left Eye Goggle */}
            <circle cx="53" cy="54" r="16" fill="#FFFFFF" stroke="url(#goggleRimGrad)" strokeWidth="3.5" />
            {/* Right Eye Goggle */}
            <circle cx="87" cy="54" r="16" fill="#FFFFFF" stroke="url(#goggleRimGrad)" strokeWidth="3.5" />
            {/* Center Bridge */}
            <rect x="65" y="52" width="10" height="4" rx="2" fill="#D97706" />

            {/* Eye Pupils (Expressive States) */}
            {isCelebrating ? (
              /* Star Eyes for Celebration */
              <>
                <text x="53" y="59" fontSize="16" textAnchor="middle" fill="#F59E0B">★</text>
                <text x="87" y="59" fontSize="16" textAnchor="middle" fill="#F59E0B">★</text>
              </>
            ) : isThinking ? (
              /* Looking Up & Right */
              <>
                <circle cx="57" cy="50" r="7.5" fill="#0F172A" className="quark-pupil" />
                <circle cx="59" cy="48" r="2.5" fill="#FFFFFF" />
                <circle cx="91" cy="50" r="7.5" fill="#0F172A" className="quark-pupil" />
                <circle cx="93" cy="48" r="2.5" fill="#FFFFFF" />
              </>
            ) : (
              /* Big Warm Intelligent Blink Eyes */
              <>
                <circle cx="55" cy="54" r="8" fill="#0F172A" className="quark-pupil" />
                <circle cx="57" cy="51" r="3" fill="#FFFFFF" />
                <circle cx="53" cy="57" r="1.2" fill="#FFFFFF" />

                <circle cx="85" cy="54" r="8" fill="#0F172A" className="quark-pupil" />
                <circle cx="87" cy="51" r="3" fill="#FFFFFF" />
                <circle cx="83" cy="57" r="1.2" fill="#FFFFFF" />
              </>
            )}

            {/* Rosy Cheeks */}
            <ellipse cx="40" cy="65" rx="4.5" ry="2.5" fill="#F43F5E" opacity="0.4" />
            <ellipse cx="100" cy="65" rx="4.5" ry="2.5" fill="#F43F5E" opacity="0.4" />

            {/* Golden Beak */}
            <polygon points="70,58 64,68 76,68" fill="#F59E0B" stroke="#D97706" strokeWidth="1.2" />
            <polygon points="65,68 70,72 75,68" fill="#D97706" />

            {/* Graduation Cap / Mini Bowtie */}
            <g transform="translate(70, 26)">
              {/* Cap Base */}
              <polygon points="0,-10 26,0 0,10 -26,0" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
              {/* Cap Skull Cap */}
              <path d="M -12 0 C -12 7 12 7 12 0" fill="#0F172A" />
              {/* Golden Tassel */}
              <circle cx="0" cy="0" r="2.5" fill="#F59E0B" />
              <path d="M 0 0 C 14 3 18 10 17 18" stroke="#F59E0B" strokeWidth="1.5" fill="none" />
              <rect x="15" y="18" width="4" height="4" rx="1" fill="#D97706" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}

export default ProfessorQuarkAvatar;
