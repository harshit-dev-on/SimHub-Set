import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './GradientDescent.css';
import { LOSS_FUNCTIONS, OPTIMIZERS, findFunctionMinima } from './simulationMath';
import { compileMathExpression } from './mathParser';
import CustomFunctionModal from './CustomFunctionModal';
import StudentGuideModal from './StudentGuideModal';
import LossCurveChart from './LossCurveChart';
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
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('all'); // 'all' | 'math' | 'loss' | 'concepts' | 'quests' | 'history'
  const [selectedOptimizer, setSelectedOptimizer] = useState('sgd');
  const [learningRate, setLearningRate] = useState(0.15);
  const [currentX, setCurrentX] = useState(3.2);
  const [initialX, setInitialX] = useState(3.2);
  const [isRunning, setIsRunning] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(250); // ms per step
  const [history, setHistory] = useState([]);
  const [stepCount, setStepCount] = useState(0);
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
    setStepCount(0);
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
        setStepCount((prev) => prev + 1);

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

  const handleLaunchQuest = useCallback((funcId, startX, lr, optId) => {
    setSelectedFuncKey(funcId);
    setSelectedOptimizer(optId);
    setLearningRate(lr);
    resetSimulation(startX);
    setStatusMessage(`🎯 Quest Loaded! Press '▶ Start Descent' to observe.`);
  }, [resetSimulation]);

  // Keyboard Shortcuts for seamless student interactivity
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsRunning((prev) => !prev);
      } else if (e.code === 'ArrowRight' || e.code === 'KeyN') {
        e.preventDefault();
        if (!isRunningRef.current && !isJumpingRef.current) {
          executeJumpStep();
        }
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        resetSimulation();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        setVisualMode((prev) => (prev === 'pogo' ? 'math' : 'pogo'));
      } else if (e.code === 'KeyG') {
        e.preventDefault();
        setIsGuideOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [executeJumpStep, resetSimulation]);

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
    setStepCount(0);
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
    <div className="sim-split-studio-layout gd-split-layout">
      {/* Left Column: UNSCROLLABLE WORKBENCH */}
      <div className="unscrollable-workbench-pane">
        <div className="workbench-top-simulation">
          {/* Main Visualizer Landscape Plot Card */}
          <div className="gd-visualizer-card">
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
                    <circle cx={svgWidth - 65} cy={45} r="28" fill="#FEF08A" opacity="0.4" />
                    {/* Clouds */}
                    <g className="pogo-clouds" opacity="0.85">
                      <ellipse cx="120" cy="50" rx="35" ry="14" fill="#FFFFFF" />
                      <ellipse cx="140" cy="42" rx="22" ry="16" fill="#FFFFFF" />
                      <ellipse cx="380" cy="65" rx="42" ry="16" fill="#FFFFFF" />
                      <ellipse cx="405" cy="55" rx="26" ry="18" fill="#FFFFFF" />
                    </g>
                  </g>
                ) : (
                  <rect width={svgWidth} height={svgHeight} fill="url(#gdGrid)" rx="16" />
                )}

                {/* Axis Reference Lines in Math Mode */}
                {visualMode === 'math' && (
                  <>
                    <line
                      x1={padding.left}
                      y1={svgHeight - padding.bottom}
                      x2={svgWidth - padding.right}
                      y2={svgHeight - padding.bottom}
                      stroke="#8C887A"
                      strokeWidth="1.5"
                    />
                    <line
                      x1={padding.left}
                      y1={padding.top}
                      x2={padding.left}
                      y2={svgHeight - padding.bottom}
                      stroke="#8C887A"
                      strokeWidth="1.5"
                    />
                  </>
                )}

                {/* Projectile Trajectory Flight Ghost Arc */}
                {renderPos.isJumping && renderPos.arcPath && (
                  <path
                    d={renderPos.arcPath}
                    fill="none"
                    stroke={visualMode === 'pogo' ? 'rgba(255, 255, 255, 0.85)' : '#EE7258'}
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                    className="projectile-flight-arc"
                  />
                )}

                {/* Tangent Slope Line */}
                {!renderPos.isJumping && visualMode === 'math' && (
                  <line
                    x1={scaleX(tanX1)}
                    y1={scaleY(tanY1)}
                    x2={scaleX(tanX2)}
                    y2={scaleY(tanY2)}
                    stroke="#D97706"
                    strokeWidth="2.5"
                    strokeDasharray="5 3"
                    strokeLinecap="round"
                  />
                )}

                {/* History Step Dots & Connectors */}
                {history.map((pt, idx) => {
                  if (idx === 0) return null;
                  const prevPt = history[idx - 1];
                  return (
                    <g key={`hist-${idx}`}>
                      <line
                        x1={scaleX(prevPt.x)}
                        y1={scaleY(prevPt.y)}
                        x2={scaleX(pt.x)}
                        y2={scaleY(pt.y)}
                        stroke="#EE7258"
                        strokeWidth="1.8"
                        strokeDasharray="3 3"
                        opacity={0.6}
                      />
                      <circle
                        cx={scaleX(pt.x)}
                        cy={scaleY(pt.y)}
                        r="3"
                        fill="#EE7258"
                        stroke="#FFFFFF"
                        strokeWidth="1"
                        opacity={0.85}
                      />
                    </g>
                  );
                })}

                {/* The Continuous Curve / Hills Landscape */}
                {visualMode === 'pogo' ? (
                  <g className="pogo-hills-terrain">
                    <path
                      d={`${curvePathD} L ${scaleX(currentFunc.xMax)} ${svgHeight} L ${scaleX(currentFunc.xMin)} ${svgHeight} Z`}
                      fill="url(#grassGrad)"
                    />
                    <path
                      d={curvePathD}
                      fill="none"
                      stroke="#2E7D32"
                      strokeWidth="5"
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
                  const flagColor = isGlobal ? '#22C55E' : '#EF4444';
                  const poleColor = isGlobal ? '#166534' : '#37474F';
                  const tipColor = isGlobal ? '#EAB308' : '#94A3B8';

                  return (
                    <g key={`flag-${idx}-${min.x}`} transform={`translate(${posX}, ${posY})`} className="minima-flag-marker">
                      {isGlobal && (
                        <ellipse cx="0" cy="0" rx="10" ry="3.5" fill="#22C55E" opacity="0.3" className="global-flag-glow" />
                      )}
                      <line x1="0" y1="0" x2="0" y2="-32" stroke={poleColor} strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="0" cy="-33" r="2.5" fill={tipColor} />
                      <polygon
                        points="0,-32 18,-25 0,-18"
                        fill={flagColor}
                        stroke="#FFFFFF"
                        strokeWidth="0.8"
                      />
                    </g>
                  );
                })}

                {/* Current Descending Point (Pogo Rider or Glowing Ball) */}
                {visualMode === 'pogo' ? (
                  <g
                    className={`pogo-rider-anchor ${isDragging ? 'is-dragging' : ''}`}
                    style={{
                      transform: `translate(${scaleX(displayX)}px, ${scaleY(displayY) - displayHop}px)`,
                    }}
                  >
                    {renderPos.isJumping && displayHop > 3 && (
                      <ellipse
                        cx="0"
                        cy={displayHop}
                        rx={Math.max(6, 14 - displayHop * 0.2)}
                        ry={Math.max(2, 4 - displayHop * 0.05)}
                        fill="rgba(0,0,0,0.22)"
                      />
                    )}
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
                    />
                  </g>
                ) : (
                  <g
                    className={`animated-gradient-ball ${isDragging ? 'is-dragging' : ''} ${renderPos.isJumping ? 'is-in-flight' : ''}`}
                    style={{
                      transform: `translate(${scaleX(displayX)}px, ${scaleY(displayY) - displayHop}px)`,
                    }}
                  >
                    {renderPos.isJumping && displayHop > 3 && (
                      <ellipse
                        cx="0"
                        cy={displayHop}
                        rx={Math.max(4, 10 - displayHop * 0.15)}
                        ry={Math.max(1.5, 3 - displayHop * 0.04)}
                        fill="rgba(0,0,0,0.2)"
                      />
                    )}
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
                <strong className="metric-val">{stepCount}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Area: DIFFERENT PARAMETERS TO RUN SIMULATION */}
        <div className="workbench-bottom-controls">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="gd-badge-status" style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              {statusMessage}
            </span>
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

          {/* Unified Controls Row */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
            
            {/* Playback Controls */}
            <div className="playback-buttons-group" style={{ display: 'flex', gap: '6px' }}>
              <button
                className={`action-btn-primary ${isRunning ? 'btn-pause' : 'btn-play'}`}
                onClick={() => setIsRunning(!isRunning)}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                {isRunning ? '⏸ Pause' : '▶ Start'}
              </button>
              <button className="action-btn-secondary" onClick={() => executeJumpStep()} disabled={isRunning || renderPos.isJumping} style={{ padding: '6px 10px', fontSize: '12px' }}>
                ⏭ Step
              </button>
              <button className="action-btn-secondary" onClick={() => resetSimulation()} style={{ padding: '6px 10px', fontSize: '12px' }}>
                ↺ Reset
              </button>
              <button
                className="action-btn-secondary"
                onClick={() => {
                  const speeds = [500, 250, 120, 40];
                  const currentIndex = speeds.indexOf(playbackSpeed);
                  setPlaybackSpeed(speeds[(currentIndex + 1) % speeds.length]);
                }}
                style={{ width: '70px', padding: '6px 4px', fontSize: '12px' }}
              >
                {playbackSpeed === 500 ? '🐢 0.5x' : playbackSpeed === 250 ? '🚶 1x' : playbackSpeed === 120 ? '🏃 2x' : playbackSpeed === 40 ? '🚀 5x' : 'Speed'}
              </button>
            </div>

            <div style={{ width: '1.5px', height: '24px', background: 'rgba(0,0,0,0.08)' }}></div>

            {/* Landscape Select */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <select
                value={selectedFuncKey}
                onChange={(e) => setSelectedFuncKey(e.target.value)}
                style={{
                  padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.15)',
                  fontSize: '12px', fontWeight: '600', cursor: 'pointer', outline: 'none', background: '#fff'
                }}
              >
                {Object.values(allFunctions).map((fn) => (
                  <option key={fn.id} value={fn.id}>{fn.name}</option>
                ))}
              </select>
              <button className="add-custom-fn-trigger-btn" onClick={() => setIsCustomModalOpen(true)} style={{ padding: '6px 10px', fontSize: '12px' }}>
                ✨ Custom
              </button>
              {allFunctions[selectedFuncKey]?.isCustom && (
                <button type="button" onClick={(e) => handleDeleteCustomFunc(e, selectedFuncKey)} style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}>
                  🗑️
                </button>
              )}
            </div>

            <div style={{ width: '1.5px', height: '24px', background: 'rgba(0,0,0,0.08)' }}></div>

            {/* Learning Rate Slider */}
            <div style={{ flex: 1, minWidth: '140px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#444', whiteSpace: 'nowrap' }}>
                LR: {learningRate.toFixed(3)}
              </span>
              <input
                type="range"
                min="0.005"
                max="0.8"
                step="0.005"
                value={learningRate}
                onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                className="editorial-slider lr-slider"
                style={{ flex: 1, margin: 0 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: SCROLLABLE ANALYSIS & CONCEPTS */}
      <div className="scrollable-analysis-pane">
        {/* Top Tab Selector Pills */}
        <div className="analysis-tabs-bar">
          <button
            className={`analysis-tab-pill ${activeAnalysisTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveAnalysisTab('all')}
          >
            📋 All Notes
          </button>
          <button
            className={`analysis-tab-pill ${activeAnalysisTab === 'math' ? 'active' : ''}`}
            onClick={() => setActiveAnalysisTab('math')}
          >
            📐 Live Math
          </button>
          <button
            className={`analysis-tab-pill ${activeAnalysisTab === 'loss' ? 'active' : ''}`}
            onClick={() => setActiveAnalysisTab('loss')}
          >
            📉 Loss Curve
          </button>
          <button
            className={`analysis-tab-pill ${activeAnalysisTab === 'concepts' ? 'active' : ''}`}
            onClick={() => setActiveAnalysisTab('concepts')}
          >
            🎓 Concepts
          </button>
          <button
            className={`analysis-tab-pill ${activeAnalysisTab === 'quests' ? 'active' : ''}`}
            onClick={() => setActiveAnalysisTab('quests')}
          >
            🎯 Quests
          </button>
          <button
            className={`analysis-tab-pill ${activeAnalysisTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveAnalysisTab('history')}
          >
            📝 Step Log
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="analysis-scrollable-content">
          {/* Live Update Formula (When 'all' or 'math') */}
          {(activeAnalysisTab === 'all' || activeAnalysisTab === 'math') && (
            <div className="bento-subcard surface-yellow">
              <div className="card-top-row">
                <h4 className="yellow-card-title">Live Update Formula & Calculus</h4>
                <span className="doodle-accent-badge">Instant Calculus</span>
              </div>

              {/* Active Function & Derivative Strip */}
              <div className="landscape-formula-banner" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid #E2D9C8', borderRadius: '8px', padding: '6px 10px', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', fontFamily: "'Fira Code', monospace" }}>
                  <span style={{ color: '#64748B', fontWeight: '700' }}>Loss Function:</span>
                  <span style={{ color: '#0F172A', fontWeight: '800' }}>{currentFunc.readableFormula || currentFunc.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', fontFamily: "'Fira Code', monospace" }}>
                  <span style={{ color: '#64748B', fontWeight: '700' }}>Derivative f'(x):</span>
                  <span style={{ color: '#D97706', fontWeight: '800' }}>{currentFunc.derivReadable || "f'(x)"}</span>
                </div>
              </div>

              <div className="math-equation-box">
                <div className="formula-row">
                  <span className="math-token variable">wₜ₊₁</span>
                  <span className="math-token operator">=</span>
                  <span className="math-token current">wₜ</span>
                  <span className="math-token operator">−</span>
                  <span className="math-token lr">α</span>
                  <span className="math-token operator">×</span>
                  <span className="math-token grad">f'(wₜ)</span>
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

              <div className="editorial-handwritten-note">
                <span className="hand-sketch-arrow">✍️</span>
                <p className="handwritten-comment">
                  {currentGrad > 0
                    ? `Positive slope (+${currentGrad.toFixed(2)}) pushes parameter LEFT towards the minimum.`
                    : currentGrad < 0
                    ? `Negative slope (${currentGrad.toFixed(2)}) pushes parameter RIGHT towards the minimum.`
                    : `Slope is 0.00: Perfect minimum reached!`}
                </p>
              </div>
            </div>
          )}

          {/* Loss Convergence Sparkline (When 'all' or 'loss') */}
          {(activeAnalysisTab === 'all' || activeAnalysisTab === 'loss') && (
            <LossCurveChart
              history={history}
              initialLoss={safeFn(initialX)}
              currentLoss={currentY}
            />
          )}

          {/* Guided Student Quests Strip (When 'all' or 'quests') */}
          {(activeAnalysisTab === 'all' || activeAnalysisTab === 'quests') && (
            <div className="quests-analysis-card surface-cream">
              <div className="card-top-row">
                <h4 className="card-sec-title">🎯 Guided Student Quests</h4>
                <span className="modal-sub-badge">1-Click Scenarios</span>
              </div>
              <div className="quest-cards-vertical-list">
                <button
                  type="button"
                  className="quest-action-card"
                  onClick={() => handleLaunchQuest('quadratic', 3.2, 0.15, 'sgd')}
                >
                  <span className="q-icon">⛳</span>
                  <div className="q-info">
                    <strong>Standard Smooth Descent</strong>
                    <p>Quadratic bowl with optimal step size (α = 0.15, SGD)</p>
                  </div>
                </button>

                <button
                  type="button"
                  className="quest-action-card"
                  onClick={() => handleLaunchQuest('doubleWell', 1.8, 0.08, 'momentum')}
                >
                  <span className="q-icon">🕳️</span>
                  <div className="q-info">
                    <strong>Escape Local Minima Trap</strong>
                    <p>Double Well with Momentum (β = 0.85) to carry inertia over peaks</p>
                  </div>
                </button>

                <button
                  type="button"
                  className="quest-action-card"
                  onClick={() => handleLaunchQuest('quadratic', 3.2, 0.55, 'sgd')}
                >
                  <span className="q-icon">🚀</span>
                  <div className="q-info">
                    <strong>Overshoot & Divergence Chaos</strong>
                    <p>High learning rate (α = 0.55) causing chaotic oscillations</p>
                  </div>
                </button>

                <button
                  type="button"
                  className="quest-action-card"
                  onClick={() => handleLaunchQuest('plateau', 3.5, 0.25, 'momentum')}
                >
                  <span className="q-icon">⚡</span>
                  <div className="q-info">
                    <strong>Momentum Plateau Acceleration</strong>
                    <p>Speed up through flat gradients using momentum accumulation</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Student Concept Notes (When 'all' or 'concepts') */}
          {(activeAnalysisTab === 'all' || activeAnalysisTab === 'concepts') && (
            <div className="concepts-analysis-card surface-cream">
              <div className="card-top-row">
                <h4 className="card-sec-title">🎓 Core Concepts & Intuition</h4>
                <button
                  type="button"
                  className="open-full-guide-btn"
                  onClick={() => setIsGuideOpen(true)}
                >
                  Full Modal Guide ➔
                </button>
              </div>

              <div className="concepts-cards-stack">
                <div className="concept-brief-box">
                  <strong>⛰️ The Foggy Mountain Analogy</strong>
                  <p>
                    You are blindfolded in thick mist on a mountain. By feeling the slope under your feet, you step downhill in the direction of steepest descent.
                  </p>
                </div>
                <div className="concept-brief-box">
                  <strong>🏃 The Learning Rate (α)</strong>
                  <p>
                    Step size multiplier. Too small = slow baby steps; Too high = wild overshoot; Just right = fast smooth convergence.
                  </p>
                </div>
                <div className="concept-brief-box">
                  <strong>⛳ Local vs Global Minima</strong>
                  <p>
                    A local minimum is a small dip in the landscape (Red Flag 🚩). The global minimum is the true bottom (Green Flag ⛳).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step History Log Table (When 'all' or 'history') */}
          {(activeAnalysisTab === 'all' || activeAnalysisTab === 'history') && (
            <div className="history-log-card surface-cream">
              <div className="card-top-row">
                <h4 className="card-sec-title">📝 Step-by-Step History Log</h4>
                <span className="history-count-badge">{history.length} Points</span>
              </div>
              <div className="history-table-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Step</th>
                      <th>w</th>
                      <th>f(w)</th>
                      <th>f'(w)</th>
                      <th>Δw</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice().reverse().map((h) => (
                      <tr key={`h-row-${h.step}-${h.x}`}>
                        <td>#{h.step}</td>
                        <td className="mono-cell">{h.x.toFixed(3)}</td>
                        <td className="mono-cell">{h.y.toFixed(3)}</td>
                        <td className="mono-cell">{h.grad.toFixed(3)}</td>
                        <td className="mono-cell">{h.stepSize.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Math Function Modal Builder */}
      <CustomFunctionModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onApplyCustomFunction={handleApplyCustomFunction}
      />

      {/* Student Guided Learning Modal */}
      <StudentGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onLaunchQuest={handleLaunchQuest}
      />
    </div>
  );
}
