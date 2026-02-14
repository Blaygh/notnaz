/* app.js — Production-ready vanilla JS
   + scrollable viewer + drag-down-to-close gesture (mobile friendly)
*/

const $ = (sel) => document.querySelector(sel);

const audioGate = $("#audioGate");
const audioGateBtn = $("#audioGateBtn");
const bgMusic = $("#bgMusic");
const toggleMusicBtn = $("#toggleMusic");

const beginBtn = $("#beginBtn");
const secretBtn = $("#secretBtn");
const secretNote = $("#secretNote");
const jumpBtn = $("#jumpBtn");

const backToTopBtn = $("#backToTopBtn");
const toQuestionBtn = $("#toQuestionBtn");
const backToMomentsBtn = $("#backToMomentsBtn");
const restartBtn = $("#restartBtn");

const moments = $("#moments");
const viewer = $("#viewer");
const viewerImg = $("#viewerImg");
const viewerCaption = $("#viewerCaption");
const viewerClose = $("#viewerClose");

const yesBtn = $("#yesBtn");
const noBtn = $("#noBtn");
const answer = $("#answer");
const confettiBtn = $("#confettiBtn");
const copyBtn = $("#copyBtn");
const copyStatus = $("#copyStatus");

const canvas = $("#confetti");
const ctx = canvas?.getContext("2d", { alpha: true });

let confettiPieces = [];
let confettiAnimating = false;

// ---------- utilities ----------
function scrollToId(id) {
  const el = document.querySelector(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

// ---------- canvas sizing ----------
function setCanvasSize() {
  if (!canvas || !ctx) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", setCanvasSize);
setCanvasSize();

// ---------- audio ----------
function hideAudioGate() {
  if (!audioGate) return;
  audioGate.hidden = true;
  audioGate.style.display = "none";
  // iOS repaint nudge
  document.body.style.webkitTransform = "translateZ(0)";
  requestAnimationFrame(() => (document.body.style.webkitTransform = ""));
}

async function tryAutoplay() {
  if (!bgMusic) return;
  const src = bgMusic.querySelector("source")?.getAttribute("src");
  if (!src) return;

  bgMusic.loop = true;
  bgMusic.volume = 0.9;

  try {
    await bgMusic.play();
    toggleMusicBtn?.setAttribute("aria-pressed", "true");
    if (toggleMusicBtn) toggleMusicBtn.textContent = "♫ Music: On";
    hideAudioGate();
  } catch {
    if (audioGate) audioGate.hidden = false;
  }
}

audioGateBtn?.addEventListener("click", async () => {
  try {
    await bgMusic.play();
    toggleMusicBtn?.setAttribute("aria-pressed", "true");
    if (toggleMusicBtn) toggleMusicBtn.textContent = "♫ Music: On";
    hideAudioGate();
  } catch {
    alert("Tap again 💚 (some phones block the first try)");
  }
});

toggleMusicBtn?.addEventListener("click", async () => {
  if (!bgMusic) return;
  try {
    if (bgMusic.paused) {
      await bgMusic.play();
      toggleMusicBtn.setAttribute("aria-pressed", "true");
      toggleMusicBtn.textContent = "♫ Music: On";
    } else {
      bgMusic.pause();
      toggleMusicBtn.setAttribute("aria-pressed", "false");
      toggleMusicBtn.textContent = "♫ Music";
    }
  } catch {
    if (audioGate) audioGate.hidden = false;
  }
});

window.addEventListener("load", () => {
  tryAutoplay();
});

// ---------- navigation ----------
beginBtn?.addEventListener("click", () => scrollToId("#memories"));
jumpBtn?.addEventListener("click", () => scrollToId("#question"));
backToTopBtn?.addEventListener("click", () => scrollToId("#start"));
toQuestionBtn?.addEventListener("click", () => scrollToId("#question"));
backToMomentsBtn?.addEventListener("click", () => scrollToId("#memories"));

restartBtn?.addEventListener("click", () => {
  secretNote && (secretNote.hidden = true);
  answer && (answer.hidden = true);
  copyStatus && (copyStatus.textContent = "");
  if (noBtn) {
    noBtn.style.position = "";
    noBtn.style.left = "";
    noBtn.style.top = "";
    noBtn.style.zIndex = "";
  }
  scrollToId("#start");
});

// ---------- secret ----------
secretBtn?.addEventListener("click", () => {
  if (!secretNote) return;
  secretNote.hidden = !secretNote.hidden;
});

// ---------- viewer layout (scrollable) ----------
let viewerContent = null;

function ensureViewerLayout() {
  if (!viewer) return;

  // add drag hint (top)
  if (!viewer.querySelector(".drag-hint")) {
    const hint = document.createElement("div");
    hint.className = "drag-hint";
    viewer.insertBefore(hint, viewer.firstChild);
  }

  // wrap image + caption into viewer-content once
  if (viewer.querySelector(".viewer-content")) {
    viewerContent = viewer.querySelector(".viewer-content");
    return;
  }

  viewerContent = document.createElement("div");
  viewerContent.className = "viewer-content";

  if (viewerImg) viewerContent.appendChild(viewerImg);
  if (viewerCaption) viewerContent.appendChild(viewerCaption);

  viewer.appendChild(viewerContent);
}

function openViewer(src, caption) {
  ensureViewerLayout();
  if (!viewer || !viewerImg || !viewerCaption) return;

  viewerImg.src = src;
  viewerCaption.textContent = caption || "";

  viewer.hidden = false;
  viewer.setAttribute("aria-hidden", "false");

  // reset pull animation + scroll to top
  viewer.style.setProperty("--pull", "0px");
  viewer.scrollTop = 0;
}

function closeViewer() {
  if (!viewer || !viewerImg) return;
  viewer.hidden = true;
  viewer.setAttribute("aria-hidden", "true");
  viewerImg.src = "";
  viewer.style.setProperty("--pull", "0px");
}

// open from moments
moments?.addEventListener("click", (e) => {
  const btn = e.target.closest(".moment");
  if (!btn) return;

  const src = btn.getAttribute("data-src") || btn.querySelector("img")?.src;
  const caption = btn.getAttribute("data-caption") || "";
  if (src) openViewer(src, caption);
});

// close button
viewerClose?.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  closeViewer();
});

// ESC to close
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && viewer && !viewer.hidden) closeViewer();
});

// ---------- drag-down-to-close (while still scrollable) ----------
let dragActive = false;
let startY = 0;
let pull = 0;

function canStartDrag() {
  // only allow drag-to-close if viewer is scrolled to top
  return viewer && viewer.scrollTop <= 0;
}

viewer?.addEventListener("pointerdown", (e) => {
  if (!viewer || viewer.hidden) return;
  if (!canStartDrag()) return;

  // if they start dragging on caption text selection, ignore
  const inCaption = e.target.closest(".viewer-caption");
  if (inCaption) return;

  dragActive = true;
  startY = e.clientY;
  pull = 0;
  viewer.setPointerCapture?.(e.pointerId);
});

viewer?.addEventListener("pointermove", (e) => {
  if (!dragActive || !viewer) return;

  const dy = e.clientY - startY;
  if (dy <= 0) {
    pull = 0;
    viewer.style.setProperty("--pull", "0px");
    return;
  }

  // apply resistance
  pull = Math.min(dy, 220);
  const eased = pull * 0.65;

  viewer.style.setProperty("--pull", `${eased}px`);

  // prevent page “rubber band” while dragging
  e.preventDefault?.();
}, { passive: false });

viewer?.addEventListener("pointerup", () => {
  if (!dragActive || !viewer) return;
  dragActive = false;

  // threshold to close
  if (pull > 140) {
    closeViewer();
  } else {
    // snap back
    viewer.style.setProperty("--pull", "0px");
  }
});

viewer?.addEventListener("pointercancel", () => {
  if (!viewer) return;
  dragActive = false;
  viewer.style.setProperty("--pull", "0px");
});

// ---------- valentine buttons ----------
yesBtn?.addEventListener("click", () => {
  if (answer) answer.hidden = false;
  popConfetti(220);
});

let dodge = 0;
noBtn?.addEventListener("mouseenter", () => dodgeNo());
noBtn?.addEventListener("click", () => dodgeNo(true));

function dodgeNo(fromClick=false) {
  dodge = clamp(dodge + 1, 0, 6);

  const rect = noBtn.getBoundingClientRect();
  const pad = 14;
  const maxX = window.innerWidth - rect.width - pad;
  const maxY = window.innerHeight - rect.height - pad;

  const x = Math.random() * maxX;
  const y = Math.random() * maxY;

  noBtn.style.position = "fixed";
  noBtn.style.left = `${x}px`;
  noBtn.style.top = `${y}px`;
  noBtn.style.zIndex = "60";

  if (fromClick) popConfetti(40, true);
}

// ---------- copy ----------
copyBtn?.addEventListener("click", async () => {
  const msg = "Will you be my Valentine? 💚🌹";
  try {
    await navigator.clipboard.writeText(msg);
    if (copyStatus) copyStatus.textContent = "Copied 💚";
  } catch {
    if (copyStatus) copyStatus.textContent = "Couldn’t copy — screenshot works too 💚";
  }
});

// ---------- confetti ----------
confettiBtn?.addEventListener("click", () => popConfetti(180));

function popConfetti(count = 160, sparkle = false) {
  if (!ctx) return;

  const colors = sparkle
    ? ["#2ee59d", "#ff4d7d", "#ffd479", "rgba(255,255,255,.9)"]
    : ["#2ee59d", "#ff4d7d", "#ffd479", "rgba(255,255,255,.85)"];

  for (let i = 0; i < count; i++) {
    confettiPieces.push({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * 120,
      r: sparkle ? (2 + Math.random() * 3) : (3 + Math.random() * 5),
      w: sparkle ? (2 + Math.random() * 4) : (6 + Math.random() * 10),
      h: sparkle ? (2 + Math.random() * 4) : (8 + Math.random() * 14),
      vx: (Math.random() - 0.5) * 2.2,
      vy: 2.0 + Math.random() * 3.6,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.18,
      color: colors[(Math.random() * colors.length) | 0],
      shape: Math.random() < 0.25 ? "circle" : "rect",
      life: 220 + Math.random() * 120
    });
  }

  if (!confettiAnimating) {
    confettiAnimating = true;
    requestAnimationFrame(tickConfetti);
  }
}

function tickConfetti() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  confettiPieces = confettiPieces.filter(p => p.life > 0);

  for (const p of confettiPieces) {
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life -= 1;

    if (p.x < -50) p.x = window.innerWidth + 50;
    if (p.x > window.innerWidth + 50) p.x = -50;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;

    if (p.shape === "circle") {
      ctx.beginPath();
      ctx.arc(0, 0, p.r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    ctx.restore();
  }

  if (confettiPieces.length > 0) requestAnimationFrame(tickConfetti);
  else {
    confettiAnimating = false;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
}
