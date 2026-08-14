import React, { useState, useEffect, useRef, useCallback } from 'react';
import { runMonteCarloBatch } from './montyHallMath';

/**
 * High-Speed Monte Carlo Batch Simulator with live real-time probability convergence graph
 */
export default function MonteCarloSimulator({ numDoors = 3 }) {
  const [trialCount, setTrialCount] = useState(1000);
  const [isRunning, setIsRunning] = useState(false);
  const [batchResults, setBatchResults] = useState(() => runMonteCarloBatch(1000, numDoors));
  const [animProgress, setAnimProgress] = useState(1); // 0 to 1
  const animFrameRef = useRef(null);

  const theoreticalSwitch = ((numDoors - 1) / numDoors) * 100;
  const theoreticalStick = (1 / numDoors) * 100;

  // Run a fresh batch simulation
  const executeSimulation = useCallback((count = trialCount) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsRunning(true);
    setAnimProgress(0);

    const fullBatch = runMonteCarloBatch(count, numDoors);
    setBatchResults(fullBatch);

    const startTime = performance.now();
    const duration = Math.min(800, Math.max(300, count * 0.3));

    const animateGraph = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      setAnimProgress(progress);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animateGraph);
      } else {
        setIsRunning(false);
      }
    };

    animFrameRef.current = requestAnimationFrame(animateGraph);
  }, [trialCount, numDoors]);

  // Re-run if numDoors changes
  useEffect(() => {
    executeSimulation(trialCount);
  }, [numDoors, executeSimulation, trialCount]);

  // Convergence SVG Chart Dimensions
  const chartW = 560;
  const chartH = 180;
  const pad = { top: 20, right: 30, bottom: 25, left: 45 };
  const plotW = chartW - pad.left - pad.right;
  const plotH = chartH - pad.top - pad.bottom;

  const rawHistory = batchResults.history || [];
  const visiblePointsCount = Math.max(2, Math.floor(rawHistory.length * animProgress));
  const visibleHistory = rawHistory.slice(0, visiblePointsCount);

  const scaleX = (t) => pad.left + (t / trialCount) * plotW;
  const scaleY = (pct) => pad.top + plotH - (pct / 100) * plotH;

  const switchPoints = visibleHistory.map((h) => `${scaleX(h.trial).toFixed(1)},${scaleY(h.switchWinRate).toFixed(1)}`);
  const stickPoints = visibleHistory.map((h) => `${scaleX(h.trial).toFixed(1)},${scaleY(h.stickWinRate).toFixed(1)}`);

  const switchPath = switchPoints.length > 0 ? `M ${switchPoints.join(' L ')}` : '';
  const stickPath = stickPoints.length > 0 ? `M ${stickPoints.join(' L ')}` : '';

  const currentSwitchRate = visibleHistory.length > 0 ? visibleHistory[visibleHistory.length - 1].switchWinRate : batchResults.switchWinRate;
  const currentStickRate = visibleHistory.length > 0 ? visibleHistory[visibleHistory.length - 1].stickWinRate : batchResults.stickWinRate;

  return (
    <div className="monte-carlo-container">
      {/* Top Header & Trial Count Controls */}
      <div className="mc-header-row">
        <div className="mc-title-group">
          <h3 className="mc-main-title">⚡ Monte Carlo Batch Experiment</h3>
          <span className="mc-subtitle">
            Simulate thousands of games to prove the Law of Large Numbers
          </span>
        </div>

        {/* Quick Batch Presets */}
        <div className="mc-trial-selector">
          <span className="mc-preset-label">Trials:</span>
          {[100, 1000, 5000, 10000].map((count) => (
            <button
              key={count}
              className={`mc-count-pill ${trialCount === count ? 'active' : ''}`}
              onClick={() => {
                setTrialCount(count);
                executeSimulation(count);
              }}
              disabled={isRunning}
            >
              {count >= 1000 ? `${count / 1000}k` : count}
            </button>
          ))}
          <button
            className="mc-run-btn"
            onClick={() => executeSimulation(trialCount)}
            disabled={isRunning}
          >
            {isRunning ? 'Simulating... ⏳' : '▶ Run Trials'}
          </button>
        </div>
      </div>

      {/* Main Results Bento: Live Convergence Graph & Side-by-Side Comparison */}
      <div className="mc-content-grid">
        {/* Left: Live Probability Convergence Graph */}
        <div className="mc-graph-card">
          <div className="mc-graph-header">
            <span className="graph-card-title">Empirical Win Rate Convergence vs Trials</span>
            <div className="graph-legend-group">
              <span className="legend-item switch-legend">
                <span className="legend-line switch-line" /> Switch ({currentSwitchRate.toFixed(1)}%)
              </span>
              <span className="legend-item stick-legend">
                <span className="legend-line stick-line" /> Stick ({currentStickRate.toFixed(1)}%)
              </span>
            </div>
          </div>

          <div className="mc-svg-wrapper">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="mc-convergence-svg">
              <defs>
                <linearGradient id="switchLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22C55E" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
                <linearGradient id="stickLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="100%" stopColor="#F97316" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 25, 50, 75, 100].map((val) => (
                <g key={`grid-${val}`}>
                  <line
                    x1={pad.left}
                    y1={scaleY(val)}
                    x2={chartW - pad.right}
                    y2={scaleY(val)}
                    stroke="rgba(0,0,0,0.06)"
                    strokeWidth="1"
                  />
                  <text
                    x={pad.left - 6}
                    y={scaleY(val) + 3}
                    textAnchor="end"
                    fontSize="9"
                    fill="#999"
                    fontFamily="var(--font-mono)"
                  >
                    {val}%
                  </text>
                </g>
              ))}

              {/* Theoretical Reference Lines (Dashed) */}
              <line
                x1={pad.left}
                y1={scaleY(theoreticalSwitch)}
                x2={chartW - pad.right}
                y2={scaleY(theoreticalSwitch)}
                stroke="#15803D"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                opacity="0.75"
              />
              <text
                x={chartW - pad.right + 2}
                y={scaleY(theoreticalSwitch) + 3}
                fontSize="8.5"
                fill="#15803D"
                fontFamily="var(--font-mono)"
                fontWeight="700"
              >
                {theoreticalSwitch.toFixed(1)}%
              </text>

              <line
                x1={pad.left}
                y1={scaleY(theoreticalStick)}
                x2={chartW - pad.right}
                y2={scaleY(theoreticalStick)}
                stroke="#B91C1C"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                opacity="0.75"
              />
              <text
                x={chartW - pad.right + 2}
                y={scaleY(theoreticalStick) + 3}
                fontSize="8.5"
                fill="#B91C1C"
                fontFamily="var(--font-mono)"
                fontWeight="700"
              >
                {theoreticalStick.toFixed(1)}%
              </text>

              {/* Convergence Paths */}
              {stickPath && (
                <path
                  d={stickPath}
                  fill="none"
                  stroke="url(#stickLineGrad)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {switchPath && (
                <path
                  d={switchPath}
                  fill="none"
                  stroke="url(#switchLineGrad)"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* X Axis Trial Labels */}
              <text x={pad.left} y={chartH - 6} fontSize="9" fill="#999" fontFamily="var(--font-mono)">
                Trial 1
              </text>
              <text x={chartW / 2} y={chartH - 6} textAnchor="middle" fontSize="9" fill="#999" fontFamily="var(--font-mono)">
                Trial {Math.floor(trialCount / 2)}
              </text>
              <text x={chartW - pad.right} y={chartH - 6} textAnchor="end" fontSize="9" fill="#999" fontFamily="var(--font-mono)">
                Trial {trialCount}
              </text>
            </svg>
          </div>
        </div>

        {/* Right: Strategy Scoreboard & Probability Breakdown */}
        <div className="mc-stats-card">
          <h4 className="stats-card-title">Empirical Results vs Theory</h4>

          {/* Switch Strategy Row */}
          <div className="strategy-score-box switch-box">
            <div className="strategy-meta-header">
              <span className="strategy-badge switch-badge">🔀 ALWAYS SWITCH</span>
              <span className="strategy-empirical-pct">{batchResults.switchWinRate.toFixed(1)}%</span>
            </div>
            <div className="strategy-progress-bar">
              <div
                className="progress-fill switch-fill"
                style={{ width: `${Math.min(100, batchResults.switchWinRate)}%` }}
              />
              <div
                className="target-marker"
                style={{ left: `${theoreticalSwitch}%` }}
                title={`Theoretical Target: ${theoreticalSwitch.toFixed(1)}%`}
              />
            </div>
            <div className="strategy-details-row">
              <span>Wins: <strong>{batchResults.switchWins}</strong> / {trialCount}</span>
              <span>Theory: <strong>{theoreticalSwitch.toFixed(1)}% ({numDoors - 1}/{numDoors})</strong></span>
            </div>
          </div>

          {/* Stick Strategy Row */}
          <div className="strategy-score-box stick-box">
            <div className="strategy-meta-header">
              <span className="strategy-badge stick-badge">🔒 ALWAYS STICK</span>
              <span className="strategy-empirical-pct">{batchResults.stickWinRate.toFixed(1)}%</span>
            </div>
            <div className="strategy-progress-bar">
              <div
                className="progress-fill stick-fill"
                style={{ width: `${Math.min(100, batchResults.stickWinRate)}%` }}
              />
              <div
                className="target-marker"
                style={{ left: `${theoreticalStick}%` }}
                title={`Theoretical Target: ${theoreticalStick.toFixed(1)}%`}
              />
            </div>
            <div className="strategy-details-row">
              <span>Wins: <strong>{batchResults.stickWins}</strong> / {trialCount}</span>
              <span>Theory: <strong>{theoreticalStick.toFixed(1)}% (1/{numDoors})</strong></span>
            </div>
          </div>

          {/* Takeaway Note */}
          <div className="mc-takeaway-banner">
            <span className="takeaway-emoji">💡</span>
            <p className="takeaway-text">
              Switching wins <strong>{((numDoors - 1) / 1).toFixed(0)}× more often</strong> because your initial pick had only a 1/{numDoors} chance of being correct!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
