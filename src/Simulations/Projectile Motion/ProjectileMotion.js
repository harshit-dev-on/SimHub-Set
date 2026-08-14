import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import './ProjectileMotion.css';

// Celestial Gravities (m/s^2)
const CELESTIAL_GRAVITIES = [
  { id: 'earth', name: '🌍 Earth (9.8 m/s²)', g: 9.8 },
  { id: 'moon', name: '🌙 Moon (1.62 m/s²)', g: 1.62 },
  { id: 'mars', name: '🔴 Mars (3.71 m/s²)', g: 3.71 },
  { id: 'jupiter', name: '🪐 Jupiter (24.79 m/s²)', g: 24.79 },
  { id: 'custom', name: '⚙️ Custom Gravity', g: 9.8 },
];

// Quick Angle Presets
const ANGLE_PRESETS = [
  { label: '30° Shallow', angle: 30 },
  { label: '45° Max Range', angle: 45 },
  { label: '60° High Arc', angle: 60 },
  { label: '75° Lob', angle: 75 },
];

export default function ProjectileMotion() {
  // Launch Parameters
  const [initialSpeed, setInitialSpeed] = useState(25); // m/s
  const [angleDeg, setAngleDeg] = useState(45); // degrees
  const [initialHeight, setInitialHeight] = useState(5); // meters
  const [gravityPlanet, setGravityPlanet] = useState('earth');
  const [customGravity, setCustomGravity] = useState(9.8);
  const [mass] = useState(1.0); // kg
  const [airDragEnabled, setAirDragEnabled] = useState(false);
  const [dragCoeff] = useState(0.04);

  // Playback & Animation State
  const [isRunning, setIsRunning] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(250); // ms step reference
  const [simTime, setSimTime] = useState(0); // seconds
  const [flightState, setFlightState] = useState({
    x: 0,
    y: 5,
    vx: 25 * Math.cos((45 * Math.PI) / 180),
    vy: 25 * Math.sin((45 * Math.PI) / 180),
    isLanded: false,
    hasHitTarget: false,
  });

  // Trails & History
  const [currentTrail, setCurrentTrail] = useState([]);
  const [ghostTrails, setGhostTrails] = useState([]);
  const [apexData, setApexData] = useState(null);
  const [landingData, setLandingData] = useState(null);

  // Target Challenge Mode
  const [showTarget, setShowTarget] = useState(true);
  const [targetPos, setTargetPos] = useState({ x: 55, y: 0 }); // meters (x: distance, y: altitude)
  const [targetRadius] = useState(2.5); // meters
  const [targetScore, setTargetScore] = useState({ hits: 0, attempts: 0 });
  const [isHitSplash, setIsHitSplash] = useState(false);
  const [isDraggingTarget, setIsDraggingTarget] = useState(false);

  // Overlays & Analysis View
  const [showVectors, setShowVectors] = useState(true);
  const [showTrajectory, setShowTrajectory] = useState(true);
  const [showApexMarker, setShowApexMarker] = useState(true);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('all');

  // Refs
  const svgRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastTimestampRef = useRef(null);

  // Current Gravity Value
  const g = useMemo(() => {
    if (gravityPlanet === 'custom') return customGravity;
    const found = CELESTIAL_GRAVITIES.find((p) => p.id === gravityPlanet);
    return found ? found.g : 9.8;
  }, [gravityPlanet, customGravity]);

  // Radians
  const angleRad = useMemo(() => (angleDeg * Math.PI) / 180, [angleDeg]);

  // Theoretical Calculations (Vacuum / Analytical)
  const theoretical = useMemo(() => {
    const v0x = initialSpeed * Math.cos(angleRad);
    const v0y = initialSpeed * Math.sin(angleRad);
    const tApex = v0y / g;
    const hMax = initialHeight + (v0y * v0y) / (2 * g);
    const discriminant = v0y * v0y + 2 * g * initialHeight;
    const tFlight = (v0y + Math.sqrt(Math.max(0, discriminant))) / g;
    const range = v0x * tFlight;

    return {
      v0x,
      v0y,
      tApex: tApex > 0 ? tApex : 0,
      hMax,
      tFlight,
      range,
    };
  }, [initialSpeed, angleRad, initialHeight, g]);

  // Reset Simulation to Initial Launcher State
  const resetSimulation = useCallback(() => {
    setIsRunning(false);
    setSimTime(0);
    const v0x = initialSpeed * Math.cos(angleRad);
    const v0y = initialSpeed * Math.sin(angleRad);
    setFlightState({
      x: 0,
      y: initialHeight,
      vx: v0x,
      vy: v0y,
      isLanded: false,
      hasHitTarget: false,
    });
    setCurrentTrail([{ x: 0, y: initialHeight }]);
    setApexData(null);
    setLandingData(null);
    setIsHitSplash(false);
    lastTimestampRef.current = null;
  }, [initialSpeed, angleRad, initialHeight]);

  // Auto-reset when key parameters change and not running
  useEffect(() => {
    if (!isRunning && simTime === 0) {
      resetSimulation();
    }
  }, [initialSpeed, angleDeg, initialHeight, g, resetSimulation, isRunning, simTime]);

  // Fire / Launch Action
  const handleFire = () => {
    if (flightState.isLanded || simTime > 0) {
      // Save current trail to ghost trails for comparison
      if (currentTrail.length > 1) {
        setGhostTrails((prev) => [
          ...prev.slice(-4), // keep last 4 ghosts
          {
            id: Date.now(),
            trail: [...currentTrail],
            angle: angleDeg,
            speed: initialSpeed,
            color: `hsl(${(ghostTrails.length * 75) % 360}, 70%, 50%)`,
          },
        ]);
      }
      resetSimulation();
      if (showTarget) {
        setTargetScore((prev) => ({ ...prev, attempts: prev.attempts + 1 }));
      }
      setIsRunning(true);
    } else {
      if (showTarget) {
        setTargetScore((prev) => ({ ...prev, attempts: prev.attempts + 1 }));
      }
      setIsRunning(true);
    }
  };

  // Step Simulation Forward (Numerical Euler Step)
  const stepPhysics = useCallback(
    (dt) => {
      setFlightState((prev) => {
        if (prev.isLanded) return prev;

        const currentV = Math.sqrt(prev.vx * prev.vx + prev.vy * prev.vy);
        let ax = 0;
        let ay = -g;

        if (airDragEnabled && currentV > 0.001) {
          const dragForce = 0.5 * dragCoeff * currentV * currentV;
          const dragAx = -(dragForce / mass) * (prev.vx / currentV);
          const dragAy = -(dragForce / mass) * (prev.vy / currentV);
          ax += dragAx;
          ay += dragAy;
        }

        const nextVx = prev.vx + ax * dt;
        const nextVy = prev.vy + ay * dt;
        const nextX = prev.x + prev.vx * dt;
        const nextY = prev.y + prev.vy * dt;

        // Check Apex (when vy crosses 0 from positive to negative)
        if (prev.vy >= 0 && nextVy <= 0) {
          setApexData({ x: nextX, y: nextY, time: simTime + dt });
        }

        // Check Ground Collision (y <= 0)
        if (nextY <= 0) {
          setIsRunning(false);
          const landingX = nextX;
          setLandingData({ x: landingX, time: simTime + dt });

          // Check Target Hit (if target is enabled)
          let hit = false;
          if (showTarget) {
            const distToTarget = Math.sqrt(
              Math.pow(landingX - targetPos.x, 2) + Math.pow(0 - targetPos.y, 2)
            );
            hit = distToTarget <= targetRadius;
            if (hit) {
              setIsHitSplash(true);
              setTargetScore((s) => ({ ...s, hits: s.hits + 1 }));
            }
          }

          return {
            x: landingX,
            y: 0,
            vx: 0,
            vy: 0,
            isLanded: true,
            hasHitTarget: hit,
          };
        }

        // Target Mid-Air Collision (if target is enabled)
        let hitMidAir = prev.hasHitTarget;
        if (showTarget && !hitMidAir) {
          const distToTargetCenter = Math.sqrt(
            Math.pow(nextX - targetPos.x, 2) + Math.pow(nextY - targetPos.y, 2)
          );
          if (distToTargetCenter <= targetRadius) {
            hitMidAir = true;
            setIsHitSplash(true);
            setTargetScore((s) => ({ ...s, hits: s.hits + 1 }));
          }
        }

        return {
          x: nextX,
          y: nextY,
          vx: nextVx,
          vy: nextVy,
          isLanded: false,
          hasHitTarget: hitMidAir,
        };
      });

      setSimTime((t) => t + dt);
      setCurrentTrail((trail) => {
        const last = trail[trail.length - 1];
        if (!last || Math.hypot(flightState.x - last.x, flightState.y - last.y) > 0.4) {
          return [...trail, { x: flightState.x, y: flightState.y }];
        }
        return trail;
      });
    },
    [g, airDragEnabled, dragCoeff, mass, simTime, flightState.x, flightState.y, targetPos.x, targetPos.y, targetRadius, showTarget]
  );

  // Animation Loop
  useEffect(() => {
    if (!isRunning) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastTimestampRef.current = null;
      return;
    }

    const speedMultiplier = 250 / playbackSpeed; // 1x is playbackSpeed = 250ms reference
    const loop = (timestamp) => {
      if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;
      const elapsed = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      // Fixed physics sub-stepping for smooth, accurate trajectory
      const dt = Math.min(elapsed, 0.05) * speedMultiplier;
      stepPhysics(dt);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, playbackSpeed, stepPhysics]);

  // Current Instantaneous Energies (Joules)
  const currentSpeed = Math.sqrt(flightState.vx * flightState.vx + flightState.vy * flightState.vy);
  const kineticEnergy = 0.5 * mass * currentSpeed * currentSpeed;
  const potentialEnergy = mass * g * Math.max(0, flightState.y);
  const totalMechanicalEnergy = kineticEnergy + potentialEnergy;
  const keRatio = totalMechanicalEnergy > 0 ? (kineticEnergy / totalMechanicalEnergy) * 100 : 50;

  // Viewport / Coordinate Mapping
  // Canvas domain: X: [ -5, max(80, targetPos.x + 20, theoretical.range + 15) ], Y: [ -2, max(35, theoretical.hMax + 10) ]
  const viewBounds = useMemo(() => {
    const maxX = Math.max(75, showTarget ? targetPos.x + 18 : 0, (theoretical.range || 40) + 15);
    const maxY = Math.max(30, showTarget ? targetPos.y + 12 : 0, (theoretical.hMax || 15) + 12);
    return { minX: -6, maxX, minY: -3, maxY };
  }, [showTarget, targetPos.x, targetPos.y, theoretical.range, theoretical.hMax]);

  const svgWidth = 800;
  const svgHeight = 460;

  const toSvgX = useCallback(
    (x) => ((x - viewBounds.minX) / (viewBounds.maxX - viewBounds.minX)) * svgWidth,
    [viewBounds]
  );
  const toSvgY = useCallback(
    (y) => svgHeight - ((y - viewBounds.minY) / (viewBounds.maxY - viewBounds.minY)) * svgHeight,
    [viewBounds]
  );

  const fromSvgX = useCallback(
    (svgX) => viewBounds.minX + (svgX / svgWidth) * (viewBounds.maxX - viewBounds.minX),
    [viewBounds]
  );
  const fromSvgY = useCallback(
    (svgY) => viewBounds.minY + ((svgHeight - svgY) / svgHeight) * (viewBounds.maxY - viewBounds.minY),
    [viewBounds]
  );

  // Target Drag Handlers
  const handlePointerDownTarget = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingTarget(true);
  };

  const handlePointerMove = useCallback(
    (e) => {
      if (!isDraggingTarget || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const svgX = ((e.clientX - rect.left) / rect.width) * svgWidth;
      const svgY = ((e.clientY - rect.top) / rect.height) * svgHeight;
      const rawX = fromSvgX(svgX);
      const rawY = fromSvgY(svgY);
      const clampedX = Math.max(5, Math.min(viewBounds.maxX - 5, rawX));
      const clampedY = Math.max(0, Math.min(viewBounds.maxY - 4, rawY));
      setTargetPos({
        x: Math.round(clampedX * 10) / 10,
        y: Math.round(clampedY * 10) / 10,
      });
    },
    [isDraggingTarget, fromSvgX, fromSvgY, viewBounds.maxX, viewBounds.maxY]
  );

  const handlePointerUp = useCallback(() => {
    setIsDraggingTarget(false);
  }, []);

  useEffect(() => {
    if (isDraggingTarget) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
      };
    }
  }, [isDraggingTarget, handlePointerMove, handlePointerUp]);

  // SVG Coordinates
  const cannonBaseX = toSvgX(0);
  const cannonBaseY = toSvgY(initialHeight);
  const groundY = toSvgY(0);

  const projSvgX = toSvgX(flightState.x);
  const projSvgY = toSvgY(flightState.y);

  // Velocity Vector Endpoints (Scaled)
  const vectorScale = 1.2;
  const vEndX = projSvgX + flightState.vx * vectorScale;
  const vEndY = projSvgY - flightState.vy * vectorScale;
  const vxEndX = projSvgX + flightState.vx * vectorScale;
  const vyEndY = projSvgY - flightState.vy * vectorScale;

  // Generate Predicted Path D-string
  const predictedPathD = useMemo(() => {
    const points = [];
    const stepCount = 50;
    const dt = theoretical.tFlight / stepCount;
    for (let i = 0; i <= stepCount; i++) {
      const t = i * dt;
      const x = theoretical.v0x * t;
      const y = initialHeight + theoretical.v0y * t - 0.5 * g * t * t;
      if (y >= 0) {
        points.push(`${toSvgX(x)},${toSvgY(y)}`);
      }
    }
    return points.length > 0 ? `M ${points.join(' L ')}` : '';
  }, [theoretical, initialHeight, g, toSvgX, toSvgY]);

  // Current Active Trail D-string
  const activeTrailD = useMemo(() => {
    if (currentTrail.length === 0) return '';
    return `M ${currentTrail.map((p) => `${toSvgX(p.x)},${toSvgY(p.y)}`).join(' L ')}`;
  }, [currentTrail, toSvgX, toSvgY]);

  return (
    <div className="sim-split-studio-layout">
      {/* Left Column: UN-SCROLLABLE WORKBENCH */}
      <div className="unscrollable-workbench-pane">
        {/* Top Simulation Stage Card */}
        <div className="workbench-top-simulation">
          <div className="projectile-stage-card">
            {/* Header / Badges Row */}
            <div className="projectile-stage-header">
              <div className="stage-badge-group">
                <span className="stage-mode-pill">🎯 Ballistics Lab</span>
                <div className="stage-status-live">
                  <span className={`status-dot ${isRunning ? 'in-flight' : ''}`} />
                  <span>{isRunning ? 'Flight Active' : flightState.isLanded ? 'Impact Settled' : 'Ready to Fire'}</span>
                </div>
              </div>

              {/* View Overlays */}
              <div className="stage-overlay-toggles">
                <button
                  type="button"
                  className={`toggle-chip ${showTarget ? 'active' : ''}`}
                  onClick={() => setShowTarget(!showTarget)}
                  title="Toggle target bullseye on/off"
                >
                  🎯 Target: {showTarget ? 'ON' : 'OFF'}
                </button>
                <button
                  type="button"
                  className={`toggle-chip ${showVectors ? 'active' : ''}`}
                  onClick={() => setShowVectors(!showVectors)}
                >
                  ↗ Vectors
                </button>
                <button
                  type="button"
                  className={`toggle-chip ${showTrajectory ? 'active' : ''}`}
                  onClick={() => setShowTrajectory(!showTrajectory)}
                >
                  〰 Path
                </button>
                <button
                  type="button"
                  className={`toggle-chip ${showApexMarker ? 'active' : ''}`}
                  onClick={() => setShowApexMarker(!showApexMarker)}
                >
                  ▲ Apex
                </button>
                {ghostTrails.length > 0 && (
                  <button
                    type="button"
                    className="toggle-chip"
                    onClick={() => setGhostTrails([])}
                    title="Clear ghost trajectories"
                  >
                    🧹 Clear Ghosts ({ghostTrails.length})
                  </button>
                )}
              </div>
            </div>

            {/* Ballistics SVG Viewport */}
            <div className="projectile-svg-viewport">
              <svg
                ref={svgRef}
                className="projectile-svg"
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <linearGradient id="cannonMetalGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#475569" />
                    <stop offset="50%" stopColor="#1E293B" />
                    <stop offset="100%" stopColor="#0F172A" />
                  </linearGradient>
                  <radialGradient id="targetBullseyeGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="40%" stopColor="#DC2626" />
                    <stop offset="100%" stopColor="#991B1B" />
                  </radialGradient>
                </defs>

                {/* Sky Grid Marks */}
                {[10, 20, 30, 40, 50, 60, 70, 80].map((gx) => (
                  <g key={`grid-x-${gx}`}>
                    <line x1={toSvgX(gx)} y1={0} x2={toSvgX(gx)} y2={groundY} className="grid-line" />
                    <text x={toSvgX(gx)} y={groundY + 14} fontSize="9" fill="#94A3B8" textAnchor="middle" fontFamily="monospace">
                      {gx}m
                    </text>
                  </g>
                ))}

                {[10, 20, 30].map((gy) => (
                  <g key={`grid-y-${gy}`}>
                    <line x1={0} y1={toSvgY(gy)} x2={svgWidth} y2={toSvgY(gy)} className="grid-line" />
                    <text x={12} y={toSvgY(gy) - 3} fontSize="9" fill="#94A3B8" fontFamily="monospace">
                      {gy}m
                    </text>
                  </g>
                ))}

                {/* Ground Platform & Dirt Fill */}
                <rect x={0} y={groundY} width={svgWidth} height={svgHeight - groundY} className="ground-dirt-fill" />
                <line x1={0} y1={groundY} x2={svgWidth} y2={groundY} className="grass-top-rim" />

                {/* Initial Elevation Cliff/Pillar */}
                {initialHeight > 0 && (
                  <g>
                    <rect
                      x={toSvgX(-3)}
                      y={toSvgY(initialHeight)}
                      width={toSvgX(2) - toSvgX(-3)}
                      height={groundY - toSvgY(initialHeight)}
                      fill="#E2E8F0"
                      stroke="#94A3B8"
                      strokeWidth="1.5"
                      rx="4"
                    />
                    <line x1={toSvgX(-3)} y1={toSvgY(initialHeight)} x2={toSvgX(2)} y2={toSvgY(initialHeight)} stroke="#84CC16" strokeWidth="3" />
                    <text x={toSvgX(-0.5)} y={toSvgY(initialHeight / 2) + 4} fill="#64748B" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="monospace">
                      h₀ = {initialHeight}m
                    </text>
                  </g>
                )}

                {/* Ghost Trails from previous runs */}
                {ghostTrails.map((gt) => (
                  <path
                    key={gt.id}
                    d={`M ${gt.trail.map((p) => `${toSvgX(p.x)},${toSvgY(p.y)}`).join(' L ')}`}
                    className="trajectory-ghost-path"
                    stroke={gt.color}
                  />
                ))}

                {/* Theoretical Predicted Path */}
                {showTrajectory && predictedPathD && (
                  <path d={predictedPathD} className="trajectory-predicted-path" />
                )}

                {/* Active Flight Trajectory Path */}
                {showTrajectory && activeTrailD && (
                  <path d={activeTrailD} className="trajectory-active-path" />
                )}

                {/* Draggable Target Practice Bullseye */}
                {showTarget && (
                  <g
                    className={`target-draggable-group ${isDraggingTarget ? 'is-dragging' : ''}`}
                    transform={`translate(${toSvgX(targetPos.x)}, ${toSvgY(targetPos.y)})`}
                    onPointerDown={handlePointerDownTarget}
                  >
                    {/* Elevated stand/guide or ground post */}
                    {targetPos.y > 0 ? (
                      <>
                        <line x1="0" y1="0" x2="0" y2={groundY - toSvgY(targetPos.y)} className="target-elevation-guide" />
                        <line x1="0" y1="0" x2="0" y2="16" className="target-base-post" />
                        <circle cx="0" cy={groundY - toSvgY(targetPos.y)} r="3.5" fill="#DC2626" opacity="0.6" />
                      </>
                    ) : (
                      <line x1="0" y1="0" x2="0" y2={groundY - toSvgY(0)} className="target-base-post" />
                    )}

                    {/* Drag Active Halo */}
                    {isDraggingTarget && (
                      <circle
                        cx="0"
                        cy="0"
                        r={(toSvgX(targetRadius) - toSvgX(0)) + 6}
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    )}

                    {/* Outer Ring */}
                    <circle cx="0" cy="0" r={toSvgX(targetRadius) - toSvgX(0)} className="target-outer-ring" />
                    {/* Mid Ring */}
                    <circle cx="0" cy="0" r={(toSvgX(targetRadius) - toSvgX(0)) * 0.65} className="target-mid-ring" />
                    {/* Bullseye Center */}
                    <circle cx="0" cy="0" r={(toSvgX(targetRadius) - toSvgX(0)) * 0.3} className="target-bullseye-center" />

                    {/* Label Badge with live coordinates and drag prompt */}
                    <g transform="translate(0, -18)">
                      <rect
                        x="-48"
                        y="-12"
                        width="96"
                        height="16"
                        rx="4"
                        fill="rgba(255, 253, 245, 0.94)"
                        stroke="rgba(185, 28, 28, 0.25)"
                        strokeWidth="1"
                      />
                      <text
                        y="-1"
                        textAnchor="middle"
                        fontSize="9.5"
                        fontWeight="800"
                        fill="#B91C1C"
                        fontFamily="sans-serif"
                      >
                        🎯 {targetPos.x}m{targetPos.y > 0 ? `, ${targetPos.y}m` : ''} ⠿
                      </text>
                    </g>
                  </g>
                )}

                {/* Hit Splash Burst Effect */}
                {showTarget && isHitSplash && (
                  <circle
                    cx={toSvgX(targetPos.x)}
                    cy={toSvgY(targetPos.y)}
                    r="35"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="4"
                    className="target-hit-splash"
                  />
                )}

                {/* Apex Marker */}
                {showApexMarker && (apexData || (simTime === 0 && theoretical.hMax > 0)) && (
                  <g>
                    {(() => {
                      const apexX = apexData ? apexData.x : theoretical.v0x * theoretical.tApex;
                      const apexY = apexData ? apexData.y : theoretical.hMax;
                      const sX = toSvgX(apexX);
                      const sY = toSvgY(apexY);
                      return (
                        <g>
                          <line x1={sX} y1={sY} x2={sX} y2={groundY} className="apex-marker-line" />
                          <circle cx={sX} cy={sY} r="4" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                          <text x={sX} y={sY - 8} fill="#2563EB" textAnchor="middle" className="marker-label">
                            ▲ H_max = {apexY.toFixed(1)}m
                          </text>
                        </g>
                      );
                    })()}
                  </g>
                )}

                {/* Impact / Range Marker */}
                {(landingData || (simTime === 0 && theoretical.range > 0)) && (
                  <g>
                    {(() => {
                      const rX = landingData ? landingData.x : theoretical.range;
                      const sX = toSvgX(rX);
                      return (
                        <g>
                          <line x1={sX} y1={groundY - 8} x2={sX} y2={groundY + 8} className="range-marker-line" />
                          <text x={sX} y={groundY + 28} fill="#16A34A" textAnchor="middle" className="marker-label">
                            🏁 Range = {rX.toFixed(1)}m
                          </text>
                        </g>
                      );
                    })()}
                  </g>
                )}

                {/* Cannon Base & Aiming Barrel */}
                <g transform={`translate(${cannonBaseX}, ${cannonBaseY})`}>
                  {/* Protractor Angle Arc */}
                  <path
                    d={`M 35 0 A 35 35 0 0 0 ${35 * Math.cos(angleRad)} ${-35 * Math.sin(angleRad)}`}
                    className="angle-arc-guide"
                  />
                  <text x={42 * Math.cos(angleRad / 2)} y={-42 * Math.sin(angleRad / 2)} fill="#D97706" fontSize="10.5" fontWeight="800" fontFamily="sans-serif">
                    {angleDeg}°
                  </text>

                  {/* Rotating Barrel */}
                  <g transform={`rotate(${-angleDeg})`}>
                    <rect x="0" y="-8" width="36" height="16" rx="4" className="cannon-barrel" />
                    <circle cx="36" cy="0" r="8" fill="#1E293B" />
                  </g>

                  {/* Cannon Carriage / Wheels */}
                  <ellipse cx="-4" cy="4" rx="14" ry="10" className="cannon-platform" />
                  <circle cx="-4" cy="6" r="9" className="cannon-wheel" />
                  <circle cx="-4" cy="6" r="3" fill="#94A3B8" />
                </g>

                {/* Flying Projectile Ball */}
                {(isRunning || simTime > 0) && (
                  <g transform={`translate(${projSvgX}, ${projSvgY})`}>
                    <circle cx="0" cy="0" r="7" className="projectile-ball" />
                    {isRunning && <circle cx="0" cy="0" r="10" fill="none" stroke="#F59E0B" strokeWidth="2" className="projectile-glow" />}
                  </g>
                )}

                {/* Real-Time Velocity Vectors */}
                {showVectors && (isRunning || simTime > 0) && !flightState.isLanded && (
                  <g>
                    {/* Horizontal Component vx */}
                    <line x1={projSvgX} y1={projSvgY} x2={vxEndX} y2={projSvgY} className="vector-arrow-vx" />
                    <text x={vxEndX + 4} y={projSvgY + 3} fill="#2563EB" fontSize="9.5" fontWeight="700" fontFamily="monospace">
                      v_x ({flightState.vx.toFixed(1)})
                    </text>

                    {/* Vertical Component vy */}
                    <line x1={projSvgX} y1={projSvgY} x2={projSvgX} y2={vyEndY} className="vector-arrow-vy" />
                    <text x={projSvgX - 6} y={vyEndY - 4} fill="#16A34A" fontSize="9.5" fontWeight="700" textAnchor="end" fontFamily="monospace">
                      v_y ({flightState.vy.toFixed(1)})
                    </text>

                    {/* Resultant Velocity v */}
                    <line x1={projSvgX} y1={projSvgY} x2={vEndX} y2={vEndY} className="vector-arrow-v" />
                  </g>
                )}
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom Parameters & Controls Area (Single-Row Toolbar) */}
        <div className="workbench-bottom-controls">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Playback Controls */}
            <div className="playback-buttons-group" style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className={`action-btn-primary ${isRunning ? 'btn-pause' : 'btn-play'}`}
                onClick={handleFire}
                style={{ padding: '6px 14px', fontSize: '12px' }}
              >
                {isRunning ? '⏸ Pause' : flightState.isLanded ? '🚀 Re-Fire' : '🔥 Fire!'}
              </button>
              <button
                type="button"
                className="action-btn-secondary"
                onClick={() => stepPhysics(0.05)}
                disabled={isRunning || flightState.isLanded}
                style={{ padding: '6px 10px', fontSize: '12px' }}
              >
                ⏭ Step
              </button>
              <button
                type="button"
                className="action-btn-secondary"
                onClick={resetSimulation}
                style={{ padding: '6px 10px', fontSize: '12px' }}
              >
                ↺ Reset
              </button>
              <button
                type="button"
                className="action-btn-secondary"
                onClick={() => {
                  const speeds = [500, 250, 120, 40];
                  const currentIndex = speeds.indexOf(playbackSpeed);
                  setPlaybackSpeed(speeds[(currentIndex + 1) % speeds.length]);
                }}
                style={{ width: '75px', padding: '6px 4px', fontSize: '12px' }}
              >
                {playbackSpeed === 500 ? '🐢 0.5x' : playbackSpeed === 250 ? '🚶 1x' : playbackSpeed === 120 ? '🏃 2x' : playbackSpeed === 40 ? '🚀 5x' : 'Speed'}
              </button>
            </div>

            <div style={{ width: '1.5px', height: '24px', background: 'rgba(0,0,0,0.08)' }}></div>

            {/* Launch Angle θ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E293B', whiteSpace: 'nowrap' }}>
                θ: {angleDeg}°
              </span>
              <input
                type="range"
                min="0"
                max="90"
                step="1"
                value={angleDeg}
                onChange={(e) => setAngleDeg(parseInt(e.target.value, 10))}
                className="editorial-slider"
                style={{ width: '75px', margin: 0 }}
              />
              <select
                value={angleDeg}
                onChange={(e) => setAngleDeg(parseInt(e.target.value, 10))}
                style={{
                  padding: '5px 6px',
                  borderRadius: '6px',
                  border: '1px solid rgba(0,0,0,0.15)',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                {ANGLE_PRESETS.map((p) => (
                  <option key={p.angle} value={p.angle}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ width: '1.5px', height: '24px', background: 'rgba(0,0,0,0.08)' }}></div>

            {/* Launch Speed v0 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E293B', whiteSpace: 'nowrap' }}>
                v₀: {initialSpeed} m/s
              </span>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={initialSpeed}
                onChange={(e) => setInitialSpeed(parseInt(e.target.value, 10))}
                className="editorial-slider"
                style={{ width: '75px', margin: 0 }}
              />
            </div>

            <div style={{ width: '1.5px', height: '24px', background: 'rgba(0,0,0,0.08)' }}></div>

            {/* Initial Height h0 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E293B', whiteSpace: 'nowrap' }}>
                h₀: {initialHeight}m
              </span>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={initialHeight}
                onChange={(e) => setInitialHeight(parseInt(e.target.value, 10))}
                className="editorial-slider"
                style={{ width: '65px', margin: 0 }}
              />
            </div>

            <div style={{ width: '1.5px', height: '24px', background: 'rgba(0,0,0,0.08)' }}></div>

            {/* Gravity Planet Presets */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <select
                value={gravityPlanet}
                onChange={(e) => setGravityPlanet(e.target.value)}
                style={{
                  padding: '5px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(0,0,0,0.15)',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                {CELESTIAL_GRAVITIES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {gravityPlanet === 'custom' && (
                <input
                  type="number"
                  min="0.1"
                  max="50"
                  step="0.1"
                  value={customGravity}
                  onChange={(e) => setCustomGravity(parseFloat(e.target.value) || 9.8)}
                  style={{ width: '50px', padding: '4px', fontSize: '11.5px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              )}
            </div>

            <div style={{ width: '1.5px', height: '24px', background: 'rgba(0,0,0,0.08)' }}></div>

            {/* Air Drag Toggle */}
            <button
              type="button"
              className={`toggle-chip ${airDragEnabled ? 'active' : ''}`}
              onClick={() => setAirDragEnabled(!airDragEnabled)}
              title="Toggle atmospheric drag"
              style={{ fontSize: '11.5px', padding: '5px 10px' }}
            >
              💨 Drag: {airDragEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: SCROLLABLE ANALYSIS & CONCEPTS */}
      <div className="scrollable-analysis-pane">
        {/* Top Tab Selector Pills */}
        <div className="analysis-tabs-bar">
          <button
            type="button"
            className={`analysis-tab-pill ${activeAnalysisTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveAnalysisTab('all')}
          >
            📋 All Notes
          </button>
          <button
            type="button"
            className={`analysis-tab-pill ${activeAnalysisTab === 'telemetry' ? 'active' : ''}`}
            onClick={() => setActiveAnalysisTab('telemetry')}
          >
            🚀 Telemetry
          </button>
          <button
            type="button"
            className={`analysis-tab-pill ${activeAnalysisTab === 'calculus' ? 'active' : ''}`}
            onClick={() => setActiveAnalysisTab('calculus')}
          >
            📐 Calculus
          </button>
          <button
            type="button"
            className={`analysis-tab-pill ${activeAnalysisTab === 'energy' ? 'active' : ''}`}
            onClick={() => setActiveAnalysisTab('energy')}
          >
            ⚡ Energy
          </button>
          <button
            type="button"
            className={`analysis-tab-pill ${activeAnalysisTab === 'challenge' ? 'active' : ''}`}
            onClick={() => setActiveAnalysisTab('challenge')}
          >
            🎯 Challenge
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="analysis-scrollable-content" style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>
          {/* Live Flight Telemetry Tile */}
          {(activeAnalysisTab === 'all' || activeAnalysisTab === 'telemetry') && (
            <div className="bento-subcard surface-yellow">
              <div className="card-top-row">
                <h4 className="card-title-text">Live Flight Telemetry</h4>
                <span className="doodle-badge">t = {simTime.toFixed(2)}s</span>
              </div>
              <div className="telemetry-grid">
                <div className="telemetry-metric-tile">
                  <span className="metric-label-small">Position (x, y)</span>
                  <span className="metric-value-accent">
                    ({flightState.x.toFixed(1)}m, {flightState.y.toFixed(1)}m)
                  </span>
                </div>
                <div className="telemetry-metric-tile">
                  <span className="metric-label-small">Speed |v|</span>
                  <span className="metric-value-accent">{currentSpeed.toFixed(1)} m/s</span>
                </div>
                <div className="telemetry-metric-tile">
                  <span className="metric-label-small">Horizontal vx</span>
                  <span className="metric-value-accent" style={{ color: '#2563EB' }}>
                    {flightState.vx.toFixed(1)} m/s
                  </span>
                </div>
                <div className="telemetry-metric-tile">
                  <span className="metric-label-small">Vertical vy</span>
                  <span className="metric-value-accent" style={{ color: '#16A34A' }}>
                    {flightState.vy.toFixed(1)} m/s
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Mechanical Energy Gauge */}
          {(activeAnalysisTab === 'all' || activeAnalysisTab === 'energy') && (
            <div className="bento-subcard surface-blue">
              <div className="card-top-row">
                <h4 className="card-title-text">Conservation of Energy</h4>
                <span className="doodle-badge">{totalMechanicalEnergy.toFixed(0)} J Total</span>
              </div>
              <div className="energy-bar-track">
                <div className="energy-segment-ke" style={{ width: `${keRatio}%` }} title={`Kinetic: ${kineticEnergy.toFixed(1)}J`} />
                <div className="energy-segment-pe" style={{ width: `${100 - keRatio}%` }} title={`Potential: ${potentialEnergy.toFixed(1)}J`} />
              </div>
              <div className="energy-legend-row">
                <span style={{ color: '#EF4444' }}>🔴 Kinetic: {kineticEnergy.toFixed(0)}J</span>
                <span style={{ color: '#3B82F6' }}>🔵 Potential: {potentialEnergy.toFixed(0)}J</span>
              </div>
            </div>
          )}

          {/* Theoretical Kinematics Formulas & Calculus */}
          {(activeAnalysisTab === 'all' || activeAnalysisTab === 'calculus') && (
            <div className="bento-subcard surface-green">
              <div className="card-top-row">
                <h4 className="card-title-text">Kinematics Calculus</h4>
                <span className="doodle-badge">Analytical Equations</span>
              </div>
              <div className="equation-box">
                <div className="eq-row">
                  <span>x(t) = v₀·cos(θ)·t</span>
                  <span className="eq-val">vx = {theoretical.v0x.toFixed(1)} m/s</span>
                </div>
                <div className="eq-row">
                  <span>y(t) = h₀ + v₀·sin(θ)·t - ½gt²</span>
                  <span className="eq-val">vy₀ = {theoretical.v0y.toFixed(1)} m/s</span>
                </div>
                <div className="eq-row" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '4px' }}>
                  <span>Apex Time t_apex = vy₀/g</span>
                  <span className="eq-val">{theoretical.tApex.toFixed(2)} s</span>
                </div>
                <div className="eq-row">
                  <span>Max Height H_max = h₀ + vy₀²/2g</span>
                  <span className="eq-val" style={{ color: '#2563EB' }}>{theoretical.hMax.toFixed(2)} m</span>
                </div>
                <div className="eq-row">
                  <span>Total Flight Time t_flight</span>
                  <span className="eq-val">{theoretical.tFlight.toFixed(2)} s</span>
                </div>
                <div className="eq-row" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '4px' }}>
                  <span style={{ fontWeight: '800' }}>Impact Range R</span>
                  <span className="eq-val" style={{ color: '#16A34A', fontWeight: '800' }}>
                    {theoretical.range.toFixed(2)} m
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Target Practice & Bullseye Game Challenge */}
          {(activeAnalysisTab === 'all' || activeAnalysisTab === 'challenge') && (
            <div className="bento-subcard surface-purple">
              <div className="card-top-row">
                <h4 className="card-title-text">🎯 Target Challenge</h4>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className={`toggle-chip ${showTarget ? 'active' : ''}`}
                    onClick={() => setShowTarget(!showTarget)}
                    style={{ fontSize: '10.5px', padding: '2px 8px' }}
                    title="Enable or disable the target bullseye"
                  >
                    {showTarget ? 'Target ON' : 'Target OFF'}
                  </button>
                  {showTarget && (
                    <span className="doodle-badge">
                      {targetScore.hits}/{targetScore.attempts} Hits (
                      {targetScore.attempts > 0 ? Math.round((targetScore.hits / targetScore.attempts) * 100) : 0}%)
                    </span>
                  )}
                </div>
              </div>

              {showTarget ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11.5px', color: '#4B5563' }}>
                  <span style={{ fontSize: '11px', color: '#6B7280' }}>
                    💡 <strong>Tip:</strong> Click & drag the target directly on the canvas to place it anywhere!
                  </span>

                  {/* Distance (X) Slider */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ minWidth: '75px', fontWeight: '600' }}>Distance (X):</span>
                    <input
                      type="range"
                      min="10"
                      max="80"
                      step="0.5"
                      value={targetPos.x}
                      onChange={(e) => setTargetPos((prev) => ({ ...prev, x: parseFloat(e.target.value) }))}
                      className="editorial-slider"
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontWeight: '800', color: '#B91C1C', minWidth: '45px', textAlign: 'right' }}>
                      {targetPos.x}m
                    </span>
                  </div>

                  {/* Altitude / Height (Y) Slider */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ minWidth: '75px', fontWeight: '600' }}>Altitude (Y):</span>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      step="0.5"
                      value={targetPos.y}
                      onChange={(e) => setTargetPos((prev) => ({ ...prev, y: parseFloat(e.target.value) }))}
                      className="editorial-slider"
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontWeight: '800', color: '#B91C1C', minWidth: '45px', textAlign: 'right' }}>
                      {targetPos.y}m
                    </span>
                  </div>

                  {/* Quick Action Buttons */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                    <button
                      type="button"
                      onClick={() =>
                        setTargetPos({
                          x: Math.floor(Math.random() * 45) + 25,
                          y: Math.random() > 0.5 ? Math.floor(Math.random() * 15) : 0,
                        })
                      }
                      className="action-btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                    >
                      🎲 Randomize Position
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetPos((prev) => ({ ...prev, y: 0 }))}
                      className="action-btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                      disabled={targetPos.y === 0}
                    >
                      ⬇ Ground Level
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '8px', color: '#6B7280', fontSize: '11.5px' }}>
                  Target is currently disabled. Toggle it back ON above to practice hitting the bullseye!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
