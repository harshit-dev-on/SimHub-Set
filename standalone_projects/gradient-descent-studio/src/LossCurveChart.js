import React from 'react';

/**
 * LossCurveChart: Real-time student loss vs step chart (Convergence Sparkline)
 */
export default function LossCurveChart({ history = [], initialLoss = 0, currentLoss = 0 }) {
  if (!history || history.length === 0) return null;

  const width = 280;
  const height = 90;
  const padding = { top: 12, right: 15, bottom: 20, left: 35 };

  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  // Extract all y (loss) values
  const yVals = history.map((h) => (typeof h.y === 'number' && !isNaN(h.y) ? h.y : 0));
  const minY = Math.min(...yVals, 0);
  const maxY = Math.max(...yVals, 1);
  const yRange = (maxY - minY) || 1;

  const totalSteps = Math.max(history.length - 1, 1);

  const scaleX = (stepIndex) => padding.left + (stepIndex / totalSteps) * plotW;
  const scaleY = (val) => padding.top + plotH - ((val - minY) / yRange) * plotH;

  const points = history.map((pt, i) => `${scaleX(i).toFixed(1)},${scaleY(pt.y).toFixed(1)}`);
  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${scaleX(history.length - 1)} ${padding.top + plotH} L ${padding.left} ${padding.top + plotH} Z`;

  return (
    <div className="loss-sparkline-card">
      <div className="sparkline-header">
        <div className="sparkline-title-group">
          <span className="sparkline-title">Loss Convergence Curve</span>
          <span className="sparkline-sub">f(w) vs Step #</span>
        </div>
        <div className="sparkline-metrics">
          <span className="current-loss-badge">
            Loss: <strong>{currentLoss.toFixed(2)}</strong>
          </span>
        </div>
      </div>

      <div className="sparkline-svg-wrapper">
        <svg viewBox={`0 0 ${width} ${height}`} className="sparkline-svg">
          <defs>
            <linearGradient id="lossFillGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EE7258" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#EE7258" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={padding.left}
            y1={padding.top + plotH}
            x2={width - padding.right}
            y2={padding.top + plotH}
            stroke="rgba(0,0,0,0.1)"
            strokeWidth="1"
          />
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + plotH}
            stroke="rgba(0,0,0,0.1)"
            strokeWidth="1"
          />

          {/* Area Fill */}
          <path d={areaD} fill="url(#lossFillGrad)" />

          {/* Sparkline curve */}
          <path
            d={pathD}
            fill="none"
            stroke="#EE7258"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Current / Latest Point */}
          {history.length > 0 && (
            <g transform={`translate(${scaleX(history.length - 1)}, ${scaleY(history[history.length - 1].y)})`}>
              <circle r="4" fill="#EE7258" stroke="#FFFFFF" strokeWidth="1.5" />
            </g>
          )}

          {/* Axis Labels */}
          <text x={padding.left - 4} y={padding.top + 4} textAnchor="end" fontSize="9" fill="#888" fontFamily="var(--font-mono)">
            {maxY > 99 ? maxY.toFixed(0) : maxY.toFixed(1)}
          </text>
          <text x={padding.left - 4} y={padding.top + plotH} textAnchor="end" fontSize="9" fill="#888" fontFamily="var(--font-mono)">
            {minY.toFixed(1)}
          </text>
          <text x={padding.left} y={height - 4} textAnchor="start" fontSize="9" fill="#888" fontFamily="var(--font-mono)">
            Step 0
          </text>
          <text x={width - padding.right} y={height - 4} textAnchor="end" fontSize="9" fill="#888" fontFamily="var(--font-mono)">
            #{history.length - 1}
          </text>
        </svg>
      </div>
    </div>
  );
}
