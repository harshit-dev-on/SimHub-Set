import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import './ElectronClouding.css';
import {
  ORBITAL_PRESETS,
  evaluateRadialWavefunction,
  evaluateWavefunction,
  generateElectronCloudSamples,
  getOrbitalQuantumInfo,
  calculateSpectralTransition,
} from './quantumMath';

function ElectronClouding() {
  // Quantum Numbers State (n, l, m)
  const [n, setN] = useState(2);
  const [l, setL] = useState(1);
  const [m, setM] = useState(0);

  // Visualization Mode: 'cloud' | 'lobes' | 'slice' | 'bohr'
  const [viewMode, setViewMode] = useState('cloud');
  const [pointCount, setPointCount] = useState(18000);
  const [sliceAxis, setSliceAxis] = useState('xz'); // 'xy' | 'xz' | 'yz'
  const [autoRotate, setAutoRotate] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [showNucleus, setShowNucleus] = useState(true);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('all');

  // Quantum Spectral Jump Simulator State (ni -> nf)
  const [transitionNi, setTransitionNi] = useState(3);
  const [transitionNf, setTransitionNf] = useState(2);

  // Refs for Three.js Canvas
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const pointsObjectRef = useRef(null);
  const meshGroupRef = useRef(null);
  const sliceMeshRef = useRef(null);
  const bohrGroupRef = useRef(null);
  const axesGroupRef = useRef(null);
  const nucleusMeshRef = useRef(null);
  const animFrameIdRef = useRef(null);

  // Camera Orbit State
  const cameraDistanceRef = useRef(35);
  const sphericalRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3 });
  const isDraggingRef = useRef(false);
  const previousMouseRef = useRef({ x: 0, y: 0 });

  // Current Orbital Metadata
  const currentPreset = useMemo(() => {
    return (
      ORBITAL_PRESETS.find((p) => p.n === n && p.l === l && p.m === m) || {
        n,
        l,
        m,
        label: `${n}${l === 0 ? 's' : l === 1 ? 'p' : l === 2 ? 'd' : 'f'}${
          m !== 0 ? ` (m=${m})` : ''
        }`,
        name: `Custom (${n}, ${l}, ${m})`,
        type: l === 0 ? 's' : l === 1 ? 'p' : l === 2 ? 'd' : 'f',
        color: '#38BDF8',
      }
    );
  }, [n, l, m]);

  const quantumInfo = useMemo(() => getOrbitalQuantumInfo(n, l, m), [n, l, m]);
  const spectralTransition = useMemo(
    () => calculateSpectralTransition(transitionNi, transitionNf),
    [transitionNi, transitionNf]
  );

  // Mathematical Wavefunction Formula String for Floating Pill
  const wavefunctionFormula = useMemo(() => {
    const orbType = l === 0 ? 's' : l === 1 ? 'p' : l === 2 ? 'd' : 'f';
    const sub = `${n}${orbType}${m !== 0 ? (m > 0 ? `+${m}` : `${m}`) : ''}`;
    return `ψ_${sub}(r, θ, φ) = R_${n}${l}(r) · Y_${l}${m}(θ, φ)`;
  }, [n, l, m]);

  // Synchronize (l, m) bounds when n changes
  const handleSetN = (newN) => {
    const clampedN = Math.max(1, Math.min(4, newN));
    setN(clampedN);
    if (l >= clampedN) {
      const newL = clampedN - 1;
      setL(newL);
      if (Math.abs(m) > newL) setM(0);
    }
  };

  const handleSetL = (newL) => {
    const clampedL = Math.max(0, Math.min(n - 1, newL));
    setL(clampedL);
    if (Math.abs(m) > clampedL) setM(0);
  };

  const handleSetM = (newM) => {
    const clampedM = Math.max(-l, Math.min(l, newM));
    setM(clampedM);
  };

  const applyPreset = (preset) => {
    setN(preset.n);
    setL(preset.l);
    setM(preset.m);
  };

  // Zoom Helpers
  const handleZoom = (factor) => {
    cameraDistanceRef.current = Math.max(6, Math.min(220, cameraDistanceRef.current * factor));
    if (cameraRef.current) {
      const dist = cameraDistanceRef.current;
      const { theta, phi } = sphericalRef.current;
      cameraRef.current.position.x = dist * Math.sin(phi) * Math.cos(theta);
      cameraRef.current.position.y = dist * Math.cos(phi);
      cameraRef.current.position.z = dist * Math.sin(phi) * Math.sin(theta);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

  // Reset 3D Camera to default framing
  const resetCameraView = useCallback(() => {
    sphericalRef.current = { theta: Math.PI / 4, phi: Math.PI / 3 };
    cameraDistanceRef.current = Math.max(24, n * n * 6.0);
    if (cameraRef.current) {
      const dist = cameraDistanceRef.current;
      const { theta, phi } = sphericalRef.current;
      cameraRef.current.position.x = dist * Math.sin(phi) * Math.cos(theta);
      cameraRef.current.position.y = dist * Math.cos(phi);
      cameraRef.current.position.z = dist * Math.sin(phi) * Math.sin(theta);
      cameraRef.current.lookAt(0, 0, 0);
    }
  }, [n]);

  // --------------------------------------------------------------------------
  // Three.js Scene Setup & Lifecycle
  // --------------------------------------------------------------------------
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 420;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    cameraDistanceRef.current = Math.max(24, n * n * 6.0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(20, 40, 30);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.6);
    dirLight2.position.set(-20, -30, -20);
    scene.add(dirLight2);

    // Groups
    const meshGroup = new THREE.Group();
    meshGroupRef.current = meshGroup;
    scene.add(meshGroup);

    const bohrGroup = new THREE.Group();
    bohrGroupRef.current = bohrGroup;
    scene.add(bohrGroup);

    const axesGroup = new THREE.Group();
    axesGroupRef.current = axesGroup;
    scene.add(axesGroup);

    // Central Nucleus Proton (Glowing Red Sphere at Origin)
    const nucleusGeo = new THREE.SphereGeometry(0.7, 24, 24);
    const nucleusMat = new THREE.MeshStandardMaterial({
      color: 0xff3b30,
      emissive: 0xff1e00,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.1,
    });
    const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
    nucleusMeshRef.current = nucleus;
    scene.add(nucleus);

    // Coordinate Grid & Bohr Radii Axes
    const maxAxis = Math.max(14, n * n * 3.5);
    const gridHelper = new THREE.GridHelper(maxAxis * 2, 16, 0x334155, 0x1e293b);
    gridHelper.position.y = -0.05;
    axesGroup.add(gridHelper);

    // Custom 3D Colored Axes (X: Red, Y: Green, Z: Blue)
    const createAxisLine = (start, end, colorHex) => {
      const mat = new THREE.LineBasicMaterial({ color: colorHex, linewidth: 2 });
      const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
      return new THREE.Line(geo, mat);
    };
    axesGroup.add(createAxisLine(new THREE.Vector3(-maxAxis, 0, 0), new THREE.Vector3(maxAxis, 0, 0), 0xef4444));
    axesGroup.add(createAxisLine(new THREE.Vector3(0, -maxAxis, 0), new THREE.Vector3(0, maxAxis, 0), 0x10b981));
    axesGroup.add(createAxisLine(new THREE.Vector3(0, 0, -maxAxis), new THREE.Vector3(0, 0, maxAxis), 0x3b82f6));

    // Update Camera Position
    const updateCameraPos = () => {
      const dist = cameraDistanceRef.current;
      const { theta, phi } = sphericalRef.current;
      camera.position.x = dist * Math.sin(phi) * Math.cos(theta);
      camera.position.y = dist * Math.cos(phi);
      camera.position.z = dist * Math.sin(phi) * Math.sin(theta);
      camera.lookAt(0, 0, 0);
    };
    updateCameraPos();

    // Mouse & Touch Pointer Orbit Controls
    const onPointerDown = (e) => {
      isDraggingRef.current = true;
      previousMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMouseRef.current.x;
      const deltaY = e.clientY - previousMouseRef.current.y;
      previousMouseRef.current = { x: e.clientX, y: e.clientY };

      sphericalRef.current.theta += deltaX * 0.008;
      sphericalRef.current.phi = Math.max(
        0.08,
        Math.min(Math.PI - 0.08, sphericalRef.current.phi - deltaY * 0.008)
      );
      updateCameraPos();
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.91;
      cameraDistanceRef.current = Math.max(6, Math.min(220, cameraDistanceRef.current * zoomFactor));
      updateCameraPos();
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Safe Window Resize Handler with rAF throttling
    let resizeRafId = null;
    const handleResize = () => {
      if (resizeRafId) cancelAnimationFrame(resizeRafId);
      resizeRafId = requestAnimationFrame(() => {
        if (!container || !renderer || !camera) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h, false);
        }
      });
    };
    window.addEventListener('resize', handleResize);

    // Animation Render Loop
    let bohrAngle = 0;
    const renderLoop = () => {
      animFrameIdRef.current = requestAnimationFrame(renderLoop);

      if (autoRotate && !isDraggingRef.current) {
        sphericalRef.current.theta += 0.004;
        updateCameraPos();
      }

      // Animate Bohr Electron Orbit if in Bohr mode
      if (bohrGroupRef.current && bohrGroupRef.current.visible) {
        bohrAngle += 0.035;
        const bohrRadius = n * n; // r = n^2 * a_0 in Bohr model
        const electronMesh = bohrGroupRef.current.getObjectByName('bohrElectron');
        if (electronMesh) {
          electronMesh.position.x = bohrRadius * Math.cos(bohrAngle);
          electronMesh.position.z = bohrRadius * Math.sin(bohrAngle);
        }
      }

      renderer.render(scene, camera);
    };
    renderLoop();

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (resizeRafId) cancelAnimationFrame(resizeRafId);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [autoRotate, n]);

  // --------------------------------------------------------------------------
  // Update 3D Quantum Objects on (n, l, m, viewMode, pointCount) Changes
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const meshGroup = meshGroupRef.current;
    const bohrGroup = bohrGroupRef.current;

    // Adjust camera distance for higher energy levels
    cameraDistanceRef.current = Math.max(22, n * n * 5.8);

    // 1. Clear previous point cloud
    if (pointsObjectRef.current) {
      scene.remove(pointsObjectRef.current);
      if (pointsObjectRef.current.geometry) pointsObjectRef.current.geometry.dispose();
      if (pointsObjectRef.current.material) pointsObjectRef.current.material.dispose();
      pointsObjectRef.current = null;
    }

    // 2. Clear previous isosurface meshes
    if (meshGroup) {
      while (meshGroup.children.length > 0) {
        const obj = meshGroup.children[0];
        meshGroup.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      }
    }

    // 3. Clear previous slice mesh
    if (sliceMeshRef.current) {
      scene.remove(sliceMeshRef.current);
      if (sliceMeshRef.current.geometry) sliceMeshRef.current.geometry.dispose();
      if (sliceMeshRef.current.material) sliceMeshRef.current.material.dispose();
      sliceMeshRef.current = null;
    }

    // 4. Clear previous Bohr group objects
    if (bohrGroup) {
      while (bohrGroup.children.length > 0) {
        const obj = bohrGroup.children[0];
        bohrGroup.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      }
    }

    // Visibility toggles
    if (axesGroupRef.current) axesGroupRef.current.visible = showAxes;
    if (nucleusMeshRef.current) nucleusMeshRef.current.visible = showNucleus;

    // ------------------------------------------------------------------------
    // Mode 1: ☁️ Monte Carlo 3D Quantum Probability Cloud
    // ------------------------------------------------------------------------
    if (viewMode === 'cloud' || viewMode === 'bohr') {
      const { positions, colors } = generateElectronCloudSamples(n, l, m, pointCount);

      const cloudGeometry = new THREE.BufferGeometry();
      cloudGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      cloudGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      // Circular glowing particle texture
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0.7)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
      const particleTexture = new THREE.CanvasTexture(canvas);

      const cloudMaterial = new THREE.PointsMaterial({
        size: viewMode === 'bohr' ? 1.6 : 2.2,
        vertexColors: true,
        map: particleTexture,
        transparent: true,
        opacity: viewMode === 'bohr' ? 0.45 : 0.78,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const pointsObj = new THREE.Points(cloudGeometry, cloudMaterial);
      pointsObjectRef.current = pointsObj;
      scene.add(pointsObj);
    }

    // ------------------------------------------------------------------------
    // Mode 2: 🔮 3D Isosurface Lobes (Boundary Surface Enclosing 90% Probability)
    // ------------------------------------------------------------------------
    if (viewMode === 'lobes') {
      const maxRadius = Math.max(6, n * n * 2.8);
      const uSteps = 56;
      const vSteps = 56;

      // Parametric radial probability shape construction
      const createParametricLobeMesh = (phaseSign, lobeColorHex) => {
        const positions = [];
        const indices = [];

        for (let i = 0; i <= uSteps; i++) {
          const theta = (i / uSteps) * Math.PI; // 0 to PI
          for (let j = 0; j <= vSteps; j++) {
            const phi = (j / vSteps) * 2 * Math.PI; // 0 to 2PI

            const dirX = Math.sin(theta) * Math.cos(phi);
            const dirY = Math.sin(theta) * Math.sin(phi);
            const dirZ = Math.cos(theta);

            // Find boundary radius where |ψ|^2 crosses 90% contour threshold
            let lobeRadius = 0.5;
            let peakR = 1.0;
            let maxPsi = 0;

            for (let rStep = 0.5; rStep < maxRadius; rStep += 0.5) {
              const { psi, probDensity } = evaluateWavefunction(n, l, m, dirX * rStep, dirY * rStep, dirZ * rStep);
              if (probDensity > maxPsi && Math.sign(psi) === phaseSign) {
                maxPsi = probDensity;
                peakR = rStep;
              }
            }

            // Scale lobe proportional to angular harmonic strength
            const { psi } = evaluateWavefunction(n, l, m, dirX * peakR, dirY * peakR, dirZ * peakR);
            if (Math.sign(psi) === phaseSign && Math.abs(psi) > 0.001) {
              lobeRadius = peakR * Math.min(1.4, Math.max(0.2, Math.pow(Math.abs(psi) * 20, 0.3)));
            } else {
              lobeRadius = 0.1;
            }

            positions.push(dirX * lobeRadius, dirY * lobeRadius, dirZ * lobeRadius);
          }
        }

        // Generate triangle indices
        for (let i = 0; i < uSteps; i++) {
          for (let j = 0; j < vSteps; j++) {
            const a = i * (vSteps + 1) + j;
            const b = (i + 1) * (vSteps + 1) + j;
            const c = (i + 1) * (vSteps + 1) + (j + 1);
            const d = i * (vSteps + 1) + (j + 1);
            indices.push(a, b, d);
            indices.push(b, c, d);
          }
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setIndex(indices);
        geo.computeVertexNormals();

        const mat = new THREE.MeshStandardMaterial({
          color: lobeColorHex,
          emissive: lobeColorHex,
          emissiveIntensity: 0.25,
          roughness: 0.3,
          metalness: 0.1,
          transparent: true,
          opacity: 0.82,
          side: THREE.DoubleSide,
        });

        return new THREE.Mesh(geo, mat);
      };

      // Positive Phase Lobe (Cyan / Sky Blue)
      const positiveLobe = createParametricLobeMesh(1, 0x38bdf8);
      meshGroup.add(positiveLobe);

      // Negative Phase Lobe (Coral / Red-Orange for l > 0)
      if (l > 0) {
        const negativeLobe = createParametricLobeMesh(-1, 0xf43f5e);
        meshGroup.add(negativeLobe);
      }
    }

    // ------------------------------------------------------------------------
    // Mode 3: 📐 2D Slicing Plane Heatmap (|ψ|^2 Density Gradient)
    // ------------------------------------------------------------------------
    if (viewMode === 'slice') {
      const sliceSize = Math.max(16, n * n * 5.0);
      const res = 128;
      const canvas = document.createElement('canvas');
      canvas.width = res;
      canvas.height = res;
      const ctx = canvas.getContext('2d');
      const imgData = ctx.createImageData(res, res);

      let maxP = 0;
      const grid = new Float32Array(res * res);
      for (let py = 0; py < res; py++) {
        for (let px = 0; px < res; px++) {
          const u = ((px / (res - 1)) - 0.5) * sliceSize;
          const v = ((py / (res - 1)) - 0.5) * sliceSize;

          let x = 0, y = 0, z = 0;
          if (sliceAxis === 'xy') { x = u; y = v; z = 0; }
          else if (sliceAxis === 'xz') { x = u; y = 0; z = v; }
          else if (sliceAxis === 'yz') { x = 0; y = u; z = v; }

          const { probDensity } = evaluateWavefunction(n, l, m, x, y, z);
          grid[py * res + px] = probDensity;
          if (probDensity > maxP) maxP = probDensity;
        }
      }
      if (maxP < 1e-7) maxP = 1;

      // Colorize pixels with quantum heatmap
      for (let i = 0; i < res * res; i++) {
        const normP = Math.pow(grid[i] / maxP, 0.45); // Logarithmic gamma for visibility
        const pIdx = i * 4;

        if (normP < 0.01) {
          imgData.data[pIdx] = 11;
          imgData.data[pIdx + 1] = 15;
          imgData.data[pIdx + 2] = 23;
          imgData.data[pIdx + 3] = 180;
        } else {
          // Heatmap: Navy -> Cyan -> White/Gold
          imgData.data[pIdx] = Math.min(255, Math.floor(normP * 255 * 0.4 + normP * normP * 200));
          imgData.data[pIdx + 1] = Math.min(255, Math.floor(normP * 210 + normP * normP * 45));
          imgData.data[pIdx + 2] = Math.min(255, Math.floor(normP * 255));
          imgData.data[pIdx + 3] = Math.min(255, Math.floor(200 + normP * 55));
        }
      }
      ctx.putImageData(imgData, 0, 0);

      const texture = new THREE.CanvasTexture(canvas);
      const sliceGeo = new THREE.PlaneGeometry(sliceSize, sliceSize);
      const sliceMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide,
      });

      const sliceMesh = new THREE.Mesh(sliceGeo, sliceMat);
      if (sliceAxis === 'xz') sliceMesh.rotation.x = Math.PI / 2;
      else if (sliceAxis === 'yz') sliceMesh.rotation.y = Math.PI / 2;

      sliceMeshRef.current = sliceMesh;
      scene.add(sliceMesh);
    }

    // ------------------------------------------------------------------------
    // Mode 4: 🪐 Classical Bohr Orbit vs Quantum Heisenberg Cloud
    // ------------------------------------------------------------------------
    if (viewMode === 'bohr' && bohrGroup) {
      const bohrRadius = n * n; // r_n = n^2 * a_0

      // Classical Orbit Ring
      const orbitCurve = new THREE.EllipseCurve(0, 0, bohrRadius, bohrRadius, 0, 2 * Math.PI, false, 0);
      const orbitPoints = orbitCurve.getPoints(64);
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(
        orbitPoints.map((p) => new THREE.Vector3(p.x, 0, p.y))
      );
      const orbitMat = new THREE.LineDashedMaterial({
        color: 0xf59e0b,
        dashSize: 1,
        gapSize: 0.5,
        linewidth: 2,
      });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      orbitLine.computeLineDistances();
      bohrGroup.add(orbitLine);

      // Classical Orbiting Electron Particle Sphere
      const electronGeo = new THREE.SphereGeometry(0.85, 16, 16);
      const electronMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.8,
      });
      const electronMesh = new THREE.Mesh(electronGeo, electronMat);
      electronMesh.name = 'bohrElectron';
      bohrGroup.add(electronMesh);
    }
  }, [n, l, m, viewMode, pointCount, sliceAxis, showAxes, showNucleus]);

  // --------------------------------------------------------------------------
  // 2D Wavefunction & Probability Graphs Generators
  // --------------------------------------------------------------------------
  const maxR = Math.max(12, n * n * 3.2);

  const radialWavefunctionPoints = useMemo(() => {
    const pts = [];
    const count = 100;
    const dr = maxR / count;
    let maxVal = 0.1;
    let minVal = -0.1;

    for (let i = 0; i <= count; i++) {
      const r = i * dr;
      const R = evaluateRadialWavefunction(n, l, r);
      pts.push({ r, R });
      if (R > maxVal) maxVal = R;
      if (R < minVal) minVal = R;
    }
    return { pts, maxVal, minVal };
  }, [n, l, maxR]);

  const radialProbabilityPoints = useMemo(() => {
    const pts = [];
    const count = 100;
    const dr = maxR / count;
    let maxP = 0.05;
    let peakR = 1;

    for (let i = 0; i <= count; i++) {
      const r = i * dr;
      const R = evaluateRadialWavefunction(n, l, r);
      const P = r * r * R * R; // Radial probability density P(r) = r^2 R^2
      pts.push({ r, P });
      if (P > maxP) {
        maxP = P;
        peakR = r;
      }
    }
    return { pts, maxP, peakR };
  }, [n, l, maxR]);

  return (
    <div className="sim-split-studio-layout">
      {/* Left Column: Unscrollable Workbench (3D Stage + Single-Row Toolbar) */}
      <div className="unscrollable-workbench-pane">
        <div className="workbench-top-simulation">
          <div className="electron-stage-card">
            {/* Header / Badges Row */}
            <div className="electron-stage-header">
              <div className="stage-badge-group">
                {/* Visual Mode Selector Pills */}
                <div className="visual-mode-toggle-pill">
                  <button
                    type="button"
                    className={`vm-toggle-btn ${viewMode === 'cloud' ? 'active' : ''}`}
                    onClick={() => setViewMode('cloud')}
                    title="3D Monte Carlo Quantum Probability Density Cloud"
                  >
                    ☁️ Cloud
                  </button>
                  <button
                    type="button"
                    className={`vm-toggle-btn ${viewMode === 'lobes' ? 'active' : ''}`}
                    onClick={() => setViewMode('lobes')}
                    title="3D Boundary Isosurface Lobes (90% Probability Enclosure)"
                  >
                    🔮 Lobes
                  </button>
                  <button
                    type="button"
                    className={`vm-toggle-btn ${viewMode === 'slice' ? 'active' : ''}`}
                    onClick={() => setViewMode('slice')}
                    title="2D Slicing Plane Heatmap and Probability Contours"
                  >
                    📐 Slice
                  </button>
                  <button
                    type="button"
                    className={`vm-toggle-btn ${viewMode === 'bohr' ? 'active' : ''}`}
                    onClick={() => setViewMode('bohr')}
                    title="Bohr Planetary Orbit vs Quantum Probability Cloud"
                  >
                    🪐 Bohr
                  </button>
                </div>

                <div className="stage-status-live">
                  <span className="status-dot in-flight" />
                  <span>
                    <strong>{currentPreset.label}</strong> ({currentPreset.name})
                  </span>
                </div>
              </div>

              {/* View Overlays */}
              <div className="stage-overlay-toggles">
                <button
                  type="button"
                  className={`toggle-chip ${autoRotate ? 'active' : ''}`}
                  onClick={() => setAutoRotate(!autoRotate)}
                  title="Toggle automatic 3D camera rotation"
                >
                  🔄 {autoRotate ? 'Auto' : 'Paused'}
                </button>
                <button
                  type="button"
                  className={`toggle-chip ${showAxes ? 'active' : ''}`}
                  onClick={() => setShowAxes(!showAxes)}
                  title="Toggle 3D coordinate axes in Bohr radii a₀"
                >
                  📏 Axes: {showAxes ? 'ON' : 'OFF'}
                </button>
                <button
                  type="button"
                  className={`toggle-chip ${showNucleus ? 'active' : ''}`}
                  onClick={() => setShowNucleus(!showNucleus)}
                  title="Toggle central proton nucleus"
                >
                  🔴 Nucleus: {showNucleus ? 'ON' : 'OFF'}
                </button>
                <button
                  type="button"
                  className="toggle-chip"
                  onClick={resetCameraView}
                  title="Reset 3D camera to default orientation"
                >
                  🎯 Reset
                </button>
              </div>
            </div>

            {/* 3D WebGL Canvas Viewport */}
            <div ref={mountRef} className="electron-3d-viewport">
              {/* Floating Mathematical Wavefunction Formula Badge */}
              <div className="floating-math-formula-pill">
                <span className="fn-header">Quantum Wavefunction</span>
                <span className="fn-body">{wavefunctionFormula}</span>
              </div>

              {/* Floating Pan & Zoom HUD */}
              <div className="floating-viewport-hud">
                <button
                  type="button"
                  className="hud-btn"
                  onClick={() => handleZoom(0.85)}
                  title="Zoom In (or scroll wheel up)"
                >
                  ➕
                </button>
                <button
                  type="button"
                  className="hud-btn"
                  onClick={() => handleZoom(1.18)}
                  title="Zoom Out (or scroll wheel down)"
                >
                  ➖
                </button>
                <button
                  type="button"
                  className="hud-btn hud-btn-reset"
                  onClick={resetCameraView}
                  title="Reset 3D camera framing"
                >
                  🎯 Fit View
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Parameters & Controls Area (Single-Row Toolbar) */}
        <div className="workbench-bottom-controls">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Principal Quantum Number n */}
            <div className="quantum-stepper-item">
              <span className="quantum-stepper-label" title="Principal Quantum Number n (Energy level 1..4)">
                Level n:
              </span>
              <button
                type="button"
                className="quantum-stepper-btn"
                onClick={() => handleSetN(n - 1)}
                disabled={n <= 1}
              >
                −
              </button>
              <span className="quantum-stepper-val" style={{ color: '#2563EB' }}>
                {n}
              </span>
              <button
                type="button"
                className="quantum-stepper-btn"
                onClick={() => handleSetN(n + 1)}
                disabled={n >= 4}
              >
                +
              </button>
            </div>

            <div style={{ width: '1.5px', height: '22px', background: 'rgba(0,0,0,0.08)' }} />

            {/* Angular Quantum Number l */}
            <div className="quantum-stepper-item">
              <span className="quantum-stepper-label" title="Azimuthal Quantum Number l (Orbital shape s, p, d, f)">
                Orbital l ({l === 0 ? 's' : l === 1 ? 'p' : l === 2 ? 'd' : 'f'}):
              </span>
              <button
                type="button"
                className="quantum-stepper-btn"
                onClick={() => handleSetL(l - 1)}
                disabled={l <= 0}
              >
                −
              </button>
              <span className="quantum-stepper-val" style={{ color: '#4F46E5' }}>
                {l}
              </span>
              <button
                type="button"
                className="quantum-stepper-btn"
                onClick={() => handleSetL(l + 1)}
                disabled={l >= n - 1}
              >
                +
              </button>
            </div>

            <div style={{ width: '1.5px', height: '22px', background: 'rgba(0,0,0,0.08)' }} />

            {/* Magnetic Quantum Number m_l */}
            <div className="quantum-stepper-item">
              <span className="quantum-stepper-label" title="Magnetic Quantum Number m_l (Spatial orientation)">
                Orientation mₗ:
              </span>
              <button
                type="button"
                className="quantum-stepper-btn"
                onClick={() => handleSetM(m - 1)}
                disabled={m <= -l}
              >
                −
              </button>
              <span className="quantum-stepper-val" style={{ color: '#9333EA' }}>
                {m}
              </span>
              <button
                type="button"
                className="quantum-stepper-btn"
                onClick={() => handleSetM(m + 1)}
                disabled={m >= l}
              >
                +
              </button>
            </div>

            <div style={{ width: '1.5px', height: '22px', background: 'rgba(0,0,0,0.08)' }} />

            {/* Mode Specific Controls */}
            {viewMode === 'cloud' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="quantum-stepper-label">Density:</span>
                <input
                  type="range"
                  min="6000"
                  max="40000"
                  step="2000"
                  value={pointCount}
                  onChange={(e) => setPointCount(parseInt(e.target.value, 10))}
                  style={{ width: '80px', margin: 0, cursor: 'pointer' }}
                />
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B' }}>
                  {(pointCount / 1000).toFixed(0)}k pts
                </span>
              </div>
            )}

            {viewMode === 'slice' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span className="quantum-stepper-label">Slice Plane:</span>
                {['xy', 'xz', 'yz'].map((axis) => (
                  <button
                    key={axis}
                    type="button"
                    onClick={() => setSliceAxis(axis)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '11px',
                      fontWeight: '800',
                      background: sliceAxis === axis ? '#1E293B' : '#FFFFFF',
                      color: sliceAxis === axis ? '#FFFFFF' : '#334155',
                      cursor: 'pointer',
                    }}
                  >
                    {axis.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            <div style={{ width: '1.5px', height: '22px', background: 'rgba(0,0,0,0.08)' }} />

            {/* Quick Orbital Preset Picker Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="quantum-stepper-label">Preset:</span>
              <select
                value={`${n}-${l}-${m}`}
                onChange={(e) => {
                  const [selN, selL, selM] = e.target.value.split('-').map((v) => parseInt(v, 10));
                  setN(selN);
                  setL(selL);
                  setM(selM);
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(0,0,0,0.15)',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  background: '#FFFFFF',
                  color: '#1E293B',
                  cursor: 'pointer',
                }}
              >
                {ORBITAL_PRESETS.map((p) => (
                  <option key={`${p.n}-${p.l}-${p.m}`} value={`${p.n}-${p.l}-${p.m}`}>
                    {p.label} - {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Scrollable Analysis & Concepts Pane */}
      <div className="scrollable-analysis-pane">
        {/* Analysis Tab Bar */}
        <div className="analysis-tabs-bar">
          <button
            type="button"
            className={`analysis-tab-pill ${activeAnalysisTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveAnalysisTab('all')}
          >
            📋 Overview
          </button>
          <button
            type="button"
            className={`analysis-tab-pill ${activeAnalysisTab === 'wavefunctions' ? 'active' : ''}`}
            onClick={() => setActiveAnalysisTab('wavefunctions')}
          >
            📊 Wavefunctions
          </button>
          <button
            type="button"
            className={`analysis-tab-pill ${activeAnalysisTab === 'nodes' ? 'active' : ''}`}
            onClick={() => setActiveAnalysisTab('nodes')}
          >
            ⚛️ Nodal Structure
          </button>
          <button
            type="button"
            className={`analysis-tab-pill ${activeAnalysisTab === 'energy' ? 'active' : ''}`}
            onClick={() => setActiveAnalysisTab('energy')}
          >
            ⚡ Spectroscopy
          </button>
          <button
            type="button"
            className={`analysis-tab-pill ${activeAnalysisTab === 'bohr' ? 'active' : ''}`}
            onClick={() => setActiveAnalysisTab('bohr')}
          >
            🪐 Bohr Model
          </button>
        </div>

        {/* Scrollable Bento Content Body */}
        <div className="analysis-scrollable-content">
          {/* Quick Preset Orbitals Grid */}
          <div className="bento-subcard surface-yellow">
            <div className="card-top-row">
              <h4 className="card-title-text">Quick Preset Orbitals</h4>
              <span className="doodle-badge">Catalog n=1..4</span>
            </div>
            <div className="presets-grid">
              {ORBITAL_PRESETS.map((p) => {
                const isActive = p.n === n && p.l === l && p.m === m;
                return (
                  <button
                    key={`${p.n}-${p.l}-${p.m}`}
                    type="button"
                    className={`preset-chip ${isActive ? 'active' : ''}`}
                    onClick={() => applyPreset(p)}
                  >
                    <span className="preset-chip-title" style={{ color: isActive ? '#2563EB' : p.color }}>
                      {p.label}
                    </span>
                    <span className="preset-chip-type">{p.type}-orbital</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Phase Legend */}
          <div className="phase-legend-bar">
            <div className="phase-tag">
              <span className="phase-dot positive" />
              <span>Positive Wavefunction Phase (ψ &gt; 0)</span>
            </div>
            <div className="phase-tag">
              <span className="phase-dot negative" />
              <span>Negative Wavefunction Phase (ψ &lt; 0)</span>
            </div>
          </div>

          {/* Radial Wavefunction Graph R(r) */}
          {(activeAnalysisTab === 'all' || activeAnalysisTab === 'wavefunctions') && (
            <div className="bento-subcard surface-blue">
              <div className="card-top-row">
                <h4 className="card-title-text">1. Radial Wavefunction R_{n}{l}(r)</h4>
                <span className="doodle-badge">Amplitude ψ(r)</span>
              </div>
              <svg viewBox="0 0 320 120" className="kinematics-mini-svg">
                <line x1="35" y1="20" x2="305" y2="20" stroke="#CBD5E1" strokeDasharray="3 3" />
                <line x1="35" y1="65" x2="305" y2="65" stroke="#94A3B8" strokeWidth="1.5" />
                <line x1="35" y1="110" x2="305" y2="110" stroke="#CBD5E1" strokeDasharray="3 3" />
                <line x1="35" y1="15" x2="35" y2="110" stroke="#94A3B8" strokeWidth="1.5" />

                {/* Y Labels */}
                <text x="30" y="24" textAnchor="end" fontSize="9" fill="#64748B" fontFamily="monospace">
                  +{radialWavefunctionPoints.maxVal.toFixed(2)}
                </text>
                <text x="30" y="69" textAnchor="end" fontSize="9" fill="#64748B" fontFamily="monospace">
                  0
                </text>
                <text x="30" y="114" textAnchor="end" fontSize="9" fill="#64748B" fontFamily="monospace">
                  {radialWavefunctionPoints.minVal.toFixed(2)}
                </text>

                {/* X Labels */}
                <text x="35" y="118" textAnchor="start" fontSize="9" fill="#64748B" fontFamily="monospace">
                  0 a₀
                </text>
                <text x="305" y="118" textAnchor="end" fontSize="9" fill="#64748B" fontFamily="monospace">
                  {maxR.toFixed(0)} a₀
                </text>

                {/* R(r) Curve */}
                <path
                  d={radialWavefunctionPoints.pts
                    .map((p, i) => {
                      const sx = 35 + (p.r / maxR) * 270;
                      const span = radialWavefunctionPoints.maxVal - radialWavefunctionPoints.minVal || 1;
                      const sy = 110 - ((p.R - radialWavefunctionPoints.minVal) / span) * 90;
                      return `${i === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="2.5"
                />
              </svg>
              <span style={{ fontSize: '10px', color: '#64748B' }}>
                Radial probability amplitude showing sign changes across spherical radial nodes.
              </span>
            </div>
          )}

          {/* Radial Probability Distribution Graph P(r) = r^2 R^2 */}
          {(activeAnalysisTab === 'all' || activeAnalysisTab === 'wavefunctions') && (
            <div className="bento-subcard surface-emerald">
              <div className="card-top-row">
                <h4 className="card-title-text">2. Radial Probability P(r) = r² |R(r)|²</h4>
                <span className="doodle-badge">Peak: r = {radialProbabilityPoints.peakR.toFixed(1)} a₀</span>
              </div>
              <svg viewBox="0 0 320 120" className="kinematics-mini-svg">
                <line x1="35" y1="20" x2="305" y2="20" stroke="#CBD5E1" strokeDasharray="3 3" />
                <line x1="35" y1="105" x2="305" y2="105" stroke="#94A3B8" strokeWidth="1.5" />
                <line x1="35" y1="15" x2="35" y2="105" stroke="#94A3B8" strokeWidth="1.5" />

                <text x="30" y="24" textAnchor="end" fontSize="9" fill="#64748B" fontFamily="monospace">
                  {radialProbabilityPoints.maxP.toFixed(3)}
                </text>
                <text x="30" y="108" textAnchor="end" fontSize="9" fill="#64748B" fontFamily="monospace">
                  0
                </text>
                <text x="35" y="117" textAnchor="start" fontSize="9" fill="#64748B" fontFamily="monospace">
                  0 a₀
                </text>
                <text x="305" y="117" textAnchor="end" fontSize="9" fill="#64748B" fontFamily="monospace">
                  {maxR.toFixed(0)} a₀
                </text>

                {/* Shaded Area Under Curve */}
                <path
                  d={`M 35 105 ${radialProbabilityPoints.pts
                    .map((p) => {
                      const sx = 35 + (p.r / maxR) * 270;
                      const sy = 105 - (p.P / (radialProbabilityPoints.maxP || 1)) * 85;
                      return `L ${sx.toFixed(1)} ${sy.toFixed(1)}`;
                    })
                    .join(' ')} L 305 105 Z`}
                  fill="rgba(16, 185, 129, 0.18)"
                />

                {/* P(r) Curve */}
                <path
                  d={radialProbabilityPoints.pts
                    .map((p, i) => {
                      const sx = 35 + (p.r / maxR) * 270;
                      const sy = 105 - (p.P / (radialProbabilityPoints.maxP || 1)) * 85;
                      return `${i === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                />
              </svg>
              <span style={{ fontSize: '10px', color: '#64748B' }}>
                Probability of finding the electron inside a spherical shell of radius r and thickness dr.
              </span>
            </div>
          )}

          {/* Nodal Structure & Quantum Numbers */}
          {(activeAnalysisTab === 'all' || activeAnalysisTab === 'nodes') && (
            <div className="bento-subcard surface-purple">
              <div className="card-top-row">
                <h4 className="card-title-text">Quantum Nodal Surfaces</h4>
                <span className="doodle-badge">Total Nodes = {quantumInfo.totalNodes}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div className="nodal-item-row">
                  <span className="nodal-bullet" style={{ background: '#38BDF8' }} />
                  <span>
                    <strong>Radial Nodes (Spherical shells):</strong> n − l − 1 = {quantumInfo.radialNodes}
                  </span>
                </div>
                <div className="nodal-item-row">
                  <span className="nodal-bullet" style={{ background: '#F43F5E' }} />
                  <span>
                    <strong>Angular Nodes (Planes / Cones):</strong> l = {quantumInfo.angularNodes}
                  </span>
                </div>
                {quantumInfo.nodalDescriptions.map((desc, idx) => (
                  <div key={idx} className="nodal-item-row" style={{ paddingLeft: '12px', fontSize: '10.5px' }}>
                    <span>📐 {desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Energy & Spectroscopy Jump Simulator */}
          {(activeAnalysisTab === 'all' || activeAnalysisTab === 'energy') && (
            <div className="bento-subcard">
              <div className="card-top-row">
                <h4 className="card-title-text">Quantum Jump & Photon Emission</h4>
                <span className="doodle-badge">E_{n} = {quantumInfo.energyEV.toFixed(2)} eV</span>
              </div>

              {/* Selector Controls for Transitions */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800' }}>Initial nᵢ:</span>
                  <select
                    value={transitionNi}
                    onChange={(e) => setTransitionNi(parseInt(e.target.value, 10))}
                    style={{ padding: '3px 6px', borderRadius: '5px', fontSize: '11px', fontWeight: '700', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.15)' }}
                  >
                    {[1, 2, 3, 4].map((v) => (
                      <option key={v} value={v}>n={v}</option>
                    ))}
                  </select>
                </div>

                <span style={{ fontWeight: '800', color: '#64748B' }}>➔</span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800' }}>Final n_f:</span>
                  <select
                    value={transitionNf}
                    onChange={(e) => setTransitionNf(parseInt(e.target.value, 10))}
                    style={{ padding: '3px 6px', borderRadius: '5px', fontSize: '11px', fontWeight: '700', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.15)' }}
                  >
                    {[1, 2, 3, 4].map((v) => (
                      <option key={v} value={v}>n={v}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Spectral Output Box */}
              {spectralTransition.deltaE > 0 ? (
                <div className="spectral-jump-box">
                  <div
                    className="spectral-transition-banner"
                    style={{ backgroundColor: spectralTransition.photonColor }}
                  >
                    <span>
                      {spectralTransition.isEmission ? '✨ Photon Emitted' : '⚡ Photon Absorbed'}
                    </span>
                    <span>λ = {spectralTransition.wavelengthNm.toFixed(1)} nm</span>
                  </div>

                  <div className="spectral-stats-grid">
                    <div className="spectral-stat-tile">
                      <span className="stat-label-tiny">Photon Energy (ΔE)</span>
                      <span className="stat-value-bold">{spectralTransition.deltaE.toFixed(3)} eV</span>
                    </div>
                    <div className="spectral-stat-tile">
                      <span className="stat-label-tiny">Spectral Series</span>
                      <span className="stat-value-bold">{spectralTransition.seriesName}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  Select differing initial and final levels (nᵢ ≠ n_f) to calculate emitted photon wavelengths.
                </span>
              )}
            </div>
          )}

          {/* Bohr vs Heisenberg Quantum Concept Comparison */}
          {(activeAnalysisTab === 'all' || activeAnalysisTab === 'bohr') && (
            <div className="bento-subcard surface-blue">
              <div className="card-top-row">
                <h4 className="card-title-text">Classical Bohr vs Quantum Cloud</h4>
                <span className="doodle-badge">Heisenberg Uncertainty</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#334155', lineHeight: 1.4 }}>
                <p style={{ margin: 0 }}>
                  <strong>1. Classical Bohr Model (1913):</strong> Treated electrons as deterministic particles in circular planetary orbits of fixed radius <em>r = n² a₀</em>. It could not explain multi-electron atoms or 3D orbital shapes.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>2. Quantum Mechanical Cloud (Schrödinger 1926):</strong> Because of the Heisenberg Uncertainty Principle (<em>Δx · Δp ≥ ℏ/2</em>), an electron does not follow a definite path. Instead, it forms a <strong>3D probability density cloud |ψ|²</strong>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ElectronClouding;
