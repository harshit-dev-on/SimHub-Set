import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './GradientDescent.css';
import { LOSS_FUNCTIONS, OPTIMIZERS, findFunctionMinima } from './simulationMath';
import { compileMathExpression } from './mathParser';
import CustomFunctionModal from './CustomFunctionModal';
import PogoRider from './PogoRider';

export default function GradientDescent() {
  const [visualMode, setVisualMode] = useState('pogo'); // 'pogo' | 'math'
  const [allFunctions, setAllFunctions] = useState(() => {
    const saved = localStorage.getItem('simhub_custom_functions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const recompiled = {};
        parsed.forEach((item) => {
          try {
            const expr = item.rawExpr || item.transformedExpr;
            if (expr) {
              const res = compileMathExpression(expr);
              recompiled[item.id] = {
                ...item,
                fn: res.fn,
                derivative: res.derivative,
              };
            }
          } catch {
            // skip corrupted item
          }
        });
        return { ...LOSS_FUNCTIONS, ...recompiled };
      } catch {
        return LOSS_FUNCTIONS;
      }
    }
    return LOSS_FUNCTIONS;
  });

  const [selectedFuncKey, setSelectedFuncKey] = useState('quadratic');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [selectedOptimizer, setSelectedOptimizer] = useState('sgd');
  const [learningRate, setLearningRate] = useState(0.15);
  const [currentX, setCurrentX] = useState(3.2);
  const [initialX, setInitialX] = useState(3.2);
  const [isRunning, setIsRunning] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(250); // ms per step
  const [history, setHistory] = useState([]);
  const [statusMessage, setStatusMessage] = useState('Ready to descend');

  const currentFunc = allFunctions[selectedFuncKey] || allFunctions.quadratic;
  const currentOpt = OPTIMIZERS[selectedOptimizer];

  const handleApplyCustomFunction = (customFuncObj) => {
    setAllFunctions((prev) => {
      const next = { ...prev, [customFuncObj.id]: customFuncObj };
      // Save serializable properties to localStorage
      try {
        const customList = Object.values(next)
          .filter((f) => f.isCustom)
          .map((f) => ({
            id: f.id,
            name: f.name,
            badge: f.badge,
            badgeColor: f.badgeColor,
            description: f.description,
            xMin: f.xMin,
            xMax: f.xMax,
            yMin: f.yMin,
            yMax: f.yMax,
            defaultX0: f.defaultX0,
            defaultLr: f.defaultLr,
            latex: f.latex,
            derivLatex: f.derivLatex,
            optimum: f.optimum,
            isCustom: true,
            rawExpr: f.rawExpr,
            transformedExpr: f.transformedExpr || f.rawExpr,
          }));
        localStorage.setItem('simhub_custom_functions', JSON.stringify(customList));
      } catch {
        // ignore localStorage errors
      }
      return next;
    });

    setSelectedFuncKey(customFuncObj.id);
  };

  const handleDeleteCustomFunc = (e, funcId) => {
    e.stopPropagation();
    setAllFunctions((prev) => {
      const next = { ...prev };
      delete next[funcId];
      try {
        const customList = Object.values(next).filter((f) => f.isCustom);
        localStorage.setItem('simhub_custom_functions', JSON.stringify(customList));
      } catch {
        // ignore
      }
      return next;
    });
    if (selectedFuncKey === funcId) {
      setSelectedFuncKey('quadratic');
    }
  };

  // Initialize or reset state on function change
  // Animation & Position Tracking Refs
  const currentXRef = useRef(3.2);
  const isJumpingRef = useRef(false);
  const animFrameRef = useRef(null);
  const nextStepTimeoutRef = useRef(null);
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;
  const svgRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const optimizerStateRef = useRef({});

  // Current mathematical metrics safely evaluated with useMemo
  const safeFn = useMemo(() => currentFunc.fn || ((x) => x * x), [currentFunc]);
  const safeDeriv = useMemo(() => currentFunc.derivative || ((x) => 2 * x), [currentFunc]);

  // Compute all local and global minima
  const detectedMinima = useMemo(() => {
    return findFunctionMinima(safeFn, safeDeriv, currentFunc.xMin, currentFunc.xMax);
  }, [safeFn, safeDeriv, currentFunc.xMin, currentFunc.xMax]);

  // SVG Coordinates Transformation
  const svgWidth = 640;
  const svgHeight = 320;
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const xSpan = (currentFunc.xMax - currentFunc.xMin) || 1;
  const ySpan = (currentFunc.yMax - currentFunc.yMin) || 1;

  const scaleX = useCallback((x) => {
    const clampedX = isNaN(x) ? currentFunc.xMin : x;
    return padding.left + ((clampedX - currentFunc.xMin) / xSpan) * plotWidth;
  }, [currentFunc.xMin, padding.left, plotWidth, xSpan]);

  const scaleY = useCallback((y) => {
    const clampedY = isNaN(y) ? currentFunc.yMin : y;
    return padding.top + plotHeight - ((clampedY - currentFunc.yMin) / ySpan) * plotHeight;
  }, [currentFunc.yMin, padding.top, plotHeight, ySpan]);

  // Exact normal (perpendicular) angle to curve in SVG screen coordinates
  const computeScreenNormalAngle = useCallback((xVal) => {
    const grad = safeDeriv(xVal);
    if (isNaN(grad)) return 0;
    const dX_screen = plotWidth / xSpan;
    const dY_screen = -(plotHeight / ySpan) * grad;
    return (Math.atan2(dY_screen, dX_screen) * 180) / Math.PI;
  }, [plotHeight, plotWidth, safeDeriv, xSpan, ySpan]);

  // Dynamic Parameter Refs to keep jump loop completely stable
  const currentOptRef = useRef(currentOpt);
  currentOptRef.current = currentOpt;
  const learningRateRef = useRef(learningRate);
  learningRateRef.current = learningRate;
  const playbackSpeedRef = useRef(playbackSpeed);
  playbackSpeedRef.current = playbackSpeed;
  const safeFnRef = useRef(safeFn);
  safeFnRef.current = safeFn;
  const safeDerivRef = useRef(safeDeriv);
  safeDerivRef.current = safeDeriv;
  const scaleXRef = useRef(scaleX);
  scaleXRef.current = scaleX;
  const scaleYRef = useRef(scaleY);
  scaleYRef.current = scaleY;
  const computeNormalRef = useRef(computeScreenNormalAngle);
  computeNormalRef.current = computeScreenNormalAngle;

  // Smooth Render State during projectile hops
  const [renderPos, setRenderPos] = useState({
    x: 3.2,
    y: 0,
    hopPx: 0,
    progress: 0,
    isJumping: false,
    direction: 1,
    normalAngle: 0,
    arcPath: null,
  });

  // Initialize or reset state on function change
  const resetSimulation = useCallback((newX0 = null) => {
    setIsRunning(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (nextStepTimeoutRef.current) clearTimeout(nextStepTimeoutRef.current);
    isJumpingRef.current = false;
    optimizerStateRef.current = {};

    const startX = newX0 !== null ? newX0 : currentFunc.defaultX0;
    currentXRef.current = startX;
    setInitialX(startX);
    setCurrentX(startX);
    const startY = safeFn(startX);
    const startGrad = safeDeriv(startX);
    const initialNormal = computeScreenNormalAngle(startX);

    setRenderPos({
      x: startX,
      y: startY,
      hopPx: 0,
      progress: 0,
      isJumping: false,
      direction: 1,
      normalAngle: initialNormal,
      arcPath: null,
    });

    setHistory([{
      step: 0,
      x: startX,
      y: startY,
      grad: startGrad,
      stepSize: 0,
    }]);
    setStatusMessage('Ready to descend');
  }, [currentFunc, safeFn, safeDeriv, computeScreenNormalAngle]);

  useEffect(() => {
    setLearningRate(currentFunc.defaultLr);
    resetSimulation(currentFunc.defaultX0);
  }, [selectedFuncKey, resetSimulation, currentFunc.defaultLr, currentFunc.defaultX0]);

  // Execute a single animated projectile jump gradient descent step (Stable Ref-Based)
  const executeJumpStep = useCallback((onComplete = null) => {
    if (isJumpingRef.current) return;

    const prevX = currentXRef.current;
    const fn = safeFnRef.current;
    const deriv = safeDerivRef.current;
    const opt = currentOptRef.current;
    const lr = learningRateRef.current;
    const spd = playbackSpeedRef.current;
    const sX = scaleXRef.current;
    const sY = scaleYRef.current;
    const compNormal = computeNormalRef.current;

    const grad = deriv(prevX);

    // Check convergence criteria
    if (Math.abs(grad) < 0.0005) {
      setIsRunning(false);
      setStatusMessage('Converged at local/global minimum! 🎉');
      if (onComplete) onComplete(false);
      return;
    }

    // Check divergence
    if (Math.abs(prevX) > 10 || isNaN(prevX)) {
      setIsRunning(false);
      setStatusMessage('Diverged! Learning rate is too high ⚠️');
      if (onComplete) onComplete(false);
      return;
    }

    const { newX, state: newOptState } = opt.update(
      prevX,
      grad,
      lr,
      optimizerStateRef.current
    );

    optimizerStateRef.current = newOptState;

    // If step size is micro small, finish immediately
    const deltaX = newX - prevX;
    if (Math.abs(deltaX) < 0.0001) {
      setIsRunning(false);
      setStatusMessage('Converged: Step size near zero');
      if (onComplete) onComplete(false);
      return;
    }

    // Calculate jump duration proportional to playbackSpeed
    const jumpDuration = Math.max(100, Math.min(spd * 0.82, 400));
    const hopMaxHeight = Math.min(48, 14 + 18 * Math.min(Math.abs(deltaX), 2.5));
    const jumpDirection = deltaX >= 0 ? 1 : -1;

    // Precalculate trajectory arc points for ghost trajectory rendering
    const arcPts = [];
    const arcRes = 25;
    for (let k = 0; k <= arcRes; k++) {
      const p = k / arcRes;
      const xInterp = prevX + p * deltaX;
      const yInterp = fn(xInterp);
      const hop = Math.sin(p * Math.PI) * hopMaxHeight;
      arcPts.push(`${sX(xInterp).toFixed(1)},${(sY(yInterp) - hop).toFixed(1)}`);
    }
    const arcPath = `M ${arcPts.join(' L ')}`;

    isJumpingRef.current = true;
    const startTime = performance.now();

    const animateHop = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / jumpDuration);

      // Smooth horizontal progress
      const currentXInterp = prevX + progress * deltaX;
      const currentYInterp = fn(currentXInterp);
      const hop = Math.sin(progress * Math.PI) * hopMaxHeight;
      const currentNormal = compNormal(currentXInterp);

      setRenderPos({
        x: currentXInterp,
        y: currentYInterp,
        hopPx: hop,
        progress,
        isJumping: true,
        direction: jumpDirection,
        normalAngle: currentNormal,
        arcPath,
      });

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animateHop);
      } else {
        // Landing completed!
        isJumpingRef.current = false;
        currentXRef.current = newX;
        setCurrentX(newX);

        const nextY = fn(newX);
        const nextGrad = deriv(newX);
        const landedNormal = compNormal(newX);

        setRenderPos({
          x: newX,
          y: nextY,
          hopPx: 0,
          progress: 1,
          isJumping: false,
          direction: jumpDirection,
          normalAngle: landedNormal,
          arcPath: null,
        });

        setHistory((prevHistory) => {
          const nextStep = prevHistory.length;
          const newHist = [
            ...prevHistory,
            {
              step: nextStep,
              x: newX,
              y: nextY,
              grad: nextGrad,
              stepSize: newX - prevX,
            },
          ];
          return newHist.slice(-40);
        });

        if (Math.abs(nextGrad) < 0.0005) {
          setIsRunning(false);
          setStatusMessage('Converged at local/global minimum! 🎉');
          if (onComplete) onComplete(false);
        } else if (Math.abs(deltaX) < 0.001) {
          setStatusMessage('Plateau: Step size is near zero');
          if (onComplete) onComplete(true);
        } else {
          setStatusMessage(`Jumped to w = ${newX.toFixed(2)} (Moving ${deltaX > 0 ? 'Right →' : 'Left ←'})`);
          if (onComplete) onComplete(true);
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(animateHop);
  }, []);

  // Handle continuous auto-jump loop when isRunning is active
  useEffect(() => {
    if (!isRunning) {
      if (nextStepTimeoutRef.current) clearTimeout(nextStepTimeoutRef.current);
      return;
    }

    let isCancelled = false;

    const runLoop = () => {
      if (isCancelled || !isRunningRef.current) return;
      executeJumpStep((shouldContinue) => {
        if (!shouldContinue || isCancelled || !isRunningRef.current) return;
        const spd = playbackSpeedRef.current;
        const restDuration = Math.max(30, spd - Math.min(spd * 0.82, 400));
        nextStepTimeoutRef.current = setTimeout(() => {
          if (!isCancelled && isRunningRef.current) {
            runLoop();
          }
        }, restDuration);
      });
    };

    runLoop();

    return () => {
      isCancelled = true;
      if (nextStepTimeoutRef.current) clearTimeout(nextStepTimeoutRef.current);
    };
  }, [isRunning, executeJumpStep]);

  // Display coordinates (interpolated during projectile flight, or current state when static)
  const displayX = renderPos.isJumping ? renderPos.x : currentX;
  const displayY = renderPos.isJumping ? renderPos.y : safeFn(currentX);
  const displayHop = renderPos.isJumping ? renderPos.hopPx : 0;
  const displayNormalAngle = renderPos.isJumping ? renderPos.normalAngle : computeScreenNormalAngle(currentX);

  const currentY = safeFn(currentX);
  const currentGrad = safeDeriv(currentX);
  const nextStepDelta = -learningRate * currentGrad;
  const theoreticalNextX = currentX + nextStepDelta;

  // Convert screen mouse/touch pointer to exact domain X
  const getDomainXFromPointer = useCallback((clientX) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    if (!rect.width) return null;
    const rawClickX = clientX - rect.left;
    const svgX = (rawClickX / rect.width) * svgWidth;
    const normX = (svgX - padding.left) / plotWidth;
    const domainX = currentFunc.xMin + normX * xSpan;
    return Math.min(Math.max(domainX, currentFunc.xMin), currentFunc.xMax);
  }, [svgWidth, padding.left, plotWidth, currentFunc.xMin, currentFunc.xMax, xSpan]);

  // Smooth position update during drag
  const updatePositionWhileDragging = useCallback((domainX) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (nextStepTimeoutRef.current) clearTimeout(nextStepTimeoutRef.current);
    isJumpingRef.current = false;
    optimizerStateRef.current = {};

    const roundedX = Number(domainX.toFixed(3));
    currentXRef.current = roundedX;
    setCurrentX(roundedX);
    setInitialX(roundedX);
    const yVal = safeFn(roundedX);
    const gradVal = safeDeriv(roundedX);
    const normalAngle = computeScreenNormalAngle(roundedX);

    setRenderPos({
      x: roundedX,
      y: yVal,
      hopPx: 0,
      progress: 0,
      isJumping: false,
      direction: 1,
      normalAngle,
      arcPath: null,
    });

    setHistory([{
      step: 0,
      x: roundedX,
      y: yVal,
      grad: gradVal,
      stepSize: 0,
    }]);
    setStatusMessage(`Placed at w = ${roundedX.toFixed(2)} (Slope: ${gradVal.toFixed(2)})`);
  }, [safeFn, safeDeriv, computeScreenNormalAngle]);

  // Pointer Event Handlers for continuous butter-smooth dragging
  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (isRunning) setIsRunning(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    isJumpingRef.current = false;

    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    const domainX = getDomainXFromPointer(e.clientX);
    if (domainX !== null) {
      updatePositionWhileDragging(domainX);
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const domainX = getDomainXFromPointer(e.clientX);
    if (domainX !== null) {
      updatePositionWhileDragging(domainX);
    }
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    const domainX = getDomainXFromPointer(e.clientX);
    if (domainX !== null) {
      updatePositionWhileDragging(domainX);
    }
  };

  // Generate SVG path for loss curve
  const curvePoints = [];
  const resolution = 150;
  for (let i = 0; i <= resolution; i++) {
    const xVal = currentFunc.xMin + (i / resolution) * xSpan;
    let yVal = 0;
    try {
      yVal = safeFn(xVal);
      if (isNaN(yVal) || !isFinite(yVal)) yVal = currentFunc.yMin;
    } catch {
      yVal = currentFunc.yMin;
    }
    const clampedY = Math.min(Math.max(yVal, currentFunc.yMin - 10), currentFunc.yMax + 10);
    curvePoints.push(`${scaleX(xVal).toFixed(1)},${scaleY(clampedY).toFixed(1)}`);
  }
  const curvePathD = `M ${curvePoints.join(' L ')}`;

  // Tangent line calculation at current point
  const tangentSpan = 0.8;
  const tanX1 = currentX - tangentSpan;
  const tanY1 = currentY - (isNaN(currentGrad) ? 0 : currentGrad) * tangentSpan;
  const tanX2 = currentX + tangentSpan;
  const tanY2 = currentY + (isNaN(currentGrad) ? 0 : currentGrad) * tangentSpan;

  return (
    <div className="gd-simulation-container">
      {/* Editorial Header */}
      <header className="gd-header">
        <div className="gd-header-badge-row">
          <span className="gd-badge-pill" style={{ backgroundColor: currentFunc.badgeColor }}>
            {currentFunc.badge}
          </span>
          <span className="gd-badge-status">{statusMessage}</span>

          {/* Mode Switcher Toggle: Pogo Hills vs Math Studio */}
          <div className="visual-mode-toggle-pill">
            <button
              className={`vm-toggle-btn ${visualMode === 'pogo' ? 'active' : ''}`}
              onClick={() => setVisualMode('pogo')}
            >
              🌿 Pogo Hills
            </button>
            <button
              className={`vm-toggle-btn ${visualMode === 'math' ? 'active' : ''}`}
              onClick={() => setVisualMode('math')}
            >
              📊 Math Studio
            </button>
          </div>
        </div>
        <h1 className="gd-title">
          {visualMode === 'pogo' ? 'Pogo Stick Gradient Descent Adventure' : 'Gradient Descent Interactive Studio'}
        </h1>
        <p className="gd-subtitle">
          {visualMode === 'pogo'
            ? 'Help the Pogo Rider bounce down the green hills to find the lowest valley (global minimum)!'
            : 'Watch parameters iteratively slide down the loss slope ∇f(w) to minimize cost.'}
        </p>
      </header>

      {/* Main Simulation Layout: 2-Column Bento */}
      <div className="gd-main-grid">
        {/* Left Column: Visualizer Landscape & Convergence Curve */}
        <div className="gd-visualizer-card">
          <div className="card-header-bar">
            <div>
              <h3 className="card-sec-title">
                {visualMode === 'pogo' ? 'Grassy Hills Terrain' : 'Loss Landscape f(w)'}
              </h3>
              <span className="card-instruction-hint">Click or drag anywhere to position the Rider</span>
            </div>
            <div className="optimum-indicator">
              <span className="global-flag-legend">⛳ Green: Global Min</span>
              {detectedMinima.some((m) => !m.isGlobal) && (
                <span className="local-flag-legend"> • 🚩 Red: Local Min</span>
              )}
            </div>
          </div>

          {/* SVG Loss Curve / Green Hills Plot */}
          <div className={`svg-plot-wrapper ${visualMode === 'pogo' ? 'pogo-theme-wrapper' : ''}`}>
            <svg
              ref={svgRef}
              className={`loss-landscape-svg ${isDragging ? 'is-dragging-active' : ''}`}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={{ touchAction: 'none' }}
            >
              <defs>
                <pattern id="gdGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
                </pattern>
                <linearGradient id="curveFillGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F7D25A" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#FAF2D8" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="ballGlow" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#EE7258" />
                  <stop offset="100%" stopColor="#D84F33" />
                </linearGradient>

                {/* Green Hills & Sky Gradients */}
                <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#BAE6FD" />
                  <stop offset="55%" stopColor="#E0F2FE" />
                  <stop offset="100%" stopColor="#FAF2D8" />
                </linearGradient>
                <linearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#66BB6A" />
                  <stop offset="12%" stopColor="#43A047" />
                  <stop offset="35%" stopColor="#2E7D32" />
                  <stop offset="55%" stopColor="#6D4C41" />
                  <stop offset="100%" stopColor="#3E2723" />
                </linearGradient>
              </defs>

              {/* Sky / Grid Background */}
              {visualMode === 'pogo' ? (
                <g className="pogo-sky-group">
                  <rect width={svgWidth} height={svgHeight} fill="url(#skyGrad)" rx="16" />
                  {/* Cartoon Sun */}
                  <circle cx={svgWidth - 65} cy={45} r="22" fill="#FDE047" opacity="0.9" />
                  <circle cx={svgWidth - 65} cy={45} r="30" fill="#FEF08A" opacity="0.3" className="sun-pulse" />
                  {/* Fluffy Clouds */}
                  <g opacity="0.75" transform="translate(60, 30) scale(0.6)">
                    <path d="M 0 20 Q 15 0 35 15 Q 55 0 75 15 Q 95 10 95 25 Q 95 40 75 40 L 15 40 Q 0 40 0 20 Z" fill="#FFFFFF" />
                  </g>
                  <g opacity="0.6" transform="translate(260, 45) scale(0.45)">
                    <path d="M 0 20 Q 15 0 35 15 Q 55 0 75 15 Q 95 10 95 25 Q 95 40 75 40 L 15 40 Q 0 40 0 20 Z" fill="#FFFFFF" />
                  </g>
                </g>
              ) : (
                <rect width={svgWidth} height={svgHeight} fill="url(#gdGrid)" rx="16" />
              )}

              {/* Zero reference axis in Math Mode */}
              {visualMode === 'math' && currentFunc.yMin <= 0 && currentFunc.yMax >= 0 && (
                <line
                  x1={padding.left}
                  y1={scaleY(0)}
                  x2={svgWidth - padding.right}
                  y2={scaleY(0)}
                  stroke="rgba(0,0,0,0.12)"
                  strokeDasharray="4 4"
                />
              )}

              {/* Green Hills Earth Fill / Area Under Curve */}
              {visualMode === 'pogo' ? (
                <g className="green-hills-ground">
                  {/* Subterranean Earth Fill */}
                  <path
                    d={`${curvePathD} L ${scaleX(currentFunc.xMax)} ${svgHeight + 20} L ${scaleX(currentFunc.xMin)} ${svgHeight + 20} Z`}
                    fill="url(#grassGrad)"
                  />
                  {/* Top Lush Grass Ridge */}
                  <path
                    d={curvePathD}
                    fill="none"
                    stroke="#81C784"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <path
                    d={curvePathD}
                    fill="none"
                    stroke="#2E7D32"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </g>
              ) : (
                <>
                  <path
                    d={`${curvePathD} L ${scaleX(currentFunc.xMax)} ${svgHeight - padding.bottom} L ${scaleX(currentFunc.xMin)} ${svgHeight - padding.bottom} Z`}
                    fill="url(#curveFillGrad)"
                  />
                  <path
                    d={curvePathD}
                    fill="none"
                    stroke="#1B1C20"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </>
              )}

              {/* Flags at ALL Local and Global Minima */}
              {detectedMinima.map((min, idx) => {
                const posX = scaleX(min.x);
                const posY = scaleY(min.y);
                const isGlobal = min.isGlobal;
                const flagColor = isGlobal ? '#22C55E' : '#EF4444'; // Green for global, Red for local
                const poleColor = isGlobal ? '#166534' : '#37474F';
                const tipColor = isGlobal ? '#EAB308' : '#94A3B8';

                return (
                  <g key={`flag-${idx}-${min.x}`} transform={`translate(${posX}, ${posY})`} className="minima-flag-marker">
                    {/* Glowing base ring for global minimum */}
                    {isGlobal && (
                      <ellipse cx="0" cy="0" rx="10" ry="3.5" fill="#22C55E" opacity="0.3" className="global-flag-glow" />
                    )}

                    {/* Flagpole */}
                    <line x1="0" y1="0" x2="0" y2="-32" stroke={poleColor} strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="0" cy="-33" r="2.5" fill={tipColor} />

                    {/* Flag Fabric (Green for Global, Red for Local) */}
                    <polygon
                      points="0,-32 18,-25 0,-18"
                      fill={flagColor}
                      stroke="#FFFFFF"
                      strokeWidth="0.8"
                    />

                    {/* Mini Badge / Label over the flag */}
                    <g transform="translate(0, -42)" className="flag-label-group">
                      <rect
                        x={isGlobal ? -32 : -28}
                        y="-12"
                        width={isGlobal ? 64 : 56}
                        height="16"
                        rx="8"
                        fill={isGlobal ? '#14532D' : '#7F1D1D'}
                        stroke="#FFFFFF"
                        strokeWidth="1"
                        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))"
                      />
                      <text
                        x="0"
                        y="0"
                        textAnchor="middle"
                        fontFamily="var(--font-primary)"
                        fontSize="9"
                        fontWeight="700"
                        fill="#FFFFFF"
                      >
                        {isGlobal ? 'Global 🌟' : 'Local ⚠️'}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Descent History Trajectory Line & Step Markers */}
              {history.length > 1 && (
                <g className="history-trajectory">
                  {history.map((pt, i) => {
                    if (i === 0) return null;
                    const prev = history[i - 1];
                    return (
                      <line
                        key={`line-${i}`}
                        x1={scaleX(prev.x)}
                        y1={scaleY(prev.y)}
                        x2={scaleX(pt.x)}
                        y2={scaleY(pt.y)}
                        stroke={visualMode === 'pogo' ? '#F7D25A' : '#EE7258'}
                        strokeWidth={visualMode === 'pogo' ? '3' : '2.5'}
                        strokeDasharray={visualMode === 'pogo' ? '4 3' : '3 3'}
                        opacity="0.85"
                      />
                    );
                  })}
                  {history.map((pt, i) => (
                    <circle
                      key={`pt-${i}`}
                      cx={scaleX(pt.x)}
                      cy={scaleY(pt.y)}
                      r={i === history.length - 1 ? 0 : 3.5}
                      fill={visualMode === 'pogo' ? '#F7D25A' : '#EE7258'}
                      stroke={visualMode === 'pogo' ? '#333' : 'none'}
                      strokeWidth={visualMode === 'pogo' ? '1' : '0'}
                      opacity="0.9"
                    />
                  ))}
                </g>
              )}

              {/* Projectile Flight Trajectory Ghost Arc */}
              {renderPos.isJumping && renderPos.arcPath && (
                <path
                  d={renderPos.arcPath}
                  fill="none"
                  stroke={visualMode === 'pogo' ? '#F59E0B' : '#EE7258'}
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                  opacity="0.8"
                  className="projectile-flight-arc"
                />
              )}

              {/* Tangent Slope Line at Current Point */}
              <line
                x1={scaleX(tanX1)}
                y1={scaleY(tanY1)}
                x2={scaleX(tanX2)}
                y2={scaleY(tanY2)}
                stroke={visualMode === 'pogo' ? 'rgba(33, 150, 243, 0.6)' : '#2B7DE9'}
                strokeWidth="2"
                strokeDasharray="4 3"
              />

              {/* Gradient Descent Step Vector Arrow */}
              <line
                x1={scaleX(displayX)}
                y1={scaleY(displayY) - displayHop}
                x2={scaleX(theoreticalNextX)}
                y2={scaleY(displayY) - displayHop}
                stroke="#EE7258"
                strokeWidth="3"
                opacity={renderPos.isJumping ? 0.3 : 1}
              />

              {/* Pogo Stick Man OR Animated Glow Ball (Driven by Projectile Physics) */}
              {visualMode === 'pogo' ? (
                <g
                  className={`pogo-rider-anchor ${isDragging ? 'is-dragging' : ''} ${renderPos.isJumping ? 'is-in-flight' : ''}`}
                  style={{
                    transform: `translate(${scaleX(displayX)}px, ${scaleY(displayY) - displayHop}px)`,
                  }}
                >
                  {/* Subtle ground shadow while airborne */}
                  {renderPos.isJumping && displayHop > 3 && (
                    <ellipse
                      cx="0"
                      cy={displayHop}
                      rx={Math.max(6, 14 - displayHop * 0.2)}
                      ry={Math.max(2, 4 - displayHop * 0.05)}
                      fill="rgba(0,0,0,0.22)"
                    />
                  )}

                  {/* Ground target circle when dragging */}
                  {isDragging && (
                    <ellipse cx="0" cy="0" rx="14" ry="4" fill="rgba(0,0,0,0.25)" />
                  )}

                  <PogoRider
                    angleDeg={displayNormalAngle}
                    isBouncing={isDragging}
                    isAirborne={renderPos.isJumping && displayHop > 2}
                    jumpProgress={renderPos.progress}
                    direction={renderPos.direction}
                    scale={isDragging ? 1.05 : 0.9}
                    showSpeechBubble={true}
                    speechText={
                      isDragging
                        ? 'Wheee! 🎯'
                        : renderPos.isJumping
                        ? displayHop > 18
                          ? 'Wheeee! 🚀'
                          : 'Hop! 💨'
                        : Math.abs(currentGrad) < 0.005
                        ? 'Valley reached! 🏁'
                        : Math.abs(currentGrad) > 3
                        ? 'Steep hill! ⚠️'
                        : 'Ready to bounce!'
                    }
                  />
                </g>
              ) : (
                <g
                  className={`animated-gradient-ball ${isDragging ? 'is-dragging' : ''} ${renderPos.isJumping ? 'is-in-flight' : ''}`}
                  style={{
                    transform: `translate(${scaleX(displayX)}px, ${scaleY(displayY) - displayHop}px)`,
                  }}
                >
                  {/* Ground shadow while airborne in math mode */}
                  {renderPos.isJumping && displayHop > 3 && (
                    <ellipse
                      cx="0"
                      cy={displayHop}
                      rx={Math.max(4, 10 - displayHop * 0.15)}
                      ry={Math.max(1.5, 3 - displayHop * 0.04)}
                      fill="rgba(0,0,0,0.2)"
                    />
                  )}

                  {/* Outer Drag Target Halo */}
                  <circle
                    r={isDragging ? '20' : renderPos.isJumping ? '16' : '14'}
                    fill="#EE7258"
                    opacity={isDragging ? '0.45' : '0.25'}
                    className="ball-pulsar"
                  />
                  <circle r="8" fill="url(#ballGlow)" stroke="#FFFFFF" strokeWidth="2.5" />
                </g>
              )}

              {/* X and Y Axis Labels */}
              <text
                x={svgWidth - padding.right}
                y={svgHeight - 12}
                textAnchor="end"
                className={`axis-label ${visualMode === 'pogo' ? 'pogo-axis-label' : ''}`}
              >
                {visualMode === 'pogo' ? 'Position (w) ➔' : 'Parameter (w)'}
              </text>
              <text
                x={padding.left - 10}
                y={padding.top - 10}
                textAnchor="start"
                className={`axis-label ${visualMode === 'pogo' ? 'pogo-axis-label' : ''}`}
              >
                {visualMode === 'pogo' ? 'Altitude (Cost)' : 'Cost f(w)'}
              </text>
            </svg>
          </div>

          {/* Quick Metrics Bar Under Canvas */}
          <div className="metrics-strip">
            <div className="metric-chip">
              <span className="metric-tag">Weight (w)</span>
              <strong className="metric-val">{currentX.toFixed(3)}</strong>
            </div>
            <div className="metric-chip">
              <span className="metric-tag">Cost f(w)</span>
              <strong className="metric-val">{currentY.toFixed(3)}</strong>
            </div>
            <div className="metric-chip">
              <span className="metric-tag">Slope f'(w)</span>
              <strong className={`metric-val ${Math.abs(currentGrad) < 0.01 ? 'converged' : ''}`}>
                {currentGrad.toFixed(3)}
              </strong>
            </div>
            <div className="metric-chip">
              <span className="metric-tag">Step #</span>
              <strong className="metric-val">{history.length - 1}</strong>
            </div>
          </div>
        </div>

        {/* Right Column: Controls, Math Blackboard & Intuition */}
        <div className="gd-controls-column">
          {/* Landscape Preset Selector with Custom Function Trigger */}
          <div className="bento-subcard surface-cream">
            <div className="card-top-row">
              <label className="bento-label">Select Loss Function</label>
              <button
                type="button"
                className="add-custom-fn-trigger-btn"
                onClick={() => setIsCustomModalOpen(true)}
              >
                ✨ + Custom Function
              </button>
            </div>

            <div className="preset-pill-grid">
              {Object.values(allFunctions).map((fn) => (
                <button
                  key={fn.id}
                  className={`preset-btn ${selectedFuncKey === fn.id ? 'active' : ''} ${
                    fn.isCustom ? 'custom-func-pill' : ''
                  }`}
                  onClick={() => setSelectedFuncKey(fn.id)}
                >
                  <span className="preset-name">{fn.name}</span>
                  {fn.isCustom && (
                    <span
                      className="delete-custom-pill-btn"
                      title="Delete function"
                      onClick={(e) => handleDeleteCustomFunc(e, fn.id)}
                    >
                      ×
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Playback & Step Controls */}
          <div className="bento-subcard surface-dark">
            <div className="playback-actions-row">
              <button
                className={`action-btn-primary ${isRunning ? 'btn-pause' : 'btn-play'}`}
                onClick={() => setIsRunning(!isRunning)}
              >
                {isRunning ? '⏸ Pause' : '▶ Start Descent'}
              </button>
              <button
                className="action-btn-secondary"
                onClick={() => executeJumpStep()}
                disabled={isRunning || renderPos.isJumping}
              >
                ⏭ Step
              </button>
              <button
                className="action-btn-secondary"
                onClick={() => resetSimulation()}
              >
                ↺ Reset
              </button>
            </div>

            {/* Speed Selector Pills */}
            <div className="speed-pills-row">
              <span className="param-title">Speed:</span>
              <div className="speed-btn-group">
                {[
                  { label: '0.5x', ms: 500 },
                  { label: '1x', ms: 250 },
                  { label: '2x', ms: 120 },
                  { label: '5x', ms: 40 },
                ].map((spd) => (
                  <button
                    key={spd.label}
                    className={`speed-pill ${playbackSpeed === spd.ms ? 'active' : ''}`}
                    onClick={() => setPlaybackSpeed(spd.ms)}
                  >
                    {spd.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Hyperparameter Sliders */}
            <div className="slider-control-group">
              {/* Learning Rate Slider */}
              <div className="slider-row">
                <div className="slider-labels">
                  <span className="param-title">Learning Rate (α)</span>
                  <span className="param-value-pill">{learningRate.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="0.005"
                  max="0.8"
                  step="0.005"
                  value={learningRate}
                  onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                  className="editorial-slider lr-slider"
                />
                <div className="slider-subtext">
                  <span>Too Small (Slow)</span>
                  <span>Optimal</span>
                  <span>Too High (Oscillates)</span>
                </div>
              </div>

              {/* Initial Point Slider */}
              <div className="slider-row">
                <div className="slider-labels">
                  <span className="param-title">Starting Position (w₀)</span>
                  <span className="param-value-pill">{initialX.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={currentFunc.xMin}
                  max={currentFunc.xMax}
                  step="0.1"
                  value={initialX}
                  onChange={(e) => resetSimulation(parseFloat(e.target.value))}
                  className="editorial-slider pos-slider"
                />
              </div>

              {/* Optimizer Toggle */}
              <div className="optimizer-toggle-row">
                <span className="param-title">Optimizer:</span>
                <div className="opt-pills">
                  {Object.values(OPTIMIZERS).map((opt) => (
                    <button
                      key={opt.id}
                      className={`opt-pill-btn ${selectedOptimizer === opt.id ? 'active' : ''}`}
                      onClick={() => setSelectedOptimizer(opt.id)}
                    >
                      {opt.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Editorial Blackboard: Live Step Math & Intuition */}
          <div className="bento-subcard surface-yellow">
            <div className="card-top-row">
              <h4 className="yellow-card-title">Live Update Formula</h4>
              <span className="doodle-accent-badge">Instant Math</span>
            </div>

            <div className="math-equation-box">
              <div className="formula-row">
                <span className="math-token variable">w_new</span>
                <span className="math-token operator">=</span>
                <span className="math-token current">w_old</span>
                <span className="math-token operator">−</span>
                <span className="math-token lr">α</span>
                <span className="math-token operator">×</span>
                <span className="math-token grad">f'(w_old)</span>
              </div>

              <div className="formula-substitution-row">
                <span className="math-num new-val">{theoreticalNextX.toFixed(3)}</span>
                <span className="math-token operator">=</span>
                <span className="math-num current-val">{currentX.toFixed(3)}</span>
                <span className="math-token operator">−</span>
                <span className="math-num lr-val">{learningRate.toFixed(2)}</span>
                <span className="math-token operator">×</span>
                <span className="math-num grad-val">({currentGrad.toFixed(3)})</span>
              </div>
            </div>

            {/* Hand-drawn editorial takeaway */}
            <div className="editorial-handwritten-note">
              <span className="hand-sketch-arrow">✍️</span>
              <p className="handwritten-comment">
                {currentGrad > 0
                  ? `Positive slope (+${currentGrad.toFixed(2)}) pushes parameter LEFT towards valley.`
                  : currentGrad < 0
                  ? `Negative slope (${currentGrad.toFixed(2)}) pushes parameter RIGHT towards valley.`
                  : `Slope is 0.00: Perfect minimum reached!`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Math Function Modal Builder */}
      <CustomFunctionModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onApplyCustomFunction={handleApplyCustomFunction}
      />
    </div>
  );
}
