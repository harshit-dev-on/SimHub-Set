// Safe Math Expression Parser & Numerical Differentiation Engine

/**
 * Transforms a user mathematical string (e.g. "x^3 - 2x + sin(x)") into a safe JS executable function
 */
export function compileMathExpression(rawExpr) {
  if (!rawExpr || typeof rawExpr !== 'string' || !rawExpr.trim()) {
    throw new Error('Please enter a mathematical expression.');
  }

  let expr = rawExpr.trim();

  // Basic security sanitize: allow only valid math characters & identifiers
  const validPattern = /^[0-9xX\s+\-*/^().,_a-zA-Z]+$/;
  if (!validPattern.test(expr)) {
    throw new Error('Expression contains invalid characters.');
  }

  // Check balanced parentheses
  let parenCount = 0;
  for (const char of expr) {
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
    if (parenCount < 0) throw new Error('Unbalanced closing parenthesis ")"');
  }
  if (parenCount !== 0) {
    throw new Error('Unbalanced open parenthesis "("');
  }

  // Pre-process math syntax
  let transformed = expr
    // Replace ln with log
    .replace(/\bln\b/g, 'log')
    // Support implicit multiplication like 2x -> 2*x, 3.5x -> 3.5*x
    .replace(/(\d+(\.\d+)?)\s*([xX])/g, '$1*$3')
    // Implicit multiplication like 2(x+1) -> 2*(x+1)
    .replace(/(\d+(\.\d+)?)\s*\(/g, '$1*(')
    // Implicit multiplication like (x+1)(x-2) -> (x+1)*(x-2)
    .replace(/\)\s*\(/g, ')*(')
    // Implicit multiplication like )x -> )*x
    .replace(/\)\s*([xX])/g, ')*$1')
    // Replace ^ power with **
    .replace(/\^/g, '**');

  // List of supported Math functions and constants
  const mathProps = [
    'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
    'sinh', 'cosh', 'tanh',
    'exp', 'log', 'log10', 'log2',
    'sqrt', 'cbrt', 'abs', 'sign',
    'floor', 'ceil', 'round',
    'PI', 'E'
  ];

  // Map known function names to Math.<name>
  mathProps.forEach((prop) => {
    const regex = new RegExp(`\\b${prop}\\b`, 'gi');
    transformed = transformed.replace(regex, `Math.${prop}`);
  });

  // Ensure 'x' or 'X' is lowercase
  transformed = transformed.replace(/\bX\b/g, 'x');

  // Build the compiled evaluation function
  let fn;
  try {
    // eslint-disable-next-line no-new-func
    fn = new Function('x', `"use strict"; return (${transformed});`);
  } catch (err) {
    throw new Error(`Syntax error in expression: ${err.message}`);
  }

  // Test with a sample value to verify execution
  try {
    const testVal = fn(1);
    if (typeof testVal !== 'number' || isNaN(testVal)) {
      // test with another point like 0.5
      const testVal2 = fn(0.5);
      if (typeof testVal2 !== 'number') {
        throw new Error('Expression did not evaluate to a valid number.');
      }
    }
  } catch (err) {
    throw new Error(`Could not evaluate function: ${err.message}`);
  }

  // Generate numerical derivative using symmetric difference quotient
  const derivative = (x) => {
    const h = 1e-5;
    const yPlus = fn(x + h);
    const yMinus = fn(x - h);
    if (isNaN(yPlus) || isNaN(yMinus)) return 0;
    return (yPlus - yMinus) / (2 * h);
  };

  return {
    rawExpr: expr,
    transformedExpr: transformed,
    fn,
    derivative,
  };
}

/**
 * Automatically computes optimal Y-bounds and a good starting position for a function
 */
export function computeFunctionBounds(fn, xMin = -4, xMax = 4, samples = 120) {
  let yMin = Infinity;
  let yMax = -Infinity;
  const step = (xMax - xMin) / samples;

  let bestStart = (xMin + xMax) / 2 + 1.2;

  for (let i = 0; i <= samples; i++) {
    const x = xMin + i * step;
    try {
      const y = fn(x);
      if (typeof y === 'number' && !isNaN(y) && isFinite(y)) {
        if (y < yMin) yMin = y;
        if (y > yMax) yMax = y;
      }
    } catch {
      // skip singularities
    }
  }

  if (!isFinite(yMin) || !isFinite(yMax) || yMin === yMax) {
    yMin = -2;
    yMax = 10;
  }

  // Add 15% margin padding
  const range = yMax - yMin;
  const padding = range === 0 ? 2 : range * 0.15;
  const boundedYMin = yMin - padding;
  const boundedYMax = yMax + padding;

  return {
    yMin: Number(boundedYMin.toFixed(2)),
    yMax: Number(boundedYMax.toFixed(2)),
    defaultX0: Number(bestStart.toFixed(2)),
  };
}

/**
 * Student-friendly preset custom functions for one-click inspiration
 */
export const PRESET_CUSTOM_TEMPLATES = [
  {
    name: 'Damped Sine Wave',
    expr: 'sin(2*x) * exp(-0.3*x) + 0.2*x^2',
    xMin: -4,
    xMax: 4,
    badge: 'Multi-Dip',
    badgeColor: '#A7C7F9',
    description: 'Oscillating ripples with multiple local minima and decay.',
  },
  {
    name: 'Sombrero / Mexican Hat',
    expr: '-3 * exp(-x^2 / 2) + 0.15*x^2',
    xMin: -4,
    xMax: 4,
    badge: 'Global Dip',
    badgeColor: '#C2EBB6',
    description: 'Classic inverted Gaussian dip surrounded by rising quadratic walls.',
  },
  {
    name: 'Cubic Saddle Valley',
    expr: 'x^3 - 3*x + 2',
    xMin: -3,
    xMax: 3,
    badge: 'Saddle Point',
    badgeColor: '#F7D25A',
    description: 'Features a local maximum, inflection/saddle area, and deep descent.',
  },
  {
    name: 'Rastrigin 1D (Rugged)',
    expr: 'x^2 - 3*cos(2*PI*x) + 3',
    xMin: -3,
    xMax: 3,
    badge: 'Rugged Landscape',
    badgeColor: '#EE7258',
    description: 'Highly multimodal rugged surface with many deceptive local minima traps.',
  },
];
