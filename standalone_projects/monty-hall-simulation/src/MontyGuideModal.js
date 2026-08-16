import React, { useState } from 'react';

/**
 * Student Concept Guide for the Monty Hall Problem
 */
export default function MontyGuideModal({ isOpen, onClose, onLaunchQuest }) {
  const [activeTab, setActiveTab] = useState('intuition');

  if (!isOpen) return null;

  const conceptTabs = [
    {
      id: 'intuition',
      title: '🚪 The 100-Door Intuition',
      subtitle: 'Why Marilyn vos Savant’s explanation makes it instantly click',
      content: (
        <div>
          <p>
            When there are 3 doors, human intuition easily gets tricked into thinking the remaining 2 closed doors must be a 50/50 toss-up.
          </p>
          <div className="guide-analogy-box">
            <div className="guide-bullet-step">
              <span className="step-num">1</span>
              <div>
                <strong>Imagine 100 Doors:</strong> 1 has a luxury car, 99 have goats. You pick Door #1. You have a <strong>1/100 (1%)</strong> chance of being right.
              </div>
            </div>
            <div className="guide-bullet-step">
              <span className="step-num">2</span>
              <div>
                <strong>Host Monty Opens 98 Goat Doors:</strong> Monty knows where the car is. He opens 98 doors showing goats, leaving only your Door #1 and Door #77.
              </div>
            </div>
            <div className="guide-bullet-step">
              <span className="step-num">3</span>
              <div>
                <strong>Do you switch to Door #77?</strong> YES! Your original pick was almost certainly a goat (99% chance). Monty filtered out all 98 other goats, funneling the entire <strong>99% probability</strong> into Door #77!
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'history',
      title: '📰 The Famous 1990 Scandal',
      subtitle: 'When 1,000 PhD Mathematicians Were Wrong',
      content: (
        <div>
          <p>
            In 1990, a reader wrote to <strong>Marilyn vos Savant</strong> in <em>Parade</em> magazine asking whether a contestant should switch doors on Monty Hall’s game show <em>Let's Make a Deal</em>.
          </p>
          <p>
            Marilyn correctly answered: <strong>"Yes; you should switch. The first door has a 1/3 chance of winning, but the second door has a 2/3 chance."</strong>
          </p>
          <div className="guide-quote-card">
            <em>"You blew it! Since there are two doors left, the probability is 1/2. How many irate mathematicians are needed for you to admit your mistake?"</em>
            <span className="quote-author">— Letter from a PhD Mathematics Professor, 1990</span>
          </div>
          <p>
            Over <strong>10,000 letters</strong> poured in. After computer simulations were run across universities worldwide, Marilyn was proven completely correct!
          </p>
        </div>
      ),
    },
    {
      id: 'fallacy',
      title: '🧠 The 50/50 Cognitive Trap',
      subtitle: 'Why the Human Brain Gets Fooled',
      content: (
        <div>
          <p>
            The fundamental mistake people make is assuming that because 2 options remain, both must be equally likely (the <em>Equiprobability Fallacy</em>).
          </p>
          <div className="guide-grid-3col">
            <div className="guide-pill-card">
              <span className="card-emoji">🎲</span>
              <strong>If Monty Were Blind</strong>
              <p>If Monty opened a random door by accident and it happened to be a goat, the odds WOULD be 50/50.</p>
            </div>
            <div className="guide-pill-card">
              <span className="card-emoji">👁️</span>
              <strong>Monty Has Secret Knowledge</strong>
              <p>Because Monty deliberately avoids the car, his action transfers probability into the unopened door!</p>
            </div>
            <div className="guide-pill-card">
              <span className="card-emoji">📈</span>
              <strong>Law of Large Numbers</strong>
              <p>Over thousands of simulated games, the Switch strategy consistently converges to exactly 66.7%!</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentTab = conceptTabs.find((t) => t.id === activeTab) || conceptTabs[0];

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="student-guide-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-row">
          <div className="modal-header-titles">
            <div className="guide-badge-row">
              <span className="modal-badge-pill">🎓 Probability & Game Theory</span>
              <span className="modal-sub-badge">Monty Hall Demystified</span>
            </div>
            <h2 className="modal-title-text">Understanding The Monty Hall Problem</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close guide">
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="guide-tabs-nav">
          {conceptTabs.map((t) => (
            <button
              key={t.id}
              className={`guide-tab-btn ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.title}
            </button>
          ))}
        </div>

        {/* Active Tab Body */}
        <div className="guide-tab-content-pane">
          <h3 className="pane-card-title">{currentTab.title}</h3>
          <h4 className="pane-card-subtitle">{currentTab.subtitle}</h4>
          <div className="pane-card-body">{currentTab.content}</div>
        </div>

        {/* Footer with Guided Quests */}
        <div className="guide-modal-footer">
          <span className="footer-quest-label">Launch a student experiment:</span>
          <div className="guide-quest-btn-row">
            <button
              className="guide-quest-btn"
              onClick={() => {
                if (onLaunchQuest) onLaunchQuest('PLAY_3_DOORS');
                onClose();
              }}
            >
              🎮 Play Interactive 3-Door Game
            </button>
            <button
              className="guide-quest-btn"
              onClick={() => {
                if (onLaunchQuest) onLaunchQuest('N_DOORS_10');
                onClose();
              }}
            >
              🚪 Try 10-Door Mode (Marilyn Intuition)
            </button>
            <button
              className="guide-quest-btn"
              onClick={() => {
                if (onLaunchQuest) onLaunchQuest('MONTE_CARLO_1000');
                onClose();
              }}
            >
              ⚡ Run 1,000 Monte Carlo Trials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
