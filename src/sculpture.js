import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const stage = document.querySelector('#sculpture-stage');
const canvas = document.querySelector('#sculpture-canvas');
function fallback() {
  canvas.hidden = true;
  const poster = stage.querySelector('.sculpture-poster');
  if (poster) poster.hidden = false;
  stage.querySelector('.sculpture-fallback').hidden = !!poster;
  stage.dataset.renderer = 'fallback';
  document.querySelector('.sculpture-controls').hidden = true;
}
function initializeSculpture() {
try {
  const compact = matchMedia('(max-width: 700px)').matches || navigator.connection?.saveData === true;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, compact ? 1.15 : 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 50);
  camera.position.set(0, .5, 8.4);
  camera.lookAt(0, 0, 0);

  const room = new RoomEnvironment();
  const bluePanel = new THREE.Mesh(new THREE.PlaneGeometry(5, 7), new THREE.MeshBasicMaterial({ color: 0x777cf5, side: THREE.DoubleSide }));
  bluePanel.position.set(-4, 1, 0); bluePanel.rotation.y = Math.PI / 2; room.add(bluePanel);
  const warmPanel = new THREE.Mesh(new THREE.PlaneGeometry(3, 5), new THREE.MeshBasicMaterial({ color: 0xffba87, side: THREE.DoubleSide }));
  warmPanel.position.set(4, 0, 0); warmPanel.rotation.y = -Math.PI / 2; room.add(warmPanel);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(room, .025);
  scene.environment = env.texture;
  room.dispose(); pmrem.dispose();

  const group = new THREE.Group(); scene.add(group);
  const material = new THREE.MeshPhysicalMaterial({ color: 0xe2e6ec, metalness: 1, roughness: .17, clearcoat: 1, clearcoatRoughness: .11, iridescence: .65, iridescenceIOR: 1.34, iridescenceThicknessRange: [100, 380], envMapIntensity: 1.1 });
  const sculpture = new THREE.Mesh(new THREE.TorusKnotGeometry(1.07, .38, compact ? 128 : 240, compact ? 24 : 48, 2, 3), material);
  sculpture.rotation.set(.3, -.22, -.4); sculpture.castShadow = true; sculpture.receiveShadow = true;
  group.add(sculpture);
  const orangeMaterial = new THREE.MeshPhysicalMaterial({ color: 0xff4e16, metalness: .55, roughness: .19, clearcoat: 1 });
  const orb = new THREE.Mesh(new THREE.SphereGeometry(.18, 32, 24), orangeMaterial);
  orb.position.set(1.7, 1.2, .5); orb.castShadow = true; group.add(orb);
  const miniOrb = new THREE.Mesh(new THREE.SphereGeometry(.08, 24, 16), material);
  miniOrb.position.set(-1.8, -.85, .2); group.add(miniOrb);
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(2.12, .004, 6, 160), new THREE.MeshBasicMaterial({ color: 0x9298a4, transparent: true, opacity: .4 }));
  orbit.rotation.set(1.25, -.3, .1); group.add(orbit);
  const light = new THREE.DirectionalLight(0xffffff, 4);
  light.position.set(-3, 7, 5); light.castShadow = true;
  light.shadow.mapSize.set(compact ? 512 : 1024, compact ? 512 : 1024); light.shadow.camera.left = -4; light.shadow.camera.right = 4;
  light.shadow.camera.top = 4; light.shadow.camera.bottom = -4; light.shadow.normalBias = .03;
  light.shadow.radius = 5; scene.add(light);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb7c0d8, 2));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ color: 0x52586a, opacity: .15 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -2.08; floor.receiveShadow = true; scene.add(floor);

  let pointerX = 0, pointerY = 0, dragX = 0, dragY = 0, targetX = 0, targetY = 0, down = false, lastX = 0, lastY = 0, visible = true;
  let elapsed = 0, previous = 0, lastRender = 0, dirty = true;
  let firstFrame = true, lastShadow = 0, shadowDirty = true, shadowGroupY = NaN, shadowOrbY = NaN;
  const frameInterval = 1000 / (compact ? 24 : 30), shadowInterval = compact ? 1000 / 12 : 1000 / 20;
  const shadowRotation = new THREE.Euler();
  const reduced = () => document.body.classList.contains('motion-off');
  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true; shadowDirty = true;
  };
  new ResizeObserver(resize).observe(stage); resize();
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; dirty = true; }).observe(stage);
  canvas.addEventListener('pointerdown', e => { down = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); canvas.classList.add('dragging'); });
  canvas.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    pointerX = (e.clientX - r.left) / r.width - .5; pointerY = (e.clientY - r.top) / r.height - .5;
    if (down) { dragY += (e.clientX - lastX) * .006; dragX += (e.clientY - lastY) * .006; lastX = e.clientX; lastY = e.clientY; }
    dirty = true;
  });
  const end = () => { down = false; canvas.classList.remove('dragging'); };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; dirty = true; });
  const palettes = { chrome: [0xe2e6ec, 1, .17, .65], orange: [0xff5a1f, .72, .22, 0], blue: [0x3348dd, .82, .19, .25] };
  document.querySelectorAll('[data-material]').forEach(button => button.addEventListener('click', () => {
    const [color, metalness, roughness, iridescence] = palettes[button.dataset.material];
    material.color.setHex(color); material.metalness = metalness; material.roughness = roughness; material.iridescence = iridescence;
    document.querySelectorAll('[data-material]').forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
    dirty = true;
  }));
  document.querySelector('.motion-toggle').addEventListener('click', () => { dirty = true; });
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = previous ? Math.min((now - previous) / 1000, .05) : 0; previous = now;
    if (canvas.hidden || !visible || document.hidden || document.querySelector('dialog[open]') || now - lastRender < frameInterval || (reduced() && !dirty && !down)) return;
    lastRender = now;
    if (!reduced() && !down) elapsed += dt;
    targetX += (pointerY * .12 + dragX - targetX) * .07;
    targetY += (pointerX * .22 + dragY - targetY) * .07;
    sculpture.rotation.x = .3 + targetX;
    sculpture.rotation.y = -.22 + targetY + elapsed * .095;
    sculpture.rotation.z = -.4 + (reduced() ? 0 : Math.sin(elapsed * .35) * .07);
    group.position.y = reduced() ? 0 : Math.sin(elapsed * .75) * .065;
    orb.position.y = 1.2 + (reduced() ? 0 : Math.sin(elapsed * .7) * .1);
    const shadowMoved = Math.abs(sculpture.rotation.x - shadowRotation.x) > .001 || Math.abs(sculpture.rotation.y - shadowRotation.y) > .001 || Math.abs(sculpture.rotation.z - shadowRotation.z) > .001 || Math.abs(group.position.y - shadowGroupY) > .001 || Math.abs(orb.position.y - shadowOrbY) > .001;
    // Reuse static shadows; moving geometry refreshes them at a lower rate.
    if (shadowDirty || (shadowMoved && now - lastShadow >= shadowInterval)) {
      renderer.shadowMap.needsUpdate = true;
      shadowRotation.copy(sculpture.rotation); shadowGroupY = group.position.y; shadowOrbY = orb.position.y;
      lastShadow = now; shadowDirty = false;
    }
    renderer.render(scene, camera); dirty = false;
    if (firstFrame) {
      firstFrame = false; stage.dataset.renderer = 'webgl';
      const poster = stage.querySelector('.sculpture-poster');
      if (poster) poster.hidden = true;
    }
  }
  requestAnimationFrame(frame);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); fallback(); });
} catch (error) { fallback(); console.warn('3D preview unavailable', error.message); }
}
window.addEventListener('sculpture-mount', initializeSculpture, { once: true });
