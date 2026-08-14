import React, { useState } from 'react';
import './App.css';
import GradientDescent from './Simulations/Gradient Descent/GradientDescent';

function App() {
  const [activeSimulation, setActiveSimulation] = useState('gradient-descent');

  const simulationsList = [
    { id: 'gradient-descent', title: 'Gradient Descent', icon: '📉', tag: 'Optimization' },
    { id: 'backprop', title: 'Backpropagation', icon: '🧠', tag: 'Coming Soon', disabled: true },
    { id: 'pca', title: 'PCA Projection', icon: '📐', tag: 'Coming Soon', disabled: true },
    { id: 'kmeans', title: 'K-Means Clustering', icon: '✨', tag: 'Coming Soon', disabled: true },
  ];

  return (
    <div className="simhub-root">
      {/* Studio Header Bar */}
      <header className="simhub-top-nav">
        <div className="simhub-brand">
          <div className="brand-badge-pill">
            <span className="pulse-indicator" />
            <span className="brand-logo-text">SimHub</span>
          </div>
          <span className="brand-tagline">Visualizing Complex Concepts for Students</span>
        </div>

        {/* Simulation Selector Pills */}
        <div className="sim-pills-container">
          {simulationsList.map((sim) => (
            <button
              key={sim.id}
              className={`sim-pill-btn ${activeSimulation === sim.id ? 'active' : ''} ${
                sim.disabled ? 'disabled-sim' : ''
              }`}
              onClick={() => !sim.disabled && setActiveSimulation(sim.id)}
            >
              <span className="sim-pill-icon">{sim.icon}</span>
              <span className="sim-pill-title">{sim.title}</span>
              {sim.disabled && <span className="coming-soon-badge">Soon</span>}
            </button>
          ))}
        </div>
      </header>

      {/* Main Simulation Stage */}
      <main className="simhub-main-stage">
        {activeSimulation === 'gradient-descent' && <GradientDescent />}
      </main>
    </div>
  );
}

export default App;
