import React from 'react';
import './HomePage.css';

function HomePage({ onSelectSimulation }) {
  const simulationCards = [
    {
      id: 'gradient-descent',
      title: 'Gradient Descent',
      icon: '📉',
      iconClass: 'icon-gd',
      cardClass: 'card-gradient-descent',
      btnClass: 'btn-gd',
      category: 'Machine Learning & Optimization',
      equation: 'wₜ₊₁ = wₜ − η·∇L(wₜ) + β·vₜ',
      description:
        'Explore 2D and 3D loss surfaces, non-convex double wells, learning rates (η), and momentum dynamics with step-by-step convergence telemetry.',
      tags: ['Loss Landscapes', 'Momentum β', 'Learning Rate η', 'Saddle Points'],
    },
    {
      id: 'monty-hall',
      title: 'Monty Hall Problem',
      icon: '🚪',
      iconClass: 'icon-mh',
      cardClass: 'card-monty-hall',
      btnClass: 'btn-mh',
      category: 'Probability & Game Theory',
      equation: 'P(Win | Switch) = (N−1)/N ≈ 66.7%',
      description:
        'Test the famous 3-door probability paradox through interactive single-play reveals and high-speed Monte Carlo batch simulations (N = 10,000).',
      tags: ['Bayesian Updating', 'Monte Carlo N=10k', 'Win-Rate Convergence', 'Streaks'],
    },
    {
      id: 'projectile-motion',
      title: 'Projectile Motion',
      icon: '🎯',
      iconClass: 'icon-pm',
      cardClass: 'card-projectile-motion',
      btnClass: 'btn-pm',
      category: 'Classical Mechanics & Kinematics',
      equation: 'y(t) = y₀ + v₀ᵧt − ½gt²  |  R = (v₀²sin 2θ)/g',
      description:
        'Freeform ballistic sandbox with draggable cannon and floating targets. Features quadratic air drag, wind resistance, and 6 live telemetry graphs.',
      tags: ['Draggable Target', 'Air Drag & Wind', '6 Live Graphs', 'Energy Conservation'],
    },
    {
      id: 'electron-clouding',
      title: 'Electron Clouding',
      icon: '⚛️',
      iconClass: 'icon-ec',
      cardClass: 'card-electron-clouding',
      btnClass: 'btn-ec',
      category: 'Quantum Mechanics & Chemistry',
      equation: 'ψₙₗₘ(r, θ, φ) = Rₙₗ(r) · Yₗₘ(θ, φ)',
      description:
        'Interactive 3D Three.js WebGL Hydrogen orbitals (n = 1..4). Features 40,000-point probability clouds, 90% boundary lobes, and Rydberg spectral transitions.',
      tags: ['3D WebGL (n=1..4)', 'Monte Carlo Cloud', 'Isosurface Lobes', 'Spectral Jump'],
    },
  ];

  return (
    <div className="simhub-home-container">
      {/* Hero Welcome Banner */}
      <section className="home-hero-card">
        <div className="hero-pill-badge">
          <span className="hero-sparkle">✨</span>
          <span>Interactive STEM Discovery Studio • 4 Active Simulations</span>
        </div>

        <h1 className="hero-headline">
          Master Complex Concepts Through <span className="gradient-text">Interactive Physics & Math</span>
        </h1>

        <p className="hero-subtext">
          Experience Optimization, Probability Paradoxes, Classical Kinematics, and 3D Quantum Mechanics
          through real-time mathematical visualizations built for students, educators, and researchers.
        </p>

        <div className="hero-metrics-row">
          <div className="metric-stat-item">
            <span className="metric-num">4</span>
            <span className="metric-label">Active Simulation Labs</span>
          </div>
          <div className="metric-divider" />
          <div className="metric-stat-item">
            <span className="metric-num">100%</span>
            <span className="metric-label">Real-Time Analytical Math</span>
          </div>
          <div className="metric-divider" />
          <div className="metric-stat-item">
            <span className="metric-num">60 FPS</span>
            <span className="metric-label">WebGL 3D & 2D Vector Physics</span>
          </div>
          <div className="metric-divider" />
          <div className="metric-stat-item">
            <span className="metric-num">Live</span>
            <span className="metric-label">Synchronized Graph Telemetry</span>
          </div>
        </div>
      </section>

      {/* Simulations Grid Showcase */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="home-section-header">
          <h2 className="home-section-title">Explore Simulation Studios</h2>
          <span className="home-section-sub">Select any lab to launch its full-screen interactive workbench</span>
        </div>

        <div className="simulations-showcase-grid">
          {simulationCards.map((card) => (
            <div
              key={card.id}
              className={`sim-showcase-card ${card.cardClass}`}
              onClick={() => onSelectSimulation(card.id)}
            >
              {/* Top Row: Icon + Category Tag */}
              <div className="card-header-group">
                <div className={`sim-icon-badge ${card.iconClass}`}>{card.icon}</div>
                <span className="sim-category-pill">{card.category}</span>
              </div>

              {/* Main Info */}
              <div className="card-content-body">
                <h3 className="sim-card-title">{card.title}</h3>
                <p className="sim-card-desc">{card.description}</p>
              </div>

              {/* Formula Strip */}
              <div className="equation-highlight-strip">
                <span className="eq-tag-tiny">Key Equation</span>
                <span className="eq-formula-mono">{card.equation}</span>
              </div>

              {/* Feature Chips */}
              <div className="feature-tags-row">
                {card.tags.map((tag) => (
                  <span key={tag} className="feature-tag-chip">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Launch CTA Button */}
              <button
                type="button"
                className={`launch-sim-btn ${card.btnClass}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSimulation(card.id);
                }}
              >
                <span>Launch {card.title}</span>
                <span>➔</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Core Design & Learning Principles Bento */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="home-section-header">
          <h2 className="home-section-title">Built for Intuitive STEM Learning</h2>
          <span className="home-section-sub">Why interactive mathematical simulation beats static textbooks</span>
        </div>

        <div className="principles-bento-grid">
          <div className="principle-card surface-yellow">
            <span className="principle-icon">📐</span>
            <h4 className="principle-title">Mathematical Rigor & Exact Solutions</h4>
            <p className="principle-desc">
              Every curve, particle, and trajectory is driven by first-principles equations — from exact
              Laguerre polynomials in Hydrogen wavefunctions to 2nd-order symplectic ballistic integrators.
            </p>
          </div>

          <div className="principle-card surface-blue">
            <span className="principle-icon">🎮</span>
            <h4 className="principle-title">Freeform Sandbox Experimentation</h4>
            <p className="principle-desc">
              Drag cannons, move targets in real time, spin 3D orbital clouds, and test parameter edge-cases
              with instantaneous visual and numerical feedback.
            </p>
          </div>

          <div className="principle-card surface-emerald">
            <span className="principle-icon">📊</span>
            <h4 className="principle-title">Synchronized Live Telemetry</h4>
            <p className="principle-desc">
              Multi-panel bento studios map animated visual stages side-by-side with live SVG graphs, phase
              diagrams, energy balances, and statistical convergence charts.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div>
          <strong>SimHub</strong> • Educational STEM Discovery Platform
        </div>
        <div className="footer-quote">
          “Visualizing the beauty of mathematics, physics, and probability.”
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
