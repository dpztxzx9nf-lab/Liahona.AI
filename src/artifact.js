const states = {
  orientation: {
    kicker: "Orientation",
    title: "Direction before output",
    body: "A quiet surface for judgment, timing, and restraint before response."
  },
  grounding: {
    kicker: "Grounding",
    title: "The source remains outside",
    body: "Scripture and reference material are pointed to, not absorbed or impersonated."
  },
  continuity: {
    kicker: "Continuity",
    title: "Memory must be recoverable",
    body: "Project memory belongs in documentation, meaningful content, or Git history."
  },
  recoverability: {
    kicker: "Recoverability",
    title: "Every experiment needs a way back",
    body: "Git is the continuity spine. Redesign work stays legible when it can be reverted."
  }
};

const interfaceNode = document.querySelector("[data-interface]");
const artifact = document.querySelector("[data-artifact]");
const buttons = [...document.querySelectorAll("[data-state]")];
const kicker = document.querySelector("[data-kicker]");
const title = document.querySelector("[data-title]");
const body = document.querySelector("[data-body]");
const continuityToggle = document.querySelector("[data-continuity-toggle]");
const continuityDevice = document.querySelector("[data-continuity-device]");
const continuityClose = document.querySelector("[data-continuity-close]");
let activeIndex = 0;
let holdTimer;
let holdPointerId;
let holdPoint = { clientX: 0, clientY: 0 };
let isSelecting = false;
let previewButton;
let suppressNextClick = false;

const holdDelay = 280;

function setState(stateName) {
  const state = states[stateName];

  if (!state) {
    return;
  }

  kicker.textContent = state.kicker;
  title.textContent = state.title;
  body.textContent = state.body;
  artifact.classList.add("is-awake");
  buttons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.state === stateName);
  });
  activeIndex = buttons.findIndex((button) => button.dataset.state === stateName);
}

function cycleState() {
  const nextIndex = (activeIndex + 1) % buttons.length;
  setState(buttons[nextIndex].dataset.state);
}

function clearPreview() {
  buttons.forEach((button) => button.classList.remove("is-preview"));
  previewButton = null;
}

function previewNearestState(event) {
  if (!isSelecting) {
    return;
  }

  const nearest = buttons.reduce((closest, button) => {
    const rect = button.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const distance = Math.hypot(event.clientX - x, event.clientY - y);

    if (!closest || distance < closest.distance) {
      return { button, distance };
    }

    return closest;
  }, null);

  if (!nearest || nearest.button === previewButton) {
    return;
  }

  clearPreview();
  previewButton = nearest.button;
  previewButton.classList.add("is-preview");
}

function beginSelection(event) {
  isSelecting = true;
  interfaceNode.classList.add("is-selecting");
  artifact.classList.add("is-selecting");
  previewNearestState(event);
}

function resetHold() {
  window.clearTimeout(holdTimer);
  holdTimer = null;
}

function endSelection(event) {
  if (isSelecting && previewButton) {
    setState(previewButton.dataset.state);
    suppressNextClick = true;
  }

  isSelecting = false;
  interfaceNode.classList.remove("is-selecting");
  artifact.classList.remove("is-selecting");
  clearPreview();
  resetHold();
  holdPointerId = undefined;

  if (event && artifact.hasPointerCapture(event.pointerId)) {
    artifact.releasePointerCapture(event.pointerId);
  }
}

function updatePointerDepth(event) {
  const x = (event.clientX / window.innerWidth - 0.5) * 26;
  const y = (event.clientY / window.innerHeight - 0.5) * 26;

  interfaceNode.style.setProperty("--x", `${x}px`);
  interfaceNode.style.setProperty("--y", `${y}px`);
  interfaceNode.style.setProperty("--tilt-x", `${y * -0.12}deg`);
  interfaceNode.style.setProperty("--tilt-y", `${x * 0.14}deg`);
}

function setContinuityDevice(open) {
  continuityDevice.hidden = !open;
  continuityToggle.classList.toggle("is-open", open);
  continuityToggle.setAttribute("aria-expanded", String(open));
}

buttons.forEach((button) => {
  button.addEventListener("click", () => setState(button.dataset.state));
});

continuityToggle.addEventListener("click", () => {
  setContinuityDevice(continuityDevice.hidden);
});

continuityClose.addEventListener("click", () => {
  setContinuityDevice(false);
  continuityToggle.focus();
});

artifact.addEventListener("pointerdown", (event) => {
  if (!event.isPrimary) {
    return;
  }

  holdPointerId = event.pointerId;
  holdPoint = { clientX: event.clientX, clientY: event.clientY };
  artifact.setPointerCapture(event.pointerId);
  resetHold();
  holdPointerId = event.pointerId;
  holdTimer = window.setTimeout(() => beginSelection(holdPoint), holdDelay);
});

artifact.addEventListener("pointermove", (event) => {
  if (event.pointerId !== holdPointerId) {
    return;
  }

  holdPoint = { clientX: event.clientX, clientY: event.clientY };
  previewNearestState(event);
});

artifact.addEventListener("pointerup", (event) => {
  if (event.pointerId !== holdPointerId) {
    return;
  }

  endSelection(event);
});

artifact.addEventListener("pointercancel", endSelection);

artifact.addEventListener("click", () => {
  if (suppressNextClick) {
    suppressNextClick = false;
    return;
  }

  cycleState();
});

artifact.addEventListener("contextmenu", (event) => event.preventDefault());
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setContinuityDevice(false);
  }
});
window.addEventListener("pointermove", updatePointerDepth, { passive: true });
setState("orientation");
setContinuityDevice(false);
