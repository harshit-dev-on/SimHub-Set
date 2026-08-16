# 📉 Gradient Descent Studio

An interactive visual learning studio for machine learning optimization, calculus, loss surfaces, and gradient descent dynamics.

[![React 18](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## 🌟 Key Features
- **4 Optimization Algorithms**: SGD ($w_{t+1} = w_t - lpha f'(w_t)$), Momentum ($eta$), RMSprop, and Adam ($eta_1, eta_2, \epsilon$).
- **Curated Loss Landscapes**: Quadratic Bowl, Non-Convex Double Well, Rastrigin Multimodal, Saddle Point, and Steep Narrow Valley.
- **Custom Math Parser**: Type arbitrary math expressions (e.g. `sin(x) + 0.5*cos(3*x)`) with automatic analytical differentiation.
- **Dual Visual Modes**: Analytical Math Canvas + Gamified Physics Pogo Hills mode.
- **Live Calculus Telemetry**: Live step breakdown, learning rate scaling, loss curve chart, and convergence quests.
- **Professor Piplu 🐧 Companion**: Duolingo-style step-by-step tutorial with checkpoint quizzes.

---

## 🚀 Quickstart & Local Hosting

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm start

# 3. Build optimized production bundle
npm run build
```

---

## 🌐 Deploy to Vercel / Netlify / GitHub Pages

### Deploy to Vercel:
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=build
```

---

## 📜 Mathematical Foundations
Gradient descent updates parameters iteratively in the direction of steepest descent:
$$w_{t+1} = w_t - lpha \cdot 
abla L(w_t)$$
