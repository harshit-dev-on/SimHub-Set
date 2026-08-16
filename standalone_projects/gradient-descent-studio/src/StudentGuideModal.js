import React, { useState } from 'react';
import './GradientDescent.css';

export default function StudentGuideModal({ isOpen, onClose, onLaunchQuest }) {
  const [activeTab, setActiveTab] = useState('intuition');

  if (!isOpen) return null;

  const conceptCards = [
    {
      id: 'intuition',
      title: '⛰️ The Foggy Hill Analogy',
      subtitle: 'How Gradient Descent Actually Works',
      content: (
        <div>
          <p>
            Imagine you are standing on a foggy mountain in heavy mist and you want to reach the lowest valley floor (the <strong>Global Minimum</strong>), but you can only feel the ground right under your feet.
          </p>
          <div className="guide-analogy-box">
            <div className="guide-bullet-step">
              <span className="step-num">1</span>
              <div>
                <strong>Feel the Slope ($f'(w)$):</strong> If the hill slopes upward to your right, you step left. If it slopes upward to your left, you step right.
              </div>
            </div>
            <div className="guide-bullet-step">
              <span className="step-num">2</span>
              <div>
                <strong>Choose Step Size ($\alpha$):</strong> You multiply the steepness by your Learning Rate ($\alpha$) to take a calculated hop downhill.
              </div>
            </div>
            <div className="guide-bullet-step">
              <span className="step-num">3</span>
              <div>
                <strong>Repeat Until Flat:</strong> When the ground feels flat ($f'(w) \approx 0$), you have reached a valley!
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'learningRate',
      title: '🏃 The Learning Rate (α)',
      subtitle: 'Why Step Size is the Most Critical Hyperparameter',
      content: (
        <div>
          <p>
            The Learning Rate $\alpha$ controls how far you jump at each step. In machine learning, setting this properly is the difference between fast learning and complete divergence!
          </p>
          <div className="guide-grid-3col">
            <div className="guide-pill-card lr-small">
              <span className="card-emoji">🐢</span>
              <strong>Too Small ($\alpha &lt; 0.02$)</strong>
              <p>Takes hundreds of tiny baby steps. Very slow to reach the valley and easily gets stuck on flat plateaus.</p>
            </div>
            <div className="guide-pill-card lr-good">
              <span className="card-emoji">🎯</span>
              <strong>Optimal ($\alpha \approx 0.15$)</strong>
              <p>Smooth, confident hops that glide directly into the lowest valley in just a few iterations.</p>
            </div>
            <div className="guide-pill-card lr-large">
              <span className="card-emoji">🚀</span>
              <strong>Too High ($\alpha &gt; 0.5$)</strong>
              <p>Overshoots the valley bottom, bounces violently back and forth, and eventually explodes (diverges)!</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'minima',
      title: '⛳ Local vs Global Minima',
      subtitle: 'The Non-Convex Landscape Challenge',
      content: (
        <div>
          <p>
            Real machine learning models (like deep neural networks) have loss landscapes with many valleys, dips, and plateaus.
          </p>
          <div className="guide-analogy-box">
            <div className="guide-bullet-step">
              <span className="step-badge green-badge">⛳ Green Flag</span>
              <div>
                <strong>Global Minimum:</strong> The true lowest point of the entire landscape. This gives the best model accuracy with minimum loss!
              </div>
            </div>
            <div className="guide-bullet-step">
              <span className="step-badge red-badge">🚩 Red Flag</span>
              <div>
                <strong>Local Minimum:</strong> A shallow valley trap. Standard Gradient Descent can get trapped here if it starts nearby, unless you use <strong>Momentum</strong> or <strong>Adam</strong>!
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'optimizers',
      title: '⚡ Optimizers: SGD vs Momentum vs Adam',
      subtitle: 'Upgrading Your Gradient Descent Engine',
      content: (
        <div>
          <p>
            Advanced optimizers add physics-inspired momentum and adaptive step sizes to solve common training problems:
          </p>
          <div className="guide-analogy-box">
            <div className="guide-bullet-step">
              <span className="step-num">SGD</span>
              <div>
                <strong>Standard Gradient Descent:</strong> Pure slope-following. Simple and clean, but can stall on flat plateaus or oscillate in narrow canyons.
              </div>
            </div>
            <div className="guide-bullet-step">
              <span className="step-num">Momentum</span>
              <div>
                <strong>Heavy Bowling Ball Physics ($\beta=0.85$):</strong> Builds velocity in downhill directions. Rolls right past small local bumps and flies across flat plateaus!
              </div>
            </div>
            <div className="guide-bullet-step">
              <span className="step-num">Adam</span>
              <div>
                <strong>Adaptive Learning Rate:</strong> Automatically scales step sizes for each parameter. The gold standard optimizer used in modern AI and LLMs.
              </div>
            </div>
          </div>
        </div>
      ),
    }
  ];

  const currentCard = conceptCards.find((c) => c.id === activeTab) || conceptCards[0];

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="student-guide-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-row">
          <div className="modal-header-titles">
            <div className="guide-badge-row">
              <span className="modal-badge-pill">🎓 Student Learning Center</span>
              <span className="modal-sub-badge">Intuitive Math & ML</span>
            </div>
            <h2 className="modal-title-text">Understanding Gradient Descent</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close guide">
            ✕
          </button>
        </div>

        {/* Tab Selector */}
        <div className="guide-tabs-nav">
          {conceptCards.map((c) => (
            <button
              key={c.id}
              className={`guide-tab-btn ${activeTab === c.id ? 'active' : ''}`}
              onClick={() => setActiveTab(c.id)}
            >
              {c.title.split(' ')[0]} {c.title.split(' ').slice(1, 3).join(' ')}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="guide-tab-content-pane">
          <h3 className="pane-card-title">{currentCard.title}</h3>
          <h4 className="pane-card-subtitle">{currentCard.subtitle}</h4>
          <div className="pane-card-body">{currentCard.content}</div>
        </div>

        {/* Footer with Quick Guided Experiments */}
        <div className="guide-modal-footer">
          <span className="footer-quest-label">Ready to try it? Launch a guided experiment:</span>
          <div className="guide-quest-btn-row">
            <button
              className="guide-quest-btn"
              onClick={() => {
                onLaunchQuest('doubleWell', 1.8, 0.08, 'momentum');
                onClose();
              }}
            >
              🎯 Escape Local Trap (Double Well)
            </button>
            <button
              className="guide-quest-btn"
              onClick={() => {
                onLaunchQuest('plateau', 3.5, 0.25, 'momentum');
                onClose();
              }}
            >
              💨 Plateau Speed Run
            </button>
            <button
              className="guide-quest-btn"
              onClick={() => {
                onLaunchQuest('quadratic', 3.2, 0.48, 'sgd');
                onClose();
              }}
            >
              🚀 Wild Overshoot Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
