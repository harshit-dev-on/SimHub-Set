import React, { useState, useEffect } from 'react';
import './App.css';
import MontyHall from './MontyHall';
import TutorialCompanion from './Tutorial/TutorialCompanion';

export default function App() {
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
    <div className="standalone-app-root">
      {/* Top Navbar */}
      <header className="standalone-top-nav">
        <div className="brand-badge-pill">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M 3 8 Q 12 20 21 8" stroke="#66BB6A" strokeWidth="2.8" strokeLinecap="round" />
            <circle cx="12" cy="14.5" r="3.2" fill="#EE7258" stroke="#FFFFFF" strokeWidth="1.2" />
          </svg>
          <span className="brand-logo-text">SimHub</span>
          <span className="brand-separator">•</span>
          <span className="standalone-sim-title">Monty Hall Problem Studio</span>
        </div>

        <div className="nav-actions-group">
          <button 
            className="fullscreen-toggle-btn" 
            onClick={toggleFullscreen} 
            title="Toggle Fullscreen"
          >
            {isFullscreen ? '↙ Standard' : '⛶ Fullscreen'}
          </button>
        </div>
      </header>

      {/* Main Simulation Workspace */}
      <main className="standalone-main-content">
        <MontyHall />
      </main>

      {/* Professor Piplu Interactive Companion */}
      <TutorialCompanion
        activeSimulation="monty-hall"
        isOpen={isTutorialOpen}
        onOpen={() => setIsTutorialOpen(true)}
        onClose={() => setIsTutorialOpen(false)}
      />
    </div>
  );
}
