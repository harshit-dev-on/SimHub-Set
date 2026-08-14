import React from 'react';

/**
 * 3D Animated Door Card with custom SVG artwork for Sports Car & Goat
 */
export default function DoorCard({
  door,
  onClick,
  isSelectable = false,
  isSwitchTarget = false,
  showResult = false,
  phase = 'PICK_INITIAL',
}) {
  const { doorNumber, hasCar, isOpen, isSelected, isHostOpened } = door;

  return (
    <div
      className={`door-card-container ${isOpen ? 'is-open' : 'is-closed'} ${
        isSelected ? 'is-selected' : ''
      } ${isHostOpened ? 'is-host-opened' : ''} ${
        isSwitchTarget ? 'is-switch-target' : ''
      } ${isSelectable ? 'is-selectable' : 'is-disabled'}`}
      onClick={isSelectable ? onClick : undefined}
      role="button"
      tabIndex={isSelectable ? 0 : -1}
      aria-label={`Door ${doorNumber}`}
    >
      {/* 3D Perspective Box */}
      <div className="door-perspective-frame">
        {/* Behind Door Chamber (Prize or Goat Room) */}
        <div className="door-chamber-interior">
          {hasCar ? (
            <div className="prize-room car-room">
              <div className="sparkle-stars">✨ 🌟 ✨</div>
              {/* Luxury Sports Car SVG */}
              <svg viewBox="0 0 120 70" className="prize-svg car-svg">
                <defs>
                  <linearGradient id="carBodyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="60%" stopColor="#DC2626" />
                    <stop offset="100%" stopColor="#991B1B" />
                  </linearGradient>
                  <linearGradient id="windshieldGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.7" />
                  </linearGradient>
                  <linearGradient id="wheelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#374151" />
                    <stop offset="100%" stopColor="#111827" />
                  </linearGradient>
                </defs>

                {/* Ground Shadow */}
                <ellipse cx="60" cy="62" rx="46" ry="6" fill="rgba(0,0,0,0.25)" />

                {/* Car Silhouette Roof & Body */}
                <path
                  d="M 16 44 L 28 32 C 34 22 48 20 68 20 C 80 20 90 26 98 42 L 108 44 C 111 44 113 47 113 50 L 111 54 C 110 57 106 58 102 58 L 16 58 C 12 58 8 55 8 51 L 8 47 C 8 44 12 44 16 44 Z"
                  fill="url(#carBodyGrad)"
                  stroke="#7F1D1D"
                  strokeWidth="1.5"
                />

                {/* Windshield & Windows */}
                <path
                  d="M 32 32 L 44 23 C 48 22 64 22 72 22 L 80 32 Z"
                  fill="url(#windshieldGrad)"
                  stroke="#1E3A8A"
                  strokeWidth="1"
                />
                <polygon points="46,24 62,24 62,32 46,32" fill="#DBEAFE" opacity="0.6" />

                {/* Headlights & Tail Lights */}
                <ellipse cx="110" cy="48" rx="3" ry="2" fill="#FEF08A" filter="drop-shadow(0 0 4px #FDE047)" />
                <rect x="7" y="47" width="3" height="4" rx="1" fill="#F87171" />

                {/* Racing Stripe */}
                <path d="M 28 44 L 98 44 L 96 47 L 26 47 Z" fill="#FEF08A" opacity="0.8" />

                {/* Front Wheel */}
                <circle cx="92" cy="56" r="10" fill="url(#wheelGrad)" stroke="#E5E7EB" strokeWidth="1.5" />
                <circle cx="92" cy="56" r="4" fill="#9CA3AF" />

                {/* Rear Wheel */}
                <circle cx="28" cy="56" r="10" fill="url(#wheelGrad)" stroke="#E5E7EB" strokeWidth="1.5" />
                <circle cx="28" cy="56" r="4" fill="#9CA3AF" />
              </svg>

              <div className="prize-label-pill car-pill">
                <span>🏎️ Grand Prize!</span>
              </div>
            </div>
          ) : (
            <div className="prize-room goat-room">
              {/* Cute Vector Goat SVG */}
              <svg viewBox="0 0 100 80" className="prize-svg goat-svg">
                <defs>
                  <linearGradient id="goatFurGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#E5E7EB" />
                  </linearGradient>
                  <linearGradient id="hornGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#78350F" />
                    <stop offset="100%" stopColor="#B45309" />
                  </linearGradient>
                </defs>

                {/* Ground Shadow */}
                <ellipse cx="50" cy="74" rx="36" ry="5" fill="rgba(0,0,0,0.18)" />

                {/* Goat Body */}
                <rect x="25" y="32" width="46" height="28" rx="14" fill="url(#goatFurGrad)" stroke="#9CA3AF" strokeWidth="1.2" />

                {/* Legs */}
                <rect x="28" y="55" width="4" height="18" rx="2" fill="#D1D5DB" />
                <rect x="36" y="55" width="4" height="18" rx="2" fill="#9CA3AF" />
                <rect x="56" y="55" width="4" height="18" rx="2" fill="#D1D5DB" />
                <rect x="64" y="55" width="4" height="18" rx="2" fill="#9CA3AF" />

                {/* Tail */}
                <path d="M 24 38 Q 18 34 20 44" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" fill="none" />

                {/* Neck & Head */}
                <path d="M 64 42 L 72 26 C 76 22 84 22 88 26 C 92 30 90 38 84 44 L 70 52 Z" fill="url(#goatFurGrad)" stroke="#9CA3AF" strokeWidth="1.2" />

                {/* Horns */}
                <path d="M 76 22 Q 72 8 64 12" stroke="url(#hornGrad)" strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M 80 20 Q 82 6 74 10" stroke="url(#hornGrad)" strokeWidth="3" strokeLinecap="round" fill="none" />

                {/* Ears */}
                <ellipse cx="70" cy="25" rx="5" ry="2.5" fill="#FBCFE8" stroke="#9CA3AF" strokeWidth="0.8" transform="rotate(-20 70 25)" />
                <ellipse cx="88" cy="24" rx="5" ry="2.5" fill="#FBCFE8" stroke="#9CA3AF" strokeWidth="0.8" transform="rotate(20 88 24)" />

                {/* Eyes & Cute Smile */}
                <circle cx="82" cy="28" r="2.5" fill="#1F2937" />
                <circle cx="83" cy="27" r="0.8" fill="#FFFFFF" />
                <circle cx="88" cy="34" r="1.5" fill="#F472B6" />

                {/* Chewing Grass */}
                <path d="M 88 38 Q 96 36 100 42" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" fill="none" />
                <path d="M 88 38 Q 94 44 98 46" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              </svg>

              <div className="prize-label-pill goat-pill">
                <span>🐐 Baaah! (Goat)</span>
              </div>
            </div>
          )}
        </div>

        {/* The 3D Swinging Door Leaf */}
        <div className="door-leaf-panel">
          {/* Wood Panel Decor */}
          <div className="door-wood-surface">
            {/* Top Inset Panel */}
            <div className="wood-inset-box inset-top">
              {/* Brass Door Number Badge */}
              <div className="brass-number-plate">
                <span className="door-num-text">{doorNumber}</span>
              </div>
            </div>

            {/* Bottom Inset Panel */}
            <div className="wood-inset-box inset-bottom" />

            {/* Golden Brass Knob */}
            <div className="brass-door-knob">
              <div className="knob-highlight" />
            </div>

            {/* Door Frame Keyhole */}
            <div className="brass-keyhole" />
          </div>
        </div>
      </div>

      {/* Dynamic Status Badges Below Door */}
      <div className="door-footer-badge-bar">
        {isSelected && (
          <span className="door-status-badge badge-selected">
            {phase === 'FINAL_DECISION' ? '🎯 Your Pick' : '⭐ Chosen'}
          </span>
        )}

        {isHostOpened && (
          <span className="door-status-badge badge-host-opened">
            🐐 Host Revealed
          </span>
        )}

        {isSwitchTarget && !isSelected && !isOpen && (
          <span className="door-status-badge badge-switch-target">
            🔀 Switch Target
          </span>
        )}

        {showResult && hasCar && (
          <span className="door-status-badge badge-winner">
            🏆 Winner!
          </span>
        )}
      </div>
    </div>
  );
}
