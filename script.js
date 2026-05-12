const hologram = document.querySelector("[data-hologram]");
const hologramCard = hologram?.querySelector(".hologram-card");

function setTilt(x, y) {
  if (!hologram) {
    return;
  }

  hologram.style.setProperty("--tilt-x", `${x}deg`);
  hologram.style.setProperty("--tilt-y", `${y}deg`);
  hologram.style.setProperty("--glow-x", `${50 + x * 2}%`);
  hologram.style.setProperty("--glow-y", `${50 - y * 2}%`);
  hologram.style.setProperty("--particle-x", `${x * 1.4}px`);
  hologram.style.setProperty("--particle-y", `${y * 1.4}px`);
  hologram.style.setProperty("--shadow-x", `${x * -1.8}px`);
  hologram.style.setProperty("--shadow-y", `${18 + y * 1.2}px`);
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

  if (navigator.vibrate) {
    try {
      navigator.vibrate(12);
    } catch (error) {
      // Haptics are optional; unsupported browsers can ignore this.
    }
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

    setTilt(clamp(x * 9, -9, 9), clamp(y * -9, -9, 9));
  });

  hologramCard.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") {
      resetTilt();
    }
  });

  hologramCard.addEventListener("pointerdown", (event) => {
    triggerTouchEffect(event);
  });

  hologramCard.addEventListener("click", async () => {
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
  });

  window.addEventListener("deviceorientation", (event) => {
    if (hologram.dataset.motion !== "enabled") {
      return;
    }

    const limit = isCoarsePointer() ? 4 : 9;
    const x = clamp((event.gamma || 0) / 6, -limit, limit);
    const y = clamp((event.beta || 0) / -10, -limit, limit);

    setTilt(x, y);
  });
}
