import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './MontyHall.css';
import {
  createNewGame,
  getHostOpenedDoors,
  getSwitchDoorIndex,
} from './montyHallMath';
import DoorCard from './DoorCard';
import MonteCarloSimulator from './MonteCarloSimulator';
import ProbabilityBlackboard from './ProbabilityBlackboard';
import MontyGuideModal from './MontyGuideModal';

export default function MontyHall() {
  const [numDoors, setNumDoors] = useState(3);
  const [activeTab, setActiveTab] = useState('interactive'); // 'interactive' | 'monte-carlo'
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('all'); // 'all' | 'scoreboard' | 'tree' | 'montecarlo' | 'history'
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Interactive Game State
  const [game, setGame] = useState(() => createNewGame(3));
  const [activeCase, setActiveCase] = useState(null); // 1, 2, or 3 for blackboard tree highlight

  // Overall Scoreboard Stats
  const [stats, setStats] = useState({
    totalGames: 0,
    switchPlays: 0,
    switchWins: 0,
    stickPlays: 0,
    stickWins: 0,
  });

  // Start a new interactive round
  const startNewRound = useCallback((doorsCount = numDoors) => {
    const freshGame = createNewGame(doorsCount);
    setGame(freshGame);
    setActiveCase(null);
  }, [numDoors]);

  // Handle number of doors change (any N >= 3)
  const handleNumDoorsChange = (newCount) => {
    const parsed = parseInt(newCount, 10);
    const clamped = Math.max(3, Math.min(100, isNaN(parsed) ? 3 : parsed));
    setNumDoors(clamped);
    startNewRound(clamped);
  };

  // Step 1: Player makes initial pick
  const handleSelectInitialDoor = useCallback((doorIndex) => {
    if (game.phase !== 'PICK_INITIAL') return;

    const updatedDoors = game.doors.map((d) => ({
      ...d,
      isSelected: d.id === doorIndex,
    }));

    // Monty opens (numDoors - 2) goat doors
    const hostOpens = getHostOpenedDoors(game, doorIndex);

    // Identify which probability case this corresponds to in a 3-door game
    if (numDoors === 3) {
      if (game.carIndex === doorIndex) {
        setActiveCase(3); // Picked Car initially
      } else {
        // Picked a goat
        setActiveCase(doorIndex === 0 ? 1 : 2);
      }
    }

    setGame((prev) => ({
      ...prev,
      doors: updatedDoors,
      playerInitialPick: doorIndex,
      hostOpenedDoors: hostOpens,
      phase: 'HOST_REVEAL',
    }));

    // After a brief suspense pause, open Monty's goat doors
    setTimeout(() => {
      setGame((prev) => {
        const revealedDoors = prev.doors.map((d) => ({
          ...d,
          isOpen: hostOpens.includes(d.id) ? true : d.isOpen,
          isHostOpened: hostOpens.includes(d.id),
        }));

        return {
          ...prev,
          doors: revealedDoors,
          phase: 'FINAL_DECISION',
        };
      });
    }, 600);
  }, [game, numDoors]);

  // Step 2: Player chooses to STICK or SWITCH
  const handleFinalDecision = useCallback((strategy) => {
    if (game.phase !== 'FINAL_DECISION') return;

    const switchTarget = getSwitchDoorIndex(numDoors, game.playerInitialPick, game.hostOpenedDoors);
    const finalPick = strategy === 'SWITCH' ? switchTarget : game.playerInitialPick;
    const isWin = finalPick === game.carIndex;

    // Open all remaining doors to show full reveal
    const finalDoors = game.doors.map((d) => ({
      ...d,
      isOpen: true,
      isSelected: d.id === finalPick,
    }));

    setGame((prev) => ({
      ...prev,
      doors: finalDoors,
      playerFinalPick: finalPick,
      strategyUsed: strategy,
      phase: 'ROUND_OVER',
      isWin,
    }));

    // Update scoreboard stats
    setStats((prev) => {
      const isSwitch = strategy === 'SWITCH';
      return {
        totalGames: prev.totalGames + 1,
        switchPlays: isSwitch ? prev.switchPlays + 1 : prev.switchPlays,
        switchWins: isSwitch && isWin ? prev.switchWins + 1 : prev.switchWins,
        stickPlays: !isSwitch ? prev.stickPlays + 1 : prev.stickPlays,
        stickWins: !isSwitch && isWin ? prev.stickWins + 1 : prev.stickWins,
      };
    });
  }, [game.phase, game.playerInitialPick, game.hostOpenedDoors, game.carIndex, game.doors, numDoors]);

  // Reset Scoreboard Stats
  const resetStats = () => {
    setStats({
      totalGames: 0,
      switchPlays: 0,
      switchWins: 0,
      stickPlays: 0,
      stickWins: 0,
    });
  };

  // Launch a quest from the guide modal
  const handleLaunchQuest = (questType) => {
    if (questType === 'PLAY_3_DOORS') {
      setActiveTab('interactive');
      handleNumDoorsChange(3);
    } else if (questType === 'N_DOORS_10') {
      setActiveTab('interactive');
      handleNumDoorsChange(10);
    } else if (questType === 'MONTE_CARLO_1000') {
      setActiveTab('monte-carlo');
    }
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;

      if (e.code === 'KeyG') {
        e.preventDefault();
        setIsGuideOpen((prev) => !prev);
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        startNewRound();
      } else if (game.phase === 'PICK_INITIAL') {
        if (e.key >= '1' && e.key <= String(numDoors)) {
          const pickedIdx = parseInt(e.key, 10) - 1;
          handleSelectInitialDoor(pickedIdx);
        }
      } else if (game.phase === 'FINAL_DECISION') {
        if (e.code === 'KeyS') {
          e.preventDefault();
          handleFinalDecision('SWITCH');
        } else if (e.code === 'KeyK') {
          e.preventDefault();
          handleFinalDecision('STICK');
        }
      } else if (game.phase === 'ROUND_OVER') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          startNewRound();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [game.phase, numDoors, startNewRound, handleSelectInitialDoor, handleFinalDecision]);

  // Compute the target switch door for visual indication
  const switchTargetDoor = useMemo(() => {
    if (game.phase === 'FINAL_DECISION' && game.playerInitialPick !== null) {
      return getSwitchDoorIndex(numDoors, game.playerInitialPick, game.hostOpenedDoors);
    }
    return null;
  }, [numDoors, game.phase, game.playerInitialPick, game.hostOpenedDoors]);

  // Win rates for scoreboard
  const switchWinRate = stats.switchPlays > 0 ? (stats.switchWins / stats.switchPlays) * 100 : 0;
  const stickWinRate = stats.stickPlays > 0 ? (stats.stickWins / stats.stickPlays) * 100 : 0;

  return (
    <div className="sim-split-studio-layout monty-split-layout">
      {/* Left Column: UNSCROLLABLE WORKBENCH */}
      <div className="unscrollable-workbench-pane">
        <div className="workbench-top-simulation">
          {/* Interactive Game Stage */}
          {activeTab === 'interactive' ? (
            <div className="monty-interactive-workbench">
              {/* Host Dialogue Speech Banner */}
              <div className="host-commentary-banner">
                <div className="host-avatar-badge">
                  <span className="host-emoji">🎙️</span>
                  <span className="host-name">Monty Hall:</span>
                </div>
                <div className="host-speech-text">
                  {game.phase === 'PICK_INITIAL' && (
                    <span>
                      "Welcome! Choose any of the <strong>{numDoors} doors</strong> below to place your initial bet!"
                    </span>
                  )}
                  {game.phase === 'HOST_REVEAL' && (
                    <span>
                      "You chose <strong>Door #{game.playerInitialPick + 1}</strong>! Opening the goat doors..."
                    </span>
                  )}
                  {game.phase === 'FINAL_DECISION' && (
                    <span>
                      "I've opened the goat doors! Do you want to <strong>STICK with Door #{game.playerInitialPick + 1}</strong> or <strong>SWITCH to Door #{switchTargetDoor + 1}</strong>?"
                    </span>
                  )}
                  {game.phase === 'ROUND_OVER' && (
                    <span>
                      {game.isWin ? (
                        <span className="host-win-msg">
                          🎉 <strong>BAM! YOU WON THE SPORTS CAR!</strong> You used the <strong>{game.strategyUsed}</strong> strategy!
                        </span>
                      ) : (
                        <span className="host-lose-msg">
                          🐐 <strong>Baaah! It's a Goat!</strong> The car was behind <strong>Door #{game.carIndex + 1}</strong>.
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* 3D Doors Stage Card */}
              <div className="doors-stage-card">
                {/* Doors Flex Grid */}
                <div className={`doors-grid-container doors-count-${numDoors} ${numDoors >= 14 ? 'is-dense-grid' : ''}`}>
                  {game.doors.map((door) => (
                    <DoorCard
                      key={door.id}
                      door={door}
                      onClick={() => handleSelectInitialDoor(door.id)}
                      isSelectable={game.phase === 'PICK_INITIAL'}
                      isSwitchTarget={door.id === switchTargetDoor}
                      showResult={game.phase === 'ROUND_OVER'}
                      phase={game.phase}
                      totalDoors={numDoors}
                    />
                  ))}
                </div>

                {/* Phase 3 Final Decision Action Bar */}
                {game.phase === 'FINAL_DECISION' && (
                  <div className="final-decision-action-bar">
                    <button
                      type="button"
                      className="decision-btn stick-btn"
                      onClick={() => handleFinalDecision('STICK')}
                    >
                      <span className="btn-icon">🔒</span>
                      <div className="btn-text-group">
                        <strong className="btn-main-label">STICK WITH DOOR #{game.playerInitialPick + 1}</strong>
                        <span className="btn-sub-label">Keep initial bet (1/{numDoors} probability)</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="decision-btn switch-btn"
                      onClick={() => handleFinalDecision('SWITCH')}
                    >
                      <span className="btn-icon">🔀</span>
                      <div className="btn-text-group">
                        <strong className="btn-main-label">SWITCH TO DOOR #{switchTargetDoor + 1}</strong>
                        <span className="btn-sub-label">Switch to filtered door ({numDoors - 1}/{numDoors} probability!)</span>
                      </div>
                    </button>
                  </div>
                )}

                {/* Phase 4 Round Over Next Button */}
                {game.phase === 'ROUND_OVER' && (
                  <div className="round-over-action-bar">
                    <button
                      type="button"
                      className="next-round-btn"
                      onClick={() => startNewRound()}
                    >
                      ▶ Next Round (Space)
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Monte Carlo Standalone in Left Window */
            <div className="monte-carlo-workbench-wrapper">
              <MonteCarloSimulator numDoors={numDoors} />
            </div>
          )}
        </div>

        {/* Bottom Area: PARAMETERS TO RUN SIMULATION */}
        <div className="workbench-bottom-controls">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="monty-badge-status" style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              {activeTab === 'interactive' ? (
                <>
                  {game.phase === 'PICK_INITIAL' && 'Step 1: Pick a Door'}
                  {game.phase === 'HOST_REVEAL' && 'Step 2: Monty Opens Goat Doors'}
                  {game.phase === 'FINAL_DECISION' && 'Step 3: Stick or Switch?'}
                  {game.phase === 'ROUND_OVER' && (game.isWin ? '🎉 Winner!' : '🐐 Goat!')}
                </>
              ) : (
                'Automated Simulation Lab'
              )}
            </span>
            {/* Mode Switcher: Interactive Game Show vs Monte Carlo Simulator */}
            <div className="visual-mode-toggle-pill">
              <button
                className={`vm-toggle-btn ${activeTab === 'interactive' ? 'active' : ''}`}
                onClick={() => setActiveTab('interactive')}
              >
                🎪 Game Show
              </button>
              <button
                className={`vm-toggle-btn ${activeTab === 'monte-carlo' ? 'active' : ''}`}
                onClick={() => setActiveTab('monte-carlo')}
              >
                ⚡ Monte Carlo Lab
              </button>
            </div>
          </div>

          <div className="stage-door-count-control">
            <span className="stage-label">Doors (N):</span>
            <div className="doors-quick-presets">
              {[3, 4, 5, 8, 10, 20, 50, 100].map((count) => (
                <button
                  key={count}
                  className={`door-count-btn ${numDoors === count ? 'active' : ''}`}
                  onClick={() => handleNumDoorsChange(count)}
                >
                  {count}
                </button>
              ))}
            </div>

            <div className="custom-door-input-group">
              <button
                className="stepper-btn"
                onClick={() => handleNumDoorsChange(numDoors - 1)}
                disabled={numDoors <= 3}
                title="Decrease Doors"
              >
                −
              </button>
              <input
                type="number"
                min="3"
                max="100"
                value={numDoors}
                onChange={(e) => handleNumDoorsChange(e.target.value)}
                className="custom-door-number-input"
                title="Enter any number of doors (3 - 100)"
              />
              <button
                className="stepper-btn"
                onClick={() => handleNumDoorsChange(numDoors + 1)}
                disabled={numDoors >= 100}
                title="Increase Doors"
              >
                +
              </button>
            </div>

            <div className="door-prob-preview-pill">
              <span>Switch: <strong>{(((numDoors - 1) / numDoors) * 100).toFixed(1)}%</strong></span>
              <span>Stick: <strong>{((1 / numDoors) * 100).toFixed(1)}%</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: SCROLLABLE ANALYSIS & CONCEPTS */}
      <div className="scrollable-analysis-pane">
        {/* Top Tab Selector Pills */}
        <div className="analysis-tabs-bar">
          <button
            className={`analysis-tab-pill ${activeAnalysisTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveAnalysisTab('all')}
          >
            📋 All Notes
          </button>
          <button
            className={`analysis-tab-pill ${activeAnalysisTab === 'scoreboard' ? 'active' : ''}`}
            onClick={() => setActiveAnalysisTab('scoreboard')}
          >
            📊 Scoreboard
          </button>
          <button
            className={`analysis-tab-pill ${activeAnalysisTab === 'tree' ? 'active' : ''}`}
            onClick={() => setActiveAnalysisTab('tree')}
          >
            🌳 Decision Tree
          </button>
          <button
            className={`analysis-tab-pill ${activeAnalysisTab === 'montecarlo' ? 'active' : ''}`}
            onClick={() => setActiveAnalysisTab('montecarlo')}
          >
            ⚡ Monte Carlo
          </button>
          <button
            className={`analysis-tab-pill ${activeAnalysisTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveAnalysisTab('history')}
          >
            🎓 Marilyn's Proof
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="analysis-scrollable-content">
          {/* Live Scoreboard Card (When 'all' or 'scoreboard') */}
          {(activeAnalysisTab === 'all' || activeAnalysisTab === 'scoreboard') && (
            <div className="scoreboard-card surface-cream">
              <div className="scoreboard-header">
                <h4 className="scoreboard-title">📊 Your Live Scoreboard</h4>
                <button className="reset-stats-btn" onClick={resetStats} title="Reset Stats">
                  ↺ Reset
                </button>
              </div>

              <div className="stats-comparison-row">
                {/* Switch Column */}
                <div className="stat-strategy-col switch-col">
                  <span className="stat-col-badge">🔀 When You Switch</span>
                  <strong className="stat-win-rate">{switchWinRate.toFixed(0)}%</strong>
                  <span className="stat-detail">
                    {stats.switchWins} wins / {stats.switchPlays} games
                  </span>
                  <div className="stat-bar-track">
                    <div className="stat-bar-fill switch-fill" style={{ width: `${switchWinRate}%` }} />
                  </div>
                  <span className="stat-target-note">Target: {(((numDoors - 1) / numDoors) * 100).toFixed(1)}%</span>
                </div>

                {/* Stick Column */}
                <div className="stat-strategy-col stick-col">
                  <span className="stat-col-badge">🔒 When You Stick</span>
                  <strong className="stat-win-rate">{stickWinRate.toFixed(0)}%</strong>
                  <span className="stat-detail">
                    {stats.stickWins} wins / {stats.stickPlays} games
                  </span>
                  <div className="stat-bar-track">
                    <div className="stat-bar-fill stick-fill" style={{ width: `${stickWinRate}%` }} />
                  </div>
                  <span className="stat-target-note">Target: {((1 / numDoors) * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="scoreboard-footer-note">
                Total Games Played: <strong>{stats.totalGames}</strong>
              </div>
            </div>
          )}

          {/* Probability Blackboard & Decision Tree (When 'all' or 'tree') */}
          {(activeAnalysisTab === 'all' || activeAnalysisTab === 'tree') && (
            <ProbabilityBlackboard activeCase={activeCase} />
          )}

          {/* Monte Carlo Lab (When 'all' or 'montecarlo') */}
          {(activeAnalysisTab === 'all' || activeAnalysisTab === 'montecarlo') && (
            <div className="monte-carlo-analysis-card">
              <MonteCarloSimulator numDoors={numDoors} />
            </div>
          )}

          {/* Marilyn vos Savant & Historical Controversy (When 'all' or 'history') */}
          {(activeAnalysisTab === 'all' || activeAnalysisTab === 'history') && (
            <div className="concepts-analysis-card surface-cream">
              <div className="card-top-row">
                <h4 className="card-sec-title">🎓 The 1990 Marilyn vos Savant Controversy</h4>
                <button
                  type="button"
                  className="open-full-guide-btn"
                  onClick={() => setIsGuideOpen(true)}
                >
                  Full Modal Guide ➔
                </button>
              </div>

              <div className="concepts-cards-stack">
                <div className="concept-brief-box">
                  <strong>💡 The 100-Door Intuition</strong>
                  <p>
                    Imagine 100 doors. You pick Door #1 (1/100 chance). Monty opens 98 goat doors, leaving only Door #77.
                    Did your blind guess magically pick the car (1%), or did Monty's filter funnel the remaining 99% of probability into Door #77?
                  </p>
                </div>

                <div className="concept-brief-box">
                  <strong>📜 The Host's Asymmetric Knowledge</strong>
                  <p>
                    Monty is forbidden from opening the car door or your door. This asymmetric filter preserves your initial 1/N odds while concentrating all the remaining (N-1)/N probability into the single switch target!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Student Guide Modal */}
      <MontyGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onLaunchQuest={handleLaunchQuest}
      />
    </div>
  );
}
