import React, { useState, useMemo } from 'react';
import { compileMathExpression, computeFunctionBounds, PRESET_CUSTOM_TEMPLATES } from './mathParser';

export default function CustomFunctionModal({ isOpen, onClose, onApplyCustomFunction }) {
  const [exprInput, setExprInput] = useState('x^3 - 3*x + 1.5');
  const [funcName, setFuncName] = useState('My Custom Loss');
  const [xMin, setXMin] = useState(-3.5);
  const [xMax, setXMax] = useState(3.5);
  const [defaultLr, setDefaultLr] = useState(0.1);
  const [parseError, setParseError] = useState(null);

  // Live compilation of input expression
  const compiledData = useMemo(() => {
    try {
      if (!exprInput.trim()) return null;
      const res = compileMathExpression(exprInput);
      const bounds = computeFunctionBounds(res.fn, Number(xMin), Number(xMax));
      setParseError(null);
      return { ...res, ...bounds };
    } catch (err) {
      setParseError(err.message);
      return null;
    }
  }, [exprInput, xMin, xMax]);

  // Handle Quick Insertion chips
  const insertToken = (token) => {
    setExprInput((prev) => prev + token);
  };

  const handleApplyTemplate = (tpl) => {
    setExprInput(tpl.expr);
    setFuncName(tpl.name);
    setXMin(tpl.xMin);
    setXMax(tpl.xMax);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!compiledData) return;

    const customFuncObj = {
      id: `custom-${Date.now()}`,
      name: funcName.trim() || `Custom: ${exprInput}`,
      badge: 'Custom Student Fn',
      badgeColor: '#EE7258',
      description: `Custom function: f(x) = ${exprInput}`,
      xMin: Number(xMin),
      xMax: Number(xMax),
      yMin: compiledData.yMin,
      yMax: compiledData.yMax,
      defaultX0: compiledData.defaultX0,
      defaultLr: Number(defaultLr),
      fn: compiledData.fn,
      derivative: compiledData.derivative,
      latex: `f(x) = ${exprInput}`,
      derivLatex: "f'(x) \\approx \\text{Numerical Derivative}",
      optimum: compiledData.defaultX0,
      isCustom: true,
      rawExpr: exprInput,
    };

    onApplyCustomFunction(customFuncObj);
    onClose();
  };

  if (!isOpen) return null;

  // Mini preview plot points
  const previewPoints = [];
  if (compiledData) {
    const width = 360;
    const height = 140;
    const pad = 15;
    const pw = width - 2 * pad;
    const ph = height - 2 * pad;
    const res = 80;

    for (let i = 0; i <= res; i++) {
      const xVal = Number(xMin) + (i / res) * (Number(xMax) - Number(xMin));
      try {
        const yVal = compiledData.fn(xVal);
        const clampedY = Math.min(Math.max(yVal, compiledData.yMin), compiledData.yMax);
        const px = pad + ((xVal - Number(xMin)) / (Number(xMax) - Number(xMin))) * pw;
        const py = pad + ph - ((clampedY - compiledData.yMin) / (compiledData.yMax - compiledData.yMin)) * ph;
        previewPoints.push(`${px.toFixed(1)},${py.toFixed(1)}`);
      } catch {
        // skip
      }
    }
  }

  return (
    <div className="modal-overlay-backdrop" onClick={onClose}>
      <div className="custom-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header-row">
          <div>
            <div className="modal-badge">Formula Builder</div>
            <h2 className="modal-title">Add Custom Loss Function</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="custom-fn-form">
          {/* Function Name Input */}
          <div className="modal-input-field">
            <label className="field-label">Function Title</label>
            <input
              type="text"
              value={funcName}
              onChange={(e) => setFuncName(e.target.value)}
              placeholder="e.g. My Quadratic Dip"
              className="modal-text-input"
            />
          </div>

          {/* Mathematical Expression Input */}
          <div className="modal-input-field">
            <div className="label-with-status">
              <label className="field-label">Equation f(x)</label>
              {parseError ? (
                <span className="status-pill status-error">⚠️ {parseError}</span>
              ) : (
                <span className="status-pill status-valid">✓ Valid Function</span>
              )}
            </div>

            <div className="formula-input-wrapper">
              <span className="fx-prefix">f(x) =</span>
              <input
                type="text"
                value={exprInput}
                onChange={(e) => setExprInput(e.target.value)}
                placeholder="e.g. x^4 - 2*x^2 + sin(3*x)"
                className="modal-formula-input"
                autoFocus
              />
            </div>

            {/* Quick Math Operator Chips */}
            <div className="quick-token-chips">
              {['x^2', 'x^3', 'sin(x)', 'cos(x)', 'exp(x)', 'log(x)', 'sqrt(x)', 'abs(x)', '+', '-', '*', '/', '^', 'PI'].map(
                (tok) => (
                  <button
                    key={tok}
                    type="button"
                    className="math-chip-btn"
                    onClick={() => insertToken(tok)}
                  >
                    {tok}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Real-Time Mini Graph Preview */}
          <div className="preview-graph-section">
            <label className="field-label">Live Curve Preview</label>
            <div className="mini-preview-canvas">
              {compiledData && previewPoints.length > 2 ? (
                <svg viewBox="0 0 360 140" className="preview-svg">
                  <path
                    d={`M ${previewPoints.join(' L ')}`}
                    fill="none"
                    stroke="#EE7258"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <div className="preview-empty-state">
                  Enter a valid formula above to preview curve
                </div>
              )}
            </div>
          </div>

          {/* Domain & Parameters Row */}
          <div className="modal-grid-row">
            <div className="modal-input-field">
              <label className="field-label">Domain Range (x)</label>
              <div className="range-inputs-pair">
                <input
                  type="number"
                  step="0.5"
                  value={xMin}
                  onChange={(e) => setXMin(e.target.value)}
                  className="modal-num-input"
                />
                <span className="range-to-sep">to</span>
                <input
                  type="number"
                  step="0.5"
                  value={xMax}
                  onChange={(e) => setXMax(e.target.value)}
                  className="modal-num-input"
                />
              </div>
            </div>

            <div className="modal-input-field">
              <label className="field-label">Initial Learning Rate (α)</label>
              <input
                type="number"
                step="0.01"
                min="0.001"
                max="0.9"
                value={defaultLr}
                onChange={(e) => setDefaultLr(e.target.value)}
                className="modal-num-input"
              />
            </div>
          </div>

          {/* Preset Templates Inspiration */}
          <div className="preset-templates-section">
            <label className="field-label">Or choose a pre-made template:</label>
            <div className="template-pills-row">
              {PRESET_CUSTOM_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.name}
                  type="button"
                  className="template-pill-card"
                  onClick={() => handleApplyTemplate(tpl)}
                >
                  <strong className="tpl-name">{tpl.name}</strong>
                  <code className="tpl-code">{tpl.expr}</code>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="modal-actions-footer">
            <button type="button" className="btn-cancel-modal" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-apply-modal"
              disabled={!compiledData || Boolean(parseError)}
            >
              🚀 Load Into Simulation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
