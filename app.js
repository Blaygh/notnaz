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

const gmBtn = $("#gmBtn");
const gmNote = $("#gmNote");
const gmReplay = $("#gmReplay");

const moodResult = $("#moodResult");
const chips = document.querySelectorAll(".chip");

const gallery = $("#gallery");
const memoryCaption = $("#memoryCaption");

const promiseSlider = $("#promiseSlider");
const sliderValue = $("#sliderValue");
const promiseBox = $("#promiseBox");

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
const ctx = canvas.getContext("2d", { alpha: true });

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
  modalText.textContent = text;
  if (typeof modal.showModal === "function") modal.showModal();
  else alert(text);
}
// close when clicking the button
modalCloseBtn?.addEventListener("click", () => {
  if (modal?.open) modal.close();
});

// close when clicking outside the modal content
modal?.addEventListener("click", (e) => {
  if (e.target === modal) modal.close();
});

// close with ESC (some browsers do this automatically, but we enforce it)
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal?.open) modal.close();
});

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function setCanvasSize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", setCanvasSize);
setCanvasSize();

// ---------- audio: autoplay on open (best effort) ----------
async function tryAutoplay() {
  if (!bgMusic || !$src) return; // no audio file set

  bgMusic.loop = true;
  bgMusic.volume = 0.85;

try {
  await bgMusic.play();
  toggleMusicBtn?.setAttribute("aria-pressed", "true");
  if (toggleMusicBtn) toggleMusicBtn.textContent = "♫ Music: On";

  if (audioGate) audioGate.remove(); // ✅ remove on success autoplay
} catch (e) {
  if (audioGate) audioGate.hidden = false;
}
}

// If autoplay is blocked, the gate button enables it.
audioGateBtn?.addEventListener("click", async () => {
  try {
    await bgMusic.play();

    // ✅ Remove overlay completely so it can't keep blurring
    if (audioGate) {
      audioGate.classList.remove("show");   // in case you used classes
      audioGate.style.backdropFilter = "none";
      audioGate.style.webkitBackdropFilter = "none";
      audioGate.style.display = "none";
      audioGate.hidden = true;

      // strongest option: remove from DOM
      audioGate.remove();
    }

    toggleMusicBtn?.setAttribute("aria-pressed", "true");
    if (toggleMusicBtn) toggleMusicBtn.textContent = "♫ Music: On";
  } catch (e) {
    alert("Tap again — some phones block audio the first time 💚");
  }
});


// Also attempt autoplay as soon as page loads
window.addEventListener("load", () => {
  tryAutoplay();
});

// Music toggle stays useful
toggleMusicBtn?.addEventListener("click", async () => {
  if (!bgMusic || !$src) {
    openModal("Add ./assets/song.mp3 to enable music 🎶");
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
  } catch (e) {
    // Show gate if needed
    if (audioGate) audioGate.hidden = false;
  }
});

// ---------- navigation buttons ----------
document.addEventListener("click", (e) => {
  const next = e.target.closest("[data-next]");
  const prev = e.target.closest("[data-prev]");
  if (next) scrollToId(next.getAttribute("data-next"));
  if (prev) scrollToId(prev.getAttribute("data-prev"));
});

skipToQuestion?.addEventListener("click", () => scrollToId("#question"));
beginBtn?.addEventListener("click", () => scrollToId("#memories"));

restartBtn?.addEventListener("click", () => {
  secretNote.hidden = true;
  gmNote.hidden = true;
  moodResult.textContent = "";
  memoryCaption.textContent = "Tap a photo to reveal a message 💚";
  promiseSlider.value = "0";
  sliderValue.textContent = "0%";
  promiseBox.innerHTML = `<p class="muted">Slide to 100% to reveal the promise.</p>`;
  answer.hidden = true;
  copyStatus.textContent = "";
  scrollToId("#start");
});

// ---------- secret note ----------
secretBtn?.addEventListener("click", () => {
  secretNote.hidden = !secretNote.hidden;
  if (!secretNote.hidden) popSparkles(14);
});

// ---------- Good morning ----------
gmBtn?.addEventListener("click", () => {
  gmNote.hidden = false;
  popSparkles(18);
});
gmReplay?.addEventListener("click", () => popSparkles(22));

// ---------- mood chips ----------
chips.forEach((btn) => {
  btn.addEventListener("click", () => {
    const mood = btn.getAttribute("data-mood");
    const responses = {
      "Happy 😊": "That makes me smile. Let’s keep that energy all day 💚",
      "Soft 🥹": "Come here. (Virtually.) I’m holding your hand 🫶",
      "Tired 😴": "Okay, Pineapple. Be gentle with yourself today 🍍💚",
      "Stressed 😵‍💫": "Breathe with me: in… out… You’ve got this—and I’ve got you."
    };
    moodResult.textContent = responses[mood] || `Noted: ${mood}`;
    popSparkles(10);
  });
});

// ---------- gallery ----------
gallery?.addEventListener("click", (e) => {
  const tile = e.target.closest(".tile");
  if (!tile) return;
  const caption = tile.getAttribute("data-caption") || "💚";
  memoryCaption.textContent = caption;
  popSparkles(10);
});

// ---------- promise slider ----------
promiseSlider?.addEventListener("input", () => {
  const v = Number(promiseSlider.value);
  sliderValue.textContent = `${v}%`;

  if (v >= 100) {
    promiseBox.innerHTML = `
      <p><strong>Promise unlocked:</strong></p>
      <p>
        I promise to keep choosing you—on the loud days and the quiet days.
        I’ll celebrate your wins, hold you through the hard parts,
        and keep making you laugh until we’re old.
      </p>
      <p class="muted small">Now… scroll. Because the question is waiting 😌</p>
    `;
    popConfetti(160);
  } else if (v >= 60) {
    promiseBox.innerHTML = `<p class="muted">You’re close… keep going 💚</p>`;
  } else {
    promiseBox.innerHTML = `<p class="muted">Slide to 100% to reveal the promise.</p>`;
  }
});

// ---------- final question buttons ----------
yesBtn?.addEventListener("click", () => {
  answer.hidden = false;
  popConfetti(220);
  openModal("You said YES 💚🌹 I love you!!!");
});

let dodgeLevel = 0;
noBtn?.addEventListener("mouseenter", () => dodgeNoButton());
noBtn?.addEventListener("click", () => dodgeNoButton(true));

function dodgeNoButton(fromClick = false) {
  dodgeLevel = clamp(dodgeLevel + 1, 0, 8);

  const lines = [
    "Wait… are you sure? 😳",
    "Try again 😂",
    "I’m gonna pretend I didn’t see that.",
    "I hope you know you can't say no to me",
    "There you go again trying to be stubborn",
    "You dont learn huh.",
    "You know how this will end",
    
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
  const msg = "She said YES 💚🌹 Screenshot this: Will you be my Valentine?";
  try {
    await navigator.clipboard.writeText(msg);
    copyStatus.textContent = "Copied! Now paste it and send it to me 😭💚";
  } catch (err) {
    copyStatus.textContent = "Couldn’t copy automatically—no worries, just screenshot 💚";
  }
});

function openViewer(src, caption) {
  viewerImg.src = src;
  viewerCaption.textContent = caption || "";
  viewer.hidden = false;
  viewer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeViewer() {
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

// close if user taps outside caption area (tap image background)
viewer?.addEventListener("click", (e) => {
  if (e.target === viewer) closeViewer();
});

// close on ESC
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && viewer && !viewer.hidden) closeViewer();
});


// ---------- confetti ----------
function popSparkles(count = 12) { popConfetti(count, true); }

function popConfetti(count = 160, isSparkle = false) {
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
