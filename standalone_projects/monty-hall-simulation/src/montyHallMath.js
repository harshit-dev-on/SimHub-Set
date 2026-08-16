/**
 * Monty Hall Mathematical Core & Simulation Utilities
 */

/**
 * Creates a new Monty Hall game round configuration
 * @param {number} numDoors - Number of doors (default 3)
 * @returns {object} Game state with car index and doors array
 */
export function createNewGame(numDoors = 3) {
  const carIndex = Math.floor(Math.random() * numDoors);
  const doors = Array.from({ length: numDoors }, (_, idx) => ({
    id: idx,
    doorNumber: idx + 1,
    hasCar: idx === carIndex,
    hasGoat: idx !== carIndex,
    isOpen: false,
    isSelected: false,
    isHostOpened: false,
  }));

  return {
    numDoors,
    carIndex,
    doors,
    playerInitialPick: null,
    playerFinalPick: null,
    hostOpenedDoors: [],
    phase: 'PICK_INITIAL', // 'PICK_INITIAL' | 'HOST_REVEAL' | 'FINAL_DECISION' | 'ROUND_OVER'
    strategyUsed: null, // 'STICK' | 'SWITCH'
    isWin: false,
  };
}

/**
 * Simulates Host Monty Hall opening (N - 2) goat doors
 * Monty always knows where the car is and NEVER opens the car door or the player's chosen door.
 * @param {object} game - Current game object
 * @param {number} playerPick - Player's chosen door index
 * @returns {number[]} Array of door indices opened by Monty
 */
export function getHostOpenedDoors(game, playerPick) {
  const { numDoors, carIndex } = game;
  const availableGoatDoors = [];

  for (let i = 0; i < numDoors; i++) {
    if (i !== playerPick && i !== carIndex) {
      availableGoatDoors.push(i);
    }
  }

  // Shuffle available goat doors
  const shuffledGoats = [...availableGoatDoors].sort(() => Math.random() - 0.5);

  // In standard 3-door game, Monty opens 1 goat door.
  // In N-door game, Monty opens (N - 2) goat doors, leaving exactly 1 unopened alternative!
  const doorsToOpenCount = numDoors - 2;
  return shuffledGoats.slice(0, doorsToOpenCount);
}

/**
 * Gets the single remaining unopened alternative door index when switching
 * @param {number} numDoors - Total doors
 * @param {number} playerPick - Initial player pick
 * @param {number[]} hostOpenedDoors - Indices opened by host
 * @returns {number} The switch target door index
 */
export function getSwitchDoorIndex(numDoors, playerPick, hostOpenedDoors) {
  const openedSet = new Set(hostOpenedDoors);
  for (let i = 0; i < numDoors; i++) {
    if (i !== playerPick && !openedSet.has(i)) {
      return i;
    }
  }
  return playerPick;
}

/**
 * Runs a single simulated Monty Hall trial with given strategy
 * @param {string} strategy - 'SWITCH' | 'STICK' | 'RANDOM'
 * @param {number} numDoors - Total doors (default 3)
 * @returns {object} Trial result with isWin, carIndex, initialPick, finalPick
 */
export function runSingleTrial(strategy = 'SWITCH', numDoors = 3) {
  const carIndex = Math.floor(Math.random() * numDoors);
  const initialPick = Math.floor(Math.random() * numDoors);

  // Host opens (numDoors - 2) goat doors
  const candidateGoats = [];
  for (let i = 0; i < numDoors; i++) {
    if (i !== initialPick && i !== carIndex) {
      candidateGoats.push(i);
    }
  }
  candidateGoats.sort(() => Math.random() - 0.5);
  const hostOpens = candidateGoats.slice(0, numDoors - 2);
  const switchDoor = getSwitchDoorIndex(numDoors, initialPick, hostOpens);

  let finalPick = initialPick;
  let effectiveStrategy = strategy;

  if (strategy === 'RANDOM') {
    effectiveStrategy = Math.random() < 0.5 ? 'SWITCH' : 'STICK';
  }

  if (effectiveStrategy === 'SWITCH') {
    finalPick = switchDoor;
  } else {
    finalPick = initialPick;
  }

  const isWin = finalPick === carIndex;

  return {
    strategy: effectiveStrategy,
    carIndex,
    initialPick,
    finalPick,
    hostOpens,
    isWin,
  };
}

/**
 * Runs a high-speed Monte Carlo batch simulation
 * @param {number} totalTrials - Number of trials to run (e.g. 100, 1000, 10000)
 * @param {number} numDoors - Total doors (default 3)
 * @returns {object} Summary stats and convergence history points
 */
export function runMonteCarloBatch(totalTrials = 1000, numDoors = 3) {
  let switchWins = 0;
  let stickWins = 0;

  const history = [];
  const maxHistoryPoints = 120;
  const sampleInterval = Math.max(1, Math.floor(totalTrials / maxHistoryPoints));

  for (let t = 1; t <= totalTrials; t++) {
    // Run 1 trial for Switch strategy
    const switchRes = runSingleTrial('SWITCH', numDoors);
    if (switchRes.isWin) switchWins++;

    // Run 1 trial for Stick strategy
    const stickRes = runSingleTrial('STICK', numDoors);
    if (stickRes.isWin) stickWins++;

    if (t % sampleInterval === 0 || t === totalTrials) {
      history.push({
        trial: t,
        switchWinRate: (switchWins / t) * 100,
        stickWinRate: (stickWins / t) * 100,
      });
    }
  }

  const theoreticalSwitchWinRate = ((numDoors - 1) / numDoors) * 100;
  const theoreticalStickWinRate = (1 / numDoors) * 100;

  return {
    totalTrials,
    numDoors,
    switchWins,
    switchLosses: totalTrials - switchWins,
    switchWinRate: (switchWins / totalTrials) * 100,
    stickWins,
    stickLosses: totalTrials - stickWins,
    stickWinRate: (stickWins / totalTrials) * 100,
    theoreticalSwitchWinRate,
    theoreticalStickWinRate,
    history,
  };
}
