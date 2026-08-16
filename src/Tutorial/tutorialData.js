// ============================================================================
// SimHub Tutorial Curriculums & Duolingo-Style Lesson Content
// ============================================================================

export const TUTORIAL_CURRICULUMS = {
  home: {
    simId: 'home',
    title: 'Welcome to SimHub Discovery Studio',
    subtitle: 'Your Interactive Visual STEM Companion',
    steps: [
      {
        id: 'home-intro',
        title: 'Meet Your Visual STEM Lab',
        conceptTag: 'Getting Started',
        expression: 'EXPLAINING',
        speech:
          "Waddle-waddle! 🐧 Welcome to **SimHub**! I'm **Professor Piplu**, your personal STEM laboratory companion. Here, we don't just read dry formulas—we **touch, manipulate, and visualize** math and science in real-time!",
        actionPrompt: 'Pick any of the 4 labs on screen to begin exploring, or tap Next to take a quick tour!',
      },
      {
        id: 'home-labs',
        title: 'Four Core Laboratories',
        conceptTag: 'Curriculum',
        expression: 'EUREKA',
        speech:
          "SimHub has 4 deep-dive interactive studios:\n\n• **📉 Gradient Descent**: Optimization landscapes & machine learning.\n• **🚪 Monty Hall**: Probability paradoxes & 50k Monte Carlo simulations.\n• **🎯 Projectile Motion**: Classical 2D kinematics & space gravities.\n• **⚛️ Electron Clouding**: 3D Three.js quantum hydrogen wavefunctions!",
      },
      {
        id: 'home-mobile',
        title: 'Built for Any Device',
        conceptTag: 'Pro Tip',
        expression: 'CHALLENGE',
        speech:
          "📱 **YouTube-Style Split Layout**: On mobile or tablet, the simulation stage stays pinned at the top without scrolling, while all formulas, live graphs, and notes scroll smoothly below!\n\nYou can also use **2-finger pinch-to-zoom** on the live stages.",
      },
      {
        id: 'home-quiz',
        title: 'Ready for Your First Experiment?',
        conceptTag: 'Check-In',
        expression: 'CELEBRATING',
        speech:
          "Let's test your curiosity! Which laboratory would you like to explore first?",
        quiz: {
          question: 'What is the core philosophy of SimHub?',
          options: [
            'Memorizing formulas by heart without seeing them',
            'Interactive visual experimentation with 100% exact math',
            'Watching static pre-recorded video lectures',
            'Guessing numbers randomly',
          ],
          correctIndex: 1,
          explanation:
            'Spot on! SimHub lets you manipulate parameters and observe exact analytical calculus, physics, and probability in real-time!',
        },
      },
    ],
  },

  'gradient-descent': {
    simId: 'gradient-descent',
    title: 'Gradient Descent & Optimization Theory',
    subtitle: 'How AI and Machine Learning Models Learn',
    steps: [
      {
        id: 'gd-intro',
        title: 'The Blindfolded Mountaineer',
        conceptTag: 'Core Intuition',
        expression: 'EXPLAINING',
        speech:
          "Imagine being blindfolded on a foggy mountain and wanting to reach the lowest valley floor. 🏔️\n\nHow would you do it? You'd feel the slope under your feet and take a step in the **steepest downhill direction**! That is exactly what **Gradient Descent** does by following the negative gradient: **-∇L(θ)**.",
        actionPrompt: 'Click anywhere on the 2D contour map to drop your starting position!',
      },
      {
        id: 'gd-lr',
        title: 'The Learning Rate Dilemma (η)',
        conceptTag: 'Parameter Tuning',
        expression: 'THINKING',
        speech:
          "The **Learning Rate (η)** determines your step size:\n\n• **Too small (e.g. 0.005)**: Convergence is painfully slow. You might get stuck forever.\n• **Too large (e.g. 0.9)**: The optimizer overshoots the minimum and explodes into instability!\n\nFinding the sweet spot is the art of hyperparameter tuning.",
        actionPrompt: 'Try dragging the Learning Rate slider to 0.05 vs 0.5 to see the difference!',
      },
      {
        id: 'gd-momentum',
        title: 'Momentum & Escaping Traps',
        conceptTag: 'Advanced Algorithms',
        expression: 'EUREKA',
        speech:
          "Real-world loss surfaces aren't simple bowls—they have **local minima** and shallow saddles! 🎢\n\nBy adding **Momentum (β)**, the optimizer builds physical velocity like a heavy rolling ball, allowing it to blast right through shallow local traps and oscillate less across steep ravines.",
        actionPrompt: 'Switch the landscape to Rastrigin Multimodal and try Adam optimizer!',
      },
      {
        id: 'gd-quiz',
        title: 'Checkpoint Quiz',
        conceptTag: 'Concept Check',
        expression: 'CHALLENGE',
        speech:
          "Let's lock in what you've learned before you start training!",
        quiz: {
          question: 'What does the gradient vector ∇L(θ) represent at any point on a loss surface?',
          options: [
            'The direction of steepest ascent (fastest increase of loss)',
            'The exact coordinates of the global minimum',
            'The speed of the rolling ball',
            'The learning rate multiplier',
          ],
          correctIndex: 0,
          explanation:
            'Brilliant! ∇L points uphill toward the steepest increase. That is why we subtract it (θ - η·∇L) to walk downhill!',
        },
      },
    ],
  },

  'monty-hall': {
    simId: 'monty-hall',
    title: 'The Monty Hall Probability Paradox',
    subtitle: 'The 1990 Controversy that Stumped PhD Mathematicians',
    steps: [
      {
        id: 'monty-intro',
        title: 'The 3-Door Game Show',
        conceptTag: 'Initial Odds',
        expression: 'EXPLAINING',
        speech:
          "Welcome to the game show! 🎪 Behind one door is a luxury **Sports Car** 🏎️; behind the other two are **Goats** 🐐.\n\nWhen you make your initial blind pick, your chance of picking the car is exactly **1 in 3 (33.3%)**. The remaining **2 in 3 (66.7%)** chance lies with the other two doors.",
        actionPrompt: 'Click any of the 3 doors on screen to place your first bet!',
      },
      {
        id: 'monty-filter',
        title: "Monty's Asymmetric Filter",
        conceptTag: 'Bayesian Filter',
        expression: 'EUREKA',
        speech:
          "Here is the magic twist! Host Monty Hall **knows where the car is** and will **never open the car door**.\n\nWhen he reveals a goat, his knowledge acts as a filter: all of that initial **2/3 probability** gets concentrated entirely into the single remaining unopened door!",
      },
      {
        id: 'monty-100doors',
        title: 'The 100-Door Intuition',
        conceptTag: 'Mental Model',
        expression: 'THINKING',
        speech:
          "Still skeptical? Imagine **100 Doors**! 🚪\n\nYou pick Door #1 (a tiny **1% chance**). Monty opens **98 goat doors**, leaving only Door #77.\n\nDid your blind guess magically hit the 1% car, or did Monty's filter funnel the **99% probability** into Door #77? Always switch!",
        actionPrompt: 'Use the Doors (N) stepper at the bottom to set N=100 and test this yourself!',
      },
      {
        id: 'monty-quiz',
        title: 'Checkpoint Quiz',
        conceptTag: 'Probability Check',
        expression: 'CELEBRATING',
        speech:
          "Let's see if you can outsmart the 1,000 PhD mathematicians who wrote letters criticizing Marilyn vos Savant!",
        quiz: {
          question:
            'If there are 10 doors and Monty opens 8 goat doors, what is your win probability if you SWITCH to the remaining door?',
          options: [
            '50% (because only 2 doors are left)',
            '90% (or 9/10 probability)',
            '10% (same as initial pick)',
            '33.3%',
          ],
          correctIndex: 1,
          explanation:
            'Outstanding! Your initial pick has 1/10 (10%) chance. The other 9 doors hold 9/10 (90%) of the probability, which Monty funnels into the single switch door!',
        },
      },
    ],
  },

  'projectile-motion': {
    simId: 'projectile-motion',
    title: 'Projectile Motion & Vector Kinematics',
    subtitle: 'Galileo’s Parabolic Trajectory Calculus',
    steps: [
      {
        id: 'proj-intro',
        title: "Galileo's Independence Principle",
        conceptTag: 'Vector Orthogonality',
        expression: 'EXPLAINING',
        speech:
          "In classical mechanics, horizontal and vertical motion are completely **independent**! 🚀\n\n• **Horizontal**: No forces act ($a_x = 0$), so $v_x$ remains constant forever.\n• **Vertical**: Gravity pulls downward ($a_y = -g$), causing $v_y$ to decelerate, hit zero at the apex, and accelerate downward.",
        actionPrompt: 'Click and drag the cannon nozzle to aim, or tap Fire to launch your first shot!',
      },
      {
        id: 'proj-45deg',
        title: 'The Golden 45° Angle',
        conceptTag: 'Calculus Optimization',
        expression: 'EUREKA',
        speech:
          "Why is **45°** the magic launch angle for maximum distance?\n\nThe range formula is **R = (v₀² · sin(2θ)) / g**. The sine function reaches its maximum of **1.0** when its argument is **90°**. Since $2θ = 90°$, $\\mathbf{θ = 45°}$ delivers the maximum possible range on flat ground!",
        actionPrompt: 'Use the angle slider to test 45° vs 30° vs 60° and observe the landing markers!',
      },
      {
        id: 'proj-gravity',
        title: 'Cosmic Gravities & Air Drag',
        conceptTag: 'Space Physics',
        expression: 'THINKING',
        speech:
          "Gravity dictates how tightly curved your parabolic arc will be:\n\n• 🌕 **Moon (1.6 m/s²)**: Ultra-low gravity allows massive, soaring high-altitude arcs.\n• 🪐 **Jupiter (24.8 m/s²)**: Crushing gravity slams projectiles into the ground almost immediately!\n• 💨 **Air Drag**: Asymmetry causes steep drops near the end of flight.",
        actionPrompt: 'Switch the celestial gravity dropdown to Moon or Jupiter to compare trajectory shapes!',
      },
      {
        id: 'proj-quiz',
        title: 'Checkpoint Quiz',
        conceptTag: 'Physics Check',
        expression: 'CHALLENGE',
        speech:
          "Time for a quick ballistics flight certification check!",
        quiz: {
          question:
            'At the very apex (highest point) of a projectile’s flight, which of the following is true?',
          options: [
            'Total velocity is zero (v = 0)',
            'Vertical velocity is zero (vy = 0), but horizontal velocity (vx) is unchanged',
            'Gravity stops acting on the projectile',
            'Acceleration becomes zero',
          ],
          correctIndex: 1,
          explanation:
            'Bullseye! At the peak, vertical velocity momentarily reaches vy = 0 before reversing, while horizontal velocity vx continues unhindered!',
        },
      },
    ],
  },

  'electron-clouding': {
    simId: 'electron-clouding',
    title: 'Electron Clouding & Quantum Wavefunctions',
    subtitle: 'The 3D Schrödinger Solutions for the Hydrogen Atom',
    steps: [
      {
        id: 'orbit-intro',
        title: 'No Planetary Orbits in Quantum!',
        conceptTag: 'Wave-Particle Duality',
        expression: 'EXPLAINING',
        speech:
          "Forget the old solar-system model where electrons orbit like planets! ⚛️\n\nBy Heisenberg's Uncertainty Principle, an electron has no fixed path. Instead, it exists as a **3D Probability Cloud** described by the wavefunction **ψ(r, θ, φ)**, where **|ψ|²** is the probability density of finding the electron at that point.",
        actionPrompt: 'Click and drag in 3D space with 1 finger to rotate the orbital, or 2 fingers to pinch-to-zoom!',
      },
      {
        id: 'orbit-numbers',
        title: 'Decoding the 3 Quantum Numbers',
        conceptTag: 'Quantum Anatomy',
        expression: 'EUREKA',
        speech:
          "Every orbital state is uniquely defined by three integers **(n, l, ml)**:\n\n• **n (Principal, 1..4)**: Energy level & shell size.\n• **l (Angular Momentum, 0..n-1)**: Orbital shape — **s** (spherical), **p** (dumbbells), **d** (four-leaf clovers), **f** (eight lobes)!\n• **ml (Magnetic, -l..+l)**: Spatial orientation in 3D.",
        actionPrompt: 'Use the n, l, ml steppers to jump between 1s, 2pz, 3dxy, and 4fz3 orbitals!',
      },
      {
        id: 'orbit-nodes',
        title: 'Nodal Planes & Zero Probability',
        conceptTag: 'Nodal Structures',
        expression: 'THINKING',
        speech:
          "Look closely at higher orbitals like **2s** or **3d**! You will notice hollow rings or planes where **no dots appear**.\n\nThese are **Nodes**—surfaces where the wavefunction **ψ = 0** and the probability of finding an electron is strictly zero, even though it exists on both sides!",
      },
      {
        id: 'orbit-quiz',
        title: 'Checkpoint Quiz',
        conceptTag: 'Quantum Check',
        expression: 'CELEBRATING',
        speech:
          "Ready to claim your Quantum Mechanics badge?",
        quiz: {
          question:
            'Why do all 3d orbitals (3dz2, 3dxz, 3dyz, 3dxy, 3dx2-y2) share the EXACT same radial probability graph P(r)?',
          options: [
            'It is a graphical rendering bug',
            'Because radial wavefunction R_nl(r) depends only on (n, l), while ml only alters angular 3D orientation',
            'Because all electrons have the same mass',
            'Because Bohr radius is constant across all atoms',
          ],
          correctIndex: 1,
          explanation:
            'Phenomenal! In hydrogen, the radial solution R_nl(r) is degenerate with respect to ml—orbitals with identical (n, l) have identical radial distribution curves!',
        },
      },
    ],
  },
};
