/* Production-ready vanilla JS for GitHub Pages */

const $ = (sel) => document.querySelector(sel);

const beginBtn = $("#beginBtn");
const secretBtn = $("#secretBtn");
const secretNote = $("#secretNote");
const skipToQuestion = $("#skipToQuestion");
const restartBtn = $("#restartBtn");

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

const toggleMusicBtn = $("#toggleMusic");
const bgMusic = $("#bgMusic");

const canvas = $("#confetti");
const ctx = canvas.getContext("2d", { alpha: true });

let confettiPieces = [];
let confettiAnimating = false;

// ---------- helpers ----------
function scrollToId(id) {
  const el = document.querySelector(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function openModal(text) {
  modalText.textContent = text;
  if (typeof modal.showModal === "function") modal.showModal();
  else alert(text); // fallback
}

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

// ---------- navigation buttons ----------
document.addEventListener("click", (e) => {
  const next = e.target.closest("[data-next]");
  const prev = e.target.closest("[data-prev]");
  if (next) scrollToId(next.getAttribute("data-next"));
  if (prev) scrollToId(prev.getAttribute("data-prev"));
});

skipToQuestion.addEventListener("click", () => scrollToId("#question"));
beginBtn.addEventListener("click", () => scrollToId("#goodmorning"));

restartBtn.addEventListener("click", () => {
  // reset key UI state
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
secretBtn.addEventListener("click", () => {
  secretNote.hidden = !secretNote.hidden;
  if (!secretNote.hidden) popSparkles(14);
});

// ---------- Good morning ----------
gmBtn.addEventListener("click", () => {
  gmNote.hidden = false;
  popSparkles(18);
});

gmReplay.addEventListener("click", () => popSparkles(22));

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
gallery.addEventListener("click", (e) => {
  const tile = e.target.closest(".tile");
  if (!tile) return;
  const caption = tile.getAttribute("data-caption") || "💚";
  memoryCaption.textContent = caption;
  popSparkles(10);
});

// ---------- promise slider ----------
promiseSlider.addEventListener("input", () => {
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
yesBtn.addEventListener("click", () => {
  answer.hidden = false;
  popConfetti(220);
  openModal("You said YES 💚🌹 I love you!!!");
});

let dodgeLevel = 0;
noBtn.addEventListener("mouseenter", () => dodgeNoButton());
noBtn.addEventListener("click", () => {
  // On mobile, clicking might happen more than hover—keep it playful
  dodgeNoButton(true);
});

function dodgeNoButton(fromClick = false) {
  dodgeLevel = clamp(dodgeLevel + 1, 0, 8);

  const lines = [
    "Wait… are you sure? 😳",
    "Try again 😂",
    "Nope, that button is shy.",
    "You’re too cute for ‘No’.",
    "Okay but… look at the green theme though 💚",
    "Last chance… 😌",
    "I’m gonna pretend I didn’t see that.",
    "Plot twist: it only accepts YES.",
    "Alright… I’ll stop (maybe)."
  ];

  openModal(lines[dodgeLevel - 1] || "Hmm…");

  const rect = noBtn.getBoundingClientRect();
  const padding = 14;

  // Keep within viewport
  const maxX = window.innerWidth - rect.width - padding;
  const maxY = window.innerHeight - rect.height - padding;

  const x = Math.random() * maxX;
  const y = Math.random() * maxY;

  // Move button using fixed positioning while dodging
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

// ---------- music toggle (optional) ----------
toggleMusicBtn.addEventListener("click", async () => {
  // If you don't set an audio src, gracefully no-op
  const hasSrc = bgMusic?.querySelector("source")?.getAttribute("src");
  if (!hasSrc) {
    openModal("Add an MP3 source in index.html to enable music 🎶");
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
    openModal("Tap once anywhere on the page, then try Music again (browser autoplay rules).");
  }
});

// ---------- sparkles (light confetti) ----------
function popSparkles(count = 12) {
  popConfetti(count, true);
}

// ---------- confetti engine ----------
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

    // drift + wrap
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

  if (confettiPieces.length > 0) {
    requestAnimationFrame(tickConfetti);
  } else {
    confettiAnimating = false;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
}
app
