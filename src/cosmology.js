import { fragments, memoryEchoes, chambers } from "./data/cosmology.js";

const storageKey = "liahonaCosmologyState";
const defaultState = {
  unlockedArtifacts: [],
  returnPoints: [],
  device: {
    x: null,
    y: null,
    minimized: false,
    expanded: false,
    tab: "private"
  },
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

function loadState() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(storageKey));
    return {
      ...defaultState,
      ...stored,
      device: { ...defaultState.device, ...stored?.device },
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

function pulseArtifact() {
  artifact?.classList.remove("is-awake");
  window.requestAnimationFrame(() => artifact?.classList.add("is-awake"));
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
  pulseArtifact();
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
  const chamberList = document.querySelector("[data-chamber-list]");

  if (fragmentList) {
    fragmentList.innerHTML = fragments.map((fragment) => {
      const unlocked = state.unlockedArtifacts.includes(fragment.id);
      return `
        <article class="device-item ${unlocked ? "is-unlocked" : "is-locked"}">
          <span>${unlocked ? "Unlocked" : "Dormant"}</span>
          <h4>${fragment.title}</h4>
          <p>${unlocked ? fragment.summary : "Touch the artifact to reveal this fragment."}</p>
        </article>
      `;
    }).join("");
  }

  if (returnList) {
    returnList.innerHTML = state.returnPoints.length
      ? state.returnPoints.map((point) => `
          <button class="device-item return-point" type="button" data-return-artifact="${point.artifact}">
            <span>${point.date}</span>
            <h4>${point.title}</h4>
            <p>${point.chamber}</p>
          </button>
        `).join("")
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

  device.classList.toggle("is-minimized", Boolean(state.device.minimized));
  device.classList.toggle("is-expanded", Boolean(state.device.expanded));

  if (Number.isFinite(state.device.x) && Number.isFinite(state.device.y)) {
    device.style.left = `${state.device.x}px`;
    device.style.top = `${state.device.y}px`;
    device.style.right = "auto";
    device.style.bottom = "auto";
  }

  setDeviceTab(state.device.tab);
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
  cosmology.style.setProperty("--light-x", `${50 + x * 22}%`);
  cosmology.style.setProperty("--light-y", `${50 + y * 18}%`);
}

function bindInteractions() {
  document.querySelectorAll("[data-fragment-id]").forEach((button) => {
    button.addEventListener("click", () => unlockFragment(button.dataset.fragmentId));
  });

  document.querySelector("[data-save-return]")?.addEventListener("click", saveReturnPoint);
  document.querySelector("[data-copy-return-link]")?.addEventListener("click", copyReturnPointLink);

  document.querySelectorAll("[data-device-tab]").forEach((button) => {
    button.addEventListener("click", () => setDeviceTab(button.dataset.deviceTab));
  });

  document.querySelector("[data-device-minimize]")?.addEventListener("click", () => {
    state.device.minimized = !state.device.minimized;
    saveState();
    applyDeviceState();
  });

  document.querySelector("[data-device-expand]")?.addEventListener("click", () => {
    state.device.expanded = !state.device.expanded;
    state.device.minimized = false;
    saveState();
    applyDeviceState();
    keepDeviceInBounds();
  });

  document.querySelector("[data-device-snap]")?.addEventListener("click", () => {
    const rect = device.getBoundingClientRect();
    state.device.x = rect.left < window.innerWidth / 2 ? 10 : window.innerWidth - rect.width - 10;
    state.device.y = clamp(rect.top, 10, window.innerHeight - rect.height - 10);
    saveState();
    applyDeviceState();
  });

  document.addEventListener("click", (event) => {
    const returnPoint = event.target.closest("[data-return-artifact]");
    const chamber = event.target.closest("[data-chamber-id]");

    if (returnPoint) {
      unlockFragment(returnPoint.dataset.returnArtifact);
    }

    if (chamber && !chamber.disabled) {
      state.lastViewedChamber = chamber.dataset.chamberId;
      saveState();
      renderDevice();
      setStatus(`Chamber opened: ${chamber.querySelector("h4")?.textContent}`);
    }
  });

  window.addEventListener("pointermove", updateParallax, { passive: true });
  window.addEventListener("touchmove", updateParallax, { passive: true });
  window.addEventListener("resize", keepDeviceInBounds);
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
      offsetY: event.clientY - rect.top
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
    device.style.left = `${x}px`;
    device.style.top = `${y}px`;
    device.style.right = "auto";
    device.style.bottom = "auto";
  });

  dragHandle.addEventListener("pointerup", (event) => {
    if (dragState?.pointerId === event.pointerId) {
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
