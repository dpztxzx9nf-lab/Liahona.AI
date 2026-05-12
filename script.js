const hologram = document.querySelector("[data-hologram]");
const hologramCard = hologram?.querySelector(".hologram-card");
let swipeStart = null;
let suppressNextClick = false;

function setTilt(x, y) {
  if (!hologram) {
    return;
  }

  hologram.style.setProperty("--tilt-x", `${x}deg`);
  hologram.style.setProperty("--tilt-y", `${y}deg`);
  hologram.style.setProperty("--glow-x", `${50 + x * 2}%`);
  hologram.style.setProperty("--glow-y", `${50 - y * 2}%`);
  hologram.style.setProperty("--particle-x", `${x * 2.2}px`);
  hologram.style.setProperty("--particle-y", `${y * 2.2}px`);
  hologram.style.setProperty("--particle-x-strong", `${x * 3.6}px`);
  hologram.style.setProperty("--particle-y-strong", `${y * 3.6}px`);
  hologram.style.setProperty("--particle-x-reverse", `${x * -2.8}px`);
  hologram.style.setProperty("--particle-y-reverse", `${y * -2.8}px`);
  hologram.style.setProperty("--particle-x-soft", `${x * -1.6}px`);
  hologram.style.setProperty("--particle-y-soft", `${y * 1.6}px`);
  hologram.style.setProperty("--shadow-x", `${x * -2.2}px`);
  hologram.style.setProperty("--shadow-y", `${20 + y * 1.5}px`);
}

function resetTilt() {
  setTilt(0, 0);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function isCoarsePointer() {
  return window.matchMedia("(pointer: coarse)").matches;
}

function pulseHaptic() {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(12);
    } catch (error) {
      // Haptics are optional; unsupported browsers can ignore this.
    }
  }
}

function triggerTouchEffect(event) {
  const rect = hologramCard.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const burst = document.createElement("span");

  burst.className = "hologram-touch-burst";
  burst.style.left = `${x}px`;
  burst.style.top = `${y}px`;
  burst.setAttribute("aria-hidden", "true");

  hologramCard.style.setProperty("--touch-x", `${x}px`);
  hologramCard.style.setProperty("--touch-y", `${y}px`);
  hologramCard.classList.remove("is-touched");
  hologramCard.appendChild(burst);

  requestAnimationFrame(() => {
    hologramCard.classList.add("is-touched");
  });

  window.setTimeout(() => {
    burst.remove();
    hologramCard.classList.remove("is-touched");
  }, 760);

  pulseHaptic();
}

function flipCard() {
  const isFlipped = hologramCard.classList.toggle("is-flipped");
  hologramCard.setAttribute("aria-pressed", String(isFlipped));
  pulseHaptic();
}

async function requestMotionPermission() {
  if (!window.DeviceOrientationEvent) {
    hologram.dataset.motion = "unsupported";
    return;
  }

  try {
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== "granted") {
        hologram.dataset.motion = "denied";
        return;
      }
    }

    hologram.dataset.motion = "enabled";
  } catch (error) {
    hologram.dataset.motion = "denied";
  }
}

if (hologram && hologramCard) {
  resetTilt();

  hologramCard.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") {
      return;
    }

    const rect = hologramCard.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

    setTilt(clamp(x * 13, -13, 13), clamp(y * -13, -13, 13));
  });

  hologramCard.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") {
      resetTilt();
    }
  });

  hologramCard.addEventListener("pointerdown", (event) => {
    swipeStart = {
      x: event.clientX,
      y: event.clientY
    };
    triggerTouchEffect(event);
  });

  hologramCard.addEventListener("pointerup", (event) => {
    if (!swipeStart) {
      return;
    }

    const deltaX = event.clientX - swipeStart.x;
    const deltaY = event.clientY - swipeStart.y;
    const isSwipe = Math.abs(deltaX) > 42 || Math.abs(deltaY) > 48;

    swipeStart = null;

    if (isSwipe) {
      suppressNextClick = true;
      flipCard();
      requestMotionPermission();
      window.setTimeout(() => {
        suppressNextClick = false;
      }, 0);
    }
  });

  hologramCard.addEventListener("pointercancel", () => {
    swipeStart = null;
  });

  hologramCard.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      return;
    }

    if (suppressNextClick) {
      suppressNextClick = false;
      return;
    }

    flipCard();
    requestMotionPermission();
  });

  hologramCard.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    flipCard();
    requestMotionPermission();
  });

  window.addEventListener("deviceorientation", (event) => {
    if (hologram.dataset.motion !== "enabled") {
      return;
    }

    const limit = isCoarsePointer() ? 5 : 13;
    const x = clamp((event.gamma || 0) / 5, -limit, limit);
    const y = clamp((event.beta || 0) / -8, -limit, limit);

    setTilt(x, y);
  });
}
