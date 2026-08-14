<div align="center">

# 🌌 SimHub — Interactive STEM Discovery Laboratory
### *Visualizing Complex Concepts for Students & Researchers*

[![React 18](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL_3D-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![HTML5 Vector Physics](https://img.shields.io/badge/Physics-2D_Analytical_Vector-EE7258?style=for-the-badge)](https://en.wikipedia.org/wiki/Classical_mechanics)
[![60 FPS Real-time](https://img.shields.io/badge/Performance-60_FPS_WebGL-10B981?style=for-the-badge)](https://webgl.org)
[![Responsive Studio](https://img.shields.io/badge/Mobile-YouTube_Split_Studio-3B82F6?style=for-the-badge)](https://developer.mozilla.org/)

<p align="center">
  <b>SimHub</b> is an editorial, high-performance interactive STEM simulation suite built to transform abstract mathematical equations, physical laws, probability paradoxes, and quantum mechanics into tangible, real-time manipulables.
</p>

[Explore Simulations](#-the-4-interactive-simulation-labs) • [Mobile Architecture](#-mobile-first-youtube-style-split-architecture) • [Mathematical Derivations](#-mathematical--physical-foundations) • [Getting Started](#-getting-started)

---

</div>

## ✨ Key Features & Capabilities

- **🧪 4 Core Simulation Laboratories**: Spanning Optimization Theory, Bayesian Probability, Classical Vector Kinematics, and Quantum Wavefunction Mechanics.
- **🎯 100% Analytical Mathematics**: Zero arbitrary approximations; trajectories, wavefunctions, and gradient descent paths calculate exact closed-form calculus equations at runtime.
- **⚡ WebGL 3D & Vector 2D Graphics**: GPU-accelerated Three.js orbital visualizations and responsive SVG coordinate viewports running at a locked 60 FPS.
- **📱 Mobile YouTube-Style Split Viewport**: Pinned, unscrollable interactive stage at top ($\approx 52\%$) and independently scrollable concept bento studio at bottom ($\approx 48\%$).
- **🤏 Multi-Touch Gestures**: Seamless 2-finger pinch-to-zoom ($0.25\times$ to $6.0\times$), 2-finger arena panning, 1-finger 3D camera orbital rotation, and draggable angle/target handles.
- **🔙 Native Device Back Button Navigation**: Full integration with the HTML5 History API (`window.history.pushState` & `popstate`), allowing Android/browser hardware back buttons to transition smoothly through your simulation history without page reloads.

---

## 🔬 The 4 Interactive Simulation Labs

### 1. 📉 Gradient Descent & Optimization Lab
> *Explore how neural networks, machine learning models, and calculus optimizers traverse complex loss topologies.*

```
   θ_{t+1} = θ_t - η · ∇L(θ_t) + β · v_{t-1}
```

- **Interactive 2D & 3D Loss Topologies**:
  - **Quadratic Convex Bowl**: $f(x, y) = x^2 + y^2$ (Ideal convex convergence benchmark).
  - **Rastrigin Multimodal Landscape**: $f(x, y) = 20 + x^2 - 10\cos(2\pi x) + y^2 - 10\cos(2\pi y)$ (Escaping local minima).
  - **Saddle Point Surface**: $f(x, y) = x^2 - y^2$ (Vanishing gradients & inflection dynamics).
  - **Rosenbrock Banana Valley**: $f(x, y) = (1 - x)^2 + 100(y - x^2)^2$ (Narrow curved valley navigation).
- **Optimizers Supported**:
  - **Vanilla SGD**: Fixed step size with learning rate $\eta \in [0.001, 1.0]$.
  - **SGD with Momentum**: Physical inertia accumulation with momentum factor $\beta \in [0.1, 0.99]$.
  - **RMSprop**: Exponentially decaying average of squared gradients $\sqrt{E[g^2] + \epsilon}$.
  - **Adam Optimizer**: First and second adaptive moment estimation ($\beta_1, \beta_2$).
- **Telemetry & Live Data**: Real-time parameter trajectory table, loss history curves, and interactive starting point dragging.

---

### 2. 🚪 Monty Hall Problem & Bayesian Probability Lab
> *Deconstruct the 1990 Marilyn vos Savant cognitive paradox through interactive game-show dynamics and high-speed statistical sampling.*

```
   P(Car | Switch) = (N - 1) / N    vs.    P(Car | Stick) = 1 / N
```

- **Interactive 3D Game Show Mode**:
  - 3D perspective casino doors with golden brass number plates, wood grain textures, and smooth opening animations revealing sports cars 🏎️ and goats 🐐.
  - Host dialogue bubble dynamically narrating each phase (*Pick a door $\rightarrow$ Monty reveals goats $\rightarrow$ Stick or Switch decision*).
  - Floating decision cards (`🔒 STICK` vs `🔀 SWITCH`) with live probability hints.
- **Dynamic Scalability ($N = 3 \dots 100$ Doors)**:
  - Intuition amplifier: Select $N=100$ doors where picking Door #1 gives $1\%$ and Monty opening 98 goats funnels the remaining $99\%$ into the switch door.
- **High-Speed Monte Carlo Batch Lab**:
  - Automated simulation runner executing up to **50,000 consecutive rounds** in milliseconds.
  - Live comparative win-rate convergence charts proving asymptotic convergence to $(N-1)/N$.
- **Bayesian Blackboard**: Full step-by-step decision tree breakdown of Prior $P(C_i)$, Likelihood $P(O_k | C_i)$, and Posterior $P(C_i | O_k)$ probabilities.

---

### 3. 🎯 Projectile Motion & Vector Ballistics Lab
> *Master classical 2D kinematics, parabolic trajectory calculus, and celestial gravity dynamics.*

```
   y(x) = y₀ + (x - x₀) tan(θ) - [ g / (2 v₀² cos²(θ)) ] · (x - x₀)²
```

- **Dual-Mode Visualization**:
  - **🚀 Ballistics Physics Studio**: Artillery cannon with draggable barrel nozzle, elevation wheels, smoke recoil, flight vector arrows ($\vec{v}, \vec{v}_x, \vec{v}_y$), and target bullseyes with spark celebration effects.
  - **📊 Mathematical Graph Paper Mode**: Pure Cartesian coordinate system plotting explicit quadratic functions $y(x) = ax^2 + bx + c$, vertex coordinates, and ground root intersections.
- **Celestial Gravities**:
  - 🌍 **Earth**: $g = 9.807\,\text{m/s}^2$
  - 🌕 **Moon**: $g = 1.620\,\text{m/s}^2$
  - 🪐 **Mars**: $g = 3.721\,\text{m/s}^2$
  - 🪐 **Jupiter**: $g = 24.79\,\text{m/s}^2$
  - 🌌 **Zero-G Space**: $g = 0.100\,\text{m/s}^2$
  - ⚙️ **Custom Gravity**: Any $g \in [0.1, 50.0]\,\text{m/s}^2$
- **Advanced Aerodynamics**: Toggle quadratic atmospheric air drag $F_{\text{drag}} = \frac{1}{2} C_d \rho A v^2$.
- **4 Real-Time Kinematics & Energy Telemetry Graphs**:
  1. Height vs Time: $y(t) = y_0 + v_{0y}t - \frac{1}{2}gt^2$
  2. Horizontal Distance vs Time: $x(t) = x_0 + v_{0x}t$
  3. Total Velocity Magnitude vs Time: $v(t) = \sqrt{v_x^2 + v_y^2}$
  4. Kinetic vs Potential Energy Conservation: $E_{\text{total}} = \frac{1}{2}mv^2 + mgy$
- **Gesture Controls**: 2-finger pinch-to-zoom, 2-finger pan, and draggable launcher/target handles.

---

### 4. ⚛️ Electron Clouding & Quantum Wavefunctions Lab
> *Visualize 3D quantum mechanical hydrogen wavefunctions derived from the exact Schrödinger equation.*

```
   ψ_{nlm}(r, θ, φ) = R_{nl}(r) · Y_{lm}(θ, φ)
```

- **Full Orbitals Coverage ($n=1 \dots 4$)**:
  - **$s$-orbitals ($l=0$)**: $1s, 2s, 3s, 4s$ (Spherical symmetry).
  - **$p$-orbitals ($l=1$)**: $2p_z, 2p_x, 2p_y, 3p_z, 4p_z$ (Dipolar dumbbell lobes).
  - **$d$-orbitals ($l=2$)**: $3d_{z^2}, 3d_{xz}, 3d_{yz}, 3d_{x^2-y^2}, 3d_{xy}, 4d_{z^2}$ (Four-leaf clover & torus rings).
  - **$f$-orbitals ($l=3$)**: $4f_{z^3}, 4f_{xz^2}, 4f_{yz^2}, 4f_{z(x^2-y^2)}, 4f_{xyz}$ (Eight-lobed quantum flowers).
- **3D Quantum Rendering Engines**:
  - **Monte Carlo 40,000-Point Probability Cloud**: Rejection-sampled spatial probability distribution $\propto |\psi_{nlm}|^2$ with radial phase coloring.
  - **90% Boundary Isosurface Lobes**: Smooth polygonal meshes enclosing the $90\%$ electron localization probability boundary.
  - **2D Density Slicing Heatmap**: Cross-sectional plane rendering quantum probability density across the $XZ$ and $XY$ planes.
- **3 Analytical Quantum Telemetry Graphs**:
  1. **Radial Wavefunction** $R_{nl}(r)$ showing node crossings $\Delta R = 0$.
  2. **Radial Probability Density** $P(r) = r^2 |R_{nl}(r)|^2$ highlighting Bohr radius peaks.
  3. **Angular Probability Distribution** $|Y_{lm}(\theta, \phi)|^2$ vs polar angle $\theta \in [0^\circ, 180^\circ]$ explaining orbital shape anisotropy and radial degeneracy across $m_l$.
- **Bohr Atomic Spectral Photon Jump Simulator**:
  - Simulate electronic transitions $n_i \rightarrow n_f$ across the **Lyman** (UV), **Balmer** (Visible Colors), and **Paschen** (Infrared) series with exact wavelength calculation $\frac{1}{\lambda} = R_H \left(\frac{1}{n_f^2} - \frac{1}{n_i^2}\right)$ and emitted photon spark animations.

---

## 📱 Mobile-First YouTube-Style Split Architecture

SimHub features a responsive viewport architecture modeled after the YouTube mobile app experience:

```
┌────────────────────────────────────────────────────────┐
│  SimHub Top Nav Bar (42px) [ 🏠 Home  📉 GD  🚪 Monty  🎯 Proj  ⚛️ Orbit ]
├────────────────────────────────────────────────────────┤
│                                                        │
│  🎬 FIXED UNLOADABLE STAGE WORKBENCH (52% Viewport)   │
│  • 3D WebGL Three.js Quantum Orbital Orbit & Zoom     │
│  • 2D Ballistic Canvas (Aim, Fire, Move Target)        │
│  • touch-action: none (No window bouncing on drag)     │
│  • Compact Parameter Stepper Toolbar                   │
│                                                        │
├────────────────────────────────────────────────────────┤
│  ════════════════════════════════════════════════════  │
│  📜 SCROLLABLE ANALYSIS & BENTO STUDIO (48% Viewport) │
│  • [ 📋 Overview ] [ 📊 Graphs ] [ ⚡ Concepts ]       │
│  • Live Telemetry SVG Curves                           │
│  • Mathematical Derivations & Historical Notes         │
│  • overflow-y: auto; touch-action: pan-y               │
└────────────────────────────────────────────────────────┘
```

---

## 📐 Mathematical & Physical Foundations

### Projectile Motion Equations
$$\text{Range: } R = \frac{v_0^2 \sin(2\theta)}{g} \quad\quad \text{Apex Height: } H_{\text{max}} = y_0 + \frac{v_0^2 \sin^2(\theta)}{2g} \quad\quad \text{Time of Flight: } t_f = \frac{v_0\sin(\theta) + \sqrt{v_0^2\sin^2(\theta) + 2gy_0}}{g}$$

### Hydrogen Quantum Wavefunction
$$\psi_{nlm}(r, \theta, \phi) = R_{nl}(r) Y_{lm}(\theta, \phi) = \sqrt{\left(\frac{2}{n a_0}\right)^3 \frac{(n - l - 1)!}{2n [(n + l)!]^3}} e^{-\rho/2} \rho^l L_{n-l-1}^{2l+1}(\rho) \cdot Y_{lm}(\theta, \phi)$$
*where $\rho = \frac{2r}{n a_0}$ and $a_0$ is the Bohr radius ($0.529\,\text{Å}$).*

### Rydberg Spectral Formula
$$\Delta E = -13.6\,\text{eV} \left( \frac{1}{n_i^2} - \frac{1}{n_f^2} \right), \quad \lambda = \frac{hc}{\Delta E} = \frac{1}{R_H \left( \frac{1}{n_f^2} - \frac{1}{n_i^2} \right)}$$

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** $\ge 16.x$
- **npm** $\ge 8.x$

### Installation & Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/harshit-dev-on/SimHub-Set.git
   cd SimHub-Set
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development studio**:
   ```bash
   npm start
   ```
   *The app will automatically open at `http://localhost:3000`.*

4. **Build optimized production bundle**:
   ```bash
   npm run build
   ```

---

## 🛠️ Technology Stack

| Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **Core UI** | React 18 | Declarative component state & lifecycle management |
| **3D Graphics** | Three.js (WebGL) | GPU-accelerated quantum electron cloud & orbital isosurfaces |
| **2D Graphics** | Dynamic SVG & HTML5 Canvas | Pixel-perfect vector physics arenas and coordinate paper |
| **Typography** | Inter & Fira Code | Editorial display fonts and high-legibility monospace numbers |
| **Styling** | Vanilla CSS3 Tokens | Modular glassmorphism, fluid bento grids, and dark accents |
| **Routing & History** | HTML5 History API (`pushState`) | Hardware back button navigation & direct hash routing |

---

## 👨‍💻 Author & Acknowledgements

Created with ❤️ by **Harshit** for STEM students, physics enthusiasts, and researchers worldwide.

*If you found SimHub helpful, consider starring ⭐ the repository!*
