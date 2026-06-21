/* =================================================================
   Tesseract Visualizer — app.js
   · Projeção 4D → 3D perspectiva
   · Rotação combinada XY·XW·YZ·ZW
   · Shadow projection opcional
   · Matrix display ao vivo
   ================================================================= */

/* ── Renderer ─────────────────────────────────────────────────── */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 1);
document.body.appendChild(renderer.domElement);

/* ── Scene / Camera ───────────────────────────────────────────── */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.z = 2.8;

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ── 4D Math ──────────────────────────────────────────────────── */
let angle = 0;

function getRotMatrix(a) {
  const c = Math.cos(a),
    s = Math.sin(a);
  const mul = (A, B) => {
    const R = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++)
        for (let k = 0; k < 4; k++) R[i][j] += A[i][k] * B[k][j];
    return R;
  };
  const Rxy = [
    [c, -s, 0, 0],
    [s, c, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];
  const Rxw = [
    [c, 0, 0, -s],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [s, 0, 0, c],
  ];
  const Ryz = [
    [1, 0, 0, 0],
    [0, c, -s, 0],
    [0, s, c, 0],
    [0, 0, 0, 1],
  ];
  const Rzw = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, c, -s],
    [0, 0, s, c],
  ];
  return mul(Rzw, mul(Ryz, mul(Rxw, Rxy)));
}

function applyMatrix4D(v, M) {
  const [x, y, z, w] = v;
  return [
    M[0][0] * x + M[0][1] * y + M[0][2] * z + M[0][3] * w,
    M[1][0] * x + M[1][1] * y + M[1][2] * z + M[1][3] * w,
    M[2][0] * x + M[2][1] * y + M[2][2] * z + M[2][3] * w,
    M[3][0] * x + M[3][1] * y + M[3][2] * z + M[3][3] * w,
  ];
}

function project4Dto3D(v) {
  const d = 3,
    f = 1 / (d - v[3]);
  return [v[0] * f, v[1] * f, v[2] * f];
}

/* ── Tesseract geometry ───────────────────────────────────────── */
function buildTesseract() {
  const S = 1.2,
    verts = [];
  for (let x of [-S, S])
    for (let y of [-S, S])
      for (let z of [-S, S]) for (let w of [-S, S]) verts.push([x, y, z, w]);

  const edges = [];
  for (let i = 0; i < verts.length; i++)
    for (let j = i + 1; j < verts.length; j++) {
      let diff = 0;
      for (let k = 0; k < 4; k++) if (verts[i][k] !== verts[j][k]) diff++;
      if (diff === 1) edges.push([i, j]);
    }
  return { verts, edges };
}

/* ── Build scene objects ──────────────────────────────────────── */
const COLOR = 0x00ffff;
const { verts, edges } = buildTesseract();
const nFloats = edges.length * 2 * 3;

// Main edges
const mainGeo = new THREE.BufferGeometry();
const mainPos = new Float32Array(nFloats);
const mainAttr = new THREE.BufferAttribute(mainPos, 3);
mainAttr.setUsage(THREE.DynamicDrawUsage);
mainGeo.setAttribute("position", mainAttr);
mainGeo.setDrawRange(0, edges.length * 2);
const mainLines = new THREE.LineSegments(
  mainGeo,
  new THREE.LineBasicMaterial({ color: COLOR }),
);
mainLines.frustumCulled = false;
scene.add(mainLines);

// Shadow
const shadowGeo = new THREE.BufferGeometry();
const shadowPos = new Float32Array(nFloats);
const shadowAttr = new THREE.BufferAttribute(shadowPos, 3);
shadowAttr.setUsage(THREE.DynamicDrawUsage);
shadowGeo.setAttribute("position", shadowAttr);
shadowGeo.setDrawRange(0, edges.length * 2);
const shadowLines = new THREE.LineSegments(
  shadowGeo,
  new THREE.LineBasicMaterial({
    color: COLOR,
    transparent: true,
    opacity: 0.25,
  }),
);
shadowLines.frustumCulled = false;
shadowLines.visible = false;
scene.add(shadowLines);

/* ── Shadow toggle ────────────────────────────────────────────── */
let shadowMode = false;
document.getElementById("btn-shadow").addEventListener("click", (e) => {
  shadowMode = !shadowMode;
  e.target.textContent = shadowMode ? "ON" : "OFF";
  e.target.classList.toggle("active", shadowMode);
  shadowLines.visible = shadowMode;
});

/* ── Matrix display ───────────────────────────────────────────── */
function updateMatrixDisplay(M) {
  const fmt = (n) => (n >= 0 ? " " : "") + n.toFixed(2);
  document.getElementById("matrix-display").textContent = M.map(
    (row) => "[ " + row.map(fmt).join("  ") + " ]",
  ).join("\n");
}

/* ── Animate ──────────────────────────────────────────────────── */
function animate() {
  requestAnimationFrame(animate);
  angle += 0.01;

  const M = getRotMatrix(angle);
  updateMatrixDisplay(M);

  const rot4D = verts.map((v) => applyMatrix4D(v, M));
  const proj3D = rot4D.map((v) => project4Dto3D(v));

  let pi = 0;
  edges.forEach(([ei, ej]) => {
    const a = proj3D[ei],
      b = proj3D[ej];
    mainPos[pi++] = a[0];
    mainPos[pi++] = a[1];
    mainPos[pi++] = a[2];
    mainPos[pi++] = b[0];
    mainPos[pi++] = b[1];
    mainPos[pi++] = b[2];
  });
  mainGeo.attributes.position.needsUpdate = true;

  if (shadowMode) {
    let si = 0;
    edges.forEach(([ei, ej]) => {
      const a = project4Dto3D([rot4D[ei][0], rot4D[ei][1], rot4D[ei][2], 0]);
      const b = project4Dto3D([rot4D[ej][0], rot4D[ej][1], rot4D[ej][2], 0]);
      shadowPos[si++] = a[0];
      shadowPos[si++] = -1.2;
      shadowPos[si++] = a[2];
      shadowPos[si++] = b[0];
      shadowPos[si++] = -1.2;
      shadowPos[si++] = b[2];
    });
    shadowGeo.attributes.position.needsUpdate = true;
  }

  renderer.render(scene, camera);
}

animate();
