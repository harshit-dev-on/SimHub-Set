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
  { label: '30° Shallow (Right)', angle: 30 },
  { label: '45° Max Range (Right)', angle: 45 },
  { label: '60° High Arc (Right)', angle: 60 },
  { label: '90° Vertical', angle: 90 },
  { label: '120° High Arc (Left)', angle: 120 },
  { label: '135° Max Range (Left)', angle: 135 },
  { label: '150° Shallow (Left)', angle: 150 },
];

export default function ProjectileMotion() {
  // Launch Parameters
  const [initialSpeed, setInitialSpeed] = useState(25); // m/s
  const [angleDeg, setAngleDeg] = useState(45); // degrees (0 to 180)
  const [cannonPos, setCannonPos] = useState({ x: 0, y: 5 }); // meters (x0: position, y0: elevation)
  const [groundEnabled, setGroundEnabled] = useState(true); // Toggle physical ground platform at y=0
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
  const [isDraggingAim, setIsDraggingAim] = useState(false);
  const [isDraggingCannon, setIsDraggingCannon] = useState(false);

  // 2D Pan & Zoom Navigation State
  const [zoomLevel, setZoomLevel] = useState(1.0); // 1.0 = 100%, 0.25x to 6.0x
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 }); // meters pan offset
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ clientX: 0, clientY: 0, initPanX: 0, initPanY: 0 });

  // Overlays & Analysis View
  const [visualMode, setVisualMode] = useState('physics'); // 'physics' | 'math'
  const [showAxes, setShowAxes] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [showTrajectory, setShowTrajectory] = useState(true);
  const [showApexMarker, setShowApexMarker] = useState(true);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('all');

  // Refs
  const viewportRef = useRef(null);
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

  // Parabolic Trajectory Equation y(x) = y0 + (x - x0)tan(θ) - (g / 2v0^2 cos^2θ)(x - x0)^2
  const parabolaEquation = useMemo(() => {
    const x0 = cannonPos.x;
    const y0 = cannonPos.y;
    const b = Math.tan(angleRad);
    const cosVal = Math.cos(angleRad);
    const denom = 2 * initialSpeed * initialSpeed * cosVal * cosVal;
    const a = denom > 0 ? -(g / denom) : 0;
    const bStr = Math.abs(b).toFixed(3);
    const aStr = Math.abs(a).toFixed(4);

    let str = 'y(x) = ';
    if (x0 === 0) {
      if (y0 !== 0) str += `${y0.toFixed(1)} `;
      if (b >= 0) {
        str += `${y0 !== 0 ? '+ ' : ''}${bStr}x `;
      } else {
        str += `- ${bStr}x `;
      }
      str += `- ${aStr}x²`;
    } else {
      const x0Str = x0 > 0 ? `- ${x0.toFixed(1)}` : `+ ${Math.abs(x0).toFixed(1)}`;
      str += `${y0.toFixed(1)} ${b >= 0 ? '+' : '-'} ${bStr}(x ${x0Str}) - ${aStr}(x ${x0Str})²`;
    }

    return {
      a,
      b,
      x0,
      y0,
      displayStr: str,
    };
  }, [cannonPos.x, cannonPos.y, angleRad, initialSpeed, g]);

  // Theoretical Calculations (Vacuum / Analytical)
  const theoretical = useMemo(() => {
    const v0x = initialSpeed * Math.cos(angleRad);
    const v0y = initialSpeed * Math.sin(angleRad);
    const tApex = v0y / g;
    const hMax = cannonPos.y + (v0y * v0y) / (2 * g);
    const discriminant = v0y * v0y + 2 * g * cannonPos.y;
    let tFlight = 0;
    let range = 0;
    if (discriminant >= 0) {
      tFlight = (v0y + Math.sqrt(discriminant)) / g;
      range = cannonPos.x + v0x * tFlight;
    }

    return {
      v0x,
      v0y,
      tApex: tApex > 0 ? tApex : 0,
      hMax,
      tFlight,
      range,
    };
  }, [initialSpeed, angleRad, cannonPos.x, cannonPos.y, g]);

  // Reset Simulation to Initial Launcher State
  const resetSimulation = useCallback(() => {
    setIsRunning(false);
    setSimTime(0);
    const v0x = initialSpeed * Math.cos(angleRad);
    const v0y = initialSpeed * Math.sin(angleRad);
    setFlightState({
      x: cannonPos.x,
      y: cannonPos.y,
      vx: v0x,
      vy: v0y,
      isLanded: false,
      hasHitTarget: false,
    });
    setCurrentTrail([{ x: cannonPos.x, y: cannonPos.y }]);
    setApexData(null);
    setLandingData(null);
    setIsHitSplash(false);
    lastTimestampRef.current = null;
  }, [initialSpeed, angleRad, cannonPos.x, cannonPos.y]);

  // Auto-reset when key parameters change and not running
  useEffect(() => {
    if (!isRunning && simTime === 0) {
      resetSimulation();
    }
  }, [initialSpeed, angleDeg, cannonPos.x, cannonPos.y, g, resetSimulation, isRunning, simTime]);

  // Play / Pause / Re-Fire Toggle Action
  const handlePlayPause = () => {
    if (isRunning) {
      // Pause current active flight
      setIsRunning(false);
    } else if (flightState.isLanded) {
      // Re-Fire after landing
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
    } else if (simTime > 0) {
      // Resume paused flight
      setIsRunning(true);
    } else {
      // Initial Launch
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

        // Ground Collision (if ground platform is enabled)
        if (groundEnabled && nextY <= 0) {
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

        // Out of Bounds check (when ground platform is disabled)
        if (!groundEnabled && (nextY < -250 || Math.abs(nextX) > 400 || simTime > 30)) {
          setIsRunning(false);
          setLandingData({ x: nextX, time: simTime + dt });
          return {
            x: nextX,
            y: nextY,
            vx: nextVx,
            vy: nextVy,
            isLanded: true,
            hasHitTarget: prev.hasHitTarget,
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
    [g, airDragEnabled, dragCoeff, mass, simTime, flightState.x, flightState.y, targetPos.x, targetPos.y, targetRadius, showTarget, groundEnabled]
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

  // Helper to compute pleasant, non-crowded step sizes (1, 2, 5, 10, 20, 25, 50, 100...)
  const calculateNiceStep = (range, targetTicks = 8) => {
    if (range <= 0) return 10;
    const roughStep = range / targetTicks;
    const power = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const fraction = roughStep / power;
    let niceFraction = 1;
    if (fraction > 1.5 && fraction <= 3) niceFraction = 2;
    else if (fraction > 3 && fraction <= 7) niceFraction = 5;
    else if (fraction > 7) niceFraction = 10;
    return niceFraction * power;
  };

  // Viewport / Coordinate Mapping (Stable 1:1 Isometric Canvas Frame)
  const viewBounds = useMemo(() => {
    const targetAspect = 800 / 460;

    // Key points that define the stable arena bounds
    const relevantX = [cannonPos.x];
    if (showTarget) relevantX.push(targetPos.x);
    if (groundEnabled && theoretical.range) {
      relevantX.push(theoretical.range);
    } else {
      // In groundless mode, bound by expected flight span
      relevantX.push(cannonPos.x + theoretical.v0x * 5);
    }

    // Include ghost trails if present
    ghostTrails.forEach((gt) => {
      gt.trail.forEach((pt) => relevantX.push(pt.x));
    });

    const minObservedX = Math.min(...relevantX);
    const maxObservedX = Math.max(...relevantX);

    // Initial padding margins
    let minX = minObservedX - 14;
    let maxX = maxObservedX + 14;

    if (maxX - minX < 36) {
      const mid = (minX + maxX) / 2;
      minX = mid - 18;
      maxX = mid + 18;
    }

    const relevantY = [cannonPos.y];
    if (showTarget) relevantY.push(targetPos.y);
    if (theoretical.hMax) relevantY.push(theoretical.hMax);
    if (groundEnabled) {
      relevantY.push(0);
    } else {
      const projectedMinY = cannonPos.y + theoretical.v0y * 5 - 0.5 * g * 25;
      relevantY.push(Math.max(-80, projectedMinY));
    }

    ghostTrails.forEach((gt) => {
      gt.trail.forEach((pt) => relevantY.push(pt.y));
    });

    const minObservedY = Math.min(...relevantY);
    const maxObservedY = Math.max(...relevantY);

    let minY = groundEnabled ? -2.5 : Math.min(-6, minObservedY - 8);
    let maxY = Math.max(18, maxObservedY + 8);

    let spanX = maxX - minX;
    let spanY = maxY - minY;
    const currentAspect = spanX / spanY;

    if (currentAspect < targetAspect) {
      // Widen X symmetrically to guarantee 1:1 pixel aspect ratio
      const desiredSpanX = spanY * targetAspect;
      const extraX = (desiredSpanX - spanX) / 2;
      minX -= extraX;
      maxX += extraX;
    } else {
      // Heighten Y to guarantee 1:1 pixel aspect ratio
      const desiredSpanY = spanX / targetAspect;
      const extraY = desiredSpanY - spanY;
      if (groundEnabled) {
        minY = -2.5;
        maxY = minY + desiredSpanY;
      } else {
        minY -= extraY / 2;
        maxY += extraY / 2;
      }
    }

    return { minX, maxX, minY, maxY };
  }, [showTarget, targetPos.x, targetPos.y, cannonPos.x, cannonPos.y, theoretical.range, theoretical.v0x, theoretical.v0y, theoretical.hMax, groundEnabled, ghostTrails, g]);

  // Active Viewport with Zoom and Pan Transformations
  const activeViewBounds = useMemo(() => {
    const baseMidX = (viewBounds.minX + viewBounds.maxX) / 2;
    const baseMidY = (viewBounds.minY + viewBounds.maxY) / 2;
    const baseSpanX = viewBounds.maxX - viewBounds.minX;
    const baseSpanY = viewBounds.maxY - viewBounds.minY;

    const currentSpanX = baseSpanX / zoomLevel;
    const currentSpanY = baseSpanY / zoomLevel;

    const currentMidX = baseMidX + panOffset.x;
    const currentMidY = baseMidY + panOffset.y;

    return {
      minX: currentMidX - currentSpanX / 2,
      maxX: currentMidX + currentSpanX / 2,
      minY: currentMidY - currentSpanY / 2,
      maxY: currentMidY + currentSpanY / 2,
    };
  }, [viewBounds, zoomLevel, panOffset]);

  // Dynamic Grid Marks for X with Adaptive Step
  const xGridMarks = useMemo(() => {
    const marks = [];
    const span = activeViewBounds.maxX - activeViewBounds.minX;
    const step = calculateNiceStep(span, 8);
    const start = Math.floor(activeViewBounds.minX / step) * step;
    const end = Math.ceil(activeViewBounds.maxX / step) * step;
    for (let gx = start; gx <= end; gx += step) {
      if (gx !== 0 && gx >= activeViewBounds.minX + step * 0.15 && gx <= activeViewBounds.maxX - step * 0.15) {
        marks.push(gx);
      }
    }
    return marks;
  }, [activeViewBounds.minX, activeViewBounds.maxX]);

  // Dynamic Grid Marks for Y with Adaptive Step
  const yGridMarks = useMemo(() => {
    const marks = [];
    const span = activeViewBounds.maxY - activeViewBounds.minY;
    const step = calculateNiceStep(span, 6);
    const start = Math.floor(activeViewBounds.minY / step) * step;
    const end = Math.ceil(activeViewBounds.maxY / step) * step;
    for (let gy = start; gy <= end; gy += step) {
      if (gy !== 0 && gy >= activeViewBounds.minY + step * 0.15 && gy <= activeViewBounds.maxY - step * 0.15) {
        marks.push(gy);
      }
    }
    return marks;
  }, [activeViewBounds.minY, activeViewBounds.maxY]);

  const svgWidth = 800;
  const svgHeight = 460;

  const toSvgX = useCallback(
    (x) => ((x - activeViewBounds.minX) / (activeViewBounds.maxX - activeViewBounds.minX)) * svgWidth,
    [activeViewBounds]
  );
  const toSvgY = useCallback(
    (y) => svgHeight - ((y - activeViewBounds.minY) / (activeViewBounds.maxY - activeViewBounds.minY)) * svgHeight,
    [activeViewBounds]
  );

  const fromSvgX = useCallback(
    (svgX) => activeViewBounds.minX + (svgX / svgWidth) * (activeViewBounds.maxX - activeViewBounds.minX),
    [activeViewBounds]
  );
  const fromSvgY = useCallback(
    (svgY) => activeViewBounds.minY + ((svgHeight - svgY) / svgHeight) * (activeViewBounds.maxY - activeViewBounds.minY),
    [activeViewBounds]
  );

  // SVG Base Coordinates
  const cannonBaseX = toSvgX(cannonPos.x);
  const cannonBaseY = toSvgY(cannonPos.y);
  const groundY = toSvgY(0);

  // Wheel Zoom Listener (Attached to Viewport Container with Cursor Anchor)
  useEffect(() => {
    const el = viewportRef.current || svgRef.current;
    if (!el) return;

    const onWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const svgX = ((e.clientX - rect.left) / rect.width) * svgWidth;
      const svgY = ((e.clientY - rect.top) / rect.height) * svgHeight;

      const cursorWorldX = fromSvgX(svgX);
      const cursorWorldY = fromSvgY(svgY);

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      setZoomLevel((prevZoom) => {
        const nextZoom = Math.max(0.25, Math.min(6.0, Math.round(prevZoom * zoomFactor * 100) / 100));
        if (nextZoom === prevZoom) return prevZoom;

        // Keep cursor position stable under mouse
        const baseSpanX = viewBounds.maxX - viewBounds.minX;
        const baseSpanY = viewBounds.maxY - viewBounds.minY;
        const nextSpanX = baseSpanX / nextZoom;
        const nextSpanY = baseSpanY / nextZoom;

        const nextMinX = cursorWorldX - (svgX / svgWidth) * nextSpanX;
        const nextMinY = cursorWorldY - ((svgHeight - svgY) / svgHeight) * nextSpanY;

        const nextMidX = nextMinX + nextSpanX / 2;
        const nextMidY = nextMinY + nextSpanY / 2;

        const baseMidX = (viewBounds.minX + viewBounds.maxX) / 2;
        const baseMidY = (viewBounds.minY + viewBounds.maxY) / 2;

        setPanOffset({
          x: Math.round((nextMidX - baseMidX) * 10) / 10,
          y: Math.round((nextMidY - baseMidY) * 10) / 10,
        });

        return nextZoom;
      });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [fromSvgX, fromSvgY, viewBounds, svgWidth, svgHeight]);

  // Pointer Drag Handlers (Aiming, Cannon Moving, Target Moving, Canvas Panning)
  const handlePointerDownCanvas = (e) => {
    // Canvas background panning
    panStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      initPanX: panOffset.x,
      initPanY: panOffset.y,
    };
    setIsPanning(true);
  };

  const handlePointerDownAim = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingAim(true);
  };

  const handlePointerDownCannon = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCannon(true);
  };

  const handlePointerDownTarget = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingTarget(true);
  };

  const handlePointerMove = useCallback(
    (e) => {
      if ((!isDraggingAim && !isDraggingTarget && !isDraggingCannon && !isPanning) || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const svgX = ((e.clientX - rect.left) / rect.width) * svgWidth;
      const svgY = ((e.clientY - rect.top) / rect.height) * svgHeight;

      if (isPanning) {
        const dxPx = e.clientX - panStartRef.current.clientX;
        const dyPx = e.clientY - panStartRef.current.clientY;
        const metersPerPx = (activeViewBounds.maxX - activeViewBounds.minX) / svgWidth;
        const deltaMetersX = -dxPx * metersPerPx;
        const deltaMetersY = dyPx * metersPerPx;
        setPanOffset({
          x: Math.round((panStartRef.current.initPanX + deltaMetersX) * 10) / 10,
          y: Math.round((panStartRef.current.initPanY + deltaMetersY) * 10) / 10,
        });
      } else if (isDraggingAim) {
        const dx = svgX - toSvgX(cannonPos.x);
        const dy = svgY - toSvgY(cannonPos.y);
        let deg = Math.atan2(-dy, dx) * (180 / Math.PI);
        if (deg < 0) {
          deg = dx >= 0 ? 0 : 180;
        }
        deg = Math.max(0, Math.min(180, Math.round(deg)));
        setAngleDeg(deg);
      } else if (isDraggingCannon) {
        const rawX = fromSvgX(svgX);
        const rawY = fromSvgY(svgY);
        const clampedX = Math.max(activeViewBounds.minX + 3, Math.min(activeViewBounds.maxX - 3, rawX));
        const clampedY = groundEnabled
          ? Math.max(0, Math.min(activeViewBounds.maxY - 3, rawY))
          : Math.max(activeViewBounds.minY + 3, Math.min(activeViewBounds.maxY - 3, rawY));
        setCannonPos({
          x: Math.round(clampedX * 10) / 10,
          y: Math.round(clampedY * 10) / 10,
        });
      } else if (isDraggingTarget) {
        const rawX = fromSvgX(svgX);
        const rawY = fromSvgY(svgY);
        const clampedX = Math.max(activeViewBounds.minX + 3, Math.min(activeViewBounds.maxX - 3, rawX));
        const clampedY = groundEnabled
          ? Math.max(0, Math.min(activeViewBounds.maxY - 3, rawY))
          : Math.max(activeViewBounds.minY + 3, Math.min(activeViewBounds.maxY - 3, rawY));
        setTargetPos({
          x: Math.round(clampedX * 10) / 10,
          y: Math.round(clampedY * 10) / 10,
        });
      }
    },
    [isDraggingAim, isDraggingCannon, isDraggingTarget, isPanning, cannonPos.x, cannonPos.y, toSvgX, toSvgY, fromSvgX, fromSvgY, activeViewBounds.minX, activeViewBounds.maxX, activeViewBounds.minY, activeViewBounds.maxY, groundEnabled]
  );

  const handlePointerUp = useCallback(() => {
    setIsDraggingTarget(false);
    setIsDraggingAim(false);
    setIsDraggingCannon(false);
    setIsPanning(false);
  }, []);

  useEffect(() => {
    if (isDraggingTarget || isDraggingAim || isDraggingCannon || isPanning) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
      };
    }
  }, [isDraggingTarget, isDraggingAim, isDraggingCannon, isPanning, handlePointerMove, handlePointerUp]);

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
    const stepCount = 60;
    const maxT = groundEnabled && theoretical.tFlight > 0 ? theoretical.tFlight : 5.0;
    const dt = maxT / stepCount;
    for (let i = 0; i <= stepCount; i++) {
      const t = i * dt;
      const x = cannonPos.x + theoretical.v0x * t;
      const y = cannonPos.y + theoretical.v0y * t - 0.5 * g * t * t;
      if (groundEnabled && y < 0) {
        break;
      }
      points.push(`${toSvgX(x)},${toSvgY(y)}`);
    }
    return points.length > 0 ? `M ${points.join(' L ')}` : '';
  }, [theoretical, cannonPos.x, cannonPos.y, g, groundEnabled, toSvgX, toSvgY]);

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
                {/* Visual Mode Selector Pill */}
                <div className="visual-mode-toggle-pill">
                  <button
                    type="button"
                    className={`vm-toggle-btn ${visualMode === 'physics' ? 'active' : ''}`}
                    onClick={() => setVisualMode('physics')}
                  >
                    🚀 Ballistics Lab
                  </button>
                  <button
                    type="button"
                    className={`vm-toggle-btn ${visualMode === 'math' ? 'active' : ''}`}
                    onClick={() => setVisualMode('math')}
                  >
                    📊 Math Graph
                  </button>
                </div>

                <div className="stage-status-live">
                  <span className={`status-dot ${isRunning ? 'in-flight' : ''}`} />
                  <span>{isRunning ? 'Flight Active' : flightState.isLanded ? 'Impact Settled' : 'Ready'}</span>
                </div>
              </div>

              {/* View Overlays */}
              <div className="stage-overlay-toggles">
                <button
                  type="button"
                  className={`toggle-chip ${groundEnabled ? 'active' : ''}`}
                  onClick={() => setGroundEnabled(!groundEnabled)}
                  title="Toggle ground platform on/off"
                >
                  🌍 Ground: {groundEnabled ? 'ON' : 'OFF'}
                </button>
                <button
                  type="button"
                  className={`toggle-chip ${showAxes ? 'active' : ''}`}
                  onClick={() => setShowAxes(!showAxes)}
                  title="Toggle coordinate axes"
                >
                  📐 Axes: {showAxes ? 'ON' : 'OFF'}
                </button>
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
                  ▲ {visualMode === 'math' ? 'Vertex' : 'Apex'}
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

            {/* Ballistics / Mathematical SVG Viewport */}
            <div
              ref={viewportRef}
              className={`projectile-svg-viewport ${visualMode === 'math' ? 'math-mode' : ''}`}
            >
              {/* Floating Explicit Parabola Formula Badge in Math Mode */}
              {visualMode === 'math' && (
                <div className="floating-math-formula-pill">
                  <span className="fn-header">Parabolic Trajectory Function</span>
                  <span className="fn-body">{parabolaEquation.displayStr}</span>
                </div>
              )}

              {/* Floating Pan & Zoom HUD */}
              <div className="floating-viewport-hud">
                <button
                  type="button"
                  className="hud-btn"
                  onClick={() => setZoomLevel((z) => Math.min(6.0, Math.round(z * 1.25 * 100) / 100))}
                  title="Zoom In (or scroll wheel up)"
                >
                  ➕
                </button>
                <span className="hud-zoom-indicator">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  className="hud-btn"
                  onClick={() => setZoomLevel((z) => Math.max(0.25, Math.round(z * 0.8 * 100) / 100))}
                  title="Zoom Out (or scroll wheel down)"
                >
                  ➖
                </button>
                {(zoomLevel !== 1.0 || panOffset.x !== 0 || panOffset.y !== 0) && (
                  <button
                    type="button"
                    className="hud-btn hud-btn-reset"
                    onClick={() => {
                      setZoomLevel(1.0);
                      setPanOffset({ x: 0, y: 0 });
                    }}
                    title="Reset pan & zoom to default arena frame"
                  >
                    🎯 Fit View
                  </button>
                )}
              </div>

              <svg
                ref={svgRef}
                className="projectile-svg"
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                preserveAspectRatio="xMidYMid meet"
                onPointerDown={handlePointerDownCanvas}
                style={{ cursor: isPanning ? 'grabbing' : 'crosshair' }}
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
                  <marker
                    id="axisArrowheadX"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 7 3, 0 6" fill="#334155" />
                  </marker>
                  <marker
                    id="axisArrowheadY"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 7 3, 0 6" fill="#334155" />
                  </marker>
                  <marker
                    id="v0VectorArrowhead"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 7 3, 0 6" fill="#2563EB" />
                  </marker>
                </defs>

                {/* Sky / Cartesian Grid Marks */}
                {xGridMarks.map((gx) => (
                  <g key={`grid-x-${gx}`}>
                    <line x1={toSvgX(gx)} y1={0} x2={toSvgX(gx)} y2={groundEnabled ? groundY : svgHeight} className="grid-line" />
                  </g>
                ))}

                {yGridMarks.map((gy) => (
                  <g key={`grid-y-${gy}`}>
                    <line x1={0} y1={toSvgY(gy)} x2={svgWidth} y2={toSvgY(gy)} className="grid-line" />
                  </g>
                ))}

                {/* Physics Mode: Ground Platform & Dirt Fill */}
                {visualMode === 'physics' && groundEnabled && (
                  <>
                    <rect x={0} y={groundY} width={svgWidth} height={svgHeight - groundY} fill="#E2DDD2" />
                    <line x1={0} y1={groundY} x2={svgWidth} y2={groundY} className="grass-top-rim" />
                  </>
                )}

                {/* Math Mode / Groundless: Clean y = 0 Reference Line */}
                {(!showAxes || !groundEnabled) && (
                  <line x1={0} y1={groundY} x2={svgWidth} y2={groundY} stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4 4" />
                )}

                {/* Formal Coordinate Axes System */}
                {showAxes && (
                  <g className="coordinate-axes-group">
                    {/* Horizontal X-Axis */}
                    <line
                      x1={12}
                      y1={groundY}
                      x2={svgWidth - 12}
                      y2={groundY}
                      className="coord-axis-line"
                      markerEnd="url(#axisArrowheadX)"
                    />
                    {/* X-Axis Label */}
                    <text
                      x={svgWidth - 16}
                      y={groundY - 9}
                      textAnchor="end"
                      className="coord-axis-label"
                    >
                      {visualMode === 'math' ? '+x ➔' : 'Distance x (m) ➔'}
                    </text>
                    {viewBounds.minX <= -25 && (
                      <text
                        x={16}
                        y={groundY - 9}
                        textAnchor="start"
                        className="coord-axis-label"
                      >
                        {visualMode === 'math' ? '⬅ -x' : '⬅ -x (m)'}
                      </text>
                    )}

                    {/* Vertical Y-Axis */}
                    <line
                      x1={toSvgX(0)}
                      y1={groundEnabled ? groundY + 8 : svgHeight - 12}
                      x2={toSvgX(0)}
                      y2={16}
                      className="coord-axis-line"
                      markerEnd="url(#axisArrowheadY)"
                    />
                    {/* Y-Axis Label */}
                    <text
                      x={toSvgX(0) + 8}
                      y={22}
                      textAnchor="start"
                      className="coord-axis-label"
                    >
                      {visualMode === 'math' ? '⬆ y-axis (Height, m)' : '⬆ Height y (m)'}
                    </text>

                    {/* Origin Marker */}
                    <circle cx={toSvgX(0)} cy={groundY} r="3.5" fill="#334155" />
                    <text
                      x={toSvgX(0) - 6}
                      y={groundY + 14}
                      textAnchor="end"
                      className="coord-origin-label"
                    >
                      (0,0)
                    </text>

                    {/* X-Axis Ticks & Numerical Labels */}
                    {xGridMarks.map((gx) => {
                      const sX = toSvgX(gx);
                      return (
                        <g key={`axis-tick-x-${gx}`}>
                          <line x1={sX} y1={groundY - 4} x2={sX} y2={groundY + 4} className="coord-tick-line" />
                          <text x={sX} y={groundY + 16} textAnchor="middle" className="coord-tick-label">
                            {gx}m
                          </text>
                        </g>
                      );
                    })}

                    {/* Y-Axis Ticks & Numerical Labels */}
                    {yGridMarks.map((gy) => {
                      const sY = toSvgY(gy);
                      return (
                        <g key={`axis-tick-y-${gy}`}>
                          <line x1={toSvgX(0) - 4} y1={sY} x2={toSvgX(0) + 4} y2={sY} className="coord-tick-line" />
                          <text x={toSvgX(0) - 7} y={sY + 3.5} textAnchor="end" className="coord-tick-label">
                            {gy}m
                          </text>
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* Physics Mode: Elevation Cliff (Ground Supported) */}
                {visualMode === 'physics' && groundEnabled && cannonPos.y > 0 && (
                  <g>
                    <rect
                      x={toSvgX(cannonPos.x - 2.5)}
                      y={toSvgY(cannonPos.y)}
                      width={toSvgX(cannonPos.x + 2.5) - toSvgX(cannonPos.x - 2.5)}
                      height={groundY - toSvgY(cannonPos.y)}
                      fill="#E2E8F0"
                      stroke="#94A3B8"
                      strokeWidth="1.5"
                      rx="4"
                    />
                    <line x1={toSvgX(cannonPos.x - 2.5)} y1={toSvgY(cannonPos.y)} x2={toSvgX(cannonPos.x + 2.5)} y2={toSvgY(cannonPos.y)} stroke="#84CC16" strokeWidth="3" />
                    <text x={toSvgX(cannonPos.x)} y={toSvgY(cannonPos.y / 2) + 4} fill="#64748B" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="monospace">
                      h₀ = {cannonPos.y}m
                    </text>
                  </g>
                )}

                {/* Math Mode: Elevation Guide & Initial Point P0(x0, y0) */}
                {visualMode === 'math' && (
                  <g>
                    {groundEnabled && cannonPos.y !== 0 && (
                      <line x1={toSvgX(cannonPos.x)} y1={groundY} x2={toSvgX(cannonPos.x)} y2={toSvgY(cannonPos.y)} stroke="#2563EB" strokeWidth="1.5" strokeDasharray="3 3" />
                    )}
                    <text x={toSvgX(cannonPos.x) - 8} y={toSvgY(cannonPos.y) + 4} textAnchor="end" fontSize="10" fontWeight="700" fill="#2563EB" fontFamily="monospace">
                      P₀ ({cannonPos.x.toFixed(1)}, {cannonPos.y.toFixed(1)})
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
                  <path
                    d={predictedPathD}
                    className="trajectory-predicted-path"
                    stroke={visualMode === 'math' ? '#2563EB' : 'rgba(220, 38, 38, 0.4)'}
                  />
                )}

                {/* Active Flight Trajectory Path */}
                {showTrajectory && activeTrailD && (
                  <path
                    d={activeTrailD}
                    className="trajectory-active-path"
                    stroke={visualMode === 'math' ? '#4F46E5' : '#DC2626'}
                    strokeWidth={visualMode === 'math' ? 3 : 2.5}
                  />
                )}

                {/* Draggable Target Bullseye / Geometric Target Region */}
                {showTarget && (
                  <g
                    className={`target-draggable-group ${isDraggingTarget ? 'is-dragging' : ''}`}
                    transform={`translate(${toSvgX(targetPos.x)}, ${toSvgY(targetPos.y)})`}
                    onPointerDown={handlePointerDownTarget}
                    title="Click and drag target to place anywhere"
                  >
                    {/* Elevated stand/guide or ground post (Physics only) */}
                    {visualMode !== 'math' && groundEnabled && (
                      targetPos.y > 0 ? (
                        <>
                          <line x1="0" y1="0" x2="0" y2={groundY - toSvgY(targetPos.y)} className="target-elevation-guide" />
                          <line x1="0" y1="0" x2="0" y2="16" className="target-base-post" />
                          <circle cx="0" cy={groundY - toSvgY(targetPos.y)} r="3.5" fill="#DC2626" opacity="0.6" />
                        </>
                      ) : (
                        <line x1="0" y1="0" x2="0" y2={groundY - toSvgY(0)} className="target-base-post" />
                      )
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

                    {visualMode === 'math' ? (
                      /* Small Red Cross */
                      <g className="target-math-cross">
                        <line x1="-8" y1="-8" x2="8" y2="8" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="8" y1="-8" x2="-8" y2="8" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
                      </g>
                    ) : (
                      <>
                        {/* Outer Ring */}
                        <circle cx="0" cy="0" r={toSvgX(targetRadius) - toSvgX(0)} className="target-outer-ring" />
                        {/* Mid Ring */}
                        <circle cx="0" cy="0" r={(toSvgX(targetRadius) - toSvgX(0)) * 0.65} className="target-mid-ring" />
                        {/* Bullseye Center */}
                        <circle cx="0" cy="0" r={(toSvgX(targetRadius) - toSvgX(0)) * 0.3} className="target-bullseye-center" />
                      </>
                    )}

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
                        🎯 {targetPos.x}m{targetPos.y !== 0 ? `, ${targetPos.y}m` : ''} ⠿
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

                {/* Apex Marker / Math Vertex */}
                {showApexMarker && (apexData || (simTime === 0 && theoretical.hMax > 0)) && (
                  <g>
                    {(() => {
                      const apexX = apexData ? apexData.x : cannonPos.x + theoretical.v0x * theoretical.tApex;
                      const apexY = apexData ? apexData.y : theoretical.hMax;
                      const sX = toSvgX(apexX);
                      const sY = toSvgY(apexY);
                      return (
                        <g>
                          <line x1={sX} y1={sY} x2={sX} y2={groundY} className="apex-marker-line" />
                          <circle cx={sX} cy={sY} r="4" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                          <text x={sX} y={sY - 8} fill="#2563EB" textAnchor="middle" className="marker-label">
                            {visualMode === 'math' ? `Vertex (${apexX.toFixed(1)}, ${apexY.toFixed(1)})` : `▲ H_max = ${apexY.toFixed(1)}m`}
                          </text>
                        </g>
                      );
                    })()}
                  </g>
                )}

                {/* Impact / Range Marker / Math Root (when ground enabled) */}
                {groundEnabled && (landingData || (simTime === 0 && Math.abs(theoretical.range) > 0.1)) && (
                  <g>
                    {(() => {
                      const rX = landingData ? landingData.x : theoretical.range;
                      const sX = toSvgX(rX);
                      return (
                        <g>
                          <line x1={sX} y1={groundY - 8} x2={sX} y2={groundY + 8} className="range-marker-line" />
                          <text x={sX} y={groundY + 28} fill="#16A34A" textAnchor="middle" className="marker-label">
                            {visualMode === 'math' ? `Root (${rX.toFixed(1)}, 0)` : `🏁 Range = ${rX.toFixed(1)}m`}
                          </text>
                        </g>
                      );
                    })()}
                  </g>
                )}

                {/* Launcher: Physics Cannon vs Math Vector Origin (Scaled with Zoom) */}
                {visualMode === 'physics' ? (
                  <g transform={`translate(${cannonBaseX}, ${cannonBaseY}) scale(${zoomLevel})`}>
                    {/* Drag Halo for Cannon Base when moving */}
                    {isDraggingCannon && (
                      <circle cx="0" cy="0" r="28" fill="none" stroke="#2563EB" strokeWidth="2" strokeDasharray="4 4" />
                    )}

                    {/* Protractor Angle Arc */}
                    <path
                      d={`M 35 0 A 35 35 0 0 0 ${35 * Math.cos(angleRad)} ${-35 * Math.sin(angleRad)}`}
                      className="angle-arc-guide"
                    />
                    <text
                      x={42 * Math.cos(angleRad / 2)}
                      y={-42 * Math.sin(angleRad / 2) + (angleDeg > 150 ? 4 : 0)}
                      fill="#D97706"
                      fontSize="10.5"
                      fontWeight="800"
                      textAnchor={angleDeg > 130 ? 'end' : angleDeg < 50 ? 'start' : 'middle'}
                      fontFamily="sans-serif"
                    >
                      {angleDeg}°
                    </text>

                    {/* Rotating Barrel with Draggable Nozzle */}
                    <g
                      transform={`rotate(${-angleDeg})`}
                      className={`cannon-barrel-group ${isDraggingAim ? 'is-aiming' : ''}`}
                      onPointerDown={handlePointerDownAim}
                      title="Click and drag nozzle to rotate launch angle"
                    >
                      <rect x="0" y="-8" width="36" height="16" rx="4" className="cannon-barrel" />
                      <circle cx="36" cy="0" r="8" fill="#1E293B" />
                      {/* Interactive Drag Handle on Nozzle */}
                      <circle
                        cx="36"
                        cy="0"
                        r="11"
                        fill={isDraggingAim ? 'rgba(245, 158, 11, 0.45)' : 'rgba(245, 158, 11, 0.18)'}
                        stroke="#F59E0B"
                        strokeWidth="1.5"
                        strokeDasharray={isDraggingAim ? 'none' : '3 3'}
                        className="cannon-nozzle-handle"
                      />
                      <circle cx="36" cy="0" r="3.5" fill="#F59E0B" />
                    </g>

                    {/* Draggable Cannon Carriage & Platform */}
                    <g
                      className={`cannon-base-group ${isDraggingCannon ? 'is-dragging' : ''}`}
                      onPointerDown={handlePointerDownCannon}
                      style={{ cursor: isDraggingCannon ? 'grabbing' : 'grab' }}
                      title="Click & drag cannon carriage to reposition (X, Y)"
                    >
                      <ellipse cx="0" cy="4" rx="15" ry="10" className="cannon-platform" />
                      <circle cx="0" cy="6" r="9" className="cannon-wheel" />
                      <circle cx="0" cy="6" r="3" fill="#94A3B8" />

                      {/* Floating Thruster / Hover Glow when in groundless mode or elevated */}
                      {(!groundEnabled || cannonPos.y > 0) && (
                        <ellipse cx="0" cy="14" rx="12" ry="3" fill="rgba(37, 99, 235, 0.3)" opacity="0.8" />
                      )}
                    </g>
                  </g>
                ) : (
                  /* Math Mode: Vector Launcher Arrow v0 with Draggable Origin and Tip (Scaled with Zoom) */
                  <g transform={`translate(${cannonBaseX}, ${cannonBaseY}) scale(${zoomLevel})`}>
                    {/* Drag Halo for Origin Point P0 */}
                    {isDraggingCannon && (
                      <circle cx="0" cy="0" r="22" fill="none" stroke="#2563EB" strokeWidth="2" strokeDasharray="3 3" />
                    )}

                    {/* Angle Sector Arc */}
                    <path
                      d={`M 38 0 A 38 38 0 0 0 ${38 * Math.cos(angleRad)} ${-38 * Math.sin(angleRad)}`}
                      fill="rgba(37, 99, 235, 0.12)"
                      stroke="#2563EB"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />
                    <text
                      x={46 * Math.cos(angleRad / 2)}
                      y={-46 * Math.sin(angleRad / 2)}
                      fill="#2563EB"
                      fontSize="10.5"
                      fontWeight="800"
                      textAnchor={angleDeg > 130 ? 'end' : angleDeg < 50 ? 'start' : 'middle'}
                      fontFamily="monospace"
                    >
                      θ = {angleDeg}°
                    </text>

                    {/* Initial Velocity Vector Arrow v0 */}
                    <g
                      className={`vector-aim-group ${isDraggingAim ? 'is-aiming' : ''}`}
                      onPointerDown={handlePointerDownAim}
                      title="Click and drag arrow to rotate vector angle"
                    >
                      <line
                        x1="0"
                        y1="0"
                        x2={50 * Math.cos(angleRad)}
                        y2={-50 * Math.sin(angleRad)}
                        stroke="#2563EB"
                        strokeWidth="2.8"
                        markerEnd="url(#v0VectorArrowhead)"
                      />
                      {/* Draggable Vector Tip Handle */}
                      <circle
                        cx={50 * Math.cos(angleRad)}
                        cy={-50 * Math.sin(angleRad)}
                        r="11"
                        fill={isDraggingAim ? 'rgba(37, 99, 235, 0.45)' : 'rgba(37, 99, 235, 0.18)'}
                        stroke="#2563EB"
                        strokeWidth="1.5"
                        strokeDasharray={isDraggingAim ? 'none' : '3 3'}
                        className="vector-tip-handle"
                      />
                      <circle
                        cx={50 * Math.cos(angleRad)}
                        cy={-50 * Math.sin(angleRad)}
                        r="3.5"
                        fill="#2563EB"
                      />
                    </g>

                    {/* Draggable Origin Point P0 */}
                    <g
                      onPointerDown={handlePointerDownCannon}
                      style={{ cursor: isDraggingCannon ? 'grabbing' : 'grab' }}
                      title="Click & drag origin P0 to reposition (X, Y)"
                    >
                      <circle cx="0" cy="0" r="9" fill="rgba(37, 99, 235, 0.18)" />
                      <circle cx="0" cy="0" r="4.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                    </g>

                    <text
                      x={58 * Math.cos(angleRad)}
                      y={-58 * Math.sin(angleRad)}
                      fill="#2563EB"
                      fontSize="10"
                      fontWeight="800"
                      textAnchor={angleDeg > 90 ? 'end' : 'start'}
                      fontFamily="monospace"
                    >
                      v₀ = {initialSpeed}m/s
                    </text>
                  </g>
                )}

                {/* Flying Projectile: Ballistics vs Math Point Particle (Scaled with Zoom) */}
                {(isRunning || simTime > 0) && (
                  <g transform={`translate(${projSvgX}, ${projSvgY}) scale(${zoomLevel})`}>
                    {visualMode === 'physics' ? (
                      <>
                        <circle cx="0" cy="0" r="7" className="projectile-ball" />
                        {isRunning && <circle cx="0" cy="0" r="10" fill="none" stroke="#F59E0B" strokeWidth="2" className="projectile-glow" />}
                      </>
                    ) : (
                      /* Math Point Particle P(x, y) */
                      <>
                        <circle cx="0" cy="0" r="5" fill="#4F46E5" stroke="#FFFFFF" strokeWidth="2" />
                        <circle cx="0" cy="0" r="9" fill="none" stroke="#4F46E5" strokeWidth="1.5" opacity="0.6" />
                        <g transform="translate(0, -14)">
                          <rect x="-36" y="-11" width="72" height="14" rx="3" fill="rgba(15, 23, 42, 0.85)" />
                          <text y="-1" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="700" fontFamily="monospace">
                            ({flightState.x.toFixed(1)}, {flightState.y.toFixed(1)})
                          </text>
                        </g>
                      </>
                    )}
                  </g>
                )}

                {/* Real-Time Velocity Vectors */}
                {showVectors && (isRunning || simTime > 0) && !flightState.isLanded && (
                  <g>
                    {/* Horizontal Component vx */}
                    <line x1={projSvgX} y1={projSvgY} x2={vxEndX} y2={projSvgY} className="vector-arrow-vx" />
                    <text
                      x={flightState.vx >= 0 ? vxEndX + 4 : vxEndX - 4}
                      y={projSvgY + 3}
                      fill="#2563EB"
                      fontSize="9.5"
                      fontWeight="700"
                      textAnchor={flightState.vx >= 0 ? 'start' : 'end'}
                      fontFamily="monospace"
                    >
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
                onClick={handlePlayPause}
                style={{ padding: '6px 14px', fontSize: '12px' }}
              >
                {isRunning
                  ? '⏸ Pause'
                  : flightState.isLanded
                  ? '🚀 Re-Fire'
                  : simTime > 0
                  ? '▶ Resume'
                  : '🔥 Fire!'}
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
                max="180"
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

            {/* Launcher Position (x0, y0) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E293B', whiteSpace: 'nowrap' }} title="Launcher Horizontal Coordinate">
                x₀: {cannonPos.x}m
              </span>
              <input
                type="range"
                min="-60"
                max="60"
                step="0.5"
                value={cannonPos.x}
                onChange={(e) => setCannonPos((p) => ({ ...p, x: parseFloat(e.target.value) }))}
                className="editorial-slider"
                style={{ width: '60px', margin: 0 }}
                title="Adjust launcher horizontal position"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#1E293B', whiteSpace: 'nowrap' }} title="Launcher Vertical Coordinate">
                y₀: {cannonPos.y}m
              </span>
              <input
                type="range"
                min={groundEnabled ? 0 : -30}
                max="30"
                step="0.5"
                value={cannonPos.y}
                onChange={(e) => setCannonPos((p) => ({ ...p, y: parseFloat(e.target.value) }))}
                className="editorial-slider"
                style={{ width: '60px', margin: 0 }}
                title="Adjust launcher vertical position"
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
                      min="-80"
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
                          x: (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 45) + 15),
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
