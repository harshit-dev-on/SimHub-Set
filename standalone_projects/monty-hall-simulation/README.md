# 🚪 Monty Hall Problem Simulation

An interactive probability and game theory lab investigating the famous 3-door counter-intuitive paradox.

[![React 18](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## 🌟 Key Features
- **Interactive Single-Play Mode**: Pick a door, watch host reveal a goat, and decide whether to STAY or SWITCH.
- **High-Speed Monte Carlo Engine**: Simulate up to 10,000 automated trials with live win-rate convergence charts.
- **N-Door Generalization**: Test 3 to 10 doors to see why $P(\text{Win}|\text{Switch}) = \frac{N-1}{N} \times \frac{1}{N-2}$.
- **Bayes Probability Blackboard**: Visual step-by-step mathematical proof of conditional updating.
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

```bash
# Vercel
vercel

# Netlify
netlify deploy --prod --dir=build
```
