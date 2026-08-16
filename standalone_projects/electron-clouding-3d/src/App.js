import React, { useState, useEffect } from 'react';
import './App.css';
import ElectronClouding from './ElectronClouding';
import TutorialCompanion from './Tutorial/TutorialCompanion';

function App() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  return (
    <div className={`simhub-root ${isFullscreen ? 'is-fullscreen-active' : ''}`}>
      {/* Top Navigation (Exact Original SimHub Header Bar) */}
      <header className="simhub-top-nav">
        <div className="simhub-brand">
          <div className="brand-badge-pill">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M 3 8 Q 12 20 21 8" stroke="#66BB6A" strokeWidth="2.8" strokeLinecap="round" />
              <circle cx="12" cy="14.5" r="3.2" fill="#EE7258" stroke="#FFFFFF" strokeWidth="1.2" />
            </svg>
            <span className="brand-logo-text">SimHub</span>
          </div>
          <span className="brand-tagline">Quantum Mechanics & Hydrogen Orbitals</span>
        </div>

        {/* Navigation Actions Group */}
        <div className="nav-actions-group">
          <div className="sim-pills-container">
            <div className="sim-pill-btn active">
              <span className="sim-pill-title">Electron Clouding 3D</span>
            </div>
          </div>

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

      {/* Main Simulation Stage (Exact Original Layout & Workbench Styling) */}
      <main className="simhub-main-stage">
        <ElectronClouding />
      </main>

      {/* Interactive Duolingo-Style STEM Companion (Professor Piplu 🐧) */}
      <TutorialCompanion
        activeSimulation="electron-clouding"
        isOpen={isTutorialOpen}
        onOpen={() => setIsTutorialOpen(true)}
        onClose={() => setIsTutorialOpen(false)}
      />

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
