import React, { useState, useEffect } from 'react';
import './App.css';
import HomePage from './Home/HomePage';
import GradientDescent from './Simulations/Gradient Descent/GradientDescent';
import MontyHall from './Simulations/Monty Hall/MontyHall';
import ProjectileMotion from './Simulations/Projectile Motion/ProjectileMotion';
import ElectronClouding from './Simulations/Electron Clouding/ElectronClouding';

function App() {
  const [activeSimulation, setActiveSimulation] = useState('home');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync state with native fullscreen changes (e.g. Esc or F11 key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch((err) => console.error(err));
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        docEl.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => console.error(err));
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  const simulationsList = [
    { id: 'home', title: 'Home', icon: '🏠', tag: 'Discovery Hub' },
    { id: 'gradient-descent', title: 'Gradient Descent', icon: '📉', tag: 'Optimization' },
    { id: 'monty-hall', title: 'Monty Hall Problem', icon: '🚪', tag: 'Probability' },
    { id: 'projectile-motion', title: 'Projectile Motion', icon: '🎯', tag: 'Physics' },
    { id: 'electron-clouding', title: 'Electron Clouding', icon: '⚛️', tag: 'Quantum Mechanics' },
  ];

  return (
    <div className={`simhub-root ${isFullscreen ? 'is-fullscreen-active' : ''}`}>
      {/* Studio Header Bar */}
      <header className="simhub-top-nav">
        <div
          className="simhub-brand"
          onClick={() => setActiveSimulation('home')}
          style={{ cursor: 'pointer' }}
          title="Return to SimHub Home"
        >
          <div className="brand-badge-pill">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M 3 8 Q 12 20 21 8" stroke="#66BB6A" strokeWidth="2.8" strokeLinecap="round" />
              <circle cx="12" cy="14.5" r="3.2" fill="#EE7258" stroke="#FFFFFF" strokeWidth="1.2" />
            </svg>
            <span className="brand-logo-text">SimHub</span>
          </div>
          <span className="brand-tagline">Visualizing Complex Concepts for Students</span>
        </div>

        {/* Navigation Actions Group (Pills + Fullscreen Toggle) */}
        <div className="nav-actions-group">
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

          {/* Fullscreen / Minimise Toggle Button */}
          <button
            type="button"
            className={`fullscreen-toggle-btn ${isFullscreen ? 'is-active-fullscreen' : ''}`}
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Minimise / Exit Fullscreen (Esc)' : 'Enter Fullscreen Mode'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                </svg>
                <span>Minimise</span>
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
                <span>Fullscreen</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Simulation Stage */}
      <main className={`simhub-main-stage ${activeSimulation === 'home' ? 'is-home-stage' : ''}`}>
        {activeSimulation === 'home' && (
          <HomePage onSelectSimulation={(simId) => setActiveSimulation(simId)} />
        )}
        {activeSimulation === 'gradient-descent' && <GradientDescent />}
        {activeSimulation === 'monty-hall' && <MontyHall />}
        {activeSimulation === 'projectile-motion' && <ProjectileMotion />}
        {activeSimulation === 'electron-clouding' && <ElectronClouding />}
      </main>

      {/* Floating Minimise Button when in Fullscreen Mode */}
      {isFullscreen && (
        <button
          type="button"
          className="fullscreen-floating-exit-btn"
          onClick={toggleFullscreen}
          title="Exit Fullscreen (Esc)"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
          </svg>
          <span>Minimise</span>
        </button>
      )}
    </div>
  );
}

export default App;
