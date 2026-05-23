(function () {
  const THREE = window.THREE;
  const container = document.querySelector("#hero-scene");
  const i18n = window.MesudarotI18n;

  if (!container) return;

  if (!THREE) {
    container.classList.add("hero-scene-fallback");
    return;
  }

  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const a11ySettingsKey = "mesudarotA11ySettings";
  const pointer = { x: 0, y: 0 };
  const easedPointer = { x: 0, y: 0 };
  const clock = new THREE.Clock();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(47, 1, 0.1, 80);
  const root = new THREE.Group();
  const vanityGroup = new THREE.Group();
  const productGroup = new THREE.Group();
  const brushGroup = new THREE.Group();
  const floatGroup = new THREE.Group();
  const floaters = [];
  const shinePieces = [];

  let renderer;
  let reduceMotion = reduceMotionQuery.matches || getStoredReduceMotionSetting();
  let sceneDirectionSign = getDirectionSign();
  let heroWidth = 1;
  let targetScroll = 0;
  let scrollProgress = 0;
  let isRunning = true;

  function getStoredReduceMotionSetting() {
    try {
      const settings = JSON.parse(window.localStorage.getItem(a11ySettingsKey) || "{}");
      return Boolean(settings["reduce-motion"]);
    } catch (error) {
      return false;
    }
  }

  function getDirectionSign() {
    return document.documentElement.dir === "ltr" ? 1 : -1;
  }

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

  renderer.setClearColor(0x000000, 0);

  if ("outputColorSpace" in renderer && THREE.SRGBColorSpace) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  } else if ("outputEncoding" in renderer && THREE.sRGBEncoding) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }

  if ("toneMapping" in renderer && THREE.ACESFilmicToneMapping) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
  }

  renderer.domElement.setAttribute("role", "img");
  renderer.domElement.tabIndex = -1;
  container.appendChild(renderer.domElement);

  scene.add(root);
  root.add(vanityGroup, productGroup, brushGroup, floatGroup);
  camera.position.set(0, 0.08, 8.7);

  const materials = createMaterials();
  const geometries = createGeometries();

  addVanityMirror();
  addBeautyProducts();
  addBrushAndTowel();
  addFloatingAccents();
  addLights();
  updateCanvasLabel();

  i18n?.ready?.then(() => {
    updateCanvasLabel();
    syncDirection();
  });

  window.addEventListener("mesudarot:language-change", () => {
    updateCanvasLabel();
    syncDirection();
  });

  function createMaterials() {
    const roseGold = new THREE.MeshStandardMaterial({
      color: 0xe0a26e,
      roughness: 0.26,
      metalness: 0.52
    });

    const deepRose = new THREE.MeshStandardMaterial({
      color: 0xc01866,
      emissive: 0x3a071d,
      emissiveIntensity: 0.12,
      roughness: 0.34,
      metalness: 0.08
    });

    const softPink = new THREE.MeshPhysicalMaterial({
      color: 0xffb7cf,
      emissive: 0x30111f,
      emissiveIntensity: 0.05,
      roughness: 0.22,
      metalness: 0.02,
      clearcoat: 1,
      clearcoatRoughness: 0.12
    });

    const cream = new THREE.MeshStandardMaterial({
      color: 0xffedf5,
      roughness: 0.44,
      metalness: 0.02
    });

    const glass = new THREE.MeshPhysicalMaterial({
      color: 0xfff8fb,
      transparent: true,
      opacity: 0.46,
      roughness: 0.04,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.04
    });

    const mirror = new THREE.MeshPhysicalMaterial({
      color: 0xffe6f1,
      transparent: true,
      opacity: 0.52,
      roughness: 0.02,
      metalness: 0.18,
      clearcoat: 1,
      clearcoatRoughness: 0.04
    });

    const mirrorGlow = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
      depthWrite: false
    });

    const graphite = new THREE.MeshStandardMaterial({
      color: 0x170d15,
      roughness: 0.32,
      metalness: 0.28
    });

    const towel = new THREE.MeshStandardMaterial({
      color: 0xf9d7df,
      roughness: 0.68,
      metalness: 0.01
    });

    const shadow = new THREE.MeshBasicMaterial({
      color: 0x160d17,
      transparent: true,
      opacity: 0.24,
      depthWrite: false
    });

    const shimmer = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.52,
      depthWrite: false
    });

    return {
      roseGold,
      deepRose,
      softPink,
      cream,
      glass,
      mirror,
      mirrorGlow,
      graphite,
      towel,
      shadow,
      shimmer
    };
  }

  function createGeometries() {
    return {
      shelf: createRoundedRectangleGeometry(3.24, 0.28, 0.12, 0.14),
      mirrorGlass: new THREE.CircleGeometry(1, 72),
      mirrorRim: new THREE.TorusGeometry(1, 0.038, 14, 128),
      mirrorLight: new THREE.TorusGeometry(1.08, 0.012, 10, 128),
      bottle: new THREE.CylinderGeometry(0.24, 0.3, 1.08, 40),
      bottleLiquid: new THREE.CylinderGeometry(0.22, 0.27, 0.62, 40),
      pump: new THREE.CylinderGeometry(0.065, 0.07, 0.24, 24),
      spout: new THREE.BoxGeometry(0.34, 0.045, 0.045),
      jar: new THREE.CylinderGeometry(0.42, 0.44, 0.34, 48),
      jarLid: new THREE.CylinderGeometry(0.45, 0.45, 0.16, 48),
      towelRoll: new THREE.CylinderGeometry(0.28, 0.28, 1.0, 40),
      brushHandle: new THREE.CylinderGeometry(0.04, 0.04, 1.42, 26),
      brushFerrule: new THREE.CylinderGeometry(0.1, 0.12, 0.26, 24),
      brushBristles: new THREE.ConeGeometry(0.22, 0.42, 32),
      pearl: new THREE.SphereGeometry(0.06, 18, 18),
      softDrop: new THREE.SphereGeometry(0.12, 22, 22),
      shadow: new THREE.SphereGeometry(1, 48, 18)
    };
  }

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
      bevelThickness: 0.018,
      bevelSegments: 5
    });

    geometry.center();
    return geometry;
  }

  function addVanityMirror() {
    const mirrorGlass = new THREE.Mesh(geometries.mirrorGlass, materials.mirror);
    mirrorGlass.position.set(-0.42, 0.18, -0.28);
    mirrorGlass.scale.set(0.84, 1.18, 1);
    vanityGroup.add(mirrorGlass);

    const rim = new THREE.Mesh(geometries.mirrorRim, materials.roseGold);
    rim.position.copy(mirrorGlass.position);
    rim.scale.set(0.84, 1.18, 1);
    vanityGroup.add(rim);

    const lightRing = new THREE.Mesh(geometries.mirrorLight, materials.mirrorGlow);
    lightRing.position.set(-0.42, 0.18, -0.255);
    lightRing.scale.set(0.84, 1.18, 1);
    vanityGroup.add(lightRing);
    shinePieces.push(lightRing);

    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.86, 24), materials.roseGold);
    stand.position.set(-0.42, -1.08, -0.28);
    vanityGroup.add(stand);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.6, 0.1, 48), materials.roseGold);
    base.position.set(-0.42, -1.56, -0.28);
    vanityGroup.add(base);

    const reflection = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.04), materials.shimmer.clone());
    reflection.material.opacity = 0.42;
    reflection.position.set(-0.72, 0.46, -0.22);
    reflection.rotation.z = -0.45;
    vanityGroup.add(reflection);
    shinePieces.push(reflection);
  }

  function addBeautyProducts() {
    const shadow = new THREE.Mesh(geometries.shadow, materials.shadow);
    shadow.position.set(0.36, -1.62, -0.42);
    shadow.scale.set(1.72, 0.22, 0.06);
    productGroup.add(shadow);

    const shelf = new THREE.Mesh(geometries.shelf, materials.cream);
    shelf.position.set(0.3, -1.48, -0.36);
    shelf.rotation.z = -0.02;
    productGroup.add(shelf);

    const serum = new THREE.Group();
    serum.position.set(0.5, -0.84, 0.02);

    const bottle = new THREE.Mesh(geometries.bottle, materials.glass);
    serum.add(bottle);

    const liquid = new THREE.Mesh(geometries.bottleLiquid, materials.softPink);
    liquid.position.y = -0.2;
    serum.add(liquid);

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.12, 32), materials.roseGold);
    collar.position.y = 0.58;
    serum.add(collar);

    const pump = new THREE.Mesh(geometries.pump, materials.roseGold);
    pump.position.y = 0.76;
    serum.add(pump);

    const spout = new THREE.Mesh(geometries.spout, materials.roseGold);
    spout.position.set(0.16, 0.88, 0);
    serum.add(spout);

    const label = new THREE.Mesh(createRoundedRectangleGeometry(0.38, 0.22, 0.012, 0.045), materials.cream);
    label.position.set(0, -0.08, 0.31);
    serum.add(label);

    serum.rotation.set(0.02, -0.18, -0.03);
    productGroup.add(serum);

    const jar = new THREE.Group();
    jar.position.set(1.12, -1.16, 0.08);

    const jarBody = new THREE.Mesh(geometries.jar, materials.glass);
    jar.add(jarBody);

    const jarCream = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.37, 0.18, 44), materials.softPink);
    jarCream.position.y = -0.04;
    jar.add(jarCream);

    const jarLid = new THREE.Mesh(geometries.jarLid, materials.roseGold);
    jarLid.position.y = 0.25;
    jar.add(jarLid);

    const jarHighlight = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.025, 0.012), materials.shimmer.clone());
    jarHighlight.material.opacity = 0.34;
    jarHighlight.position.set(-0.04, 0.02, 0.42);
    jarHighlight.rotation.z = -0.08;
    jar.add(jarHighlight);
    shinePieces.push(jarHighlight);

    productGroup.add(jar);
  }

  function addBrushAndTowel() {
    const towel = new THREE.Mesh(geometries.towelRoll, materials.towel);
    towel.position.set(-0.9, -1.37, 0.04);
    towel.rotation.set(0, 0, Math.PI / 2);
    brushGroup.add(towel);

    const towelEdgeA = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.012, 10, 48), materials.cream);
    towelEdgeA.position.set(-1.4, -1.37, 0.04);
    towelEdgeA.rotation.y = Math.PI / 2;
    brushGroup.add(towelEdgeA);

    const towelEdgeB = towelEdgeA.clone();
    towelEdgeB.position.x = -0.4;
    brushGroup.add(towelEdgeB);

    const handle = new THREE.Mesh(geometries.brushHandle, materials.graphite);
    handle.position.set(0.0, -1.15, 0.26);
    handle.rotation.set(0.18, 0, -0.92);
    brushGroup.add(handle);

    const ferrule = new THREE.Mesh(geometries.brushFerrule, materials.roseGold);
    ferrule.position.set(0.46, -1.56, 0.28);
    ferrule.rotation.set(0.18, 0, -0.92);
    brushGroup.add(ferrule);

    const bristles = new THREE.Mesh(geometries.brushBristles, materials.deepRose);
    bristles.position.set(0.7, -1.78, 0.28);
    bristles.rotation.set(Math.PI + 0.18, 0, -0.92);
    bristles.scale.set(0.78, 1, 0.58);
    brushGroup.add(bristles);
  }

  function addFloatingAccents() {
    const accents = [
      { x: -1.36, y: 1.2, z: -0.05, s: 0.44, material: materials.cream, phase: 0.1 },
      { x: 0.92, y: 1.2, z: 0.26, s: 0.34, material: materials.roseGold, phase: 0.9 },
      { x: 1.5, y: 0.36, z: 0.18, s: 0.46, material: materials.softPink, phase: 1.7 },
      { x: -1.62, y: -0.34, z: 0.16, s: 0.36, material: materials.deepRose, phase: 2.6 },
      { x: 1.62, y: -0.7, z: -0.04, s: 0.3, material: materials.cream, phase: 3.4 },
      { x: -0.05, y: 1.52, z: 0.04, s: 0.26, material: materials.roseGold, phase: 4.2 }
    ];

    accents.forEach((definition, index) => {
      const geometry = index % 2 ? geometries.pearl : geometries.softDrop;
      const accent = new THREE.Mesh(geometry, definition.material);
      accent.position.set(definition.x, definition.y, definition.z);
      accent.scale.setScalar(definition.s);
      accent.userData.base = accent.position.clone();
      accent.userData.phase = definition.phase;
      accent.userData.spin = index % 2 ? -1 : 1;
      floatGroup.add(accent);
      floaters.push(accent);
    });
  }

  function addLights() {
    scene.add(new THREE.AmbientLight(0xffdcec, 0.86));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.65);
    keyLight.position.set(-3.2, 4.5, 5.6);
    scene.add(keyLight);

    const roseLight = new THREE.PointLight(0xff5fa6, 28, 16);
    roseLight.position.set(-2.7, -0.8, 3.2);
    scene.add(roseLight);

    const goldLight = new THREE.PointLight(0xffd28a, 18, 14);
    goldLight.position.set(2.5, 1.7, 3.2);
    scene.add(goldLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.74);
    rimLight.position.set(3.2, 2.8, -1.4);
    scene.add(rimLight);
  }

  function updateCanvasLabel() {
    renderer.domElement.setAttribute(
      "aria-label",
      i18n?.t("runtime.heroSceneCanvasLabel", container.getAttribute("aria-label") || "")
    );
  }

  function syncDirection() {
    sceneDirectionSign = getDirectionSign();
    resize();
  }

  function updateScrollProgress() {
    const scrollRange = Math.max(1, window.innerHeight * 0.9);
    targetScroll = THREE.MathUtils.clamp(window.scrollY / scrollRange, 0, 1);
  }

  function resize() {
    const rect = container.getBoundingClientRect();
    heroWidth = Math.max(1, rect.width);
    const heroHeight = Math.max(1, rect.height);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, heroWidth < 720 ? 1.35 : 1.65));
    renderer.setSize(heroWidth, heroHeight, false);

    camera.aspect = heroWidth / heroHeight;
    camera.fov = heroWidth < 720 ? 53 : heroWidth < 1040 ? 50 : 47;
    camera.position.z = heroWidth < 720 ? 9.1 : 8.55;
    camera.updateProjectionMatrix();

    const sign = sceneDirectionSign;
    const sceneScale = heroWidth < 520 ? 0.76 : heroWidth < 760 ? 0.84 : heroWidth < 1040 ? 0.94 : 1.08;
    const sceneX = heroWidth < 720 ? sign * 0.2 : heroWidth < 1040 ? sign * 1.18 : sign * 2.08;
    const sceneY = heroWidth < 720 ? 0.18 : heroWidth < 1040 ? 0.02 : -0.02;

    root.scale.setScalar(sceneScale);
    root.position.set(sceneX, sceneY, 0);
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

  function renderFrame() {
    const elapsed = clock.getElapsedTime();
    const drift = reduceMotion ? 0 : elapsed;

    if (reduceMotion) {
      easedPointer.x = 0;
      easedPointer.y = 0;
      scrollProgress = targetScroll;
    } else {
      easedPointer.x += (pointer.x - easedPointer.x) * 0.075;
      easedPointer.y += (pointer.y - easedPointer.y) * 0.075;
      scrollProgress += (targetScroll - scrollProgress) * 0.065;
    }

    const baseY = heroWidth < 720 ? 0.18 : heroWidth < 1040 ? 0.02 : -0.02;
    const scrollLift = scrollProgress * (heroWidth < 720 ? 0.1 : 0.2);
    const baseTurn = sceneDirectionSign * -0.15;

    root.rotation.y = baseTurn + easedPointer.x * 0.16 + Math.sin(drift * 0.22) * 0.028;
    root.rotation.x = -0.02 - easedPointer.y * 0.08 + Math.sin(drift * 0.18) * 0.014;
    root.position.y += baseY - scrollLift - root.position.y;

    vanityGroup.rotation.y = -0.08 + easedPointer.x * 0.04;
    productGroup.rotation.y = 0.08 + easedPointer.x * 0.055;
    brushGroup.rotation.z = Math.sin(drift * 0.35) * 0.012;
    floatGroup.rotation.y = -drift * 0.045 + easedPointer.x * 0.08;

    floaters.forEach((floater) => {
      const base = floater.userData.base;
      const phase = floater.userData.phase || 0;
      if (base) {
        floater.position.y = base.y + (reduceMotion ? 0 : Math.sin(elapsed * 0.86 + phase) * 0.052);
        floater.position.x = base.x + (reduceMotion ? 0 : Math.cos(elapsed * 0.56 + phase) * 0.026);
      }
      floater.rotation.y += reduceMotion ? 0 : 0.004 * (floater.userData.spin || 1);
    });

    shinePieces.forEach((piece, index) => {
      piece.material.opacity = reduceMotion
        ? piece.material.opacity
        : 0.28 + Math.sin(elapsed * 1.2 + index * 0.72) * 0.1;
    });

    camera.position.x = easedPointer.x * 0.17;
    camera.position.y = 0.08 + easedPointer.y * 0.1;
    camera.lookAt(0, -0.02, 0);

    renderer.render(scene, camera);
  }

  function animate() {
    if (!isRunning) return;
    renderFrame();
    window.requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("touchstart", handleTouch, { passive: true });
  window.addEventListener("touchmove", handleTouch, { passive: true });

  if (typeof reduceMotionQuery.addEventListener === "function") {
    reduceMotionQuery.addEventListener("change", (event) => {
      reduceMotion = event.matches || getStoredReduceMotionSetting();
      renderFrame();
    });
  }

  window.addEventListener("mesudarot:a11y-change", (event) => {
    reduceMotion = reduceMotionQuery.matches || Boolean(event.detail?.settings?.["reduce-motion"]);
    renderFrame();
  });

  document.addEventListener("visibilitychange", () => {
    isRunning = !document.hidden;
    if (isRunning) animate();
  });

  window.mesudarotHeroScene = {
    getState: () => ({
      pointer: { ...pointer },
      direction: sceneDirectionSign === 1 ? "ltr" : "rtl",
      visualSide: sceneDirectionSign === 1 ? "right" : "left",
      model: "beauty-studio-vanity",
      scrollProgress
    })
  };

  resize();
  updateScrollProgress();
  container.classList.add("scene-ready");
  animate();
})();
