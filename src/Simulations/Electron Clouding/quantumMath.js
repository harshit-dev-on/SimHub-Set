/**
 * Quantum Mechanical Engine for Hydrogen-like Atomic Orbitals
 * Evaluates exact analytical wavefunctions ψ_nlm(r, θ, φ) = R_nl(r) * Y_lm(θ, φ),
 * calculates 3D probability densities |ψ|^2, radial distributions P(r) = r^2 R_nl^2,
 * Monte Carlo electron cloud point sampling, nodal surface properties, and spectral transitions.
 */

// Preset Hydrogen Orbitals Catalog
export const ORBITAL_PRESETS = [
  { n: 1, l: 0, m: 0, label: '1s', name: '1s Ground State', type: 's', color: '#38BDF8' },
  { n: 2, l: 0, m: 0, label: '2s', name: '2s Spherical Shell', type: 's', color: '#0EA5E9' },
  { n: 2, l: 1, m: 0, label: '2pz', name: '2p_z Axial Lobe', type: 'p', color: '#6366F1' },
  { n: 2, l: 1, m: 1, label: '2px', name: '2p_x Horizontal Lobe', type: 'p', color: '#8B5CF6' },
  { n: 2, l: 1, m: -1, label: '2py', name: '2p_y Transverse Lobe', type: 'p', color: '#A855F7' },
  { n: 3, l: 0, m: 0, label: '3s', name: '3s Multi-Shell', type: 's', color: '#0284C7' },
  { n: 3, l: 1, m: 0, label: '3pz', name: '3p_z Concentric Lobe', type: 'p', color: '#4F46E5' },
  { n: 3, l: 2, m: 0, label: '3dz2', name: '3d_z² Donut & Lobes', type: 'd', color: '#EC4899' },
  { n: 3, l: 2, m: 2, label: '3dx2-y2', name: '3d_x²-y² Four-Leaf Clover', type: 'd', color: '#F43F5E' },
  { n: 3, l: 2, m: -2, label: '3dxy', name: '3d_xy Diagonal Clover', type: 'd', color: '#E11D48' },
  { n: 4, l: 0, m: 0, label: '4s', name: '4s Quad Shell', type: 's', color: '#0369A1' },
  { n: 4, l: 1, m: 0, label: '4pz', name: '4p_z High-Order Lobe', type: 'p', color: '#4338CA' },
  { n: 4, l: 2, m: 0, label: '4dz2', name: '4d_z² High-Order Toroid', type: 'd', color: '#DB2777' },
  { n: 4, l: 3, m: 0, label: '4fz3', name: '4f_z³ Complex Multi-Lobe', type: 'f', color: '#10B981' },
];

/**
 * Evaluates the analytical radial wavefunction R_nl(r)
 * @param {number} n - Principal quantum number (1, 2, 3, 4)
 * @param {number} l - Orbital angular momentum quantum number (0 <= l < n)
 * @param {number} r - Radial distance in Bohr radii a_0
 * @returns {number} Value of R_nl(r)
 */
export function evaluateRadialWavefunction(n, l, r) {
  if (r < 0) return 0;

  // Exact Hydrogen Radial Wavefunctions R_nl(r) for n = 1..4
  if (n === 1 && l === 0) {
    // 1s: 2 * exp(-r)
    return 2.0 * Math.exp(-r);
  }
  if (n === 2 && l === 0) {
    // 2s: (1 / sqrt(2)) * (1 - r/2) * exp(-r/2)
    return (1.0 / Math.SQRT2) * (1.0 - 0.5 * r) * Math.exp(-0.5 * r);
  }
  if (n === 2 && l === 1) {
    // 2p: (1 / sqrt(24)) * r * exp(-r/2)
    return (1.0 / (2.0 * Math.sqrt(6.0))) * r * Math.exp(-0.5 * r);
  }
  if (n === 3 && l === 0) {
    // 3s: (2 / (3 * sqrt(3))) * (1 - 2r/3 + 2r^2/27) * exp(-r/3)
    const factor = 2.0 / (3.0 * Math.sqrt(3.0));
    const poly = 1.0 - (2.0 / 3.0) * r + (2.0 / 27.0) * r * r;
    return factor * poly * Math.exp(-r / 3.0);
  }
  if (n === 3 && l === 1) {
    // 3p: (4 * sqrt(2) / (9 * sqrt(3))) * (r/3) * (1 - r/6) * exp(-r/3)
    const factor = (4.0 * Math.SQRT2) / (27.0 * Math.sqrt(3.0));
    return factor * r * (1.0 - r / 6.0) * Math.exp(-r / 3.0);
  }
  if (n === 3 && l === 2) {
    // 3d: (4 / (81 * sqrt(30))) * r^2 * exp(-r/3)
    const factor = 4.0 / (81.0 * Math.sqrt(30.0));
    return factor * r * r * Math.exp(-r / 3.0);
  }
  if (n === 4 && l === 0) {
    // 4s: (1/4) * (1 - 3r/4 + r^2/8 - r^3/192) * exp(-r/4)
    const poly = 1.0 - 0.75 * r + (r * r) / 8.0 - (r * r * r) / 192.0;
    return 0.25 * poly * Math.exp(-0.25 * r);
  }
  if (n === 4 && l === 1) {
    // 4p: (sqrt(5) / (16 * sqrt(3))) * (r/4) * (1 - r/4 + r^2/80) * exp(-r/4)
    const factor = Math.sqrt(5.0) / (64.0 * Math.sqrt(3.0));
    const poly = 1.0 - 0.25 * r + (r * r) / 80.0;
    return factor * r * poly * Math.exp(-0.25 * r);
  }
  if (n === 4 && l === 2) {
    // 4d: (1 / (64 * sqrt(5))) * (r/4)^2 * (1 - r/12) * exp(-r/4)
    const factor = 1.0 / (1024.0 * Math.sqrt(5.0));
    return factor * r * r * (1.0 - r / 12.0) * Math.exp(-0.25 * r);
  }
  if (n === 4 && l === 3) {
    // 4f: (1 / (768 * sqrt(35))) * (r/4)^3 * exp(-r/4)
    const factor = 1.0 / (49152.0 * Math.sqrt(35.0));
    return factor * r * r * r * Math.exp(-0.25 * r);
  }

  // Fallback exponential decay
  return Math.exp(-r / n);
}

/**
 * Evaluates Real Spherical Harmonics Y_lm(x, y, z) in Cartesian coordinates
 * @param {number} l - Angular momentum quantum number (0, 1, 2, 3)
 * @param {number} m - Magnetic quantum number (-l <= m <= l)
 * @param {number} x - Normalized x coordinate (x / r)
 * @param {number} y - Normalized y coordinate (y / r)
 * @param {number} z - Normalized z coordinate (z / r)
 * @returns {number} Value of Y_lm
 */
export function evaluateSphericalHarmonic(l, m, x, y, z) {
  // s-orbital (l = 0)
  if (l === 0) {
    return 1.0 / Math.sqrt(4.0 * Math.PI);
  }

  // p-orbitals (l = 1)
  if (l === 1) {
    const k = Math.sqrt(3.0 / (4.0 * Math.PI));
    if (m === 0) return k * z; // p_z
    if (m === 1) return k * x; // p_x
    if (m === -1) return k * y; // p_y
  }

  // d-orbitals (l = 2)
  if (l === 2) {
    if (m === 0) {
      // d_z^2
      return Math.sqrt(5.0 / (16.0 * Math.PI)) * (3.0 * z * z - 1.0);
    }
    if (m === 1) {
      // d_xz
      return Math.sqrt(15.0 / (4.0 * Math.PI)) * x * z;
    }
    if (m === -1) {
      // d_yz
      return Math.sqrt(15.0 / (4.0 * Math.PI)) * y * z;
    }
    if (m === 2) {
      // d_x^2-y^2
      return Math.sqrt(15.0 / (16.0 * Math.PI)) * (x * x - y * y);
    }
    if (m === -2) {
      // d_xy
      return Math.sqrt(15.0 / (4.0 * Math.PI)) * x * y;
    }
  }

  // f-orbitals (l = 3)
  if (l === 3) {
    if (m === 0) {
      // f_z^3
      return Math.sqrt(7.0 / (16.0 * Math.PI)) * z * (5.0 * z * z - 3.0);
    }
    if (m === 1) {
      // f_xz^2
      return Math.sqrt(21.0 / (32.0 * Math.PI)) * x * (5.0 * z * z - 1.0);
    }
    if (m === -1) {
      // f_yz^2
      return Math.sqrt(21.0 / (32.0 * Math.PI)) * y * (5.0 * z * z - 1.0);
    }
    if (m === 2) {
      // f_z(x^2-y^2)
      return Math.sqrt(105.0 / (16.0 * Math.PI)) * z * (x * x - y * y);
    }
    if (m === -2) {
      // f_xyz
      return Math.sqrt(105.0 / (4.0 * Math.PI)) * x * y * z;
    }
    if (m === 3) {
      // f_x(x^2-3y^2)
      return Math.sqrt(35.0 / (32.0 * Math.PI)) * x * (x * x - 3.0 * y * y);
    }
    if (m === -3) {
      // f_y(3x^2-y^2)
      return Math.sqrt(35.0 / (32.0 * Math.PI)) * y * (3.0 * x * x - y * y);
    }
  }

  return 0.0;
}

/**
 * Evaluates the full wavefunction ψ_nlm(x, y, z) in Cartesian Bohr coordinates
 * @param {number} n
 * @param {number} l
 * @param {number} m
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {{ psi: number, probDensity: number, phase: number, r: number }}
 */
export function evaluateWavefunction(n, l, m, x, y, z) {
  const r = Math.sqrt(x * x + y * y + z * z);
  if (r < 1e-6) {
    const rVal = evaluateRadialWavefunction(n, l, 0.001);
    const yVal = l === 0 ? 1.0 / Math.sqrt(4.0 * Math.PI) : 0.0;
    const psi = rVal * yVal;
    return {
      psi,
      probDensity: psi * psi,
      phase: psi >= 0 ? 1 : -1,
      r: 0,
    };
  }

  const normX = x / r;
  const normY = y / r;
  const normZ = z / r;

  const R = evaluateRadialWavefunction(n, l, r);
  const Y = evaluateSphericalHarmonic(l, m, normX, normY, normZ);
  const psi = R * Y;

  return {
    psi,
    probDensity: psi * psi,
    phase: psi >= 0 ? 1 : -1,
    r,
  };
}

/**
 * Monte Carlo Rejection Sampling: Generates 3D electron cloud positions
 * weighted proportionally to quantum probability density |ψ(x, y, z)|^2.
 * @param {number} n
 * @param {number} l
 * @param {number} m
 * @param {number} sampleCount - Number of points to generate (e.g. 15000)
 * @returns {{ positions: Float32Array, colors: Float32Array, maxRadius: number }}
 */
export function generateElectronCloudSamples(n, l, m, sampleCount = 15000) {
  // Spatial bounding box radius in Bohr radii a_0
  const maxRadius = Math.max(8.0, n * n * 2.6);
  const positions = new Float32Array(sampleCount * 3);
  const colors = new Float32Array(sampleCount * 3);

  // Peak estimate for rejection sampling
  let peakProb = 0;
  for (let i = 0; i < 600; i++) {
    const testR = (i / 600) * maxRadius;
    const { probDensity } = evaluateWavefunction(n, l, m, testR, 0, 0);
    if (probDensity > peakProb) peakProb = probDensity;
    const { probDensity: pZ } = evaluateWavefunction(n, l, m, 0, 0, testR);
    if (pZ > peakProb) peakProb = pZ;
  }
  if (peakProb < 1e-7) peakProb = 0.05;

  let accepted = 0;
  let iterations = 0;
  const maxIterations = sampleCount * 80;

  while (accepted < sampleCount && iterations < maxIterations) {
    iterations++;

    // Random point in sphere
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const radius = Math.cbrt(Math.random()) * maxRadius;

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    const { psi, probDensity } = evaluateWavefunction(n, l, m, x, y, z);

    // Rejection step
    const threshold = Math.random() * peakProb;
    if (probDensity >= threshold) {
      const idx = accepted * 3;
      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;

      // Color by quantum phase (Positive: Sky Blue / Cyan, Negative: Coral / Red-Orange)
      if (psi >= 0) {
        colors[idx] = 0.22; // R
        colors[idx + 1] = 0.74; // G
        colors[idx + 2] = 0.97; // B (Sky Blue / Cyan)
      } else {
        colors[idx] = 0.96; // R
        colors[idx + 1] = 0.42; // G
        colors[idx + 2] = 0.28; // B (Coral Orange)
      }

      accepted++;
    }
  }

  return { positions, colors, maxRadius };
}

/**
 * Computes nodal surfaces and quantum properties for an orbital (n, l, m)
 * @param {number} n
 * @param {number} l
 * @param {number} m
 */
export function getOrbitalQuantumInfo(n, l, m) {
  const radialNodes = n - l - 1;
  const angularNodes = l;
  const totalNodes = n - 1;

  // Energy in eV: E_n = -13.6 / n^2
  const energyEV = -13.6057 / (n * n);

  // Angular Momentum Magnitude: L = hbar * sqrt(l(l+1))
  const angularMomentumUnits = Math.sqrt(l * (l + 1));

  // Magnetic Component: L_z = m * hbar
  const lzUnits = m;

  // Nodal surfaces description
  const nodalDescriptions = [];
  if (radialNodes > 0) {
    nodalDescriptions.push(`${radialNodes} Spherical Radial Node${radialNodes > 1 ? 's' : ''}`);
  }
  if (angularNodes > 0) {
    if (l === 1) {
      if (m === 0) nodalDescriptions.push('1 Nodal Plane at z = 0 (xy-plane)');
      if (m === 1) nodalDescriptions.push('1 Nodal Plane at x = 0 (yz-plane)');
      if (m === -1) nodalDescriptions.push('1 Nodal Plane at y = 0 (xz-plane)');
    } else if (l === 2) {
      if (m === 0) nodalDescriptions.push('2 Nodal Cones at cos²θ = 1/3 (θ ≈ 54.7°, 125.3°)');
      else if (m === 2) nodalDescriptions.push('2 Orthogonal Nodal Planes at x = ±y');
      else if (m === -2) nodalDescriptions.push('2 Orthogonal Nodal Planes at x = 0 and y = 0');
      else nodalDescriptions.push('2 Angular Nodal Planes');
    } else {
      nodalDescriptions.push(`${angularNodes} Angular Nodal Planes / Cones`);
    }
  }
  if (totalNodes === 0) {
    nodalDescriptions.push('No nodes (Ground State)');
  }

  return {
    radialNodes,
    angularNodes,
    totalNodes,
    energyEV,
    angularMomentumUnits,
    lzUnits,
    nodalDescriptions,
  };
}

/**
 * Calculates Hydrogen Spectral Transition between two energy levels
 * @param {number} ni - Initial level (e.g. 3)
 * @param {number} nf - Final level (e.g. 2)
 * @returns {{ deltaE: number, wavelengthNm: number, seriesName: string, region: string, photonColor: string, isEmission: boolean }}
 */
export function calculateSpectralTransition(ni, nf) {
  if (ni === nf) {
    return {
      deltaE: 0,
      wavelengthNm: 0,
      seriesName: 'No Transition',
      region: 'None',
      photonColor: '#94A3B8',
      isEmission: false,
    };
  }

  const nUpper = Math.max(ni, nf);
  const nLower = Math.min(ni, nf);

  const eUpper = -13.6057 / (nUpper * nUpper);
  const eLower = -13.6057 / (nLower * nLower);
  const deltaE = eUpper - eLower; // eV

  // Rydberg wavelength in nm: λ (nm) = 1239.84 / ΔE(eV)
  const wavelengthNm = 1239.84193 / deltaE;

  let seriesName = 'Higher Series';
  if (nLower === 1) seriesName = 'Lyman Series (UV)';
  else if (nLower === 2) seriesName = 'Balmer Series (Visible)';
  else if (nLower === 3) seriesName = 'Paschen Series (IR)';
  else if (nLower === 4) seriesName = 'Brackett Series (Far-IR)';

  let region = 'Ultraviolet';
  let photonColor = '#A855F7';

  if (wavelengthNm < 380) {
    region = 'Ultraviolet (UV)';
    photonColor = '#8B5CF6';
  } else if (wavelengthNm <= 450) {
    region = 'Visible (Violet)';
    photonColor = '#7C3AED';
  } else if (wavelengthNm <= 495) {
    region = 'Visible (Blue)';
    photonColor = '#2563EB';
  } else if (wavelengthNm <= 570) {
    region = 'Visible (Cyan / Green)';
    photonColor = '#059669';
  } else if (wavelengthNm <= 590) {
    region = 'Visible (Yellow)';
    photonColor = '#D97706';
  } else if (wavelengthNm <= 620) {
    region = 'Visible (Orange)';
    photonColor = '#EA580C';
  } else if (wavelengthNm <= 750) {
    region = 'Visible (Red)';
    photonColor = '#DC2626';
  } else {
    region = 'Infrared (IR)';
    photonColor = '#EF4444';
  }

  return {
    deltaE,
    wavelengthNm,
    seriesName,
    region,
    photonColor,
    isEmission: ni > nf,
  };
}
