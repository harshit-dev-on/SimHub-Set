import React from 'react';

/**
 * Professor Piplu: Animated Blue Penguin STEM Companion Mascot
 * Duolingo-style vector blue penguin with bright yellow beak, rich facial expressions, gestures & particles.
 */
export function ProfessorQuarkAvatar({ expression = 'EXPLAINING', size = 110, className = '' }) {
  // Determine accessories and emotional visual states
  const isEureka = expression === 'EUREKA';
  const isCelebrating = expression === 'CELEBRATING';
  const isThinking = expression === 'THINKING';
  const isChallenge = expression === 'CHALLENGE';

  return (
    <div
      className={`professor-quark-avatar-wrap penguin-avatar ${expression.toLowerCase()}-state ${className}`}
      style={{ width: size, height: size, position: 'relative' }}
      title="Professor Piplu - Your SimHub Blue Penguin Guide"
    >
      <svg
        viewBox="0 0 140 140"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="quark-svg penguin-svg"
      >
        <defs>
          {/* Penguin Blue Feather Gradients */}
          <linearGradient id="penguinBlueGrad" x1="20" y1="20" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="45%" stopColor="#0284C7" />
            <stop offset="85%" stopColor="#0369A1" />
            <stop offset="100%" stopColor="#075985" />
          </linearGradient>

          <linearGradient id="penguinDarkBlueGrad" x1="20" y1="20" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#0C4A6E" />
          </linearGradient>

          {/* Crisp White/Cream Belly */}
          <linearGradient id="penguinBellyGrad" x1="45" y1="65" x2="95" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="85%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          {/* Bright Yellow Beak Gradient */}
          <linearGradient id="yellowBeakGrad" x1="55" y1="58" x2="85" y2="76" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="35%" stopColor="#FACC15" />
            <stop offset="80%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Orange Webbed Feet Gradient */}
          <linearGradient id="penguinFeetGrad" x1="40" y1="120" x2="100" y2="130" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FB923C" />
            <stop offset="70%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#C2410C" />
          </linearGradient>

          {/* Scientist Goggles Rim */}
          <linearGradient id="goggleRimGrad" x1="30" y1="40" x2="110" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="50%" stopColor="#F59E0B" />
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
            <feDropShadow dx="0" dy="4" stdDeviation="3.5" floodColor="#0F172A" floodOpacity="0.22" />
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
            <polygon points="115,20 122,25 118,32 110,27" fill="#38BDF8" className="confetti-p2" />
            <circle cx="28" cy="45" r="3" fill="#F59E0B" className="confetti-p3" />
            <circle cx="112" cy="50" r="3.5" fill="#10B981" className="confetti-p4" />
            <polygon points="70,2 73,8 79,9 75,14 76,20 70,17 64,20 65,14 61,9 67,8" fill="#FBBF24" />
          </g>
        )}

        {isChallenge && (
          <g className="particle-aura challenge-sparks">
            <path d="M68 6 L64 16 L70 16 L66 26" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="22" cy="35" r="2.5" fill="#38BDF8" />
            <circle cx="118" cy="35" r="2.5" fill="#38BDF8" />
          </g>
        )}

        {/* 2. Character Body & Penguin Feet */}
        <g filter="url(#quarkDropShadow)" className="quark-character-body">
          {/* Orange Webbed Feet */}
          <g className="penguin-feet">
            <path d="M 42 122 C 40 122 36 127 42 130 C 48 132 58 130 60 125 C 60 122 52 121 42 122 Z" fill="url(#penguinFeetGrad)" stroke="#C2410C" strokeWidth="1" />
            <path d="M 98 122 C 100 122 104 127 98 130 C 92 132 82 130 80 125 C 80 122 88 121 98 122 Z" fill="url(#penguinFeetGrad)" stroke="#C2410C" strokeWidth="1" />
          </g>

          {/* Main Oval Blue Penguin Body */}
          <path
            d="M 70 30 C 36 30 26 58 26 88 C 26 114 46 125 70 125 C 94 125 114 114 114 88 C 114 58 104 30 70 30 Z"
            fill="url(#penguinBlueGrad)"
            stroke="#0369A1"
            strokeWidth="2.5"
          />

          {/* White Penguin Face Mask Plumage */}
          <path
            d="M 70 42 C 54 42 42 50 42 66 C 42 76 48 84 56 86 C 62 87 67 85 70 85 C 73 85 78 87 84 86 C 92 84 98 76 98 66 C 98 50 86 42 70 42 Z"
            fill="#FFFFFF"
            opacity="0.96"
          />

          {/* Crisp Clean White Penguin Belly */}
          <path
            d="M 70 70 C 50 70 44 84 44 100 C 44 115 54 121 70 121 C 86 121 96 115 96 100 C 96 84 90 70 70 70 Z"
            fill="url(#penguinBellyGrad)"
            stroke="rgba(15, 23, 42, 0.08)"
            strokeWidth="1.5"
          />

          {/* 3. Penguin Flippers (Wings) */}
          {isThinking ? (
            /* Thinking Pose: Flipper to Beak */
            <g className="penguin-flippers-thinking">
              {/* Left Flipper */}
              <path d="M 28 78 C 18 84 18 98 30 102 C 34 103 36 94 34 84" fill="url(#penguinDarkBlueGrad)" stroke="#0369A1" strokeWidth="1.8" />
              {/* Right Flipper Touching Beak */}
              <path d="M 112 78 C 118 72 104 66 84 72 C 80 73 84 80 92 82 C 104 84 110 88 112 78 Z" fill="url(#penguinDarkBlueGrad)" stroke="#0369A1" strokeWidth="1.8" />
            </g>
          ) : isCelebrating ? (
            /* Celebrating: Both Flippers Raised High in Joy */
            <g className="penguin-flippers-celebrate">
              <path d="M 30 74 C 14 58 12 42 22 36 C 29 32 35 48 33 68 Z" fill="url(#penguinDarkBlueGrad)" stroke="#0369A1" strokeWidth="2" />
              <path d="M 110 74 C 126 58 128 42 118 36 C 111 32 105 48 107 68 Z" fill="url(#penguinDarkBlueGrad)" stroke="#0369A1" strokeWidth="2" />
            </g>
          ) : (
            /* Explaining / Default: Right Flipper Holding Laser Pointer Stick */
            <g className="penguin-flippers-default">
              {/* Left Flipper Rest */}
              <path d="M 28 74 C 16 80 16 96 28 102 C 32 103 35 94 32 82 Z" fill="url(#penguinDarkBlueGrad)" stroke="#0369A1" strokeWidth="1.8" />
              {/* Right Flipper Pointing */}
              <path d="M 110 76 C 122 72 126 62 122 54 C 118 48 112 56 108 68 Z" fill="url(#penguinDarkBlueGrad)" stroke="#0369A1" strokeWidth="1.8" />
              {/* Laser Pointer Rod */}
              <line x1="120" y1="58" x2="136" y2="38" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="136" cy="38" r="2.5" fill="#EF4444" />
            </g>
          )}

          {/* 4. Big Expressive Eyes & Scientist Goggles */}
          <g className="quark-head-features">
            {/* Goggle Strap */}
            <path d="M 28 54 Q 70 50 112 54" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" fill="none" />

            {/* Left Eye Goggle */}
            <circle cx="53" cy="54" r="16" fill="#FFFFFF" stroke="url(#goggleRimGrad)" strokeWidth="3.5" />
            {/* Right Eye Goggle */}
            <circle cx="87" cy="54" r="16" fill="#FFFFFF" stroke="url(#goggleRimGrad)" strokeWidth="3.5" />
            {/* Center Bridge */}
            <rect x="65" y="52" width="10" height="4" rx="2" fill="#F59E0B" />

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
              /* Big Warm Intelligent Penguin Blink Eyes */
              <>
                <circle cx="55" cy="54" r="8" fill="#0F172A" className="quark-pupil" />
                <circle cx="57" cy="51" r="3" fill="#FFFFFF" />
                <circle cx="53" cy="57" r="1.2" fill="#FFFFFF" />

                <circle cx="85" cy="54" r="8" fill="#0F172A" className="quark-pupil" />
                <circle cx="87" cy="51" r="3" fill="#FFFFFF" />
                <circle cx="83" cy="57" r="1.2" fill="#FFFFFF" />
              </>
            )}

            {/* Cute Rosy Pink Blush Cheeks */}
            <ellipse cx="38" cy="66" rx="5" ry="3" fill="#FB7185" opacity="0.5" />
            <ellipse cx="102" cy="66" rx="5" ry="3" fill="#FB7185" opacity="0.5" />

            {/* 5. BRIGHT YELLOW PENGUIN BEAK */}
            <g className="penguin-yellow-beak">
              {/* Upper Beak */}
              <path
                d="M 58 58 Q 70 54 82 58 Q 75 74 70 76 Q 65 74 58 58 Z"
                fill="url(#yellowBeakGrad)"
                stroke="#D97706"
                strokeWidth="1.5"
              />
              {/* Beak Highlight Shine */}
              <ellipse cx="70" cy="61" rx="6" ry="2.2" fill="#FEF08A" opacity="0.8" />
              {/* Lower Beak Shadow/Line */}
              <path d="M 62 66 Q 70 72 78 66" stroke="#B45309" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            </g>

            {/* Graduation Cap / Academic Bow */}
            <g transform="translate(70, 24)">
              {/* Cap Base */}
              <polygon points="0,-10 26,0 0,10 -26,0" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
              {/* Cap Skull Cap */}
              <path d="M -12 0 C -12 7 12 7 12 0" fill="#0F172A" />
              {/* Golden Tassel */}
              <circle cx="0" cy="0" r="2.5" fill="#FACC15" />
              <path d="M 0 0 C 14 3 18 10 17 18" stroke="#FACC15" strokeWidth="1.5" fill="none" />
              <rect x="15" y="18" width="4" height="4" rx="1" fill="#EAB308" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}

export default ProfessorQuarkAvatar;
