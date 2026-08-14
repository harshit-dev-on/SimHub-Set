import React, { useState, useEffect, useRef, useCallback } from 'react';
import './GradientDescent.css';
import { LOSS_FUNCTIONS, OPTIMIZERS } from './simulationMath';

export default function GradientDescent() {
  const [selectedFuncKey, setSelectedFuncKey] = useState('quadratic');
  const [selectedOptimizer, setSelectedOptimizer] = useState('sgd');
  const [learningRate, setLearningRate] = useState(0.15);
  const [currentX, setCurrentX] = useState(3.2);
  const [initialX, setInitialX] = useState(3.2);
  const [isRunning, setIsRunning] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(250); // ms per step
  const [history, setHistory] = useState([]);
  const [optimizerState, setOptimizerState] = useState({});
  const [statusMessage, setStatusMessage] = useState('Ready to descend');

  const currentFunc = LOSS_FUNCTIONS[selectedFuncKey];
  const currentOpt = OPTIMIZERS[selectedOptimizer];
  const timerRef = useRef(null);

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

  // Current mathematical metrics
  const currentY = currentFunc.fn(currentX);
  const currentGrad = currentFunc.derivative(currentX);
  const nextStepDelta = -learningRate * currentGrad;
  const theoreticalNextX = currentX + nextStepDelta;

  // SVG Coordinates Transformation
  const svgWidth = 640;
  const svgHeight = 320;
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const scaleX = (x) => {
    return padding.left + ((x - currentFunc.xMin) / (currentFunc.xMax - currentFunc.xMin)) * plotWidth;
  };

  const scaleY = (y) => {
    return padding.top + plotHeight - ((y - currentFunc.yMin) / (currentFunc.yMax - currentFunc.yMin)) * plotHeight;
  };

  // Generate SVG path for loss curve
  const curvePoints = [];
  const resolution = 150;
  for (let i = 0; i <= resolution; i++) {
    const xVal = currentFunc.xMin + (i / resolution) * (currentFunc.xMax - currentFunc.xMin);
    const yVal = currentFunc.fn(xVal);
    // Clamp to avoid extreme spikes on screen
    const clampedY = Math.min(Math.max(yVal, currentFunc.yMin), currentFunc.yMax + 5);
    curvePoints.push(`${scaleX(xVal)},${scaleY(clampedY)}`);
  }
  const curvePathD = `M ${curvePoints.join(' L ')}`;

  // Tangent line calculation at current point
  const tangentSpan = 0.8;
  const tanX1 = currentX - tangentSpan;
  const tanY1 = currentY - currentGrad * tangentSpan;
  const tanX2 = currentX + tangentSpan;
  const tanY2 = currentY + currentGrad * tangentSpan;

  // Handle click on canvas to set starting point
  const handleSvgClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const normX = (clickX - padding.left) / plotWidth;
    const domainX = currentFunc.xMin + normX * (currentFunc.xMax - currentFunc.xMin);
    
    if (domainX >= currentFunc.xMin && domainX <= currentFunc.xMax) {
      resetSimulation(Number(domainX.toFixed(2)));
    }
  };

  return (
    <div className="gd-simulation-container">
      {/* Editorial Header */}
      <header className="gd-header">
        <div className="gd-header-badge-row">
          <span className="gd-badge-pill" style={{ backgroundColor: currentFunc.badgeColor }}>
            {currentFunc.badge}
          </span>
          <span className="gd-badge-status">{statusMessage}</span>
        </div>
        <h1 className="gd-title">Gradient Descent Interactive Studio</h1>
        <p className="gd-subtitle">
          Watch parameters iteratively slide down the loss slope $\nabla f(w)$ to minimize cost.
        </p>
      </header>

      {/* Main Simulation Layout: 2-Column Bento */}
      <div className="gd-main-grid">
        {/* Left Column: Visualizer Landscape & Convergence Curve */}
        <div className="gd-visualizer-card">
          <div className="card-header-bar">
            <div>
              <h3 className="card-sec-title">Loss Landscape f(w)</h3>
              <span className="card-instruction-hint">Click anywhere on the curve to reposition ball</span>
            </div>
            <div className="optimum-indicator">
              Target Min: <strong>w ≈ {currentFunc.optimum}</strong>
            </div>
          </div>

          {/* SVG Loss Curve Plot */}
          <div className="svg-plot-wrapper">
            <svg
              className="loss-landscape-svg"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              onClick={handleSvgClick}
            >
              {/* Subtle Grid Background */}
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
              </defs>

              <rect width={svgWidth} height={svgHeight} fill="url(#gdGrid)" rx="16" />

              {/* Zero reference axis */}
              {currentFunc.yMin <= 0 && currentFunc.yMax >= 0 && (
                <line
                  x1={padding.left}
                  y1={scaleY(0)}
                  x2={svgWidth - padding.right}
                  y2={scaleY(0)}
                  stroke="rgba(0,0,0,0.12)"
                  strokeDasharray="4 4"
                />
              )}

              {/* Shaded Area Under Curve */}
              <path
                d={`${curvePathD} L ${scaleX(currentFunc.xMax)} ${svgHeight - padding.bottom} L ${scaleX(currentFunc.xMin)} ${svgHeight - padding.bottom} Z`}
                fill="url(#curveFillGrad)"
              />

              {/* Loss Function Curve */}
              <path
                d={curvePathD}
                fill="none"
                stroke="#1B1C20"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

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
                        stroke="#EE7258"
                        strokeWidth="2.5"
                        strokeDasharray="3 3"
                        opacity="0.75"
                      />
                    );
                  })}
                  {history.map((pt, i) => (
                    <circle
                      key={`pt-${i}`}
                      cx={scaleX(pt.x)}
                      cy={scaleY(pt.y)}
                      r={i === history.length - 1 ? 0 : 3.5}
                      fill="#EE7258"
                      opacity="0.8"
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
                stroke="#2B7DE9"
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
                markerEnd="url(#arrowhead)"
              />

              {/* Current Animated Ball / Particle */}
              <g
                className="animated-gradient-ball"
                style={{
                  transform: `translate(${scaleX(currentX)}px, ${scaleY(currentY)}px)`,
                  transition: isRunning ? 'none' : 'transform 0.15s ease',
                }}
              >
                {/* Glow ring */}
                <circle r="14" fill="#EE7258" opacity="0.25" className="ball-pulsar" />
                <circle r="8" fill="url(#ballGlow)" stroke="#FFFFFF" strokeWidth="2.5" />
              </g>

              {/* X and Y Axis Labels */}
              <text x={svgWidth - padding.right} y={svgHeight - 12} textAnchor="end" className="axis-label">
                Parameter (w)
              </text>
              <text x={padding.left - 10} y={padding.top - 10} textAnchor="start" className="axis-label">
                Cost f(w)
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
          {/* Landscape Preset Selector */}
          <div className="bento-subcard surface-cream">
            <label className="bento-label">Select Loss Function</label>
            <div className="preset-pill-grid">
              {Object.values(LOSS_FUNCTIONS).map((fn) => (
                <button
                  key={fn.id}
                  className={`preset-btn ${selectedFuncKey === fn.id ? 'active' : ''}`}
                  onClick={() => setSelectedFuncKey(fn.id)}
                >
                  <span className="preset-name">{fn.name}</span>
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
    </div>
  );
}
