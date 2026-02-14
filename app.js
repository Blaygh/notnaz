/* Mobile-first, production-ready vanilla JS for GitHub Pages */

const $ = (sel) => document.querySelector(sel);

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

const modal = $("#modal");
const modalText = $("#modalText");
const modalCloseBtn = $("#modalCloseBtn");

const toggleMusicBtn = $("#toggleMusic");
const bgMusic = $("#bgMusic");
const audioGate = $("#audioGate");
const audioGateBtn = $("#audioGateBtn");

const canvas = $("#confetti");
const ctx = canvas?.getContext("2d", { alpha: true });

let confettiPieces = [];
let confettiAnimating = false;

const $src = bgMusic?.querySelector("source")?.getAttribute("src");

// ---------- helpers ----------
function scrollToId(id) {
  const el = document.querySelector(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function openModal(text) {
  if (!modal || !modalText) return alert(text);
  modalText.textContent = text;
  if (typeof modal.showModal === "function") modal.showModal();
  else alert(text);
}

// close modal
modalCloseBtn?.addEventListener("click", () => {
  if (modal?.open) modal.close();
});
modal?.addEventListener("click", (e) => {
  if (e.target === modal) modal.close();
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal?.open) modal.close();
});

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

// ---------- confetti canvas sizing ----------
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
function safariRepaintFix() {
  // clears lingering backdrop-filter compositor layers on iOS
  document.body.style.transform = "translateZ(0)";
  requestAnimationFrame(() => {
    document.body.style.transform = "";
  });
}

function killAudioGate() {
  if (!audioGate) return;
  audioGate.hidden = true;
  audioGate.style.display = "none";
  audioGate.style.backdropFilter = "none";
  audioGate.style.webkitBackdropFilter = "none";
  audioGate.remove();
  safariRepaintFix();
}

async function tryAutoplay() {
  if (!bgMusic || !$src) return;

  bgMusic.loop = true;
  bgMusic.volume = 0.85;

  try {
    await bgMusic.play();
    toggleMusicBtn?.setAttribute("aria-pressed", "true");
    if (toggleMusicBtn) toggleMusicBtn.textContent = "♫ Music: On";
    killAudioGate();
  } catch {
    // autoplay blocked
    if (audioGate) audioGate.hidden = false;
  }
}

audioGateBtn?.addEventListener("click", async () => {
  try {
    await bgMusic.play();
    toggleMusicBtn?.setAttribute("aria-pressed", "true");
    if (toggleMusicBtn) toggleMusicBtn.textContent = "♫ Music: On";
    killAudioGate();
  } catch {
    alert("Tap again — some phones block audio the first time 💚");
  }
});

window.addEventListener("load", () => {
  tryAutoplay();
});

// music toggle
toggleMusicBtn?.addEventListener("click", async () => {
  if (!bgMusic || !$src) {
    openModal("Add assets/song.mp3 to enable music 🎶");
    return;
  }

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

// ---------- navigation ----------
document.addEventListener("click", (e) => {
  const next = e.target.closest("[data-next]");
  const prev = e.target.closest("[data-prev]");
  if (next) scrollToId(next.getAttribute("data-next"));
  if (prev) scrollToId(prev.getAttribute("data-prev"));
});

skipToQuestion?.addEventListener("click", () => scrollToId("#question"));
beginBtn?.addEventListener("click", () => scrollToId("#memories"));

restartBtn?.addEventListener("click", () => {
  secretNote && (secretNote.hidden = true);
  answer && (answer.hidden = true);
  copyStatus && (copyStatus.textContent = "");
  scrollToId("#start");
});

// ---------- secret ----------
secretBtn?.addEventListener("click", () => {
  if (!secretNote) return;
  secretNote.hidden = !secretNote.hidden;
  if (!secretNote.hidden) popSparkles(14);
});

// ---------- fullscreen viewer for moments ----------
function openViewer(src, caption) {
  if (!viewer || !viewerImg || !viewerCaption) return;
  viewerImg.src = src;
  viewerCaption.textContent = caption || "";
  viewer.hidden = false;
  viewer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeViewer() {
  if (!viewer || !viewerImg) return;
  viewer.hidden = true;
  viewer.setAttribute("aria-hidden", "true");
  viewerImg.src = "";
  document.body.style.overflow = "";
}

moments?.addEventListener("click", (e) => {
  const btn = e.target.closest(".moment");
  if (!btn) return;
  const img = btn.querySelector("img");
  const caption = btn.getAttribute("data-caption") || "";
  if (img?.src) openViewer(img.src, caption);
});

viewerClose?.addEventListener("click", closeViewer);
viewer?.addEventListener("click", (e) => {
  if (e.target === viewer) closeViewer();
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && viewer && !viewer.hidden) closeViewer();
});

// ---------- final question ----------
yesBtn?.addEventListener("click", () => {
  if (answer) answer.hidden = false;
  popConfetti(220);
  openModal("YAY 💚🌹");
});

let dodgeLevel = 0;
noBtn?.addEventListener("mouseenter", () => dodgeNoButton());
noBtn?.addEventListener("click", () => dodgeNoButton(true));

function dodgeNoButton(fromClick = false) {
  dodgeLevel = clamp(dodgeLevel + 1, 0, 7);

  const lines = [
    "Wait… are you sure? 😳",
    "Try again 😂",
    "I’m gonna pretend I didn’t see that.",
    "You can’t say no to me 😌",
    "There you go again being stubborn",
    "You don’t learn huh 😭",
    "You know how this ends 💚",
  ];

  openModal(lines[dodgeLevel - 1] || "Hmm…");

  const rect = noBtn.getBoundingClientRect();
  const padding = 14;
  const maxX = window.innerWidth - rect.width - padding;
  const maxY = window.innerHeight - rect.height - padding;

  const x = Math.random() * maxX;
  const y = Math.random() * maxY;

  noBtn.style.position = "fixed";
  noBtn.style.left = `${x}px`;
  noBtn.style.top = `${y}px`;
  noBtn.style.zIndex = "60";

  popSparkles(fromClick ? 10 : 6);
}

confettiBtn?.addEventListener("click", () => popConfetti(180));

copyBtn?.addEventListener("click", async () => {
  const msg = "She said YES 💚🌹 Will you be my Valentine?";
  try {
    await navigator.clipboard.writeText(msg);
    if (copyStatus) copyStatus.textContent = "Copied 💚";
  } catch {
    if (copyStatus) copyStatus.textContent = "Couldn’t copy — screenshot works too 💚";
  }
});

// ---------- confetti ----------
function popSparkles(count = 12) { popConfetti(count, true); }

function popConfetti(count = 160, isSparkle = false) {
  if (!ctx) return;

  const colors = isSparkle
    ? ["#2ee59d", "#ff4d7d", "#ffd479", "rgba(255,255,255,.9)"]
    : ["#2ee59d", "#ff4d7d", "#ffd479", "rgba(255,255,255,.85)"];

  for (let i = 0; i < count; i++) {
    confettiPieces.push({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * 120,
      r: isSparkle ? (2 + Math.random() * 3) : (3 + Math.random() * 5),
      w: isSparkle ? (2 + Math.random() * 4) : (6 + Math.random() * 10),
      h: isSparkle ? (2 + Math.random() * 4) : (8 + Math.random() * 14),
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
  if (!ctx) return;

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
