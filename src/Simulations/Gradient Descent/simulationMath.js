// Mathematical functions and their analytical derivatives for Gradient Descent simulation

export const LOSS_FUNCTIONS = {
  quadratic: {
    id: 'quadratic',
    name: 'Convex Bowl (f(x) = x²)',
    badge: 'Single Global Min',
    badgeColor: '#C2EBB6',
    description: 'A smooth, perfectly convex quadratic loss landscape. Ideal for seeing optimal vs overshooting learning rates.',
    xMin: -4,
    xMax: 4,
    yMin: -0.5,
    yMax: 16,
    defaultX0: 3.2,
    defaultLr: 0.15,
    fn: (x) => x * x,
    derivative: (x) => 2 * x,
    latex: 'f(x) = x^2',
    derivLatex: "f'(x) = 2x",
    optimum: 0,
  },
  doubleWell: {
    id: 'doubleWell',
    name: 'Double Well (Local & Global Minima)',
    badge: 'Local vs Global',
    badgeColor: '#EE7258',
    description: 'A non-convex landscape with two minima separated by a local peak. Highlights how initial starting points dictate convergence.',
    xMin: -2.5,
    xMax: 2.5,
    yMin: -3,
    yMax: 8,
    defaultX0: -2.0,
    defaultLr: 0.08,
    fn: (x) => Math.pow(x, 4) - 3 * Math.pow(x, 2) + 0.5 * x,
    derivative: (x) => 4 * Math.pow(x, 3) - 6 * x + 0.5,
    latex: 'f(x) = x^4 - 3x^2 + 0.5x',
    derivLatex: "f'(x) = 4x^3 - 6x + 0.5",
    optimum: 1.16,
  },
  plateau: {
    id: 'plateau',
    name: 'Plateau & Vanishing Gradient',
    badge: 'Vanishing Gradient',
    badgeColor: '#F7D25A',
    description: 'Features a flat plateau region where gradients become near zero. Demonstrates slow crawling and the advantage of Momentum.',
    xMin: -4,
    xMax: 4,
    yMin: -0.5,
    yMax: 4,
    defaultX0: 3.5,
    defaultLr: 0.25,
    fn: (x) => Math.log(1 + Math.exp(x * 0.8)) + 0.1 * Math.sin(x * 3),
    derivative: (x) => (0.8 * Math.exp(x * 0.8)) / (1 + Math.exp(x * 0.8)) + 0.3 * Math.cos(x * 3),
    latex: 'f(x) = \\ln(1 + e^{0.8x}) + 0.1\\sin(3x)',
    derivLatex: "f'(x) = \\frac{0.8e^{0.8x}}{1+e^{0.8x}} + 0.3\\cos(3x)",
    optimum: -3.8,
  },
  steepValley: {
    id: 'steepValley',
    name: 'Steep Asymmetric Canyon',
    badge: 'Oscillation Challenge',
    badgeColor: '#A7C7F9',
    description: 'Very steep on one side and gentle on the other. Causes wild zigzag oscillations when learning rate is high.',
    xMin: -3,
    xMax: 3,
    yMin: -1,
    yMax: 14,
    defaultX0: -2.6,
    defaultLr: 0.06,
    fn: (x) => (x < 0 ? 2 * Math.pow(x, 2) + Math.abs(x) * 1.5 : 0.5 * Math.pow(x, 2)),
    derivative: (x) => (x < 0 ? 4 * x - 1.5 : x),
    latex: "f(x) = \\begin{cases} 2x^2 + 1.5|x| & x < 0 \\\\ 0.5x^2 & x \\ge 0 \\end{cases}",
    derivLatex: "f'(x) = \\begin{cases} 4x - 1.5 & x < 0 \\\\ x & x \\ge 0 \\end{cases}",
    optimum: 0,
  }
};

export const OPTIMIZERS = {
  sgd: {
    id: 'sgd',
    name: 'Standard GD',
    formula: 'w_{t+1} = w_t - \\alpha \\cdot \\nabla f(w_t)',
    description: 'Direct step in opposite direction of the gradient.',
    update: (x, grad, lr) => {
      const step = lr * grad;
      return { newX: x - step, state: {} };
    }
  },
  momentum: {
    id: 'momentum',
    name: 'Momentum (β = 0.85)',
    formula: 'v_{t+1} = \\beta v_t + \\alpha \\nabla f(w_t), \\; w_{t+1} = w_t - v_{t+1}',
    description: 'Builds velocity in consistent directions to escape plateaus and reduce oscillations.',
    update: (x, grad, lr, state = {}) => {
      const beta = 0.85;
      const v = (state.v || 0) * beta + lr * grad;
      return { newX: x - v, state: { v } };
    }
  },
  adam: {
    id: 'adam',
    name: 'Adam (Adaptive)',
    formula: 'm_t = \\beta_1 m_{t-1} + (1-\\beta_1)g, \\; v_t = \\beta_2 v_{t-1} + (1-\\beta_2)g^2',
    description: 'Maintains running averages of both gradients and second moments for adaptive steps.',
    update: (x, grad, lr, state = {}) => {
      const beta1 = 0.9;
      const beta2 = 0.999;
      const eps = 1e-8;
      const t = (state.t || 0) + 1;
      const m = beta1 * (state.m || 0) + (1 - beta1) * grad;
      const v = beta2 * (state.v || 0) + (1 - beta2) * (grad * grad);
      const mHat = m / (1 - Math.pow(beta1, t));
      const vHat = v / (1 - Math.pow(beta2, t));
      const step = (lr * mHat) / (Math.sqrt(vHat) + eps);
      return { newX: x - step, state: { m, v, t } };
    }
  }
};
