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
    <div className="monty-hall-container">
      {/* Top Editorial Header */}
      <header className="monty-header">
        <div className="monty-header-badge-row">
          <span className="monty-badge-pill">🎲 Probability & Game Theory</span>
          <span className="monty-badge-status">
            {activeTab === 'interactive'
              ? game.phase === 'PICK_INITIAL'
                ? 'Pick your initial door'
                : game.phase === 'FINAL_DECISION'
                ? 'Make your choice: Stick or Switch?'
                : game.isWin
                ? '🎉 Grand Prize Won!'
                : '🐐 Goat Revealed!'
              : 'Monte Carlo Lab Active'}
          </span>

          <button
            type="button"
            className="student-guide-header-btn"
            onClick={() => setIsGuideOpen(true)}
          >
            🎓 Concept Guide
          </button>

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

        <h1 className="monty-title">The Monty Hall Problem</h1>
        <p className="monty-subtitle">
          Behind 1 door is a luxury Sports Car 🏎️ and behind the rest are Goats 🐐. Should you stick or switch?
        </p>

        {/* Quick Student Quests Bar */}
        <div className="guided-quests-strip">
          <div className="quest-strip-label">
            <span>🎯 Student Quests:</span>
          </div>
          <div className="quest-buttons-list">
            <button
              type="button"
              className="quest-pill-btn"
              onClick={() => {
                setActiveTab('interactive');
                handleNumDoorsChange(3);
              }}
            >
              🚪 Classic 3-Door Game
            </button>
            <button
              type="button"
              className="quest-pill-btn"
              onClick={() => {
                setActiveTab('interactive');
                handleNumDoorsChange(8);
              }}
            >
              🌟 8-Door Extreme Mode
            </button>
            <button
              type="button"
              className="quest-pill-btn"
              onClick={() => {
                setActiveTab('monte-carlo');
              }}
            >
              📈 10,000 Trials Convergence
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Stage */}
      {activeTab === 'interactive' ? (
        <div className="monty-interactive-layout">
          {/* Top Live Host Dialogue & Action Banner */}
          <div className="host-commentary-banner">
            <div className="host-avatar-badge">
              <span className="host-emoji">🎙️</span>
              <span className="host-name">Monty Hall:</span>
            </div>
            <div className="host-speech-text">
              {game.phase === 'PICK_INITIAL' && (
                <span>
                  "Welcome, contestant! Choose any of the <strong>{numDoors} doors</strong> below to place your initial bet!"
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

          {/* 3D Doors Show Stage */}
          <div className="doors-stage-card">
            <div className="doors-stage-header">
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

              <div className="doors-hint-tag">
                {game.phase === 'PICK_INITIAL' && '👉 Click any door to pick'}
                {game.phase === 'FINAL_DECISION' && '🤔 Choose your strategy below'}
                {game.phase === 'ROUND_OVER' && '✨ Click Next Round to play again'}
              </div>
            </div>

            {/* Active Contenders Spotlight for High N Doors in Phase 3 & 4 */}
            {numDoors >= 6 && (game.phase === 'FINAL_DECISION' || game.phase === 'ROUND_OVER') && (
              <div className="contenders-spotlight-card">
                <div className="spotlight-title-row">
                  <span className="spotlight-badge">⚡ The Final Matchup</span>
                  <span className="spotlight-note">
                    Monty opened {game.hostOpenedDoors.length} goat doors! Only 2 doors remain closed:
                  </span>
                </div>
                <div className="spotlight-matchup-row">
                  <div className="contender-box contender-stick">
                    <span className="contender-tag">🔒 Your Initial Pick</span>
                    <strong className="contender-num">Door #{game.playerInitialPick + 1}</strong>
                    <span className="contender-prob">Initial Blind Guess: <strong>{((1 / numDoors) * 100).toFixed(1)}%</strong></span>
                  </div>
                  <span className="matchup-vs-badge">VS</span>
                  <div className="contender-box contender-switch">
                    <span className="contender-tag">🔀 Switch Target</span>
                    <strong className="contender-num">Door #{switchTargetDoor + 1}</strong>
                    <span className="contender-prob">Filtered by Monty: <strong>{(((numDoors - 1) / numDoors) * 100).toFixed(1)}%</strong></span>
                  </div>
                </div>
              </div>
            )}

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
                    <span className="btn-sub-label">Switch to remaining door ({numDoors - 1}/{numDoors} probability!)</span>
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

          {/* Lower 2-Column Grid: Live Scoreboard & Probability Blackboard */}
          <div className="monty-lower-grid">
            {/* Live Scoreboard Card */}
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

            {/* Probability Blackboard & Decision Tree */}
            <ProbabilityBlackboard activeCase={activeCase} />
          </div>
        </div>
      ) : (
        /* Monte Carlo Lab Mode */
        <MonteCarloSimulator numDoors={numDoors} />
      )}

      {/* Keyboard Shortcuts Helper Footer */}
      <footer className="gd-student-footer-bar">
        <div className="keyboard-shortcut-hints">
          <span className="shortcut-item"><kbd>1</kbd>-<kbd>{numDoors}</kbd> Pick Door</span>
          <span className="shortcut-item"><kbd>S</kbd> Switch</span>
          <span className="shortcut-item"><kbd>K</kbd> Stick</span>
          <span className="shortcut-item"><kbd>Space</kbd> Next Round</span>
          <span className="shortcut-item"><kbd>R</kbd> Reset</span>
          <span className="shortcut-item"><kbd>G</kbd> Concept Guide</span>
        </div>
      </footer>

      {/* Student Guide Modal */}
      <MontyGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onLaunchQuest={handleLaunchQuest}
      />
    </div>
  );
}
