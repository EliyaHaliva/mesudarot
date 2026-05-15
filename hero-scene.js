(function () {
  const THREE = window.THREE;
  const container = document.querySelector("#hero-scene");

  if (!container) return;

  if (!THREE) {
    container.classList.add("hero-scene-fallback");
    return;
  }

  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduceMotion = reduceMotionQuery.matches;
  let targetScroll = 0;
  let scrollProgress = 0;

  const pointer = { x: 0, y: 0 };
  const easedPointer = { x: 0, y: 0 };
  const clock = new THREE.Clock();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 80);
  const root = new THREE.Group();
  const bottleGroup = new THREE.Group();
  const capGroup = new THREE.Group();
  const brushGroup = new THREE.Group();
  const nailGroup = new THREE.Group();
  const sparkleGroup = new THREE.Group();
  const sparkles = [];

  let renderer;
  let paintFill;
  let polishDrop;
  let brushTip;

  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
  } catch (error) {
    container.classList.add("hero-scene-fallback");
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);

  if ("outputColorSpace" in renderer && THREE.SRGBColorSpace) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  } else if ("outputEncoding" in renderer && THREE.sRGBEncoding) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }

  renderer.domElement.setAttribute("role", "img");
  renderer.domElement.setAttribute("aria-label", "אנימציית תלת ממד של בקבוק לק שנפתח ומברשת שצובעת ציפורן בגלילה");
  renderer.domElement.tabIndex = -1;
  container.appendChild(renderer.domElement);

  camera.position.set(0, 0.05, 8.7);
  scene.add(root);
  root.add(nailGroup, bottleGroup, capGroup, brushGroup, sparkleGroup);

  const polish = new THREE.MeshPhysicalMaterial({
    color: 0xff167f,
    emissive: 0x5a002c,
    emissiveIntensity: 0.24,
    roughness: 0.18,
    metalness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.1
  });

  const hotPink = new THREE.MeshStandardMaterial({
    color: 0xff4fa3,
    emissive: 0x541034,
    emissiveIntensity: 0.18,
    roughness: 0.28,
    metalness: 0.04
  });

  const capMaterial = new THREE.MeshStandardMaterial({
    color: 0xd41470,
    emissive: 0x4c0027,
    emissiveIntensity: 0.2,
    roughness: 0.22,
    metalness: 0.12
  });

  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xfff7fc,
    transparent: true,
    opacity: 0.58,
    roughness: 0.03,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.06
  });

  const pearl = new THREE.MeshPhysicalMaterial({
    color: 0xfff7fc,
    roughness: 0.16,
    metalness: 0.02,
    clearcoat: 0.82,
    clearcoatRoughness: 0.16
  });

  const nailBaseMaterial = new THREE.MeshStandardMaterial({
    color: 0xffe9f4,
    emissive: 0x301120,
    emissiveIntensity: 0.06,
    roughness: 0.3,
    metalness: 0.03
  });

  const gold = new THREE.MeshStandardMaterial({
    color: 0xf5c86b,
    roughness: 0.26,
    metalness: 0.35
  });

  const violet = new THREE.MeshStandardMaterial({
    color: 0xa78bfa,
    emissive: 0x24104f,
    emissiveIntensity: 0.1,
    roughness: 0.34,
    metalness: 0.1
  });

  function createRoundedRectangleGeometry(width, height, depth, radius) {
    if (!THREE.Shape || !THREE.ExtrudeGeometry) {
      return new THREE.BoxGeometry(width, height, depth, 4, 4, 1);
    }

    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const corner = Math.min(radius, halfWidth, halfHeight);
    const shape = new THREE.Shape();

    shape.moveTo(-halfWidth + corner, -halfHeight);
    shape.lineTo(halfWidth - corner, -halfHeight);
    shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + corner);
    shape.lineTo(halfWidth, halfHeight - corner);
    shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - corner, halfHeight);
    shape.lineTo(-halfWidth + corner, halfHeight);
    shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - corner);
    shape.lineTo(-halfWidth, -halfHeight + corner);
    shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + corner, -halfHeight);

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSize: 0.025,
      bevelThickness: 0.022,
      bevelSegments: 5
    });

    geometry.center();
    return geometry;
  }

  function createPaintStrokeGeometry(width, height) {
    if (!THREE.Shape || !THREE.ShapeGeometry) {
      return new THREE.PlaneGeometry(width, height);
    }

    const radius = height / 2;
    const shape = new THREE.Shape();
    shape.moveTo(radius, -radius);
    shape.lineTo(width - radius, -radius);
    shape.quadraticCurveTo(width, -radius, width, 0);
    shape.quadraticCurveTo(width, radius, width - radius, radius);
    shape.lineTo(radius, radius);
    shape.quadraticCurveTo(0, radius, 0, 0);
    shape.quadraticCurveTo(0, -radius, radius, -radius);
    return new THREE.ShapeGeometry(shape, 32);
  }

  function createLabelTexture() {
    if (!THREE.CanvasTexture) return null;

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext("2d");

    if (!context) return null;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(255, 255, 255, 0.96)";
    context.strokeStyle = "rgba(192, 24, 102, 0.28)";
    context.lineWidth = 8;

    context.beginPath();
    if (typeof context.roundRect === "function") {
      context.roundRect(28, 30, 456, 196, 38);
    } else {
      context.moveTo(66, 30);
      context.lineTo(446, 30);
      context.quadraticCurveTo(484, 30, 484, 68);
      context.lineTo(484, 188);
      context.quadraticCurveTo(484, 226, 446, 226);
      context.lineTo(66, 226);
      context.quadraticCurveTo(28, 226, 28, 188);
      context.lineTo(28, 68);
      context.quadraticCurveTo(28, 30, 66, 30);
    }
    context.fill();
    context.stroke();

    context.direction = "rtl";
    context.textAlign = "center";
    context.fillStyle = "#c01866";
    context.font = "700 58px Arial";
    context.fillText("מסודרות", 256, 116);
    context.fillStyle = "#97174e";
    context.font = "600 30px Arial";
    context.fillText("לק ג'ל", 256, 160);
    context.fillStyle = "#f5c86b";
    context.fillRect(172, 184, 168, 8);

    const texture = new THREE.CanvasTexture(canvas);
    if ("colorSpace" in texture && THREE.SRGBColorSpace) {
      texture.colorSpace = THREE.SRGBColorSpace;
    }
    texture.needsUpdate = true;
    return texture;
  }

  function addBottle() {
    const body = new THREE.Mesh(createRoundedRectangleGeometry(1.14, 1.58, 0.58, 0.18), glass);
    body.position.set(-0.9, 0.05, 0);
    bottleGroup.add(body);

    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(body.geometry),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.48 })
    );
    body.add(outline);

    const liquidCore = new THREE.Mesh(createRoundedRectangleGeometry(0.86, 0.88, 0.46, 0.12), polish);
    liquidCore.position.set(-0.9, -0.24, 0.035);
    bottleGroup.add(liquidCore);

    const liquidGlow = new THREE.Mesh(createRoundedRectangleGeometry(0.66, 0.5, 0.03, 0.08), hotPink);
    liquidGlow.position.set(-0.9, -0.36, 0.288);
    liquidGlow.material = hotPink.clone();
    liquidGlow.material.transparent = true;
    liquidGlow.material.opacity = 0.72;
    bottleGroup.add(liquidGlow);

    const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.5, 0.26, 36), glass);
    shoulder.position.set(-0.9, 0.88, 0);
    bottleGroup.add(shoulder);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.25, 0.32, 36), pearl);
    neck.position.set(-0.9, 1.14, 0);
    bottleGroup.add(neck);

    const labelTexture = createLabelTexture();
    const labelMaterial = labelTexture
      ? new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true })
      : pearl;
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.42), labelMaterial);
    label.position.set(-0.9, 0.02, 0.324);
    bottleGroup.add(label);

    const highlight = new THREE.Mesh(new THREE.BoxGeometry(0.045, 1.08, 0.018), pearl);
    highlight.material = pearl.clone();
    highlight.material.transparent = true;
    highlight.material.opacity = 0.56;
    highlight.position.set(-1.27, 0.05, 0.322);
    bottleGroup.add(highlight);
  }

  function addCapAndBrush() {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.34, 0.92, 48), capMaterial);
    cap.position.set(0, 0, 0);
    capGroup.add(cap);

    [-0.22, 0.04, 0.28].forEach((y) => {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.333, 0.018, 12, 72), gold);
      band.position.set(0, y, 0);
      band.rotation.x = Math.PI / 2;
      capGroup.add(band);
    });

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 1.38, 24), pearl);
    stem.position.set(0, -0.94, 0.02);
    capGroup.add(stem);

    const bristles = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.34, 28), polish);
    bristles.position.set(0, -1.73, 0.02);
    bristles.scale.set(0.8, 1, 0.44);
    capGroup.add(bristles);

    capGroup.position.set(-0.9, 1.54, 0.02);

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.7, 28), pearl);
    handle.rotation.set(0.16, 0, -0.78);
    brushGroup.add(handle);

    const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.095, 0.28, 24), gold);
    ferrule.position.set(0.56, -0.56, 0.02);
    ferrule.rotation.set(0.16, 0, -0.78);
    brushGroup.add(ferrule);

    brushTip = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.38, 28), polish);
    brushTip.position.set(0.76, -0.84, 0.04);
    brushTip.rotation.set(0.16, 0, -0.78);
    brushTip.scale.set(0.86, 1, 0.45);
    brushGroup.add(brushTip);

    polishDrop = new THREE.Mesh(new THREE.SphereGeometry(0.12, 28, 28), polish);
    polishDrop.position.set(0.84, -1.04, 0.08);
    polishDrop.scale.set(0.7, 1.04, 0.7);
    brushGroup.add(polishDrop);
  }

  function createNailGeometry() {
    if (THREE.Shape && THREE.ExtrudeGeometry) {
      const shape = new THREE.Shape();
      shape.moveTo(-1.22, -0.42);
      shape.bezierCurveTo(-1.18, -0.9, -0.55, -1.08, 0, -1.05);
      shape.bezierCurveTo(0.62, -1.05, 1.22, -0.86, 1.26, -0.42);
      shape.bezierCurveTo(1.34, 0.28, 0.62, 0.58, 0, 0.6);
      shape.bezierCurveTo(-0.68, 0.58, -1.34, 0.28, -1.22, -0.42);
      return new THREE.ExtrudeGeometry(shape, {
        depth: 0.06,
        bevelEnabled: true,
        bevelSize: 0.025,
        bevelThickness: 0.018,
        bevelSegments: 8
      });
    }

    return new THREE.SphereGeometry(1, 48, 48);
  }

  function addNailAndPaint() {
    const nailBase = new THREE.Mesh(createNailGeometry(), nailBaseMaterial);
    nailBase.position.set(0.55, -1.22, 0.06);
    nailBase.rotation.set(0.12, -0.16, -0.03);
    nailBase.scale.set(0.9, 0.46, 0.58);
    nailGroup.add(nailBase);

    const strokeGeometry = createPaintStrokeGeometry(2.18, 0.4);
    const paintTrack = new THREE.Mesh(strokeGeometry, pearl);
    paintTrack.material = pearl.clone();
    paintTrack.material.transparent = true;
    paintTrack.material.opacity = 0.28;
    paintTrack.position.set(-0.54, -1.2, 0.14);
    paintTrack.rotation.z = -0.03;
    nailGroup.add(paintTrack);

    paintFill = new THREE.Mesh(strokeGeometry.clone(), polish);
    paintFill.position.set(-0.54, -1.2, 0.18);
    paintFill.rotation.z = -0.03;
    paintFill.scale.set(0.001, 1, 1);
    nailGroup.add(paintFill);

    const shine = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.035, 0.02), pearl);
    shine.material = pearl.clone();
    shine.material.transparent = true;
    shine.material.opacity = 0.68;
    shine.position.set(0.08, -1.02, 0.21);
    shine.rotation.z = -0.03;
    nailGroup.add(shine);
  }

  function addSparkles() {
    const materials = [pearl, hotPink, gold, violet];
    const geometry = new THREE.SphereGeometry(0.055, 16, 16);

    for (let i = 0; i < 34; i += 1) {
      const sparkle = new THREE.Mesh(geometry, materials[i % materials.length]);
      const angle = i * 0.78;
      const radius = 1.6 + (i % 5) * 0.22;
      const base = new THREE.Vector3(
        Math.cos(angle) * radius - 0.15,
        Math.sin(i * 1.19) * 1.12 - 0.15,
        Math.sin(angle) * radius * 0.24
      );
      sparkle.position.copy(base);
      sparkle.userData.base = base;
      sparkle.userData.phase = i * 0.55;
      sparkle.scale.setScalar(0.6 + (i % 4) * 0.12);
      sparkleGroup.add(sparkle);
      sparkles.push(sparkle);
    }

    const orbit = new THREE.Mesh(new THREE.TorusGeometry(2.08, 0.025, 16, 160), glass);
    orbit.rotation.set(1.32, 0.1, -0.22);
    sparkleGroup.add(orbit);
  }

  addBottle();
  addCapAndBrush();
  addNailAndPaint();
  addSparkles();

  scene.add(new THREE.AmbientLight(0xffe8f4, 1.32));

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
  keyLight.position.set(-3.2, 4.4, 5.6);
  scene.add(keyLight);

  const pinkLight = new THREE.PointLight(0xff4fa3, 58, 18);
  pinkLight.position.set(-3.2, -1.2, 3.6);
  scene.add(pinkLight);

  const violetLight = new THREE.PointLight(0xa78bfa, 34, 16);
  violetLight.position.set(3.2, 2.2, 3);
  scene.add(violetLight);

  const pointerLight = new THREE.PointLight(0xffd6e8, 22, 10);
  scene.add(pointerLight);

  function updateScrollProgress() {
    const scrollRange = Math.max(1, window.innerHeight * 0.86);
    targetScroll = THREE.MathUtils.clamp(window.scrollY / scrollRange, 0, 1);
  }

  function resize() {
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    const scale = width < 680 ? 0.82 : width < 1040 ? 0.92 : 1;
    root.scale.setScalar(scale);
    root.position.set(width < 760 ? 0.02 : width < 1040 ? -0.62 : -2.08, width < 760 ? -0.24 : -0.02, 0);
    updateScrollProgress();
  }

  function updatePointer(clientX, clientY) {
    const rect = container.getBoundingClientRect();
    const x = ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
    const y = -(((clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1);
    pointer.x = THREE.MathUtils.clamp(x, -1, 1);
    pointer.y = THREE.MathUtils.clamp(y, -1, 1);
  }

  function handlePointerMove(event) {
    updatePointer(event.clientX, event.clientY);
  }

  function handleTouch(event) {
    const touch = event.touches?.[0];
    if (touch) updatePointer(touch.clientX, touch.clientY);
  }

  function render() {
    const elapsed = clock.getElapsedTime();
    scrollProgress += (targetScroll - scrollProgress) * (reduceMotion ? 0.18 : 0.075);
    easedPointer.x += (pointer.x - easedPointer.x) * 0.08;
    easedPointer.y += (pointer.y - easedPointer.y) * 0.08;

    const open = THREE.MathUtils.smoothstep(scrollProgress, 0, 0.58);
    const paint = THREE.MathUtils.smoothstep(scrollProgress, 0.22, 1);
    const drift = reduceMotion ? 0 : elapsed;

    capGroup.position.set(-0.9 + open * 0.92, 1.54 + open * 0.52, 0.02 + open * 0.12);
    capGroup.rotation.set(-open * 0.14, open * 0.2, -open * 0.68 + easedPointer.x * 0.08);

    brushGroup.position.set(-1.28 + paint * 2.12, 0.42 - paint * 1.05 + easedPointer.y * 0.04, 0.18);
    brushGroup.rotation.set(0.1, easedPointer.x * 0.08, -0.55 + paint * 0.22 + Math.sin(drift * 1.1) * (reduceMotion ? 0 : 0.02));
    brushGroup.visible = open > 0.2;

    paintFill.scale.x = Math.max(0.001, paint);
    paintFill.material.opacity = 0.78 + paint * 0.22;

    if (polishDrop) {
      polishDrop.scale.setScalar(0.75 + paint * 0.34);
      polishDrop.visible = paint > 0.08;
    }

    root.rotation.y = easedPointer.x * 0.28 + Math.sin(drift * 0.28) * 0.045;
    root.rotation.x = -easedPointer.y * 0.14 + Math.sin(drift * 0.22) * 0.025;
    bottleGroup.rotation.z = Math.sin(drift * 0.45) * (reduceMotion ? 0 : 0.018);
    nailGroup.rotation.z = -0.02 + easedPointer.x * 0.035;

    sparkleGroup.rotation.y = -elapsed * (reduceMotion ? 0.01 : 0.06) + easedPointer.x * 0.12;
    sparkles.forEach((sparkle) => {
      const pulse = 0.86 + Math.sin(elapsed * 1.7 + sparkle.userData.phase) * (reduceMotion ? 0.04 : 0.16);
      sparkle.scale.setScalar(pulse * 0.86);
      sparkle.position.y = sparkle.userData.base.y + Math.sin(elapsed + sparkle.userData.phase) * (reduceMotion ? 0.01 : 0.04);
    });

    pointerLight.position.set(easedPointer.x * 2.4, easedPointer.y * 1.4, 3.5);
    pointerLight.intensity = 18 + Math.abs(easedPointer.x) * 10 + paint * 8;

    camera.position.x = easedPointer.x * 0.32;
    camera.position.y = 0.05 + easedPointer.y * 0.18;
    camera.lookAt(0, -0.05, 0);

    renderer.render(scene, camera);
    window.requestAnimationFrame(render);
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("touchstart", handleTouch, { passive: true });
  window.addEventListener("touchmove", handleTouch, { passive: true });

  if (typeof reduceMotionQuery.addEventListener === "function") {
    reduceMotionQuery.addEventListener("change", (event) => {
      reduceMotion = event.matches;
    });
  }

  window.mesudarotHeroScene = {
    getState: () => ({
      pointer: { ...pointer },
      scrollProgress,
      capOpen: THREE.MathUtils.smoothstep(scrollProgress, 0, 0.58),
      paintProgress: THREE.MathUtils.smoothstep(scrollProgress, 0.22, 1)
    })
  };

  resize();
  updateScrollProgress();
  container.classList.add("scene-ready");
  render();
})();
