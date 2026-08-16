# ⚛️ Electron Clouding 3D

Interactive Three.js WebGL Hydrogen orbitals, quantum wavefunctions, and Rydberg spectral emission transitions ($n = 1..4$).

[![React 18](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL_3D-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## 🌟 Key Features
- **3D Three.js WebGL Rendering**: Full orbit/pan/zoom viewport with dynamic slice planes ($XY, XZ, YZ$).
- **Hydrogen Quantum Numbers**: $n = 1..4$, $l = 0..3$ (s, p, d, f orbitals), and $m_l = -l..+l$.
- **40,000-Point Probability Cloud**: Rejection-sampled Monte Carlo density cloud colored by quantum phase.
- **90% Boundary Isosurface Lobes**: Volumetric probability lobes enclosing 90% electron probability.
- **Rydberg Spectral Transitions**: Click Lyman, Balmer, or Paschen jumps to see photon emission wavelengths (e.g. $H_\alpha = 656.3\,\text{nm}$).
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
