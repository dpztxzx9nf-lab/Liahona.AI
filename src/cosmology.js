import { fragments, memoryEchoes, chambers } from "./data/cosmology.js";
import { logs } from "./data/logs.js";

const storageKey = "liahonaCosmologyState";
const defaultState = {
  unlockedArtifacts: [],
  returnPoints: [],
  device: {
    x: null,
    y: null,
    minimized: true,
    expanded: false,
    view: "orb",
    dockSide: "right",
    tab: "private"
  },
  lockedItems: {},
  deletedItems: {},
  lastViewedArtifact: null,
  lastViewedChamber: null,
  progress: {
    discoveredCount: 0
  }
};

const cosmology = document.querySelector("[data-cosmology]");
const artifact = document.querySelector("[data-artifact]");
const device = document.querySelector("[data-continuity-device]");
const dragHandle = document.querySelector("[data-device-drag]");
const statusNode = document.querySelector("[data-device-status]");
let state = loadState();
let dragState = null;
let rowGesture = null;
let artifactFocusTimer = null;
let artifactPointerStart = null;

function loadState() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(storageKey));
    return {
      ...defaultState,
      ...stored,
      device: { ...defaultState.device, ...stored?.device },
      lockedItems: { ...defaultState.lockedItems, ...stored?.lockedItems },
      deletedItems: { ...defaultState.deletedItems, ...stored?.deletedItems },
      progress: { ...defaultState.progress, ...stored?.progress }
    };
  } catch (error) {
    return JSON.parse(JSON.stringify(defaultState));
  }
}

function saveState() {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    // Future backend sync can start here without changing the local V1 contract.
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setStatus(message) {
  if (statusNode) {
    statusNode.textContent = message;
  }
}

function pulseHaptic(strength = 14) {
  if (!navigator.vibrate) {
    return;
  }

  try {
    navigator.vibrate(strength);
  } catch (error) {
    // Haptics are optional and unsupported browsers can ignore them.
  }
}

function pulseArtifact() {
  artifact?.classList.remove("is-awake");
  window.requestAnimationFrame(() => artifact?.classList.add("is-awake"));
}

function focusArtifact(duration = 1400) {
  if (!artifact) {
    return;
  }

  artifact.classList.add("is-focused");
  pulseArtifact();
  pulseHaptic(12);
  window.clearTimeout(artifactFocusTimer);
  artifactFocusTimer = window.setTimeout(() => {
    artifact.classList.remove("is-focused");
  }, duration);
}

function flipArtifact() {
  if (!artifact) {
    return;
  }

  artifact.classList.toggle("is-flipped");
  focusArtifact(1800);
}

function itemKey(type, id) {
  return `${type}:${id}`;
}

function isLocked(type, id) {
  return Boolean(state.lockedItems[itemKey(type, id)]);
}

function isDeleted(type, id) {
  return Boolean(state.deletedItems[itemKey(type, id)]);
}

function isMobileViewport() {
  return window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
}

function toggleLock(type, id) {
  const key = itemKey(type, id);
  state.lockedItems[key] = !state.lockedItems[key];
  saveState();
  renderDevice();
  pulseHaptic(12);
  setStatus(state.lockedItems[key] ? "Item locked." : "Item unlocked.");
}

function deleteItem(type, id) {
  if (isLocked(type, id)) {
    setStatus("Unlock this item before deleting it.");
    pulseHaptic([8, 24, 8]);
    renderDevice();
    return;
  }

  state.deletedItems[itemKey(type, id)] = true;
  saveState();
  renderDevice();
  pulseHaptic(18);
  setStatus("Item hidden from this archive.");
}

function unlockFragment(fragmentId) {
  const fragment = fragments.find((item) => item.id === fragmentId);

  if (!fragment) {
    return;
  }

  if (!state.unlockedArtifacts.includes(fragmentId)) {
    state.unlockedArtifacts.push(fragmentId);
    state.progress.discoveredCount = state.unlockedArtifacts.length;
    setStatus(`Fragment revealed: ${fragment.title}`);
  } else {
    setStatus(`Returned to fragment: ${fragment.title}`);
  }

  state.lastViewedArtifact = fragmentId;
  saveState();
  renderDevice();
  focusArtifact(1800);
}

function unlockedChambers() {
  return chambers.filter((chamber) => state.unlockedArtifacts.length >= chamber.requiredFragments);
}

function saveReturnPoint() {
  const activeFragment = fragments.find((item) => item.id === state.lastViewedArtifact) || fragments[0];
  const point = {
    id: `return-${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
    artifact: activeFragment.id,
    title: activeFragment.title,
    chamber: state.lastViewedChamber || "surface"
  };

  state.returnPoints = [point, ...state.returnPoints].slice(0, 8);
  saveState();
  renderDevice();
  setStatus(`Return point saved: ${point.title}`);
}

async function copyReturnPointLink() {
  const artifactId = state.lastViewedArtifact || fragments[0].id;
  const chamberId = state.lastViewedChamber || "surface";
  const url = new URL(window.location.href);

  url.searchParams.set("artifact", artifactId);
  url.searchParams.set("chamber", chamberId);

  try {
    await navigator.clipboard.writeText(url.toString());
    setStatus("Return point link copied.");
  } catch (error) {
    window.prompt("Copy return point link", url.toString());
  }
}

function applyReturnPointFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const artifactId = params.get("artifact");
  const chamberId = params.get("chamber");

  if (fragments.some((fragment) => fragment.id === artifactId)) {
    state.lastViewedArtifact = artifactId;
    if (!state.unlockedArtifacts.includes(artifactId)) {
      state.unlockedArtifacts.push(artifactId);
    }
  }

  if (chambers.some((chamber) => chamber.id === chamberId)) {
    state.lastViewedChamber = chamberId;
  }

  saveState();
}

function renderDevice() {
  const fragmentList = document.querySelector("[data-fragment-list]");
  const returnList = document.querySelector("[data-return-points]");
  const echoesList = document.querySelector("[data-memory-echoes]");
  const deviceLogs = document.querySelector("[data-device-logs]");
  const chamberList = document.querySelector("[data-chamber-list]");

  if (fragmentList) {
    fragmentList.innerHTML = fragments.filter((fragment) => !isDeleted("fragment", fragment.id)).map((fragment) => {
      const unlocked = state.unlockedArtifacts.includes(fragment.id);
      const locked = isLocked("fragment", fragment.id);
      return `
        <article class="gesture-row ${locked ? "is-locked-row" : ""}" data-row-type="fragment" data-row-id="${fragment.id}" data-row-locked="${locked}">
          <div class="row-actions">
            <button type="button" data-delete-item="fragment" data-item-id="${fragment.id}" ${locked ? "disabled" : ""}>Delete</button>
          </div>
          <div class="device-item row-content ${unlocked ? "is-unlocked" : "is-locked"} ${locked ? "is-pinned" : ""}">
            <button class="item-lock" type="button" data-lock-item="fragment" data-item-id="${fragment.id}" aria-label="${locked ? "Unlock" : "Lock"} ${fragment.title}">${locked ? "Locked" : "Lock"}</button>
            <span>${unlocked ? "Unlocked" : "Dormant"}</span>
            <h4>${fragment.title}</h4>
            <p>${unlocked ? fragment.summary : "Touch the artifact to reveal this fragment."}</p>
          </div>
        </article>
      `;
    }).join("") || `<p class="device-empty">All fragments are hidden.</p>`;
  }

  if (returnList) {
    const visibleReturnPoints = state.returnPoints.filter((point) => !isDeleted("return", point.id));
    returnList.innerHTML = visibleReturnPoints.length
      ? visibleReturnPoints.map((point) => {
        const locked = isLocked("return", point.id);
        return `
          <article class="gesture-row ${locked ? "is-locked-row" : ""}" data-row-type="return" data-row-id="${point.id}" data-row-locked="${locked}">
            <div class="row-actions">
              <button type="button" data-delete-item="return" data-item-id="${point.id}" ${locked ? "disabled" : ""}>Delete</button>
            </div>
            <div class="device-item row-content return-point ${locked ? "is-pinned" : ""}">
              <button class="item-lock" type="button" data-lock-item="return" data-item-id="${point.id}" aria-label="${locked ? "Unlock" : "Lock"} ${point.title}">${locked ? "Locked" : "Lock"}</button>
              <button class="return-point-trigger" type="button" data-return-artifact="${point.artifact}">
                <span>${point.date}</span>
                <h4>${point.title}</h4>
                <p>${point.chamber}</p>
              </button>
            </div>
          </article>
        `;
      }).join("")
      : `<p class="device-empty">No return points saved yet.</p>`;
  }

  if (echoesList) {
    echoesList.innerHTML = memoryEchoes.map((echo) => `
      <article class="device-item">
        <span>Echo</span>
        <h4>${echo.title}</h4>
        <p>${echo.summary}</p>
      </article>
    `).join("");
  }

  if (deviceLogs) {
    deviceLogs.innerHTML = logs.slice(0, 5).map((entry) => `
      <article class="device-item">
        <span>${entry.date} / ${entry.project}</span>
        <h4>${entry.title}</h4>
        <p>${entry.summary}</p>
      </article>
    `).join("");
  }

  if (chamberList) {
    chamberList.innerHTML = chambers.map((chamber) => {
      const unlocked = state.unlockedArtifacts.length >= chamber.requiredFragments;
      return `
        <button class="device-item chamber-card ${unlocked ? "is-unlocked" : "is-locked"}" type="button" data-chamber-id="${chamber.id}" ${unlocked ? "" : "disabled"}>
          <span>${unlocked ? "Open" : `${state.unlockedArtifacts.length}/${chamber.requiredFragments}`}</span>
          <h4>${chamber.title}</h4>
          <p>${chamber.summary}</p>
        </button>
      `;
    }).join("");
  }
}

function setDeviceTab(tabName) {
  state.device.tab = tabName;
  document.querySelectorAll("[data-device-tab]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.deviceTab === tabName);
  });
  document.querySelectorAll("[data-device-panel]").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.devicePanel === tabName);
  });
  saveState();
}

function applyDeviceState() {
  if (!device) {
    return;
  }

  if (state.device.minimized) {
    state.device.view = "orb";
  }

  device.classList.toggle("is-minimized", Boolean(state.device.minimized));
  device.classList.toggle("is-expanded", Boolean(state.device.expanded));
  device.classList.toggle("is-peek", state.device.view === "peek" && !state.device.expanded && !state.device.minimized);
  device.classList.toggle("is-orb", Boolean(state.device.minimized));
  device.classList.toggle("is-docked-left", state.device.dockSide === "left");
  device.classList.toggle("is-docked-right", state.device.dockSide !== "left");

  if (Number.isFinite(state.device.x) && Number.isFinite(state.device.y)) {
    device.style.left = `${state.device.x}px`;
    device.style.top = `${state.device.y}px`;
    device.style.right = "auto";
    device.style.bottom = "auto";
  }

  setDeviceTab(state.device.tab);
}

function setDeviceView(view) {
  state.device.view = view;
  state.device.minimized = view === "orb";
  state.device.expanded = view === "full";
  saveState();
  applyDeviceState();
  keepDeviceInBounds();
  pulseHaptic(view === "full" ? 18 : 10);
}

function dockDevice(side = state.device.dockSide || "right") {
  if (!device) {
    return;
  }

  state.device.dockSide = side;
  state.device.view = "orb";
  state.device.minimized = true;
  state.device.expanded = false;

  const dockWidth = isMobileViewport() ? 38 : 42;
  const dockHeight = isMobileViewport() ? 104 : 118;
  state.device.x = side === "left" ? 0 : window.innerWidth - dockWidth;
  state.device.y = clamp(state.device.y ?? window.innerHeight - dockHeight - 22, 10, window.innerHeight - dockHeight - 10);
  saveState();
  applyDeviceState();
  pulseHaptic(10);
}

function keepDeviceInBounds() {
  if (!device) {
    return;
  }

  const rect = device.getBoundingClientRect();
  const maxX = Math.max(8, window.innerWidth - Math.min(rect.width, window.innerWidth) - 8);
  const maxY = Math.max(8, window.innerHeight - Math.min(rect.height, window.innerHeight) - 8);
  const x = clamp(rect.left, 8, maxX);
  const y = clamp(rect.top, 8, maxY);

  state.device.x = x;
  state.device.y = y;
  device.style.left = `${x}px`;
  device.style.top = `${y}px`;
  device.style.right = "auto";
  device.style.bottom = "auto";
  saveState();
}

function updateParallax(event) {
  if (!cosmology) {
    return;
  }

  const point = event.touches?.[0] || event;
  const x = (point.clientX / window.innerWidth - 0.5) * 2;
  const y = (point.clientY / window.innerHeight - 0.5) * 2;

  cosmology.style.setProperty("--world-x", `${x * 18}px`);
  cosmology.style.setProperty("--world-y", `${y * 18}px`);
  cosmology.style.setProperty("--artifact-tilt-x", `${clamp(y * -7, -7, 7)}deg`);
  cosmology.style.setProperty("--artifact-tilt-y", `${clamp(x * 9, -9, 9)}deg`);
  cosmology.style.setProperty("--artifact-depth", String(1 + Math.min(Math.hypot(x, y), 1) * 0.035));
  cosmology.style.setProperty("--artifact-shift-x", `${x * 7}px`);
  cosmology.style.setProperty("--artifact-shift-y", `${y * 7}px`);
  cosmology.style.setProperty("--light-x", `${50 + x * 22}%`);
  cosmology.style.setProperty("--light-y", `${50 + y * 18}%`);
}

function resetArtifactMotion() {
  if (!cosmology) {
    return;
  }

  cosmology.style.setProperty("--world-x", "0px");
  cosmology.style.setProperty("--world-y", "0px");
  cosmology.style.setProperty("--artifact-tilt-x", "0deg");
  cosmology.style.setProperty("--artifact-tilt-y", "0deg");
  cosmology.style.setProperty("--artifact-depth", "1");
  cosmology.style.setProperty("--artifact-shift-x", "0px");
  cosmology.style.setProperty("--artifact-shift-y", "0px");
  cosmology.style.setProperty("--light-x", "50%");
  cosmology.style.setProperty("--light-y", "50%");
}

function bindInteractions() {
  document.querySelectorAll("[data-fragment-id]").forEach((button) => {
    button.addEventListener("click", () => unlockFragment(button.dataset.fragmentId));
  });

  artifact?.addEventListener("pointerdown", (event) => {
    if (event.target.closest("[data-fragment-id]")) {
      return;
    }

    artifactPointerStart = {
      x: event.clientX,
      y: event.clientY
    };
    focusArtifact();
  });

  artifact?.addEventListener("pointerup", (event) => {
    if (!artifactPointerStart || event.target.closest("[data-fragment-id]")) {
      artifactPointerStart = null;
      return;
    }

    const deltaX = event.clientX - artifactPointerStart.x;
    const deltaY = event.clientY - artifactPointerStart.y;
    const isIntentional = Math.abs(deltaX) < 18 && Math.abs(deltaY) < 18;

    artifactPointerStart = null;

    if (isIntentional) {
      flipArtifact();
    }
  });

  artifact?.addEventListener("pointercancel", () => {
    artifactPointerStart = null;
  });

  document.querySelector("[data-save-return]")?.addEventListener("click", saveReturnPoint);
  document.querySelector("[data-copy-return-link]")?.addEventListener("click", copyReturnPointLink);

  document.querySelectorAll("[data-device-tab]").forEach((button) => {
    button.addEventListener("click", () => setDeviceTab(button.dataset.deviceTab));
  });

  document.querySelector("[data-device-minimize]")?.addEventListener("click", () => {
    dockDevice(state.device.dockSide);
  });

  document.querySelector("[data-device-expand]")?.addEventListener("click", () => {
    setDeviceView(state.device.expanded ? "peek" : "full");
  });

  device.addEventListener("click", (event) => {
    if (!device.classList.contains("is-orb") || event.target.closest("button")) {
      return;
    }

    setDeviceView("peek");
  });

  document.querySelector("[data-device-snap]")?.addEventListener("click", () => {
    const rect = device.getBoundingClientRect();
    state.device.dockSide = rect.left < window.innerWidth / 2 ? "left" : "right";
    state.device.x = state.device.dockSide === "left" ? 10 : window.innerWidth - rect.width - 10;
    state.device.y = clamp(rect.top, 10, window.innerHeight - rect.height - 10);
    saveState();
    applyDeviceState();
  });

  document.addEventListener("click", (event) => {
    const returnPoint = event.target.closest("[data-return-artifact]");
    const chamber = event.target.closest("[data-chamber-id]");
    const lockButton = event.target.closest("[data-lock-item]");
    const deleteButton = event.target.closest("[data-delete-item]");

    if (lockButton) {
      event.preventDefault();
      event.stopPropagation();
      toggleLock(lockButton.dataset.lockItem, lockButton.dataset.itemId);
      return;
    }

    if (deleteButton) {
      event.preventDefault();
      event.stopPropagation();
      deleteItem(deleteButton.dataset.deleteItem, deleteButton.dataset.itemId);
      return;
    }

    if (returnPoint) {
      unlockFragment(returnPoint.dataset.returnArtifact);
    }

    if (chamber && !chamber.disabled) {
      state.lastViewedChamber = chamber.dataset.chamberId;
      saveState();
      renderDevice();
      setStatus(`Chamber opened: ${chamber.querySelector("h4")?.textContent}`);
      pulseHaptic(18);
    }
  });

  window.addEventListener("pointermove", updateParallax, { passive: true });
  window.addEventListener("touchmove", updateParallax, { passive: true });
  cosmology.addEventListener("pointerleave", resetArtifactMotion);
  window.addEventListener("resize", keepDeviceInBounds);
  bindRowGestures();
}

function bindRowGestures() {
  if (!device) {
    return;
  }

  device.addEventListener("pointerdown", (event) => {
    const row = event.target.closest(".gesture-row");

    if (!row || event.target.closest("button") || row.dataset.rowLocked === "true") {
      return;
    }

    const content = row.querySelector(".row-content");
    rowGesture = {
      row,
      content,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      currentX: 0
    };
  });

  device.addEventListener("pointermove", (event) => {
    if (!rowGesture || rowGesture.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - rowGesture.startX;
    const deltaY = event.clientY - rowGesture.startY;

    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 12) {
      rowGesture = null;
      return;
    }

    if (deltaX < -8) {
      event.preventDefault();
    }

    rowGesture.currentX = clamp(deltaX, -96, 0);
    rowGesture.content.style.transform = `translateX(${rowGesture.currentX}px)`;
  });

  device.addEventListener("pointerup", (event) => {
    if (!rowGesture || rowGesture.pointerId !== event.pointerId) {
      return;
    }

    const isOpen = rowGesture.currentX < -44;
    rowGesture.row.classList.toggle("is-swiped", isOpen);
    rowGesture.content.style.transform = isOpen ? "translateX(-82px)" : "";
    rowGesture = null;
  });

  device.addEventListener("pointercancel", () => {
    if (rowGesture?.content) {
      rowGesture.content.style.transform = "";
    }
    rowGesture = null;
  });
}

function bindDrag() {
  if (!device || !dragHandle) {
    return;
  }

  dragHandle.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) {
      return;
    }

    const rect = device.getBoundingClientRect();
    dragState = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      startX: event.clientX,
      startY: event.clientY,
      moved: false
    };
    dragHandle.setPointerCapture(event.pointerId);
  });

  dragHandle.addEventListener("pointermove", (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const maxX = Math.max(8, window.innerWidth - device.offsetWidth - 8);
    const maxY = Math.max(8, window.innerHeight - device.offsetHeight - 8);
    const x = clamp(event.clientX - dragState.offsetX, 8, maxX);
    const y = clamp(event.clientY - dragState.offsetY, 8, maxY);

    state.device.x = x;
    state.device.y = y;
    dragState.moved = true;
    device.style.left = `${x}px`;
    device.style.top = `${y}px`;
    device.style.right = "auto";
    device.style.bottom = "auto";
  });

  dragHandle.addEventListener("pointerup", (event) => {
    if (dragState?.pointerId === event.pointerId) {
      const deltaX = event.clientX - (dragState.startX ?? event.clientX);
      const deltaY = event.clientY - dragState.startY;
      const nearLeft = event.clientX < 42;
      const nearRight = event.clientX > window.innerWidth - 42;
      const shouldDock = nearLeft || nearRight || deltaY > 72;
      const shouldExpand = deltaY < -64 || (Math.abs(deltaX) > 96 && !nearLeft && !nearRight);

      if (shouldDock) {
        dockDevice(nearLeft || deltaX < 0 ? "left" : "right");
      } else if ((state.device.view === "peek" || state.device.view === "orb") && shouldExpand) {
        setDeviceView("full");
      }
      dragState = null;
      saveState();
    }
  });
}

if (cosmology && artifact && device) {
  applyReturnPointFromUrl();
  renderDevice();
  applyDeviceState();
  bindInteractions();
  bindDrag();
  keepDeviceInBounds();

  if (unlockedChambers().length > 0) {
    setStatus("A dormant chamber is open.");
  }
}
