import React from 'react';

/**
 * Pogo Stick Rider SVG character
 * Supports slope angle tilting, spring compression animation, and bounce displacement
 */
export default function PogoRider({
  slope = 0,
  isBouncing = false,
  direction = 1, // 1 for right, -1 for left
  scale = 1,
  showSpeechBubble = true,
  speechText = '',
}) {
  // Compute slope tilt angle (clamped to realistic tilt between -45 and 45 degrees)
  const angleRad = Math.atan(slope);
  const angleDeg = Math.max(Math.min((angleRad * 180) / Math.PI, 45), -45);

  return (
    <g
      className="pogo-rider-group"
      transform={`rotate(${angleDeg}) scale(${scale})`}
      style={{ transformOrigin: '0px 0px' }}
    >
      {/* Speech / Thought Bubble */}
      {showSpeechBubble && speechText && (
        <g transform="translate(0, -68)" className="pogo-speech-bubble">
          <rect
            x="-45"
            y="-22"
            width="90"
            height="24"
            rx="12"
            fill="#FFFFFF"
            stroke="#1B1C20"
            strokeWidth="1.5"
            filter="drop-shadow(0 2px 5px rgba(0,0,0,0.15))"
          />
          <polygon points="0,-2 -4,-8 4,-8" fill="#FFFFFF" />
          <polygon points="0,-1 -5,-9 5,-9" fill="none" stroke="#1B1C20" strokeWidth="1.2" />
          <text
            x="0"
            y="-7"
            textAnchor="middle"
            fontFamily="'Gaegu', 'Caveat', cursive"
            fontSize="13"
            fontWeight="700"
            fill="#1B1C20"
          >
            {speechText}
          </text>
        </g>
      )}

      {/* Dust Puffs when bouncing */}
      {isBouncing && (
        <g className="pogo-dust-puffs" transform="translate(0, 0)">
          <circle cx="-8" cy="-2" r="3" fill="#D7CCC8" opacity="0.8" className="dust-particle-1" />
          <circle cx="8" cy="-2" r="3" fill="#D7CCC8" opacity="0.8" className="dust-particle-2" />
          <circle cx="-14" cy="-4" r="2" fill="#BCAAA4" opacity="0.6" className="dust-particle-3" />
          <circle cx="14" cy="-4" r="2" fill="#BCAAA4" opacity="0.6" className="dust-particle-4" />
        </g>
      )}

      {/* Pogo Stick Body & Character */}
      {/* Pogo Base Peg (Touching ground at 0,0) */}
      <rect x="-2.5" y="-6" width="5" height="6" rx="2" fill="#37474F" />

      {/* Pogo Spring Coil */}
      <g className={`pogo-spring ${isBouncing ? 'compressing' : ''}`}>
        <path
          d="M -3 -6 L 3 -9 L -3 -12 L 3 -15 L -3 -18 L 3 -21 L 0 -24"
          fill="none"
          stroke="#EE7258"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Pogo Shaft & Footpegs */}
      <g transform={isBouncing ? 'translate(0, 3)' : 'translate(0, 0)'} className="pogo-upper-body">
        {/* Main Metal Rod */}
        <line x1="0" y1="-22" x2="0" y2="-44" stroke="#78909C" strokeWidth="3" strokeLinecap="round" />

        {/* Footpegs */}
        <line x1="-10" y1="-24" x2="10" y2="-24" stroke="#455A64" strokeWidth="3" strokeLinecap="round" />

        {/* Character's Feet & Shoes */}
        <ellipse cx="-8" cy="-25" rx="4" ry="2.5" fill="#D84315" />
        <ellipse cx="8" cy="-25" rx="4" ry="2.5" fill="#D84315" />

        {/* Character's Legs (Jeans) */}
        <path d="M -8 -25 L -5 -33 L 0 -36 L 5 -33 L 8 -25" fill="none" stroke="#1E88E5" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Character Torso & Shirt */}
        <rect x="-7" y="-48" width="14" height="15" rx="5" fill="#F7D25A" stroke="#E0A800" strokeWidth="1" />

        {/* Handlebars */}
        <line x1="-12" y1="-42" x2="12" y2="-42" stroke="#263238" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="-12" cy="-42" r="2.5" fill="#EE7258" />
        <circle cx="12" cy="-42" r="2.5" fill="#EE7258" />

        {/* Arms gripping handlebars */}
        <path d="M -6 -46 L -10 -42" stroke="#F7D25A" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M 6 -46 L 10 -42" stroke="#F7D25A" strokeWidth="3.5" strokeLinecap="round" />

        {/* Neck */}
        <rect x="-2" y="-51" width="4" height="4" fill="#FFCC80" />

        {/* Head / Face */}
        <circle cx="0" cy="-55" r="7" fill="#FFCC80" />

        {/* Eyes (Looking in direction of motion) */}
        <circle cx={direction >= 0 ? '2' : '-2'} cy="-56" r="1.2" fill="#212121" />
        <circle cx={direction >= 0 ? '5' : '-5'} cy="-56" r="1.2" fill="#212121" />

        {/* Smile */}
        <path
          d={direction >= 0 ? 'M 1 -53 Q 3 -51 5 -53' : 'M -5 -53 Q -3 -51 -1 -53'}
          fill="none"
          stroke="#D84315"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Cool Helmet / Cap */}
        <path d="M -7 -57 Q 0 -64 7 -57 Z" fill="#EE7258" />
        <path
          d={direction >= 0 ? 'M 3 -57 L 9 -56' : 'M -3 -57 L -9 -56'}
          stroke="#EE7258"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
    </g>
  );
}
