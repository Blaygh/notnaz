/* app.js — Production-ready vanilla JS
   Viewer supports:
   - swipe left/right to change images
   - big close button
   - drag down to close (when at top)
*/

const $ = (sel) => document.querySelector(sel);

const audioGate = $("#audioGate");
const audioGateBtn = $("#audioGateBtn");
const bgMusic = $("#bgMusic");
const toggleMusicBtn = $("#toggleMusic");

const beginBtn = $("#beginBtn");
const secretBtn = $("#secretBtn");
const secretNote = $("#secretNote");

const skipToQuestion = $("#skipToQuestion");
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

const promiseSlider = $("#promiseSlider");
const sliderValue = $("#sliderValue");
const promiseBox = $("#promiseBox");

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
skipToQuestion?.addEventListener("click", () => scrollToId("#question"));

restartBtn?.addEventListener("click", () => {
  secretNote && (secretNote.hidden = true);
  answer && (answer.hidden = true);
  copyStatus && (copyStatus.textContent = "");
  sliderValue && (sliderValue.textContent = "0%");
  if (promiseSlider) promiseSlider.value = "0";
  if (promiseBox) promiseBox.innerHTML = `<p class="muted">Slide to 100% to reveal the promise.</p>`;

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
  if (!secretNote.hidden) popConfetti(18, true);
});

// ---------- promise slider ----------
promiseSlider?.addEventListener("input", () => {
  const v = Number(promiseSlider.value);
  if (sliderValue) sliderValue.textContent = `${v}%`;

  if (!promiseBox) return;
  if (v >= 100) {
    promiseBox.innerHTML = `
      <p><strong>Promise unlocked:</strong></p>
      <p>
        I promise to keep choosing you—on the loud days and the quiet days.
        I’ll celebrate your wins, hold you through the hard parts,
        and keep making you laugh until we’re old.
      </p>
    `;
    popConfetti(160);
  } else if (v >= 60) {
    promiseBox.innerHTML = `<p class="muted">You’re close… keep going 💚</p>`;
  } else {
    promiseBox.innerHTML = `<p class="muted">Slide to 100% to reveal the promise.</p>`;
  }
});

// ---------- viewer (swipe left/right + drag-to-close) ----------
let viewerContent = null;
let momentButtons = [];
let currentIndex = -1;

function ensureViewerLayout() {
  if (!viewer) return;

  // drag hint
  if (!viewer.querySelector(".drag-hint")) {
    const hint = document.createElement("div");
    hint.className = "drag-hint";
    viewer.insertBefore(hint, viewer.firstChild);
  }

  // nav buttons
  if (!viewer.querySelector("#viewerPrev")) {
    const prev = document.createElement("button");
    prev.id = "viewerPrev";
    prev.type = "button";
    prev.className = "viewer-nav viewer-prev";
    prev.setAttribute("aria-label", "Previous photo");
    prev.textContent = "‹";
    prev.addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      goPrev();
    });
    viewer.appendChild(prev);
  }

  if (!viewer.querySelector("#viewerNext")) {
    const next = document.createElement("button");
    next.id = "viewerNext";
    next.type = "button";
    next.className = "viewer-nav viewer-next";
    next.setAttribute("aria-label", "Next photo");
    next.textContent = "›";
    next.addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      goNext();
    });
    viewer.appendChild(next);
  }

  // wrap image + caption once
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

function refreshMomentList() {
  momentButtons = moments ? Array.from(moments.querySelectorAll(".moment")) : [];
}

function showIndex(idx) {
  if (!viewer || !viewerImg || !viewerCaption) return;
  if (!momentButtons.length) refreshMomentList();
  if (!momentButtons.length) return;

  const n = momentButtons.length;
  currentIndex = (idx + n) % n;

  const btn = momentButtons[currentIndex];
  const src = btn.getAttribute("data-src") || btn.querySelector("img")?.src;
  const caption = btn.getAttribute("data-caption") || "";

  if (src) viewerImg.src = src;
  viewerCaption.textContent = caption;

  viewer.style.setProperty("--pull", "0px");
}

function openViewerAt(idx) {
  ensureViewerLayout();
  refreshMomentList();

  viewer.hidden = false;
  viewer.setAttribute("aria-hidden", "false");
  viewer.scrollTop = 0;

  showIndex(idx);
}

function closeViewer() {
  if (!viewer || !viewerImg) return;
  viewer.hidden = true;
  viewer.setAttribute("aria-hidden", "true");
  viewerImg.src = "";
  viewer.style.setProperty("--pull", "0px");
}

function goNext() {
  if (currentIndex < 0) return;
  showIndex(currentIndex + 1);
}

function goPrev() {
  if (currentIndex < 0) return;
  showIndex(currentIndex - 1);
}

// open from moments
moments?.addEventListener("click", (e) => {
  const btn = e.target.closest(".moment");
  if (!btn) return;
  refreshMomentList();
  const idx = momentButtons.indexOf(btn);
  if (idx >= 0) openViewerAt(idx);
});

// close button
viewerClose?.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  closeViewer();
});

// keyboard
window.addEventListener("keydown", (e) => {
  if (!viewer || viewer.hidden) return;
  if (e.key === "Escape") closeViewer();
  if (e.key === "ArrowRight") goNext();
  if (e.key === "ArrowLeft") goPrev();
});

// gestures
let gestureActive = false;
let startX = 0;
let startY = 0;
let pull = 0;

function atTopOfViewer() {
  return viewer && viewer.scrollTop <= 0;
}

viewer?.addEventListener("pointerdown", (e) => {
  if (!viewer || viewer.hidden) return;
  gestureActive = true;
  startX = e.clientX;
  startY = e.clientY;
  pull = 0;
  viewer.setPointerCapture?.(e.pointerId);
}, { passive: true });

viewer?.addEventListener("pointermove", (e) => {
  if (!gestureActive || !viewer) return;

  const dx = e.clientX - startX;
  const dy = e.clientY - startY;

  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  // horizontal swipe — action on pointerup
  if (absX > 14 && absX > absY * 1.2) {
    e.preventDefault?.();
    return;
  }

  // vertical pull-down to close (only from top)
  if (atTopOfViewer() && dy > 0 && absY > absX) {
    e.preventDefault?.();
    pull = Math.min(dy, 220);
    const eased = pull * 0.65;
    viewer.style.setProperty("--pull", `${eased}px`);
  }
}, { passive: false });

viewer?.addEventListener("pointerup", (e) => {
  if (!gestureActive || !viewer) return;
  gestureActive = false;

  const dx = e.clientX - startX;
  const dy = e.clientY - startY;

  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  // horizontal swipe to change image
  if (absX > 50 && absX > absY * 1.2) {
    if (dx < 0) goNext();
    else goPrev();
    viewer.style.setProperty("--pull", "0px");
    return;
  }

  // vertical pull to close
  if (pull > 140) closeViewer();
  else viewer.style.setProperty("--pull", "0px");
});

viewer?.addEventListener("pointercancel", () => {
  gestureActive = false;
  viewer?.style.setProperty("--pull", "0px");
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

confettiBtn?.addEventListener("click", () => popConfetti(180));

// copy
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
