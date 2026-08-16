# 🎯 Projectile Motion Sandbox

A rich 2D ballistics and kinematics physics laboratory with drag physics, wind forces, and draggable targets.

[![React 18](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## 🌟 Key Features
- **Freeform Drag Controls**: Drag cannon height ($y_0$) and angle ($\theta$), or reposition the floating target in real-time.
- **Realistic Aerodynamics**: Toggle quadratic air drag ($F_d = \frac{1}{2} C_d \rho A v^2$) and crosswinds.
- **6 Real-Time Telemetry Graphs**: $y(x)$ Trajectory, $v(t)$ Velocity, $a(t)$ Acceleration, Kinetic/Potential Energy $E(t)$, Altitude $y(t)$, and Phase Space $(y, v_y)$.
- **Floating Parabola Mathematical Equation**: Live formula updates with exact numerical parameters.
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
