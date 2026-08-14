import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './GradientDescent.css';
import { LOSS_FUNCTIONS, OPTIMIZERS } from './simulationMath';
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
  const [optimizerState, setOptimizerState] = useState({});
  const [statusMessage, setStatusMessage] = useState('Ready to descend');

  const currentFunc = allFunctions[selectedFuncKey] || allFunctions.quadratic;
  const currentOpt = OPTIMIZERS[selectedOptimizer];
  const timerRef = useRef(null);

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
  const resetSimulation = useCallback((newX0 = null) => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    const startX = newX0 !== null ? newX0 : currentFunc.defaultX0;
    setInitialX(startX);
    setCurrentX(startX);
    const startY = currentFunc.fn(startX);
    const startGrad = currentFunc.derivative(startX);

    setHistory([{
      step: 0,
      x: startX,
      y: startY,
      grad: startGrad,
      stepSize: 0,
    }]);
    setOptimizerState({});
    setStatusMessage('Ready to descend');
  }, [currentFunc]);

  useEffect(() => {
    setLearningRate(currentFunc.defaultLr);
    resetSimulation(currentFunc.defaultX0);
  }, [selectedFuncKey, resetSimulation, currentFunc.defaultLr, currentFunc.defaultX0]);

  // Execute a single gradient descent step
  const stepDescent = useCallback(() => {
    setCurrentX((prevX) => {
      const grad = currentFunc.derivative(prevX);

      // Check convergence criteria
      if (Math.abs(grad) < 0.0005) {
        setIsRunning(false);
        setStatusMessage('Converged at local/global minimum! 🎉');
        return prevX;
      }

      // Check divergence
      if (Math.abs(prevX) > 10 || isNaN(prevX)) {
        setIsRunning(false);
        setStatusMessage('Diverged! Learning rate is too high ⚠️');
        return prevX;
      }

      const { newX, state: newOptState } = currentOpt.update(
        prevX,
        grad,
        learningRate,
        optimizerState
      );

      setOptimizerState(newOptState);

      const nextY = currentFunc.fn(newX);
      const nextGrad = currentFunc.derivative(newX);

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
        return newHist.slice(-40); // keep last 40 for clean rendering
      });

      if (Math.abs(newX - prevX) < 0.001) {
        setStatusMessage('Plateau: Step size is near zero');
      } else {
        setStatusMessage(`Step ${history.length}: Moving ${grad > 0 ? 'Left ←' : 'Right →'}`);
      }

      return newX;
    });
  }, [currentFunc, currentOpt, learningRate, optimizerState, history.length]);

  // Handle play/pause timer
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        stepDescent();
      }, playbackSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, playbackSpeed, stepDescent]);

  // Dragging State and Refs
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef(null);

  // Current mathematical metrics safely evaluated with useMemo
  const safeFn = useMemo(() => currentFunc.fn || ((x) => x * x), [currentFunc]);
  const safeDeriv = useMemo(() => currentFunc.derivative || ((x) => 2 * x), [currentFunc]);

  const currentY = safeFn(currentX);
  const currentGrad = safeDeriv(currentX);
  const nextStepDelta = -learningRate * currentGrad;
  const theoreticalNextX = currentX + nextStepDelta;

  // SVG Coordinates Transformation
  const svgWidth = 640;
  const svgHeight = 320;
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const xSpan = (currentFunc.xMax - currentFunc.xMin) || 1;
  const ySpan = (currentFunc.yMax - currentFunc.yMin) || 1;

  const scaleX = (x) => {
    const clampedX = isNaN(x) ? currentFunc.xMin : x;
    return padding.left + ((clampedX - currentFunc.xMin) / xSpan) * plotWidth;
  };

  const scaleY = (y) => {
    const clampedY = isNaN(y) ? currentFunc.yMin : y;
    return padding.top + plotHeight - ((clampedY - currentFunc.yMin) / ySpan) * plotHeight;
  };

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
    const roundedX = Number(domainX.toFixed(3));
    setCurrentX(roundedX);
    setInitialX(roundedX);
    const yVal = safeFn(roundedX);
    const gradVal = safeDeriv(roundedX);
    setHistory([{
      step: 0,
      x: roundedX,
      y: yVal,
      grad: gradVal,
      stepSize: 0,
    }]);
    setOptimizerState({});
    setStatusMessage(`Placed at w = ${roundedX.toFixed(2)} (Slope: ${gradVal.toFixed(2)})`);
  }, [safeFn, safeDeriv]);

  // Pointer Event Handlers for continuous butter-smooth dragging
  const handlePointerDown = (e) => {
    // Only drag on left-click or touch
    if (e.button !== undefined && e.button !== 0) return;
    if (isRunning) setIsRunning(false);
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
              <span className="card-instruction-hint">Click anywhere on the hills to drop the Pogo Rider</span>
            </div>
            <div className="optimum-indicator">
              {visualMode === 'pogo' ? 'Lowest Valley: ' : 'Target Min: '}
              <strong>w ≈ {currentFunc.optimum}</strong>
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
                  {/* Goal Minima Flag 🚩 */}
                  {currentFunc.optimum !== undefined && !isNaN(currentFunc.optimum) && (
                    <g transform={`translate(${scaleX(currentFunc.optimum)}, ${scaleY(safeFn(currentFunc.optimum))})`}>
                      <line x1="0" y1="0" x2="0" y2="-28" stroke="#37474F" strokeWidth="2.5" strokeLinecap="round" />
                      <polygon points="0,-28 16,-22 0,-16" fill="#EF4444" />
                      <circle cx="0" cy="-29" r="2" fill="#F59E0B" />
                    </g>
                  )}
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
                x1={scaleX(currentX)}
                y1={scaleY(currentY)}
                x2={scaleX(theoreticalNextX)}
                y2={scaleY(currentY)}
                stroke="#EE7258"
                strokeWidth="3"
              />

              {/* Pogo Stick Man OR Animated Glow Ball */}
              {visualMode === 'pogo' ? (
                <g
                  className={`pogo-rider-anchor ${isDragging ? 'is-dragging' : ''}`}
                  style={{
                    transform: `translate(${scaleX(currentX)}px, ${scaleY(currentY)}px)`,
                    transition: (isRunning || isDragging) ? 'none' : 'transform 0.15s ease',
                  }}
                >
                  {/* Subtle ground target circle when dragging */}
                  {isDragging && (
                    <ellipse cx="0" cy="0" rx="14" ry="4" fill="rgba(0,0,0,0.25)" />
                  )}
                  <PogoRider
                    slope={currentGrad}
                    isBouncing={isRunning || isDragging}
                    direction={currentGrad > 0 ? -1 : 1}
                    scale={isDragging ? 1.05 : 0.9}
                    showSpeechBubble={true}
                    speechText={
                      isDragging
                        ? 'Wheee! 🎯'
                        : Math.abs(currentGrad) < 0.005
                        ? 'Valley reached! 🏁'
                        : isRunning
                        ? 'Boing! 💨'
                        : Math.abs(currentGrad) > 3
                        ? 'Steep hill! ⚠️'
                        : 'Drag me!'
                    }
                  />
                </g>
              ) : (
                <g
                  className={`animated-gradient-ball ${isDragging ? 'is-dragging' : ''}`}
                  style={{
                    transform: `translate(${scaleX(currentX)}px, ${scaleY(currentY)}px)`,
                    transition: (isRunning || isDragging) ? 'none' : 'transform 0.15s ease',
                  }}
                >
                  {/* Outer Drag Target Halo */}
                  <circle
                    r={isDragging ? '20' : '14'}
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
                onClick={stepDescent}
                disabled={isRunning}
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
