const hologram = document.querySelector("[data-hologram]");
const hologramCard = hologram?.querySelector(".hologram-card");
const motionPrompt = hologram?.querySelector("[data-motion-prompt]");
const motionEnable = hologram?.querySelector("[data-motion-enable]");
const motionDismiss = hologram?.querySelector("[data-motion-dismiss]");
const motionControl = hologram?.querySelector("[data-motion-control]");
const motionPreferenceKey = "liahonaMotionPreference";
let swipeStart = null;
let suppressNextClick = false;
let motionBaseline = null;
let currentTilt = { x: 0, y: 0 };
let targetTilt = { x: 0, y: 0 };
let smoothingFrame = null;

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
  hologram.style.setProperty("--safe-scale", String(1 + Math.min(Math.max(Math.abs(x), Math.abs(y)) / 5, 1) * 0.12));
}

function resetTilt() {
  currentTilt = { x: 0, y: 0 };
  targetTilt = { x: 0, y: 0 };
  setTilt(0, 0);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function isCoarsePointer() {
  return window.matchMedia("(pointer: coarse)").matches;
}

function isDesktopPointer() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function getMotionPreference() {
  try {
    return window.localStorage.getItem(motionPreferenceKey);
  } catch (error) {
    return null;
  }
}

function setMotionPreference(value) {
  try {
    window.localStorage.setItem(motionPreferenceKey, value);
  } catch (error) {
    // Persistence is optional; the site still works without localStorage.
  }
}

function canUseMotion() {
  return Boolean(window.DeviceOrientationEvent);
}

function requiresMotionPermission() {
  return canUseMotion() && typeof DeviceOrientationEvent.requestPermission === "function";
}

function hideMotionPrompt() {
  if (motionPrompt) {
    motionPrompt.hidden = true;
  }
}

function showMotionControl() {
  if (motionControl && canUseMotion() && !isDesktopPointer()) {
    motionControl.hidden = false;
  }
}

function hideMotionControl() {
  if (motionControl) {
    motionControl.hidden = true;
  }
}

function pulseHaptic() {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(20);
    } catch (error) {
      // Haptics are optional; unsupported browsers can ignore this.
    }
  }
}

function readOrientation(event) {
  return {
    beta: event.beta || 0,
    gamma: event.gamma || 0
  };
}

function calibrateMotion(event) {
  motionBaseline = readOrientation(event);
  resetTilt();
}

function startSmoothing() {
  if (smoothingFrame) {
    return;
  }

  const step = () => {
    const ease = 0.16;
    currentTilt.x += (targetTilt.x - currentTilt.x) * ease;
    currentTilt.y += (targetTilt.y - currentTilt.y) * ease;
    setTilt(currentTilt.x, currentTilt.y);

    if (
      Math.abs(targetTilt.x - currentTilt.x) > 0.03 ||
      Math.abs(targetTilt.y - currentTilt.y) > 0.03
    ) {
      smoothingFrame = window.requestAnimationFrame(step);
      return;
    }

    currentTilt = { ...targetTilt };
    setTilt(currentTilt.x, currentTilt.y);
    smoothingFrame = null;
  };

  smoothingFrame = window.requestAnimationFrame(step);
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
        setMotionPreference("denied");
        showMotionControl();
        return;
      }
    }

    hologram.dataset.motion = "enabled";
    motionBaseline = null;
    setMotionPreference("accepted");
    hideMotionPrompt();
    hideMotionControl();
  } catch (error) {
    hologram.dataset.motion = "denied";
    setMotionPreference("denied");
    showMotionControl();
  }
}

function initializeMotionPreference() {
  if (!canUseMotion() || isDesktopPointer()) {
    hideMotionPrompt();
    hideMotionControl();
    return;
  }

  const preference = getMotionPreference();

  if (preference === "accepted") {
    if (requiresMotionPermission()) {
      hideMotionPrompt();
      showMotionControl();
      return;
    }

    hologram.dataset.motion = "enabled";
    motionBaseline = null;
    hideMotionPrompt();
    hideMotionControl();
    return;
  }

  if (preference === "denied" || preference === "dismissed") {
    hideMotionPrompt();
    showMotionControl();
    return;
  }

  if (motionPrompt) {
    motionPrompt.hidden = false;
  }

  showMotionControl();
}

if (hologram && hologramCard) {
  resetTilt();
  initializeMotionPreference();

  hologramCard.querySelectorAll(".hologram-reference a").forEach((link) => {
    ["pointerdown", "pointerup", "mousedown", "mouseup", "click", "auxclick"].forEach((eventName) => {
      link.addEventListener(eventName, (event) => {
        event.stopPropagation();
      });
    });
  });

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
    if (event.target.closest("a")) {
      return;
    }

    swipeStart = {
      x: event.clientX,
      y: event.clientY
    };
    triggerTouchEffect(event);
  });

  hologramCard.addEventListener("pointerup", (event) => {
    if (event.target.closest("a")) {
      swipeStart = null;
      return;
    }

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
  });

  hologramCard.addEventListener("keydown", (event) => {
    if (event.target.closest("a")) {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    flipCard();
  });

  motionEnable?.addEventListener("click", (event) => {
    event.stopPropagation();
    requestMotionPermission();
  });

  motionControl?.addEventListener("click", (event) => {
    event.stopPropagation();
    motionBaseline = null;
    requestMotionPermission();
  });

  motionDismiss?.addEventListener("click", (event) => {
    event.stopPropagation();
    setMotionPreference("dismissed");
    hideMotionPrompt();
    showMotionControl();
  });

  window.addEventListener("deviceorientation", (event) => {
    if (hologram.dataset.motion !== "enabled") {
      return;
    }

    if (!motionBaseline) {
      calibrateMotion(event);
      return;
    }

    const orientation = readOrientation(event);
    const relativeGamma = orientation.gamma - motionBaseline.gamma;
    const relativeBeta = orientation.beta - motionBaseline.beta;
    const limit = isCoarsePointer() ? 4.2 : 11;
    const x = clamp(relativeGamma / 3.8, -limit, limit);
    const y = clamp(relativeBeta / -6, -limit, limit);

    targetTilt = { x, y };
    startSmoothing();
  });
}
