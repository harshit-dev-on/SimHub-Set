import React, { useState } from 'react';

/**
 * Probability Blackboard: Interactive Bayesian Decision Tree & Mathematical Proof
 */
export default function ProbabilityBlackboard({ activeCase = null }) {
  const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'bayes'

  return (
    <div className="prob-blackboard-container surface-cream">
      {/* Header */}
      <div className="blackboard-top-row">
        <div className="blackboard-title-group">
          <h4 className="blackboard-title">📐 Mathematical Proof & Tree</h4>
          <span className="blackboard-subtitle">Why Switching Doubles Your Odds</span>
        </div>

        {/* View Mode Toggle: Tree vs Bayes Formula */}
        <div className="bb-toggle-group">
          <button
            className={`bb-toggle-btn ${viewMode === 'tree' ? 'active' : ''}`}
            onClick={() => setViewMode('tree')}
          >
            🌳 Decision Tree
          </button>
          <button
            className={`bb-toggle-btn ${viewMode === 'bayes' ? 'active' : ''}`}
            onClick={() => setViewMode('bayes')}
          >
            📜 Bayes Theorem
          </button>
        </div>
      </div>

      {viewMode === 'tree' ? (
        <div className="tree-diagram-wrapper">
          <p className="tree-intro-note">
            Since the car is placed randomly, there are <strong>3 equally likely initial states (each with P = 1/3)</strong>:
          </p>

          <div className="tree-cases-grid">
            {/* Case 1 */}
            <div className={`tree-case-card ${activeCase === 1 ? 'is-active-case' : ''}`}>
              <div className="case-header-row">
                <span className="case-tag">Case 1 (P = 1/3)</span>
                <span className="case-initial-pick">You picked: 🐐 Goat A</span>
              </div>
              <div className="case-step-flow">
                <div className="step-arrow-line">
                  <span className="step-action">Monty is forced to open:</span>
                  <span className="step-target">🐐 Goat B</span>
                </div>
                <div className="case-outcomes-pair">
                  <div className="outcome-chip outcome-switch-win">
                    <span className="outcome-strategy">If you SWITCH:</span>
                    <strong className="outcome-result">🏎️ WIN CAR!</strong>
                  </div>
                  <div className="outcome-chip outcome-stick-lose">
                    <span className="outcome-strategy">If you STICK:</span>
                    <span className="outcome-result">🐐 Lose (Goat A)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Case 2 */}
            <div className={`tree-case-card ${activeCase === 2 ? 'is-active-case' : ''}`}>
              <div className="case-header-row">
                <span className="case-tag">Case 2 (P = 1/3)</span>
                <span className="case-initial-pick">You picked: 🐐 Goat B</span>
              </div>
              <div className="case-step-flow">
                <div className="step-arrow-line">
                  <span className="step-action">Monty is forced to open:</span>
                  <span className="step-target">🐐 Goat A</span>
                </div>
                <div className="case-outcomes-pair">
                  <div className="outcome-chip outcome-switch-win">
                    <span className="outcome-strategy">If you SWITCH:</span>
                    <strong className="outcome-result">🏎️ WIN CAR!</strong>
                  </div>
                  <div className="outcome-chip outcome-stick-lose">
                    <span className="outcome-strategy">If you STICK:</span>
                    <span className="outcome-result">🐐 Lose (Goat B)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Case 3 */}
            <div className={`tree-case-card ${activeCase === 3 ? 'is-active-case' : ''}`}>
              <div className="case-header-row">
                <span className="case-tag">Case 3 (P = 1/3)</span>
                <span className="case-initial-pick">You picked: 🏎️ Car</span>
              </div>
              <div className="case-step-flow">
                <div className="step-arrow-line">
                  <span className="step-action">Monty opens either:</span>
                  <span className="step-target">🐐 Goat A or B</span>
                </div>
                <div className="case-outcomes-pair">
                  <div className="outcome-chip outcome-switch-lose">
                    <span className="outcome-strategy">If you SWITCH:</span>
                    <span className="outcome-result">🐐 Lose (Goat)</span>
                  </div>
                  <div className="outcome-chip outcome-stick-win">
                    <span className="outcome-strategy">If you STICK:</span>
                    <strong className="outcome-result">🏎️ WIN CAR!</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Summary Bar */}
          <div className="tree-summary-row">
            <div className="summary-col switch-summary">
              <span className="summary-label">🔀 Switching Wins:</span>
              <strong className="summary-val">2 of 3 Cases (66.7% Probability)</strong>
            </div>
            <div className="summary-col stick-summary">
              <span className="summary-label">🔒 Sticking Wins:</span>
              <strong className="summary-val">1 of 3 Cases (33.3% Probability)</strong>
            </div>
          </div>
        </div>
      ) : (
        /* Bayes Theorem View */
        <div className="bayes-proof-wrapper">
          <p className="bayes-intro">
            Using Bayes Theorem to calculate conditional probability P(Car at Door 2 | Host opens Door 3):
          </p>

          <div className="bayes-formula-box">
            <div className="bayes-eq-line">
              <span className="math-prob">P(C₂ | H₃)</span>
              <span className="math-op">=</span>
              <div className="math-fraction">
                <span className="fraction-top">P(H₃ | C₂) × P(C₂)</span>
                <span className="fraction-bottom">P(H₃)</span>
              </div>
            </div>

            <div className="bayes-substitution-steps">
              <div className="sub-step">
                <strong>1. Prior Probabilities:</strong> P(C₁) = P(C₂) = P(C₃) = 1/3
              </div>
              <div className="sub-step">
                <strong>2. Host Actions:</strong> If Car is at Door 2, Monty MUST open Door 3 (P = 1.0).
              </div>
              <div className="sub-step">
                <strong>3. Total Probability of Host Opening Door 3:</strong> P(H₃) = (1/2 × 1/3) + (1 × 1/3) + (0 × 1/3) = 1/2.
              </div>
              <div className="sub-step final-eval">
                <strong>4. Final Evaluation:</strong>
                <div className="final-eq">
                  P(C₂ | H₃) = (1 × 1/3) / (1/2) = <strong>2/3 ≈ 66.7%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
