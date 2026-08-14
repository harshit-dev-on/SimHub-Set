import React from 'react';

/**
 * Pogo Stick Rider SVG character
 * Supports slope angle tilting, spring compression/stretch animation, airborne flight physics and bounce displacement
 */
export default function PogoRider({
  angleDeg = 0,
  slope = 0,
  isBouncing = false,
  isAirborne = false,
  jumpProgress = 0, // 0 to 1
  direction = 1, // 1 for right, -1 for left
  scale = 1,
  showSpeechBubble = true,
  speechText = '',
}) {
  // Use passed screen normal angle if available, otherwise compute from slope
  let finalAngle = typeof angleDeg === 'number' && !isNaN(angleDeg) ? angleDeg : 0;
  if (!angleDeg && slope) {
    const safeSlope = (typeof slope === 'number' && !isNaN(slope)) ? slope : 0;
    finalAngle = (Math.atan(safeSlope) * 180) / Math.PI;
  }
  
  // Dynamic forward tilt while airborne in flight direction
  if (isAirborne) {
    const flightTilt = direction * Math.sin(jumpProgress * Math.PI) * 12;
    finalAngle += flightTilt;
  }
  
  const clampedAngle = Math.max(Math.min(finalAngle, 75), -75);

  // In mid-air, character body stretches; on ground impact, squishes
  let bodyStretchY = 1;
  let bodyOffsetY = 0;
  if (isAirborne) {
    const arcHeightFactor = Math.sin(jumpProgress * Math.PI);
    bodyStretchY = 1 + arcHeightFactor * 0.15;
    bodyOffsetY = -arcHeightFactor * 3;
  } else if (isBouncing) {
    bodyStretchY = 0.88;
    bodyOffsetY = 3;
  }

  return (
    <g
      className={`pogo-rider-group ${isAirborne ? 'is-airborne' : ''}`}
      transform={`rotate(${clampedAngle}) scale(${scale})`}
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

      {/* Dust Puffs when jumping or landing */}
      {(isBouncing || (isAirborne && (jumpProgress < 0.15 || jumpProgress > 0.85))) && (
        <g className="pogo-dust-puffs" transform="translate(0, 0)">
          <circle cx="-8" cy="-2" r="3.5" fill="#D7CCC8" opacity="0.8" className="dust-particle-1" />
          <circle cx="8" cy="-2" r="3.5" fill="#D7CCC8" opacity="0.8" className="dust-particle-2" />
          <circle cx="-14" cy="-4" r="2.5" fill="#BCAAA4" opacity="0.6" className="dust-particle-3" />
          <circle cx="14" cy="-4" r="2.5" fill="#BCAAA4" opacity="0.6" className="dust-particle-4" />
        </g>
      )}

      {/* Pogo Stick Body & Character */}
      {/* Pogo Base Peg (Touching ground at 0,0) */}
      <rect x="-2.5" y="-6" width="5" height="6" rx="2" fill="#37474F" />

      {/* Pogo Spring Coil */}
      <g
        className={`pogo-spring ${isBouncing ? 'compressing' : ''}`}
        transform={`scale(1, ${isAirborne ? 1.15 : (isBouncing ? 0.85 : 1)})`}
        style={{ transformOrigin: '0px -6px' }}
      >
        <path
          d="M -3 -6 L 3 -9 L -3 -12 L 3 -15 L -3 -18 L 3 -21 L 0 -24"
          fill="none"
          stroke="#EE7258"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Pogo Shaft & Footpegs with Stretch/Squash */}
      <g
        transform={`translate(0, ${bodyOffsetY}) scale(1, ${bodyStretchY})`}
        className="pogo-upper-body"
        style={{ transformOrigin: '0px -24px' }}
      >
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
